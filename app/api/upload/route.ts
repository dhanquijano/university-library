import { NextRequest, NextResponse } from "next/server";
import ImageKit from "imagekit";
import config from "@/lib/config";

const {
  env: {
    imagekit: { publicKey, privateKey, urlEndpoint },
  },
} = config;

const imagekit = new ImageKit({ publicKey, privateKey, urlEndpoint });

export async function POST(request: NextRequest) {
  try {
    console.log("Upload API called");
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;

    console.log("File received:", file?.name, "Type:", type);

    if (!file) {
      console.log("No file in request");
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${timestamp}_${originalName}`;

    // Upload to ImageKit
    const uploadResponse = await imagekit.upload({
      file: buffer,
      fileName: filename,
      folder: `/${type || "general"}`,
      tags: [type || "general", "receipt"],
    });

    console.log("ImageKit upload successful:", uploadResponse.url);

    return NextResponse.json({
      success: true,
      url: uploadResponse.url,
      filename: uploadResponse.name,
      fileId: uploadResponse.fileId,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload file" },
      { status: 500 }
    );
  }
}