import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "小红书AI - AI文案生成器",
  description: "使用AI生成高质量小红书文案，支持多种风格，一键生成爆款笔记",
  keywords: ["小红书", "AI文案", "种草笔记", "爆款文案"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}
