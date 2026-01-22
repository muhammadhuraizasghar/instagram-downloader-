import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return new NextResponse("URL is required", { status: 400 });
  }

  try {
    const response = await axios({
      method: "get",
      url: targetUrl,
      responseType: "stream",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://www.instagram.com/",
        "Accept": "image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    const headers = new Headers();
    headers.set("Content-Type", response.headers["content-type"]);
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    // Convert axios stream to Web Stream for Next.js response
    const stream = new ReadableStream({
      start(controller) {
        response.data.on("data", (chunk: any) => controller.enqueue(chunk));
        response.data.on("end", () => controller.close());
        response.data.on("error", (err: any) => controller.error(err));
      },
    });

    return new NextResponse(stream, { headers });
  } catch (error: any) {
    console.error("Proxy error:", error.message);
    return new NextResponse("Failed to proxy media", { status: 500 });
  }
}
