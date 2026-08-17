'use client';

import { useState } from 'react';
import type { MediaItem } from '@/lib/types';

interface MediaCardProps {
  item: MediaItem;
  onDelete: (id: string) => void;
  styleConfig: {
    primaryColor: string;
    borderRadius: number;
    fontSize: number;
  };
}

export default function MediaCard({ item, onDelete, styleConfig }: MediaCardProps) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(item.createdAt);
  const timeStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

  return (
    <div
      className="group relative border border-white/10 bg-white/5 overflow-hidden transition-all duration-300 hover:border-white/20"
      style={{
        borderRadius: styleConfig.borderRadius - 4,
        fontSize: styleConfig.fontSize,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="shrink-0 w-6 h-6 flex items-center justify-center text-xs font-bold"
            style={{
              borderRadius: 6,
              background: item.type === 'text' ? styleConfig.primaryColor + '30' : item.type === 'image' ? '#ec489930' : '#06b6d430',
              color: item.type === 'text' ? styleConfig.primaryColor : item.type === 'image' ? '#ec4899' : '#06b6d4',
            }}
          >
            {item.type === 'text' ? 'T' : item.type === 'image' ? 'I' : 'V'}
          </span>
          <span className="text-sm text-white/80 truncate">{item.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/30">{timeStr}</span>
          <button
            onClick={() => onDelete(item.id)}
            className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-all duration-200 p-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        {item.type === 'text' && (
          <div
            className={`text-white/70 whitespace-pre-wrap leading-relaxed ${expanded ? '' : 'line-clamp-4'}`}
          >
            {item.content}
          </div>
        )}
        {item.type === 'image' && (
          <div className="flex justify-center">
            <img
              src={item.content}
              alt={item.title}
              className={`object-contain border border-white/10 ${expanded ? 'max-h-[500px]' : 'max-h-60'}`}
              style={{ borderRadius: styleConfig.borderRadius - 8 }}
            />
          </div>
        )}
        {item.type === 'video' && (
          <div className="flex justify-center">
            <video
              src={item.content}
              controls
              className={`border border-white/10 ${expanded ? 'max-h-[500px]' : 'max-h-60'}`}
              style={{ borderRadius: styleConfig.borderRadius - 8 }}
            />
          </div>
        )}
      </div>

      {/* Expand toggle for long text */}
      {item.type === 'text' && item.content.length > 200 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-2 text-xs text-white/40 hover:text-white/60 border-t border-white/5 transition-colors"
        >
          {expanded ? '收起' : '展开全文'}
        </button>
      )}
    </div>
  );
}
