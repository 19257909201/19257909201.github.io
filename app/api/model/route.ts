import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { getSiteModelAsset } from "@/lib/site-models";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return new Response("Missing model slug", { status: 400 });
    }

    const modelAsset = await getSiteModelAsset(slug);

    if (!modelAsset) {
      return new Response(`Unknown model slug: ${slug}`, { status: 404 });
    }

    const modelStat = await stat(modelAsset.filePath);
    const stream = Readable.toWeb(
      createReadStream(modelAsset.filePath)
    ) as ReadableStream<Uint8Array>;

    return new Response(stream, {
      headers: {
        "Content-Type": "model/gltf-binary",
        "Content-Length": modelStat.size.toString(),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;

    if (code === "ENOENT") {
      return new Response("Model file not found", { status: 404 });
    }

    return new Response("Unable to read GLB model", { status: 500 });
  }
}
