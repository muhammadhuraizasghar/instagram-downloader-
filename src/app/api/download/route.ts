import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

// --- Scalability & Security ---
// In-memory cache for demo (In production, use Redis)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 10; // 10 minutes

// In-memory rate limiter (In production, use Redis)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30; // 30 requests per minute per IP

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "anonymous";

  // Rate Limiting Logic
  const now = Date.now();
  const rateLimit = rateLimitMap.get(ip) || { count: 0, lastReset: now };

  if (now - rateLimit.lastReset > RATE_LIMIT_WINDOW) {
    rateLimit.count = 0;
    rateLimit.lastReset = now;
  }

  if (rateLimit.count >= MAX_REQUESTS_PER_WINDOW) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  rateLimit.count++;
  rateLimitMap.set(ip, rateLimit);

  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    if (!url.includes("instagram.com")) {
      return NextResponse.json({ error: "Invalid Instagram URL" }, { status: 400 });
    }

    // Caching Logic
    const cachedResult = cache.get(url);
    if (cachedResult && now - cachedResult.timestamp < CACHE_TTL) {
      console.log("Serving from cache:", url);
      return NextResponse.json(cachedResult.data);
    }

    // Get metadata using yt-dlp with more robust options
    // Optimization: Use --flat-playlist for faster metadata extraction if applicable
    let command = `yt-dlp --dump-json --no-check-certificate --no-playlist --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36" "${url}"`;

    const { stdout, stderr } = await execPromise(command);

    if (stderr && !stdout) {
      console.error("yt-dlp error:", stderr);
      // Try a simpler command if the first one fails
      command = `yt-dlp --dump-json "${url}"`;
      const retry = await execPromise(command);
      if (retry.stderr && !retry.stdout) {
        return NextResponse.json({ error: "Could not fetch media. Link might be private or restricted." }, { status: 403 });
      }
    }

    const info = JSON.parse(stdout);

    const processEntry = (entry: any) => {
      const isVideo = entry.vcodec !== "none" || entry.ext === "mp4" || entry.protocol?.includes("https");
      const mediaItems = [];

      // Find best video format that MUST have audio
      let bestUrl = entry.url;
      if (isVideo && entry.formats) {
        // Filter formats that have both video and audio (acodec and vcodec are not none)
        const combinedFormats = entry.formats.filter((f: any) => 
          f.vcodec !== "none" && 
          f.acodec !== "none" && 
          f.url &&
          (f.ext === 'mp4' || f.container === 'mp4')
        );

        const bestFormat = combinedFormats.sort((a: any, b: any) => (b.height || 0) - (a.height || 0))[0] 
          || entry.formats.filter((f: any) => f.vcodec !== "none" && f.acodec !== "none" && f.url)[0]
          || entry.formats.filter((f: any) => f.vcodec !== "none" && f.url).sort((a: any, b: any) => (b.height || 0) - (a.height || 0))[0];
        
        if (bestFormat) {
          bestUrl = bestFormat.url;
        }
      }

      // Add Video/Image
      mediaItems.push({
        type: isVideo ? "video" : "image",
        url: bestUrl,
        thumbnail: entry.thumbnail,
        title: entry.title || "Media",
        resolution: entry.resolution || (entry.width && entry.height ? `${entry.width}x${entry.height}` : "HD"),
        ext: entry.ext || (isVideo ? "mp4" : "jpg"),
        filesize: entry.filesize_approx ? 
          `${(entry.filesize_approx / 1024 / 1024).toFixed(1)} MB` : 
          entry.filesize ? `${(entry.filesize / 1024 / 1024).toFixed(1)} MB` : "Unknown"
      });

      // If it's a video, add Audio option
      if (isVideo) {
        const audioFormat = entry.formats
          ?.filter((f: any) => (f.vcodec === "none" || !f.vcodec) && f.acodec !== "none" && f.url)
          .sort((a: any, b: any) => (b.abr || 0) - (a.abr || 0))[0];

        if (audioFormat) {
          mediaItems.push({
            type: "audio",
            url: audioFormat.url,
            thumbnail: entry.thumbnail,
            title: entry.title ? `${entry.title} (Audio)` : "Audio",
            resolution: "Audio only",
            ext: audioFormat.ext || "m4a",
            filesize: audioFormat.filesize_approx ? 
              `${(audioFormat.filesize_approx / 1024 / 1024).toFixed(1)} MB` : 
              audioFormat.filesize ? `${(audioFormat.filesize / 1024 / 1024).toFixed(1)} MB` : "Unknown"
          });
        }
      }

      // Collect Metadata for this specific entry
      const metadata = {
        uploader: entry.uploader || entry.uploader_id || "Unknown",
        uploader_url: entry.uploader_url || "",
        upload_date: entry.upload_date || "Unknown",
        description: entry.description || "No description",
        view_count: entry.view_count || 0,
        like_count: entry.like_count || 0,
        comment_count: entry.comment_count || 0,
        duration: entry.duration ? `${Math.floor(entry.duration / 60)}:${(entry.duration % 60).toString().padStart(2, '0')}` : "N/A",
        webpage_url: entry.webpage_url || url,
        tags: entry.tags || []
      };

      return { items: mediaItems, metadata };
    };

    let finalResult;

    if (info.entries) {
      const processedEntries = info.entries.map((entry: any) => processEntry(entry));
      finalResult = {
        type: "carousel",
        entries: processedEntries,
        title: info.title,
        main_metadata: {
          uploader: info.uploader || info.uploader_id,
          upload_date: info.upload_date,
          description: info.description
        }
      };
    } else {
      const processed = processEntry(info);
      finalResult = {
        type: "single",
        items: processed.items,
        metadata: processed.metadata,
        title: info.title
      };
    }

    // Save to cache
    cache.set(url, { data: finalResult, timestamp: Date.now() });

    return NextResponse.json(finalResult);

  } catch (error: any) {
    console.error("Server error:", error);
    return NextResponse.json({ error: "Instagram blocked the request. Try again or check the link." }, { status: 500 });
  }
}
