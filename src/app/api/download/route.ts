import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Basic Instagram URL validation
    if (!url.includes("instagram.com")) {
      return NextResponse.json({ error: "Invalid Instagram URL" }, { status: 400 });
    }

    // For a real-world app, you'd use a more robust scraping method or a paid API.
    // This is a simplified example that tries to fetch the data.
    // Note: Instagram often blocks these requests. In production, use a proxy or a dedicated API.
    
    // We'll use a public API for demonstration if possible, 
    // but for now, let's try a common scraping technique.
    
    // Extract shortcode
    const shortcodeMatch = url.match(/\/(?:p|reels|reel|tv)\/([A-Za-z0-9_-]+)/);
    if (!shortcodeMatch) {
      return NextResponse.json({ error: "Could not extract shortcode from URL" }, { status: 400 });
    }
    const shortcode = shortcodeMatch[1];

    try {
      // Using a known public API endpoint (this might be rate-limited or blocked)
      const response = await axios.get(`https://www.instagram.com/p/${shortcode}/?__a=1&__d=dis`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
        }
      });

      const data = response.data;
      const mediaData = data.items?.[0];

      if (!mediaData) {
        throw new Error("Media data not found");
      }

      // Handle carousel (multiple images/videos)
      if (mediaData.carousel_media) {
        const items = mediaData.carousel_media.map((item: any) => ({
          type: item.video_versions ? "video" : "image",
          downloadUrl: item.video_versions ? item.video_versions[0].url : item.image_versions2.candidates[0].url,
          thumbnail: item.image_versions2.candidates[0].url,
        }));
        return NextResponse.json({ type: "carousel", items });
      }

      let result = {
        type: mediaData.video_versions ? "video" : "image",
        downloadUrl: mediaData.video_versions ? mediaData.video_versions[0].url : mediaData.image_versions2.candidates[0].url,
        thumbnail: mediaData.image_versions2.candidates[0].url,
      };

      return NextResponse.json(result);
    } catch (scrapingError) {
      console.error("Scraping error:", scrapingError);
      
      // Fallback: If scraping fails, we can suggest using a proxy or a different method.
      // For this tool, we'll try to use a public rapidapi or similar if available, 
      // but since I can't sign up for one, I'll provide a placeholder that explains the limitation
      // or try another public endpoint.
      
      return NextResponse.json({ 
        error: "Instagram blocked the request. Restricted links might need a session. Try a public link or a different post." 
      }, { status: 403 });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 });
  }
}
