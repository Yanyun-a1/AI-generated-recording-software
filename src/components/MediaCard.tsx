'use client';

import { useState } from 'react';
import type { MediaItem } from '@/lib/types';

interface MediaCardProps {
  item: MediaItem;
  onDelete: (id: string) => void;
  onEdit: (id: string, title: string, content: string) => void;
  styleConfig: {
    primaryColor: string;
    borderRadius: number;
    fontSize: number;
  };
}

export default function MediaCard({ item, onDelete, onEdit, styleConfig }: MediaCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);
  const [editContent, setEditContent] = useState(item.content);

  const date = new Date(item.createdAt);
  const timeStr = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

  const handleSave = () => {
    if (editTitle.trim()) {
      onEdit(item.id, editTitle.trim(), editContent);
      setEditing(false);
    }
  };

  const handleCancel = () => {
    setEditTitle(item.title);
    setEditContent(item.content);
    setEditing(false);
  };

  return (
    <div
      className="group relative border border-white/10 bg-white/5 overflow-hidden transition-all duration-300 hover:border-white/25 flex flex-col"
      style={{
        borderRadius: styleConfig.borderRadius - 4,
        fontSize: styleConfig.fontSize - 1,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-2.5 py-2 border-b border-white/5">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span
            className="shrink-0 w-5 h-5 flex items-center justify-center text-[10px] font-bold"
            style={{
              borderRadius: 4,
              background: item.type === 'text' ? styleConfig.primaryColor + '30' : item.type === 'image' ? '#ec489930' : '#06b6d430',
              color: item.type === 'text' ? styleConfig.primaryColor : item.type === 'image' ? '#ec4899' : '#06b6d4',
            }}
          >
            {item.type === 'text' ? 'T' : item.type === 'image' ? 'I' : 'V'}
          </span>
          {editing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="bg-white/10 border border-white/20 text-white/90 text-xs px-1.5 py-0.5 flex-1 min-w-0 outline-none focus:border-white/40"
              style={{ borderRadius: 3 }}
              autoFocus
            />
          ) : (
            <span className="text-xs text-white/80 truncate">{item.title}</span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] text-white/25">{timeStr}</span>
          {item.type === 'text' && (
            <button
              onClick={() => editing ? handleSave() : setEditing(true)}
              className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-white/60 transition-all duration-200 p-0.5"
              title={editing ? '保存' : '编辑'}
            >
              {editing ? (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              )}
            </button>
          )}
          <button
            onClick={() => onDelete(item.id)}
            className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-all duration-200 p-0.5"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-2.5 py-2 flex-1 min-h-0">
        {item.type === 'text' && (
          editing ? (
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full bg-white/10 border border-white/20 text-white/80 text-xs px-2 py-1.5 outline-none focus:border-white/40 resize-none"
              style={{ borderRadius: 3, minHeight: '80px' }}
            />
          ) : (
            <div className="text-white/60 text-xs leading-relaxed overflow-hidden" style={{ maxHeight: expanded ? '300px' : '80px' }}>
              <div className="whitespace-pre-wrap">{item.content}</div>
            </div>
          )
        )}
        {item.type === 'image' && (
          <div className="flex justify-center">
            <img
              src={item.content}
              alt={item.title}
              className="object-cover w-full h-20 border border-white/10"
              style={{ borderRadius: styleConfig.borderRadius - 8 }}
            />
          </div>
        )}
        {item.type === 'video' && (
          <div className="flex justify-center">
            <video
              src={item.content}
              controls
              className="object-cover w-full h-20 border border-white/10"
              style={{ borderRadius: styleConfig.borderRadius - 8 }}
            />
          </div>
        )}
      </div>

      {/* Footer actions */}
      {editing && (
        <div className="flex items-center justify-end gap-2 px-2.5 py-1.5 border-t border-white/5 bg-white/5">
          <button
            onClick={handleCancel}
            className="text-[10px] text-white/40 hover:text-white/60 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="text-[10px] px-2 py-0.5 transition-colors"
            style={{
              background: styleConfig.primaryColor + '40',
              color: styleConfig.primaryColor,
              borderRadius: 3,
            }}
          >
            保存
          </button>
        </div>
      )}

      {/* Expand toggle for long text */}
      {!editing && item.type === 'text' && item.content.length > 120 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="py-1 text-[10px] text-white/30 hover:text-white/50 border-t border-white/5 transition-colors"
        >
          {expanded ? '收起' : '展开'}
        </button>
      )}
    </div>
  );
}
