import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    if (!url.includes("instagram.com")) {
      return NextResponse.json({ error: "Invalid Instagram URL" }, { status: 400 });
    }

    // Get metadata using yt-dlp
    let command = `yt-dlp --dump-json --no-check-certificate --no-playlist "${url}"`;

    const { stdout, stderr } = await execPromise(command);

    if (stderr && !stdout) {
      console.error("yt-dlp error:", stderr);
      return NextResponse.json({ error: "Could not fetch media. Link might be private or restricted." }, { status: 403 });
    }

    const info = JSON.parse(stdout);

    const processEntry = (entry: any) => {
      const isVideo = entry.vcodec !== "none";
      const mediaItems = [];

      // Add Video/Image
      mediaItems.push({
        type: isVideo ? "video" : "image",
        url: entry.url,
        thumbnail: entry.thumbnail,
        title: entry.title || "Media",
        resolution: `${entry.width}x${entry.height}`,
        ext: entry.ext,
        filesize: entry.filesize_approx || entry.filesize || "Unknown"
      });

      // If it's a video, add Audio option
      if (isVideo) {
        const audioFormat = entry.formats
          .filter((f: any) => f.vcodec === "none" && f.acodec !== "none")
          .sort((a: any, b: any) => (b.abr || 0) - (a.abr || 0))[0];

        if (audioFormat) {
          mediaItems.push({
            type: "audio",
            url: audioFormat.url,
            thumbnail: entry.thumbnail,
            title: entry.title ? `${entry.title} (Audio)` : "Audio",
            resolution: "Audio only",
            ext: audioFormat.ext || "mp3",
            filesize: audioFormat.filesize || audioFormat.filesize_approx || "Unknown"
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

    return NextResponse.json(finalResult);

  } catch (error: any) {
    console.error("Server error:", error);
    return NextResponse.json({ error: "Instagram blocked the request. Try again or check the link." }, { status: 500 });
  }
}
