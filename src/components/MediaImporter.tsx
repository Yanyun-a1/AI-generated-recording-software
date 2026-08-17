'use client';

import { useState, useRef } from 'react';
import type { MediaItem } from '@/lib/types';
import { addText, addFile } from '@/lib/storage-client';
import RichTextEditor from '@/components/RichTextEditor';

interface MediaImporterProps {
  onAdd: (item: MediaItem) => void;
  styleConfig: {
    primaryColor: string;
    borderRadius: number;
  };
}

export default function MediaImporter({ onAdd, styleConfig }: MediaImporterProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'image' | 'video'>('text');
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [textContent, setTextContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddText = async () => {
    const plainText = textContent.replace(/<[^>]*>/g, '').trim();
    if (!plainText || uploading) return;
    setUploading(true);
    try {
      const item = await addText(title, textContent);
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
      const item = await addFile(title, file);
      onAdd(item);
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
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="记录标题"
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
          <RichTextEditor
            value={textContent}
            onChange={setTextContent}
            placeholder="输入文字内容..."
            borderRadius={styleConfig.borderRadius}
            primaryColor={styleConfig.primaryColor}
          />

          <button
            onClick={handleAddText}
            disabled={!textContent.replace(/<[^>]*>/g, '').trim() || uploading}
            className="w-full py-2.5 text-sm font-medium transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              borderRadius: styleConfig.borderRadius - 4,
              background: uploading ? 'rgba(255,255,255,0.1)' : styleConfig.primaryColor,
              color: '#fff',
              boxShadow: uploading ? 'none' : `0 0 20px ${styleConfig.primaryColor}40`,
            }}
          >
            {uploading ? '保存中...' : '保存文字记录'}
          </button>
        </div>
      )}

      {(activeTab === 'image' || activeTab === 'video') && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-2 border-dashed border-white/15 hover:border-white/30 transition-all duration-200 flex flex-col items-center justify-center py-12 cursor-pointer group"
          style={{ borderRadius: styleConfig.borderRadius - 4 }}
        >
          <div
            className="w-12 h-12 flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
            style={{ color: styleConfig.primaryColor }}
          >
            {activeTab === 'image' ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            )}
          </div>
          <p className="text-sm text-white/50 group-hover:text-white/70 transition-colors">
            点击选择{activeTab === 'image' ? '图片' : '视频'}文件
          </p>
          <p className="text-xs text-white/30 mt-1">
            {activeTab === 'image' ? 'JPG, PNG, GIF, WebP' : 'MP4, WebM, MOV'}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept={activeTab === 'image' ? 'image/*' : 'video/*'}
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {uploading && activeTab !== 'text' && (
        <div className="flex items-center gap-2 text-sm" style={{ color: styleConfig.primaryColor }}>
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          上传中...
        </div>
      )}
    </div>
  );
}
