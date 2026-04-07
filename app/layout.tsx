import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "园林建筑模型导览",
  description: "基于位置总览与单体 GLB 切换的园林建筑展示。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
