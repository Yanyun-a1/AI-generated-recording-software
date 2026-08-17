'use client';

import { useState, useEffect } from 'react';
import { formatGregorian, formatLunar } from '@/lib/dateUtils';

interface DateDisplayProps {
  dateFormat: 'gregorian' | 'lunar';
  primaryColor: string;
}

export default function DateDisplay({ dateFormat, primaryColor }: DateDisplayProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
  }, []);

  if (!now) return null;

  const gregorian = formatGregorian(now);
  const lunar = formatLunar(now);
  const isLunar = dateFormat === 'lunar';

  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <div
          className="text-sm font-medium"
          style={{ color: primaryColor }}
        >
          {isLunar ? lunar : gregorian}
        </div>
        <div className="text-[10px] text-white/25 mt-0.5">
          {isLunar ? gregorian : lunar}
        </div>
      </div>
    </div>
  );
}
