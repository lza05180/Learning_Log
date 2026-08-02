import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const baseUrl = new URL(`${protocol}://${host}`);
  const description =
    "채윤이의 월별 수업 일정과 학습 진도, 과제 수행도를 확인하는 학습 기록 사이트입니다.";
  const imageUrl = new URL("/og.png", baseUrl).toString();

  return {
    metadataBase: baseUrl,
    title: "채윤이의 학습 기록표",
    description,
    robots: {
      index: false,
      follow: false,
      nocache: true,
    },
    openGraph: {
      title: "채윤이의 학습 기록표",
      description,
      type: "website",
      url: baseUrl,
      images: [
        {
          url: imageUrl,
          width: 1536,
          height: 1024,
          alt: "채윤이의 학습 기록표",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "채윤이의 학습 기록표",
      description,
      images: [imageUrl],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
