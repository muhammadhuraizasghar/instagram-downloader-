import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);
const API_KEY = "INSTA_V2_KEY_2026"; // You can change this or move to .env

// --- Scalability & Security ---
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 10; // 10 minutes

const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 50; // Higher limit for API v2

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "anonymous";
  const now = Date.now();

  // Rate Limiting
  const rateLimit = rateLimitMap.get(ip) || { count: 0, lastReset: now };
  if (now - rateLimit.lastReset > RATE_LIMIT_WINDOW) {
    rateLimit.count = 0;
    rateLimit.lastReset = now;
  }
  if (rateLimit.count >= MAX_REQUESTS_PER_WINDOW) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }
  rateLimit.count++;
  rateLimitMap.set(ip, rateLimit);

  try {
    const { url, type, key } = await req.json();

    // Security Check
    if (key !== API_KEY) {
      return NextResponse.json({ error: "Unauthorized: Invalid API Key" }, { status: 401 });
    }

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Caching
    const cacheKey = `${url}-${type}`;
    const cached = cache.get(cacheKey);
    if (cached && now - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // Get metadata using yt-dlp
    let command = `yt-dlp --dump-json --no-check-certificate --no-playlist --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36" "${url}"`;

    const { stdout, stderr } = await execPromise(command);

    if (stderr && !stdout) {
      return NextResponse.json({ error: "Could not fetch media. Check the link." }, { status: 403 });
    }

    const info = JSON.parse(stdout);

    const filterMedia = (entry: any) => {
      const isVideo = entry.vcodec !== "none" || entry.ext === "mp4";
      const formats = entry.formats || [];

      if (type === "video" && isVideo) {
        // Find best combined video+audio mp4
        const best = formats.filter((f: any) => f.vcodec !== "none" && f.acodec !== "none" && f.url && (f.ext === 'mp4' || f.container === 'mp4'))
          .sort((a: any, b: any) => (b.height || 0) - (a.height || 0))[0];
        return best ? { type: "video", url: best.url, ext: "mp4" } : null;
      }

      if (type === "audio") {
        const best = formats.filter((f: any) => (f.vcodec === "none" || !f.vcodec) && f.acodec !== "none" && f.url)
          .sort((a: any, b: any) => (b.abr || 0) - (a.abr || 0))[0];
        return best ? { type: "audio", url: best.url, ext: best.ext || "m4a" } : null;
      }

      if (type === "image" && !isVideo) {
        return { type: "image", url: entry.url, ext: "jpg" };
      }

      // Default: return everything if no type specified
      return {
        type: isVideo ? "video" : "image",
        url: entry.url,
        ext: entry.ext
      };
    };

    let results;
    if (info.entries) {
      results = info.entries.map((e: any) => filterMedia(e)).filter(Boolean);
    } else {
      results = [filterMedia(info)].filter(Boolean);
    }

    const finalResult = {
      success: true,
      data: results,
      title: info.title,
      uploader: info.uploader
    };

    // Save to cache
    cache.set(cacheKey, { data: finalResult, timestamp: now });

    return NextResponse.json(finalResult);

  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error", message: error.message }, { status: 500 });
  }
}
