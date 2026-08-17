import { NextResponse } from 'next/server';
import { getStore, addItem, removeItem, updateItem, saveStyle, saveTitle, writeTextFile } from '@/lib/storage';
import type { MediaItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

/** GET /api/records → { items, style } */
export async function GET() {
  return NextResponse.json(await getStore());
}

/** POST /api/records → 新增文字记录 或 保存样式 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: '无效的请求体' }, { status: 400 });

  // 新增文字记录：内容同时落盘为 texts/<id>.md
  // 注意：必须优先于 title 判断（文字记录也携带 title 字段）
  if (body.type === 'text') {
    const content = String(body.content ?? '').trim();
    if (!content) return NextResponse.json({ error: '内容不能为空' }, { status: 400 });
    const item: MediaItem = {
      id: crypto.randomUUID(),
      type: 'text',
      content,
      title: String(body.title || '文字记录'),
      createdAt: Date.now(),
    };
    await writeTextFile(item.id, content);
    await addItem(item);
    return NextResponse.json(item);
  }

  // 保存样式
  if (body.style) {
    await saveStyle(body.style);
    return NextResponse.json({ ok: true });
  }

  // 保存应用标题
  if (body.title) {
    await saveTitle(String(body.title));
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: '不支持的类型' }, { status: 400 });
}

/** DELETE /api/records?id=xxx → 删除记录及其文件 */
export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 });
  await removeItem(id);
  return NextResponse.json({ ok: true });
}

/** PUT /api/records → 更新记录标题和内容 */
export async function PUT(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || !body.id) return NextResponse.json({ error: '缺少 id' }, { status: 400 });
  const ok = await updateItem(body.id, {
    title: body.title,
    content: body.content,
  });
  if (!ok) return NextResponse.json({ error: '记录不存在' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
