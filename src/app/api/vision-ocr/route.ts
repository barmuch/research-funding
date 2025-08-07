import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json();

    // Validate input
    if (!imageBase64) {
      return NextResponse.json(
        { success: false, message: "Image data is required", items: [] },
        { status: 400 }
      );
    }

    // Check if API key is configured
    if (!process.env.OPENROUTER_API_KEY_VISION) {
      console.error("OPENROUTER_API_KEY_VISION not configured");
      return NextResponse.json(
        { success: false, message: "OCR service not configured", items: [] },
        { status: 500 }
      );
    }

  const body = {
    model: "google/gemma-3-27b-it:free",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Ekstrak semua item belanja dan harga dari gambar nota/struk ini. Format hasil dalam JSON array dengan struktur: [{\"item\":\"nama_barang\",\"price\":\"harga_numerik\"}]. Contoh: [{\"item\":\"Buku Tulis\",\"price\":\"5000\"},{\"item\":\"Pulpen\",\"price\":\"3000\"}]. Hanya berikan array JSON tanpa teks lain."
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/png;base64,${imageBase64}`
            }
          }
        ]
      }
    ],
    max_tokens: 1000
  };

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY_VISION}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://finance-tracker.vercel.app",
      "X-Title": "Research Fund Tracker"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    console.error("OpenRouter API error:", response.status, response.statusText);
    return NextResponse.json(
      { success: false, message: "Failed to process image", items: [] },
      { status: 500 }
    );
  }

  const result = await response.json();
  const text = result?.choices?.[0]?.message?.content || "";
  
  // Extract JSON array from response
  const match = text.match(/\[[\s\S]*\]/);
  let items = [];
  
  try {
    if (match) {
      items = JSON.parse(match[0]);
      // Validate items structure
      items = items.filter((item: any) => 
        item && 
        typeof item.item === 'string' && 
        (typeof item.price === 'string' || typeof item.price === 'number')
      ).map((item: any) => ({
        item: item.item,
        price: String(item.price)
      }));
    }
  } catch (parseError) {
    console.error("JSON parsing error:", parseError);
    items = [];
  }

  return NextResponse.json({ 
    success: true, 
    message: "Image processed successfully", 
    items 
  });

  } catch (error) {
    console.error("Vision OCR Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error", items: [] },
      { status: 500 }
    );
  }
}
