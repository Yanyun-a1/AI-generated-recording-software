/**
 * 存储客户端适配层：同一套前端逻辑，双环境运行
 *
 * - 桌面版（Tauri）：通过 invoke 调用 Rust 后端命令，文件存应用数据目录 uploads/
 * - 网页版（浏览器）：走原 Next.js API 路由（/api/records、/api/upload）
 *
 * 数据接口与网页版 API 语义完全对齐，页面组件无感知切换。
 */
import type { MediaItem, StyleConfig } from '@/lib/types';

export interface StoreData {
  items: MediaItem[];
  style: StyleConfig;
}

/** 是否运行在 Tauri 桌面环境 */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'video/x-msvideo': 'avi',
};

/** 读取全部记录与样式 */
export async function getRecords(): Promise<StoreData> {
  if (isTauri()) {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke('get_records');
  }
  const res = await fetch('/api/records');
  if (!res.ok) throw new Error('加载失败');
  return res.json();
}

/** 新增文字记录 */
export async function addText(title: string, content: string): Promise<MediaItem> {
  if (isTauri()) {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke('save_text', { title, content });
  }
  const res = await fetch('/api/records', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'text', title, content }),
  });
  if (!res.ok) throw new Error('保存失败');
  return res.json();
}

/** 新增图片/视频文件记录 */
export async function addFile(title: string, file: File): Promise<MediaItem> {
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  if (!isImage && !isVideo) throw new Error('仅支持图片或视频文件');

  const ext =
    MIME_EXT[file.type] ||
    file.name.split('.').pop()?.toLowerCase() ||
    (isImage ? 'jpg' : 'mp4');

  if (isTauri()) {
    const { invoke } = await import('@tauri-apps/api/core');
    const data = new Uint8Array(await file.arrayBuffer());
    return invoke('save_file', {
      title,
      kind: isImage ? 'image' : 'video',
      ext,
      data,
    });
  }

  // 网页版：二进制直传 /api/records（与组件原协议一致：X-Filename/X-File-Type 头）
  const res = await fetch('/api/records', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'X-Filename': file.name,
      'X-File-Type': file.type,
    },
    body: await file.arrayBuffer(),
  });
  if (!res.ok) throw new Error('上传失败');
  return res.json();
}

/** 删除记录（索引 + 实体文件） */
export async function deleteRecord(id: string): Promise<void> {
  if (isTauri()) {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('delete_record', { id });
    return;
  }
  const res = await fetch(`/api/records?id=${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('删除失败');
}

/** 保存样式 */
export async function saveStyle(style: StyleConfig): Promise<void> {
  if (isTauri()) {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('save_style', { style });
    return;
  }
  const res = await fetch('/api/records', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ style }),
  });
  if (!res.ok) throw new Error('样式保存失败');
}

/**
 * 将记录内容解析为可显示的 URL
 * - 桌面版：content = uploads/xxx → convertFileSrc(应用数据目录 + content)（asset protocol）
 * - 网页版：content = uploads/xxx → /uploads/xxx（Next 静态服务）
 */
export async function resolveMediaUrl(content: string): Promise<string> {
  if (isTauri()) {
    const [{ convertFileSrc }, { appDataDir }] = await Promise.all([
      import('@tauri-apps/api/core'),
      import('@tauri-apps/api/path'),
    ]);
    const dir = await appDataDir();
    return convertFileSrc(`${dir}/${content}`);
  }
  return `/${content}`;
}
