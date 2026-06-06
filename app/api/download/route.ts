import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { resumeText, filename = "optimized_resume" } = await req.json();
    if (!resumeText) return NextResponse.json({ error: "No resume text" }, { status: 400 });

    // Return plain text as .txt download (PDF generation happens client-side via jsPDF)
    const encoder = new TextEncoder();
    const bytes = encoder.encode(resumeText);

    return new NextResponse(bytes, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}.txt"`,
        "Content-Length": bytes.length.toString(),
      },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
