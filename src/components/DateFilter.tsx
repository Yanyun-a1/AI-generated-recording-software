'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DateFilterProps {
  /** 当前筛选日期 'YYYY-MM-DD'，空串表示未筛选 */
  value: string;
  onChange: (value: string) => void;
  borderRadius: number;
}

/**
 * 中文日期筛选：一个按钮，点击弹出中文日历，点一下日期即完成筛选。
 * 避免原生 <input type="date"> 跟随浏览器语言显示英文。
 */
export default function DateFilter({ value, onChange, borderRadius }: DateFilterProps) {
  const [open, setOpen] = useState(false);
  const selected = value ? parseISO(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 bg-white/5 border border-white/10 text-white/70 text-xs px-3 py-1.5 outline-none focus:border-white/25 transition-colors"
          style={{ borderRadius: borderRadius - 6 }}
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          {value ? (
            <span>
              {Number(value.slice(0, 4))}年{Number(value.slice(5, 7))}月
              {Number(value.slice(8, 10))}日
            </span>
          ) : (
            <span className="text-white/40">按日期筛选</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            if (date) {
              onChange(format(date, 'yyyy-MM-dd'));
              setOpen(false);
            }
          }}
          locale={zhCN}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
