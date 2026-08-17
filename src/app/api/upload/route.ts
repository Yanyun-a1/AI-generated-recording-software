import { NextResponse } from 'next/server';
import { addItem, writeBinaryFile, MIME_EXT } from '@/lib/storage';
import type { MediaItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

/** POST /api/upload → multipart 文件上传，落盘到 uploads/images|videos/ */
export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: '无效的上传请求' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: '缺少文件' }, { status: 400 });
  }

  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  if (!isImage && !isVideo) {
    return NextResponse.json({ error: '仅支持图片或视频文件' }, { status: 400 });
  }

  const type = isImage ? 'image' : 'video';
  const ext =
    MIME_EXT[file.type] ||
    file.name.split('.').pop()?.toLowerCase() ||
    (isImage ? 'jpg' : 'mp4');
  const id = crypto.randomUUID();
  const buf = Buffer.from(await file.arrayBuffer());
  const url = await writeBinaryFile(type, id, ext, buf);

  const item: MediaItem = {
    id,
    type,
    title: String(form.get('title') || file.name),
    content: url,
    createdAt: Date.now(),
  };
  await addItem(item);
  return NextResponse.json(item);
}
