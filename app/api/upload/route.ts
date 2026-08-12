import ImageKit from "imagekit";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    if (!process.env.IMAGEKIT_PUBLIC_KEY || !process.env.IMAGEKIT_PRIVATE_KEY || !process.env.IMAGEKIT_URL_ENDPOINT) {
      return NextResponse.json({ error: "ImageKit credentials are not configured" }, { status: 500 });
    }

    const imagekit = new ImageKit({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
    });

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResponse = await imagekit.upload({
      file: buffer, // Buffer is supported by imagekit node SDK
      fileName: file.name,
      folder: '/android-apps',
    });

    return NextResponse.json({ url: uploadResponse.url });
  } catch (error: any) {
    console.error("ImageKit upload error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
