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

  const text = dateFormat === 'lunar' ? formatLunar(now) : formatGregorian(now);

  return (
    <div
      className="text-sm font-medium whitespace-nowrap"
      style={{ color: primaryColor }}
    >
      {text}
    </div>
  );
}
