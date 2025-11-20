import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { prompt } = await req.json();

        if (!prompt) {
            return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "GEMINI_API_KEY is not set" }, { status: 500 });
        }

        const modelId = "gemini-3-pro-image-preview";
        // Correct endpoint per documentation: :generateContent
        const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

        const response = await fetch(apiEndpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    imageConfig: {
                        aspectRatio: "16:9",
                        imageSize: "2K" // or 4K, but 2K is safer for speed/quota
                    }
                }
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Google API Error:", response.status, errorText);
            return NextResponse.json({ error: `Failed to generate image: ${errorText}` }, { status: response.status });
        }

        const data = await response.json();

        // Extract image from response
        // Structure: candidates[0].content.parts[].inlineData.data (base64)

        let imageBase64 = "";

        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
            for (const part of data.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    imageBase64 = part.inlineData.data;
                    break;
                }
            }
        }

        if (!imageBase64) {
            console.error("Unexpected response format:", JSON.stringify(data));
            return NextResponse.json({ error: "Failed to parse image from response" }, { status: 500 });
        }

        // Google API returns raw base64, usually JPEG or PNG. 
        // The mimeType might be in inlineData.mimeType
        const mimeType = data.candidates[0].content.parts[0].inlineData.mimeType || "image/png";
        const imageUrl = `data:${mimeType};base64,${imageBase64}`;

        return NextResponse.json({ imageUrl });

    } catch (error) {
        console.error("Error generating image:", error);
        return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
    }
}
