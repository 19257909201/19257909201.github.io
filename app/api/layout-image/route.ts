import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { getLocationImagePath } from "@/lib/site-models";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const imagePath = getLocationImagePath();
    const imageStat = await stat(imagePath);
    const stream = Readable.toWeb(
      createReadStream(imagePath)
    ) as ReadableStream<Uint8Array>;

    return new Response(stream, {
      headers: {
        "Content-Type": "image/png",
        "Content-Length": imageStat.size.toString(),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;

    if (code === "ENOENT") {
      return new Response("location.png not found", { status: 404 });
    }

    return new Response("Unable to read location image", { status: 500 });
  }
}
