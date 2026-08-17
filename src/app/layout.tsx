import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '记录软件',
  description: '大数据竞赛高职版程序记录软件，支持文字、图片、视频导入与自定义样式',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
