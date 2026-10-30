import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const pdfUrl = searchParams.get("url");

  if (!pdfUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  // Security: only allow proxying from configured WordPress domain or trusted hosts
  try {
    const parsed = new URL(pdfUrl);
    const configuredWpHost = process.env.WORDPRESS_API_URL
      ? new URL(process.env.WORDPRESS_API_URL).hostname
      : "";

    const isAllowed =
      (configuredWpHost && parsed.hostname === configuredWpHost) ||
      parsed.hostname.endsWith(".hostingersite.com") ||
      parsed.hostname === "janasainyam.in" ||
      parsed.hostname === "epaper.janasainyam.in";

    if (!isAllowed) {
      return NextResponse.json(
        { error: "Forbidden host" },
        { status: 403 }
      );
    }

    const response = await fetch(pdfUrl, {
      headers: {
        "User-Agent": "Janasainyam-Reader/1.0",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const blob = await response.blob();
    return new NextResponse(blob, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="newspaper.pdf"',
        "Cache-Control": "public, max-age=7200, stale-while-revalidate=86400",
      },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { error: "Failed to fetch PDF", details: errorMessage },
      { status: 500 }
    );
  }
}
