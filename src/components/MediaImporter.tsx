'use client';

import { useState, useRef, useCallback } from 'react';
import type { MediaItem } from '@/lib/types';

interface MediaImporterProps {
  onAdd: (item: MediaItem) => void;
  styleConfig: {
    primaryColor: string;
    borderRadius: number;
  };
}

const FONT_FAMILIES = [
  { label: '默认', value: 'inherit' },
  { label: '宋体', value: 'SimSun, serif' },
  { label: '黑体', value: 'SimHei, sans-serif' },
  { label: '楷体', value: 'KaiTi, serif' },
  { label: '仿宋', value: 'FangSong, serif' },
  { label: '微软雅黑', value: '"Microsoft YaHei", sans-serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Times New Roman', value: '"Times New Roman", serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Courier New', value: '"Courier New", monospace' },
];

const FONT_COLORS = [
  '#ffffff', '#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c',
  '#4dabf7', '#9775fa', '#f783ac', '#868e96', '#20c997',
];

export default function MediaImporter({ onAdd, styleConfig }: MediaImporterProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'image' | 'video'>('text');
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showFontList, setShowFontList] = useState(false);
  const [showColorList, setShowColorList] = useState(false);
  const [currentFont, setCurrentFont] = useState('inherit');
  const [currentColor, setCurrentColor] = useState('#ffffff');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  }, []);

  const handleAddText = async () => {
    const content = editorRef.current?.innerHTML || '';
    const plainText = editorRef.current?.innerText || '';
    if (!plainText.trim() || uploading) return;
    setUploading(true);
    try {
      const res = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'text', title, content }),
      });
      if (!res.ok) throw new Error('save failed');
      const item: MediaItem = await res.json();
      onAdd(item);
      if (editorRef.current) editorRef.current.innerHTML = '';
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
          {/* Formatting Toolbar */}
          <div
            className="flex items-center gap-1 px-2 py-1.5 bg-white/5 border border-white/10 flex-wrap"
            style={{ borderRadius: styleConfig.borderRadius - 4 }}
          >
            {/* Font Family */}
            <div className="relative">
              <button
                onClick={() => { setShowFontList(!showFontList); setShowColorList(false); }}
                className="px-2 py-1 text-xs text-white/60 hover:text-white/90 hover:bg-white/10 transition-colors"
                style={{ borderRadius: 4 }}
                title="字体"
              >
                字体
              </button>
              {showFontList && (
                <div className="absolute top-full left-0 mt-1 z-50 bg-[#1a1025] border border-white/15 shadow-xl min-w-[160px] py-1" style={{ borderRadius: 6 }}>
                  {FONT_FAMILIES.map((font) => (
                    <button
                      key={font.value}
                      onClick={() => {
                        setCurrentFont(font.value);
                        execCommand('fontName', font.value === 'inherit' ? 'inherit' : font.value.split(',')[0].replace(/"/g, ''));
                        setShowFontList(false);
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                      style={{ fontFamily: font.value }}
                    >
                      {font.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="w-px h-4 bg-white/10 mx-1" />

            {/* Font Color */}
            <div className="relative">
              <button
                onClick={() => { setShowColorList(!showColorList); setShowFontList(false); }}
                className="px-2 py-1 text-xs hover:bg-white/10 transition-colors flex items-center gap-1"
                style={{ borderRadius: 4 }}
                title="字体颜色"
              >
                <span className="text-white/60">A</span>
                <span className="w-3 h-3 border border-white/20" style={{ background: currentColor }} />
              </button>
              {showColorList && (
                <div className="absolute top-full left-0 mt-1 z-50 bg-[#1a1025] border border-white/15 shadow-xl p-2 grid grid-cols-5 gap-1.5" style={{ borderRadius: 6 }}>
                  {FONT_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        setCurrentColor(color);
                        execCommand('foreColor', color);
                        setShowColorList(false);
                      }}
                      className="w-6 h-6 border border-white/20 hover:scale-110 transition-transform"
                      style={{ background: color, borderRadius: 4 }}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="w-px h-4 bg-white/10 mx-1" />

            {/* Bold */}
            <button
              onClick={() => execCommand('bold')}
              className="px-2 py-1 text-xs font-bold text-white/60 hover:text-white/90 hover:bg-white/10 transition-colors"
              style={{ borderRadius: 4 }}
              title="加粗"
            >
              B
            </button>

            {/* Underline */}
            <button
              onClick={() => execCommand('underline')}
              className="px-2 py-1 text-xs text-white/60 hover:text-white/90 hover:bg-white/10 transition-colors underline"
              style={{ borderRadius: 4 }}
              title="下划线"
            >
              U
            </button>
          </div>

          {/* Rich Text Editor */}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            data-placeholder="输入文字内容..."
            className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 outline-none focus:border-white/30 transition-colors overflow-y-auto min-h-[150px] max-h-[300px]"
            style={{
              borderRadius: styleConfig.borderRadius - 4,
              fontFamily: currentFont,
            }}
            onFocus={() => { setShowFontList(false); setShowColorList(false); }}
          />

          <button
            onClick={handleAddText}
            disabled={uploading}
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
