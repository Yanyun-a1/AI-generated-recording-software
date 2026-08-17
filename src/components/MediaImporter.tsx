'use client';

import { useState, useRef, useCallback } from 'react';
import type { MediaItem } from '@/lib/types';
import { addText, addFile } from '@/lib/storage-client';

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

export default function MediaImporter({ onAdd, styleConfig }: MediaImporterProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'image' | 'video'>('text');
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showFontList, setShowFontList] = useState(false);
  const [showCustomFontPanel, setShowCustomFontPanel] = useState(false);
  const [customFontName, setCustomFontName] = useState('');
  const [customFontUrl, setCustomFontUrl] = useState('');
  const [customFonts, setCustomFonts] = useState<{ label: string; value: string }[]>([]);
  const [currentColor, setCurrentColor] = useState('#ffffff');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fontFileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

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
      const item = await addText(title, content);
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
      const item = await addFile(title, file);
      onAdd(item);
    } catch {
      alert('上传失败，请重试');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleImportFont = async () => {
    if (!customFontName.trim()) {
      alert('请输入字体名称');
      return;
    }

    // If a font file is provided, load it as a font face
    const fontFile = fontFileInputRef.current?.files?.[0];
    if (fontFile) {
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          const fontData = e.target?.result as string;
          const fontFace = new FontFace(customFontName, `url(${fontData})`);
          fontFace.load().then((loadedFace) => {
            document.fonts.add(loadedFace);
            const fontValue = `"${customFontName}", sans-serif`;
            setCustomFonts((prev) => [...prev, { label: customFontName, value: fontValue }]);
            setCustomFontName('');
            setCustomFontUrl('');
            if (fontFileInputRef.current) fontFileInputRef.current.value = '';
            setShowCustomFontPanel(false);
          }).catch(() => {
            alert('字体加载失败，请检查文件格式');
          });
        };
        reader.readAsDataURL(fontFile);
      } catch {
        alert('字体导入失败');
      }
    } else if (customFontUrl.trim()) {
      // Load from URL
      try {
        const fontFace = new FontFace(customFontName, `url(${customFontUrl})`);
        fontFace.load().then((loadedFace) => {
          document.fonts.add(loadedFace);
          const fontValue = `"${customFontName}", sans-serif`;
          setCustomFonts((prev) => [...prev, { label: customFontName, value: fontValue }]);
          setCustomFontName('');
          setCustomFontUrl('');
          setShowCustomFontPanel(false);
        }).catch(() => {
          alert('字体加载失败，请检查 URL 是否有效');
        });
      } catch {
        alert('字体导入失败');
      }
    } else {
      // Just add as a system font name (user knows it's installed)
      const fontValue = `"${customFontName}", sans-serif`;
      setCustomFonts((prev) => [...prev, { label: customFontName, value: fontValue }]);
      setCustomFontName('');
      setCustomFontUrl('');
      setShowCustomFontPanel(false);
    }
  };

  const allFonts = [...FONT_FAMILIES, ...customFonts];
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
          {/* Formatting Toolbar */}
          <div
            className="flex items-center gap-1 px-2 py-1.5 bg-white/5 border border-white/10 flex-wrap"
            style={{ borderRadius: styleConfig.borderRadius - 4 }}
          >
            {/* Font Family */}
            <div className="relative">
              <button
                onClick={() => { setShowFontList(!showFontList); setShowCustomFontPanel(false); }}
                className="px-2 py-1 text-xs text-white/60 hover:text-white/90 hover:bg-white/10 transition-colors"
                style={{ borderRadius: 4 }}
                title="字体"
              >
                字体
              </button>
              {showFontList && (
                <div className="absolute top-full left-0 mt-1 z-50 bg-[#1a1025] border border-white/15 shadow-xl min-w-[180px] py-1 max-h-[280px] overflow-y-auto" style={{ borderRadius: 6 }}>
                  {allFonts.map((font) => (
                    <button
                      key={font.value}
                      onClick={() => {
                        setCurrentColor(currentColor); // keep current color
                        execCommand('fontName', font.value === 'inherit' ? 'inherit' : font.value.split(',')[0].replace(/"/g, ''));
                        setShowFontList(false);
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                      style={{ fontFamily: font.value }}
                    >
                      {font.label}
                    </button>
                  ))}
                  <div className="border-t border-white/10 my-1" />
                  <button
                    onClick={() => { setShowCustomFontPanel(true); setShowFontList(false); }}
                    className="w-full px-3 py-1.5 text-left text-xs text-white/50 hover:bg-white/10 hover:text-white/80 transition-colors flex items-center gap-1.5"
                  >
                    <span>+</span>
                    <span>更多字体</span>
                  </button>
                </div>
              )}
            </div>

            <div className="w-px h-4 bg-white/10 mx-1" />

            {/* Font Color - Native Color Picker */}
            <div className="relative">
              <button
                onClick={() => colorInputRef.current?.click()}
                className="px-2 py-1 text-xs hover:bg-white/10 transition-colors flex items-center gap-1"
                style={{ borderRadius: 4 }}
                title="字体颜色"
              >
                <span className="text-white/60">A</span>
                <span className="w-3 h-3 border border-white/20" style={{ background: currentColor }} />
              </button>
              <input
                ref={colorInputRef}
                type="color"
                value={currentColor}
                onChange={(e) => {
                  setCurrentColor(e.target.value);
                  execCommand('foreColor', e.target.value);
                }}
                className="absolute opacity-0 w-0 h-0 pointer-events-none"
              />
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

          {/* Custom Font Import Panel */}
          {showCustomFontPanel && (
            <div
              className="p-3 bg-white/5 border border-white/15 space-y-3"
              style={{ borderRadius: styleConfig.borderRadius - 4 }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/70 font-medium">导入字体</span>
                <button
                  onClick={() => setShowCustomFontPanel(false)}
                  className="text-white/40 hover:text-white/70 text-xs"
                >
                  关闭
                </button>
              </div>
              <input
                type="text"
                value={customFontName}
                onChange={(e) => setCustomFontName(e.target.value)}
                placeholder="字体名称（必填）"
                className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 px-3 py-2 text-xs outline-none focus:border-white/30"
                style={{ borderRadius: 4 }}
              />
              <input
                type="text"
                value={customFontUrl}
                onChange={(e) => setCustomFontUrl(e.target.value)}
                placeholder="字体文件 URL（可选）"
                className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 px-3 py-2 text-xs outline-none focus:border-white/30"
                style={{ borderRadius: 4 }}
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fontFileInputRef.current?.click()}
                  className="px-3 py-1.5 text-xs text-white/60 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                  style={{ borderRadius: 4 }}
                >
                  选择字体文件
                </button>
                <input
                  ref={fontFileInputRef}
                  type="file"
                  accept=".ttf,.otf,.woff,.woff2"
                  className="hidden"
                  onChange={() => {}}
                />
                <span className="text-xs text-white/30">或输入 URL</span>
              </div>
              <button
                onClick={handleImportFont}
                className="w-full py-2 text-xs font-medium transition-colors"
                style={{
                  borderRadius: 4,
                  background: styleConfig.primaryColor + '40',
                  color: styleConfig.primaryColor,
                  border: `1px solid ${styleConfig.primaryColor}50`,
                }}
              >
                导入字体
              </button>
              <p className="text-[10px] text-white/30 leading-relaxed">
                支持 TTF、OTF、WOFF、WOFF2 格式。也可输入字体名称直接使用系统已安装的字体。
              </p>
            </div>
          )}

          {/* Rich Text Editor */}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 outline-none focus:border-white/30 transition-colors min-h-[120px] max-h-[200px] overflow-y-auto custom-scrollbar whitespace-pre-wrap break-words empty:before:content-[attr(data-placeholder)] empty:before:text-white/30"
            style={{ borderRadius: styleConfig.borderRadius - 4, fontSize: 14, lineHeight: 1.6 }}
            data-placeholder="输入文字内容..."
            spellCheck={false}
          />

          <button
            onClick={handleAddText}
            disabled={!editorRef.current?.innerText.trim() || uploading}
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
