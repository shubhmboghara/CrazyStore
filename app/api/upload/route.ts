import ImageKit from "imagekit";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getImageKitInstance() {
  if (!process.env.IMAGEKIT_PUBLIC_KEY || !process.env.IMAGEKIT_PRIVATE_KEY || !process.env.IMAGEKIT_URL_ENDPOINT) {
    return null;
  }
  return new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
  });
}

export async function POST(req: Request) {
  try {
    const imagekit = getImageKitInstance();
    if (!imagekit) {
      return NextResponse.json({ error: "ImageKit credentials are not configured" }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResponse = await imagekit.upload({
      file: buffer,
      fileName: file.name.replace(/[^a-zA-Z0-9.-]/g, "_"),
      folder: "/android-apps",
    });

    return NextResponse.json({
      url: uploadResponse.url,
      fileId: uploadResponse.fileId,
      name: uploadResponse.name,
    });
  } catch (error: any) {
    console.error("ImageKit upload error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload file" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const imagekit = getImageKitInstance();
    if (!imagekit) {
      return NextResponse.json({ error: "ImageKit credentials are not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    let fileId = searchParams.get("fileId");
    let url = searchParams.get("url");
    let urls: string[] = [];

    if (req.headers.get("content-type")?.includes("application/json")) {
      try {
        const body = await req.json();
        fileId = body.fileId || fileId;
        url = body.url || url;
        if (Array.isArray(body.urls)) {
          urls = body.urls;
        }
      } catch {
        // ignore json parse error
      }
    }

    if (url && !urls.includes(url)) {
      urls.push(url);
    }

    // Direct deletion by fileId
    if (fileId) {
      try {
        await imagekit.deleteFile(fileId);
        return NextResponse.json({ success: true, message: `Deleted file ${fileId}` });
      } catch (err: any) {
        console.warn("Direct fileId delete failed:", err?.message);
      }
    }

    // Deletion by image URL(s)
    if (urls.length > 0) {
      const deletedCount: number[] = [];

      for (const targetUrl of urls) {
        if (!targetUrl || typeof targetUrl !== "string") continue;

        let fileName = "";
        try {
          const parsed = new URL(targetUrl);
          const parts = parsed.pathname.split("/").filter(Boolean);
          fileName = parts[parts.length - 1] || "";
        } catch {
          fileName = targetUrl.split("/").pop() || "";
        }

        if (fileName) {
          try {
            // Search by filename in ImageKit
            const files = await imagekit.listFiles({
              searchQuery: `name = "${fileName}"`,
            });

            if (files && Array.isArray(files) && files.length > 0) {
              for (const f of files as any[]) {
                if (f && f.fileId) {
                  await imagekit.deleteFile(f.fileId);
                  deletedCount.push(1);
                }
              }
            } else {
              // Fallback: list folder /android-apps
              const folderFiles = await imagekit.listFiles({
                path: "/android-apps",
              });
              if (Array.isArray(folderFiles)) {
                const found = (folderFiles as any[]).filter(
                  (f: any) => f && (f.name === fileName || (f.url && f.url === targetUrl))
                );
                for (const f of found) {
                  if (f && f.fileId) {
                    await imagekit.deleteFile(f.fileId);
                    deletedCount.push(1);
                  }
                }
              }
            }
          } catch (delError: any) {
            console.warn(`Could not delete ${fileName} from ImageKit:`, delError?.message);
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: `Processed deletion for ${urls.length} item(s)`,
      });
    }

    return NextResponse.json({ error: "No fileId or url provided for deletion" }, { status: 400 });
  } catch (error: any) {
    console.error("ImageKit delete error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete file from ImageKit" },
      { status: 500 }
    );
  }
}

