import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { MediaItem } from './types';
import { readFileBytes } from './storage-client';

/** 富文本 HTML 转纯文本（导出 Word 用） */
function htmlToPlainText(html: string): string {
  if (typeof document === 'undefined') return html;
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || '';
}

/** 根据文件路径推断 MIME */
function getMimeFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
  };
  return map[ext] || 'application/octet-stream';
}

/** 读取媒体文件为 Blob（桌面版走 Rust 读盘，网页版走 HTTP） */
async function getMediaBlob(item: MediaItem): Promise<Blob> {
  const bytes = await readFileBytes(item.content);
  return new Blob([new Uint8Array(bytes)], { type: getMimeFromPath(item.content) });
}

function getWeekNumber(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - start.getTime();
  const oneWeek = 604800000;
  return Math.ceil((diff / oneWeek) + 1);
}

function getFolderStructure(level: 'daily' | 'weekly' | 'monthly' | 'yearly', date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const week = getWeekNumber(date);
  const day = date.getDate();

  switch (level) {
    case 'daily':
      return '';
    case 'weekly':
      return `第${week}周/`;
    case 'monthly':
      return `${month}月/第${week}周/`;
    case 'yearly':
      return `${year}年/${month}月/第${week}周/`;
  }
}

function getDateRange(level: 'daily' | 'weekly' | 'monthly' | 'yearly', refDate: Date): { start: Date; end: Date } {
  const start = new Date(refDate);
  const end = new Date(refDate);

  switch (level) {
    case 'daily':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'weekly': {
      const dayOfWeek = start.getDay() || 7;
      start.setDate(start.getDate() - dayOfWeek + 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case 'monthly':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'yearly':
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
      break;
  }

  return { start, end };
}

async function createWordDocument(item: MediaItem): Promise<Blob> {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: item.title,
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `创建时间: ${new Date(item.createdAt).toLocaleString('zh-CN')}`,
              size: 20,
              color: '666666',
            }),
          ],
          spacing: { after: 400 },
        }),
        ...htmlToPlainText(item.content).split('\n').map(line =>
          new Paragraph({
            children: [new TextRun({ text: line, size: 24 })],
            spacing: { after: 100 },
          })
        ),
      ],
    }],
  });

  return await Packer.toBlob(doc);
}

function base64ToBlob(base64: string): Blob {
  const parts = base64.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
  const bstr = atob(parts[1]);
  const n = bstr.length;
  const u8arr = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    u8arr[i] = bstr.charCodeAt(i);
  }
  return new Blob([u8arr], { type: mime });
}
function getFileExtension(item: MediaItem): string {
  if (item.type === 'text') return '.docx';
  // content 形如 uploads/images/xxx.png，从路径取扩展名
  const name = item.content.split('/').pop() || '';
  const dot = name.lastIndexOf('.');
  if (dot > 0) return name.slice(dot);
  return item.type === 'image' ? '.png' : '.mp4';
}

export async function exportRecords(
  items: MediaItem[],
  level: 'daily' | 'weekly' | 'monthly' | 'yearly',
  refDate: Date = new Date()
): Promise<void> {
  const { start, end } = getDateRange(level, refDate);
  
  const filteredItems = items.filter(item => {
    const itemDate = new Date(item.createdAt);
    return itemDate >= start && itemDate <= end;
  });

  if (filteredItems.length === 0) {
    alert('所选时间范围内没有记录');
    return;
  }

  const zip = new JSZip();
  const folder = getFolderStructure(level, refDate);

  for (const item of filteredItems) {
    const ext = getFileExtension(item);
    const fileName = `${item.title.replace(/[\/\\:*?"<>|]/g, '_')}${ext}`;
    const filePath = folder + fileName;

    if (item.type === 'text') {
      const wordBlob = await createWordDocument(item);
      zip.file(filePath, wordBlob);
    } else {
      const blob = await getMediaBlob(item);
      zip.file(filePath, blob);
    }
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  
  const levelNames = { daily: '每日', weekly: '每周', monthly: '每月', yearly: '每年' };
  const dateStr = refDate.toISOString().split('T')[0];
  saveAs(zipBlob, `${levelNames[level]}导出_${dateStr}.zip`);
}
