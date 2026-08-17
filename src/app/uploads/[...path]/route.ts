import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { UPLOADS_ROOT, EXT_MIME } from '@/lib/storage';

export const dynamic = 'force-dynamic';

/** GET /uploads/<dir>/<file> → 读取 uploads/ 目录下的文件（带类型，防路径穿越） */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const segments = (await params).path;
  if (!segments.length) return new NextResponse('Not Found', { status: 404 });

  const filePath = path.join(UPLOADS_ROOT, ...segments);
  if (!filePath.startsWith(UPLOADS_ROOT + path.sep)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  try {
    const buf = await fs.readFile(filePath);
    const ext = path.extname(filePath).slice(1).toLowerCase();
    const contentType = EXT_MIME[ext] || 'application/octet-stream';
    return new NextResponse(new Uint8Array(buf), {
      headers: { 'Content-Type': contentType },
    });
  } catch {
    return new NextResponse('Not Found', { status: 404 });
  }
}
