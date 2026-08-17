import { Solar, Lunar } from 'lunar-javascript';

export function formatGregorian(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const w = weekDays[date.getDay()];
  return `${y}年${m}月${d}日 星期${w}`;
}

export function formatLunar(date: Date): string {
  const solar = Solar.fromDate(date);
  const lunar = solar.getLunar();
  const year = lunar.getYear();
  const month = lunar.getMonthInChinese();
  const day = lunar.getDayInChinese();
  const zodiac = lunar.getYearShengXiao();
  const ganZhi = lunar.getYearInGanZhi();
  return `农历${year}(${ganZhi}${zodiac})年${month}月${day}`;
}

export function formatDate(date: Date, format: 'gregorian' | 'lunar'): string {
  return format === 'lunar' ? formatLunar(date) : formatGregorian(date);
}

export function isSameDay(ts1: number, ts2: number): boolean {
  const d1 = new Date(ts1);
  const d2 = new Date(ts2);
  return d1.getFullYear() === d2.getFullYear()
    && d1.getMonth() === d2.getMonth()
    && d1.getDate() === d2.getDate();
}

export function isToday(ts: number): boolean {
  return isSameDay(ts, Date.now());
}

export function getDateKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
