import { promises as fs } from 'fs';
import path from 'path';
import { DEFAULT_STYLE } from './types';
import type { MediaItem, StyleConfig } from './types';

/**
 * 本地文件存储层：所有上传内容落到项目根目录 uploads/ 下，
 * 按类型分目录存放，index.json 作为唯一数据源（记录列表 + 样式）。
 */
export const UPLOADS_ROOT = path.join(process.cwd(), 'uploads');

const DIRS = {
  image: 'images',
  video: 'videos',
  text: 'texts',
} as const;

export interface StoreData {
  items: MediaItem[];
  style: StyleConfig;
  title?: string;
}

export const DEFAULT_TITLE = '记录软件';

async function ensureUploads() {
  await fs.mkdir(path.join(UPLOADS_ROOT, 'images'), { recursive: true });
  await fs.mkdir(path.join(UPLOADS_ROOT, 'videos'), { recursive: true });
  await fs.mkdir(path.join(UPLOADS_ROOT, 'texts'), { recursive: true });
}

async function readStore(): Promise<StoreData> {
  const file = path.join(UPLOADS_ROOT, 'index.json');
  try {
    const raw = await fs.readFile(file, 'utf-8');
    const data = JSON.parse(raw) as Partial<StoreData>;
    return {
      items: Array.isArray(data.items) ? data.items : [],
      style: { ...DEFAULT_STYLE, ...(data.style ?? {}) },
      title: data.title || DEFAULT_TITLE,
    };
  } catch {
    return { items: [], style: DEFAULT_STYLE, title: DEFAULT_TITLE };
  }
}

async function writeStore(data: StoreData) {
  await ensureUploads();
  await fs.writeFile(path.join(UPLOADS_ROOT, 'index.json'), JSON.stringify(data, null, 2), 'utf-8');
}

export async function getStore(): Promise<StoreData> {
  return readStore();
}

export async function addItem(item: MediaItem): Promise<MediaItem> {
  const data = await readStore();
  data.items = [item, ...data.items];
  await writeStore(data);
  return item;
}

export async function removeItem(id: string): Promise<boolean> {
  const data = await readStore();
  const item = data.items.find((i) => i.id === id);
  if (!item) return false;
  data.items = data.items.filter((i) => i.id !== id);
  await writeStore(data);
  if (item.type === 'text') {
    await fs.rm(path.join(UPLOADS_ROOT, DIRS.text, `${id}.md`), { force: true });
  } else {
    const name = path.basename(item.content);
    if (name) await fs.rm(path.join(UPLOADS_ROOT, DIRS[item.type], name), { force: true });
  }
  return true;
}

export async function updateItem(id: string, updates: { title?: string; content?: string }): Promise<boolean> {
  const data = await readStore();
  const idx = data.items.findIndex((i) => i.id === id);
  if (idx === -1) return false;
  const item = data.items[idx];
  if (updates.title !== undefined) item.title = updates.title;
  if (updates.content !== undefined) {
    item.content = updates.content;
    if (item.type === 'text') {
      await writeTextFile(id, updates.content);
    }
  }
  data.items[idx] = item;
  await writeStore(data);
  return true;
}

export async function saveStyle(style: StyleConfig) {
  const data = await readStore();
  data.style = style;
  await writeStore(data);
}

export async function saveTitle(title: string) {
  const data = await readStore();
  data.title = title;
  await writeStore(data);
}

export async function writeTextFile(id: string, content: string) {
  await ensureUploads();
  await fs.writeFile(path.join(UPLOADS_ROOT, DIRS.text, `${id}.md`), content, 'utf-8');
}

export async function writeBinaryFile(
  type: 'image' | 'video',
  id: string,
  ext: string,
  buf: Buffer,
): Promise<string> {
  const dir = DIRS[type];
  await ensureUploads();
  await fs.writeFile(path.join(UPLOADS_ROOT, dir, `${id}.${ext}`), buf);
  return `/uploads/${dir}/${id}.${ext}`;
}

/** MIME → 扩展名 */
export const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'video/x-msvideo': 'avi',
};

/** 扩展名 → MIME（用于静态文件访问） */
export const EXT_MIME: Record<string, string> = Object.fromEntries(
  Object.entries(MIME_EXT).map(([mime, ext]) => [ext, mime]),
);
