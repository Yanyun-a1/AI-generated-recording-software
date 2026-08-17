'use client';

import { useState, useRef } from 'react';
import type { MediaItem } from '@/lib/types';

interface MediaImporterProps {
  onAdd: (item: MediaItem) => void;
  styleConfig: {
    primaryColor: string;
    borderRadius: number;
  };
}

export default function MediaImporter({ onAdd, styleConfig }: MediaImporterProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'image' | 'video'>('text');
  const [textContent, setTextContent] = useState('');
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddText = async () => {
    if (!textContent.trim() || uploading) return;
    setUploading(true);
    try {
      const res = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'text', title, content: textContent }),
      });
      if (!res.ok) throw new Error('save failed');
      const item: MediaItem = await res.json();
      onAdd(item);
      setTextContent('');
      setTitle('');
    } catch {
      alert('文字保存失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || uploading) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo) return;

    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('title', title);
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      if (!res.ok) throw new Error('upload failed');
      const item: MediaItem = await res.json();
      onAdd(item);
      setTitle('');
    } catch {
      alert('上传失败，请重试');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const tabs = [
    { key: 'text' as const, label: '文字' },
    { key: 'image' as const, label: '图片' },
    { key: 'video' as const, label: '视频' },
  ];

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="标题（可选）"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 px-4 py-2.5 outline-none focus:border-white/30 transition-colors"
        style={{ borderRadius: styleConfig.borderRadius - 4 }}
      />

      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-4 py-2 text-sm font-medium transition-all duration-200"
            style={{
              borderRadius: styleConfig.borderRadius - 4,
              background: activeTab === tab.key ? styleConfig.primaryColor + '30' : 'rgba(255,255,255,0.05)',
              color: activeTab === tab.key ? styleConfig.primaryColor : 'rgba(255,255,255,0.6)',
              border: `1px solid ${activeTab === tab.key ? styleConfig.primaryColor + '50' : 'rgba(255,255,255,0.1)'}`,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'text' && (
        <div className="space-y-3">
          <textarea
            placeholder="输入文字内容..."
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            rows={6}
            className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 px-4 py-3 outline-none focus:border-white/30 transition-colors resize-none"
            style={{ borderRadius: styleConfig.borderRadius - 4 }}
          />
          <button
            onClick={handleAddText}
            disabled={!textContent.trim() || uploading}
            className="w-full py-2.5 font-medium text-white transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              borderRadius: styleConfig.borderRadius - 4,
              background: `linear-gradient(135deg, ${styleConfig.primaryColor}, ${styleConfig.primaryColor}99)`,
            }}
          >
            {uploading ? '保存中...' : '添加文字记录'}
          </button>
        </div>
      )}

      {(activeTab === 'image' || activeTab === 'video') && (
        <div className="space-y-3">
          <label
            htmlFor="media-file-input"
            className="flex flex-col items-center justify-center gap-3 py-10 border border-dashed border-white/20 cursor-pointer hover:border-white/40 transition-colors"
            style={{ borderRadius: styleConfig.borderRadius - 4 }}
          >
            <svg className="w-10 h-10 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {activeTab === 'image' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              )}
            </svg>
            <span className="text-sm text-white/40">
              {uploading ? '上传中...' : `点击选择${activeTab === 'image' ? '图片' : '视频'}文件`}
            </span>
            <span className="text-xs text-white/20">
              {activeTab === 'image' ? '支持 JPG, PNG, GIF, WebP' : '支持 MP4, WebM, MOV'}
            </span>
          </label>
          <input
            id="media-file-input"
            ref={fileInputRef}
            type="file"
            accept={activeTab === 'image' ? 'image/*' : 'video/*'}
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}
