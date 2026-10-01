import { readImage } from "@/server/storage";

// GET /api/uploads/<file name> — sends back an uploaded image.
// Names are random UUIDs, so a file can be cached "forever": a new logo
// gets a new name (and a new URL).

// RouteContext is a type Next generates for each route: it knows that
// this URL has a [name] parameter.
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/uploads/[name]">,
) {
  const image = await readImage((await ctx.params).name);
  if (!image) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(image.data), {
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
