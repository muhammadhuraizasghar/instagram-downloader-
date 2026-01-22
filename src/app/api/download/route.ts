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
    // --dump-json: get all info
    // --no-playlist: only the specific post
    let command = `yt-dlp --dump-json --no-check-certificate --no-playlist "${url}"`;

    const { stdout, stderr } = await execPromise(command);

    if (stderr && !stdout) {
      console.error("yt-dlp error:", stderr);
      return NextResponse.json({ error: "Could not fetch media. Link might be private or restricted." }, { status: 403 });
    }

    const info = JSON.parse(stdout);

    // Process items (handling potential carousel/playlist structure)
    const processEntry = (entry: any) => {
      const isVideo = entry.vcodec !== "none";
      const mediaItems = [];

      // Always add the primary media (Video or Image)
      mediaItems.push({
        type: isVideo ? "video" : "image",
        url: entry.url,
        thumbnail: entry.thumbnail,
        title: entry.title || "Media"
      });

      // If it's a video, find the best audio-only format
      if (isVideo) {
        const audioFormat = entry.formats
          .filter((f: any) => f.vcodec === "none" && f.acodec !== "none")
          .sort((a: any, b: any) => (b.abr || 0) - (a.abr || 0))[0];

        if (audioFormat) {
          mediaItems.push({
            type: "audio",
            url: audioFormat.url,
            thumbnail: entry.thumbnail,
            title: entry.title ? `${entry.title} (Audio)` : "Audio"
          });
        }
      }

      return mediaItems;
    };

    let finalResult;

    if (info.entries) {
      // It's a carousel or multiple items
      const allItems = info.entries.flatMap((entry: any) => processEntry(entry));
      finalResult = {
        type: "carousel",
        items: allItems,
        title: info.title
      };
    } else {
      // Single item
      const items = processEntry(info);
      finalResult = {
        type: items.length > 1 ? "multi-format" : items[0].type,
        items: items,
        title: info.title
      };
    }

    return NextResponse.json(finalResult);

  } catch (error: any) {
    console.error("Server error:", error);
    return NextResponse.json({ error: "Instagram blocked the request. Try again or check the link." }, { status: 500 });
  }
}
