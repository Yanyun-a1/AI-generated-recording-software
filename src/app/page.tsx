'use client';

import { useState, useEffect, useRef } from 'react';
import NeonBackground from '@/components/NeonBackground';
import MediaImporter from '@/components/MediaImporter';
import MediaCard from '@/components/MediaCard';
import StyleCustomizer from '@/components/StyleCustomizer';
import DateDisplay from '@/components/DateDisplay';
import { DEFAULT_STYLE } from '@/lib/types';
import type { MediaItem, StyleConfig } from '@/lib/types';
import { getDateKey, isToday, formatLunar } from '@/lib/dateUtils';

type Tab = 'records' | 'add' | 'style';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('records');
  const [items, setItems] = useState<MediaItem[]>([]);
  const [style, setStyle] = useState<StyleConfig>(DEFAULT_STYLE);
  const [filterDate, setFilterDate] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [lunarDate, setLunarDate] = useState<string>('');
  const styleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 计算农历日期
  useEffect(() => {
    setLunarDate(formatLunar(new Date()));
  }, []);

  // 从本地存储层加载记录与样式
  useEffect(() => {
    fetch('/api/records')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.items)) setItems(data.items);
        if (data.style) setStyle(data.style);
      })
      .catch(() => {});
  }, []);

  const handleAddItem = (item: MediaItem) => {
    setItems((prev) => [item, ...prev]);
    setActiveTab('records');
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const res = await fetch(`/api/records?id=${id}`, { method: 'DELETE' });
      if (!res.ok) return;
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      // ignore
    }
  };

  const handleEditItem = async (id: string, title: string, content: string) => {
    try {
      const res = await fetch(`/api/records`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, title, content }),
      });
      if (!res.ok) return;
      setItems((prev) => prev.map((i) => i.id === id ? { ...i, title, content } : i));
    } catch {
      // ignore
    }
  };

  // 样式变更本地即时生效，防抖 400ms 后落盘
  const handleStyleChange = (next: StyleConfig) => {
    setStyle(next);
    if (styleTimer.current) clearTimeout(styleTimer.current);
    styleTimer.current = setTimeout(() => {
      fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ style: next }),
      }).catch(() => {});
    }, 400);
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    {
      key: 'records',
      label: '记录列表',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      key: 'add',
      label: '添加记录',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
    {
      key: 'style',
      label: '样式设置',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      ),
    },
  ];

  const textCount = items.filter((i) => i.type === 'text').length;
  const imageCount = items.filter((i) => i.type === 'image').length;
  const videoCount = items.filter((i) => i.type === 'video').length;

  const filteredItems = filterDate
    ? items.filter((item) => getDateKey(item.createdAt) === filterDate)
    : items;

  return (
    <>
      <NeonBackground
        primaryColor={style.primaryColor}
        secondaryColor={style.secondaryColor}
        accentColor={style.accentColor}
        animationSpeed={style.animationSpeed}
      />

      <div className="flex items-center justify-center min-h-screen p-4 sm:p-8">
        <div
          className="w-full max-w-2xl border border-white/10 overflow-hidden"
          style={{
            borderRadius: style.borderRadius,
            background: `rgba(15, 10, 30, ${style.panelOpacity})`,
            backdropFilter: `blur(${style.panelBlur}px)`,
            WebkitBackdropFilter: `blur(${style.panelBlur}px)`,
            boxShadow: `0 0 60px ${style.primaryColor}10, 0 0 120px ${style.secondaryColor}08, inset 0 1px 0 rgba(255,255,255,0.05)`,
          }}
        >
          {/* Header */}
          <div
            className="px-6 py-5 border-b border-white/10"
            style={{
              borderRadius: `${style.borderRadius}px ${style.borderRadius}px 0 0`,
              background: 'rgb(8, 4, 18)',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h1
                  className="text-xl font-bold tracking-wide"
                  style={{
                    color: style.primaryColor,
                    textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                  }}
                >
                  大数据竞赛程序记录
                </h1>
                <p className="text-xs text-white/30 mt-1">Big Data Competition Recorder</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <DateDisplay dateFormat={style.dateFormat} primaryColor={style.primaryColor} />
                <div className="flex gap-3 text-xs text-white/30">
                  <span>{textCount} 文字</span>
                  <span>{imageCount} 图片</span>
                  <span>{videoCount} 视频</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {activeTab === 'records' && (
              <div>
                {/* Date filter bar + view toggle */}
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="bg-white/5 border border-white/10 text-white/70 text-xs px-3 py-1.5 outline-none focus:border-white/25 transition-colors"
                    style={{ borderRadius: style.borderRadius - 6, colorScheme: 'dark' }}
                  />
                  {filterDate && (
                    <button
                      onClick={() => setFilterDate('')}
                      className="text-xs text-white/30 hover:text-white/60 transition-colors px-2 py-1.5"
                      style={{ borderRadius: style.borderRadius - 6, background: 'rgba(255,255,255,0.05)' }}
                    >
                      清除筛选
                    </button>
                  )}
                  {filterDate && (
                    <span className="text-xs text-white/25">
                      {filteredItems.length} 条记录
                    </span>
                  )}
                  <div className="ml-auto flex items-center gap-1 bg-white/5 border border-white/10 p-0.5" style={{ borderRadius: style.borderRadius - 6 }}>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-white/80' : 'text-white/30 hover:text-white/50'}`}
                      style={{ borderRadius: style.borderRadius - 8 }}
                      title="网格视图"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 transition-colors ${viewMode === 'list' ? 'bg-white/10 text-white/80' : 'text-white/30 hover:text-white/50'}`}
                      style={{ borderRadius: style.borderRadius - 8 }}
                      title="列表视图"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                  </div>
                  <button
                    onClick={() => setActiveTab('add')}
                    className="p-1.5 text-white/40 hover:text-white/80 transition-colors"
                    style={{ borderRadius: style.borderRadius - 8 }}
                    title="添加记录"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setActiveTab('style')}
                    className="p-1.5 text-white/40 hover:text-white/80 transition-colors"
                    style={{ borderRadius: style.borderRadius - 8 }}
                    title="样式设置"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>

                {viewMode === 'grid' ? (
                <div className="grid grid-cols-3 gap-3">
                  {filteredItems.length === 0 ? (
                    <div className="col-span-3 flex flex-col items-center justify-center py-16 text-white/20">
                      <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p className="text-sm">{filterDate ? '当天暂无记录' : '暂无记录'}</p>
                      <p className="text-xs mt-1">{filterDate ? '试试选择其他日期或清除筛选' : '点击「添加记录」开始记录你的竞赛历程'}</p>
                    </div>
                  ) : (
                    filteredItems.map((item) => (
                      <MediaCard
                        key={item.id}
                        item={item}
                        onDelete={handleDeleteItem}
                        onEdit={handleEditItem}
                        styleConfig={style}
                      />
                    ))
                  )}
                </div>
                ) : (
                <div className="flex flex-col gap-1">
                  {filteredItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-white/20">
                      <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p className="text-sm">{filterDate ? '当天暂无记录' : '暂无记录'}</p>
                      <p className="text-xs mt-1">{filterDate ? '试试选择其他日期或清除筛选' : '点击「添加记录」开始记录你的竞赛历程'}</p>
                    </div>
                  ) : (
                    filteredItems.map((item) => (
                      <div
                        key={item.id}
                        className="group flex items-center gap-3 px-3 py-2.5 border border-white/5 hover:border-white/15 transition-colors cursor-default"
                        style={{
                          background: 'rgba(255,255,255,0.02)',
                          borderRadius: style.borderRadius - 6,
                        }}
                      >
                        {/* Type indicator */}
                        <div
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{
                            background:
                              item.type === 'text' ? style.primaryColor :
                              item.type === 'image' ? style.secondaryColor :
                              style.accentColor,
                          }}
                        />
                        {/* Title */}
                        <span
                          className="flex-1 text-white/70 group-hover:text-white/90 transition-colors truncate"
                          style={{ fontSize: style.fontSize - 1 }}
                        >
                          {item.title}
                        </span>
                        {/* Type badge */}
                        <span className="text-[10px] text-white/20 shrink-0">
                          {item.type === 'text' ? '文字' : item.type === 'image' ? '图片' : '视频'}
                        </span>
                        {/* Date */}
                        <span className="text-[10px] text-white/15 shrink-0">
                          {new Date(item.createdAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                        </span>
                        {/* Delete button */}
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all p-1 shrink-0"
                          title="删除"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))
                  )}
                </div>
                )}
              </div>
            )}

            {activeTab === 'add' && (
              <MediaImporter onAdd={handleAddItem} styleConfig={style} />
            )}

            {activeTab === 'style' && (
              <StyleCustomizer config={style} onChange={handleStyleChange} />
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-white/5 flex items-center justify-between text-xs text-white/20">
            <span>高职版 · 大数据竞赛</span>
            <span
              className="text-base tracking-widest"
              style={{
                fontFamily: "'Ma Shan Zheng', cursive",
                color: `${style.primaryColor}90`,
              }}
            >
              {lunarDate}
            </span>
            <span>数据存储于本地浏览器</span>
          </div>
        </div>
      </div>
    </>
  );
}
