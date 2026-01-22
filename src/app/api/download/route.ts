import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    const { url, type } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    if (!url.includes("instagram.com")) {
      return NextResponse.json({ error: "Invalid Instagram URL" }, { status: 400 });
    }

    // Command construction for yt-dlp
    // --dump-json: just get the info, don't download yet
    // --no-check-certificate: avoid ssl issues
    let command = `yt-dlp --dump-json --no-check-certificate "${url}"`;

    // If audio is requested, we still need the JSON first to get the direct links
    const { stdout, stderr } = await execPromise(command);

    if (stderr && !stdout) {
      console.error("yt-dlp error:", stderr);
      return NextResponse.json({ error: "Could not fetch media info. Link might be private or restricted." }, { status: 403 });
    }

    const info = JSON.parse(stdout);

    // Handle single media vs multiple (carousel)
    if (info.entries || info._type === "playlist") {
      const items = (info.entries || []).map((entry: any) => ({
        type: type === "audio" ? "audio" : (entry.vcodec !== "none" ? "video" : "image"),
        downloadUrl: type === "audio" ? entry.url : entry.url,
        thumbnail: entry.thumbnail,
      }));
      return NextResponse.json({ type: "carousel", items });
    }

    // For single item
    let result = {
      type: type === "audio" ? "audio" : (info.vcodec !== "none" ? "video" : "image"),
      downloadUrl: info.url,
      thumbnail: info.thumbnail,
    };

    // If it's a video and user wants audio, we can still use the direct URL if it's an m4a/mp3 
    // or tell yt-dlp to get the best audio. yt-dlp usually provides a separate audio URL in 'formats'
    if (type === "audio") {
      const audioFormat = info.formats.reverse().find((f: any) => f.vcodec === "none" && f.acodec !== "none");
      if (audioFormat) {
        result.downloadUrl = audioFormat.url;
        result.type = "audio";
      }
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Server error:", error);
    return NextResponse.json({ error: "Instagram is blocking the request. Restricted links might need authentication." }, { status: 500 });
  }
}
