'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

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

interface RichTextEditorProps {
  /** 当前 HTML 内容 */
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  borderRadius: number;
  primaryColor?: string;
}

/**
 * 富文本编辑器（添加/编辑共用）：
 * 支持字体、颜色、加粗、下划线、自定义字体导入。
 * 通过 document.execCommand 保持与原实现一致的行为。
 */
export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  borderRadius,
  primaryColor = '#8b5cf6',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fontFileInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [showFontList, setShowFontList] = useState(false);
  const [showCustomFontPanel, setShowCustomFontPanel] = useState(false);
  const [customFontName, setCustomFontName] = useState('');
  const [customFontUrl, setCustomFontUrl] = useState('');
  const [customFonts, setCustomFonts] = useState<{ label: string; value: string }[]>([]);
  const [currentColor, setCurrentColor] = useState('#ffffff');

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  }, []);

  // 外部 value 变化时同步（切换编辑对象等场景）；输入过程中不回写，避免光标跳动
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleImportFont = async () => {
    if (!customFontName.trim()) {
      alert('请输入字体名称');
      return;
    }
    const fontFile = fontFileInputRef.current?.files?.[0];
    if (fontFile) {
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          const fontData = e.target?.result as string;
          const fontFace = new FontFace(customFontName, `url(${fontData})`);
          fontFace
            .load()
            .then((loadedFace) => {
              document.fonts.add(loadedFace);
              const fontValue = `"${customFontName}", sans-serif`;
              setCustomFonts((prev) => [...prev, { label: customFontName, value: fontValue }]);
              setCustomFontName('');
              setCustomFontUrl('');
              if (fontFileInputRef.current) fontFileInputRef.current.value = '';
              setShowCustomFontPanel(false);
            })
            .catch(() => {
              alert('字体加载失败，请检查文件格式');
            });
        };
        reader.readAsDataURL(fontFile);
      } catch {
        alert('字体导入失败');
      }
    } else if (customFontUrl.trim()) {
      try {
        const fontFace = new FontFace(customFontName, `url(${customFontUrl})`);
        const loadedFace = await fontFace.load();
        document.fonts.add(loadedFace);
        const fontValue = `"${customFontName}", sans-serif`;
        setCustomFonts((prev) => [...prev, { label: customFontName, value: fontValue }]);
        setCustomFontName('');
        setCustomFontUrl('');
        setShowCustomFontPanel(false);
      } catch {
        alert('字体加载失败，请检查 URL');
      }
    } else {
      const fontValue = `"${customFontName}", sans-serif`;
      setCustomFonts((prev) => [...prev, { label: customFontName, value: fontValue }]);
      setCustomFontName('');
      setCustomFontUrl('');
      setShowCustomFontPanel(false);
    }
  };

  const allFonts = [...FONT_FAMILIES, ...customFonts];

  return (
    <div className="space-y-2">
      {/* 格式工具栏 */}
      <div
        className="flex items-center gap-1 px-2 py-1.5 bg-white/5 border border-white/10 flex-wrap"
        style={{ borderRadius: borderRadius - 4 }}
      >
        {/* 字体 */}
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
            <div
              className="absolute top-full left-0 mt-1 z-50 bg-[#1a1025] border border-white/15 shadow-xl min-w-[180px] py-1 max-h-[280px] overflow-y-auto"
              style={{ borderRadius: 6 }}
            >
              {allFonts.map((font) => (
                <button
                  key={font.value}
                  onClick={() => {
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

        {/* 颜色 */}
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

        {/* 加粗 */}
        <button
          onClick={() => execCommand('bold')}
          className="px-2 py-1 text-xs font-bold text-white/60 hover:text-white/90 hover:bg-white/10 transition-colors"
          style={{ borderRadius: 4 }}
          title="加粗"
        >
          B
        </button>

        {/* 下划线 */}
        <button
          onClick={() => execCommand('underline')}
          className="px-2 py-1 text-xs text-white/60 hover:text-white/90 hover:bg-white/10 transition-colors underline"
          style={{ borderRadius: 4 }}
          title="下划线"
        >
          U
        </button>
      </div>

      {/* 自定义字体导入面板 */}
      {showCustomFontPanel && (
        <div className="p-3 bg-white/5 border border-white/15 space-y-3" style={{ borderRadius: borderRadius - 4 }}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/70 font-medium">导入字体</span>
            <button onClick={() => setShowCustomFontPanel(false)} className="text-white/40 hover:text-white/70 text-xs">
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
              background: primaryColor + '40',
              color: primaryColor,
              border: `1px solid ${primaryColor}50`,
            }}
          >
            导入字体
          </button>
          <p className="text-[10px] text-white/30 leading-relaxed">
            支持 TTF、OTF、WOFF、WOFF2 格式。也可输入字体名称直接使用系统已安装的字体。
          </p>
        </div>
      )}

      {/* 编辑区 */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(editorRef.current?.innerHTML || '')}
        className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 outline-none focus:border-white/30 transition-colors min-h-[120px] max-h-[200px] overflow-y-auto custom-scrollbar whitespace-pre-wrap break-words empty:before:content-[attr(data-placeholder)] empty:before:text-white/30"
        style={{ borderRadius: borderRadius - 4, fontSize: 14, lineHeight: 1.6 }}
        data-placeholder={placeholder || '输入文字内容...'}
        spellCheck={false}
      />
    </div>
  );
}
