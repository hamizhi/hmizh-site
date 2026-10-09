import type { Metadata } from "next";
import LenisProvider from "./components/lenis-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChatGPT充值｜ChatGPT Plus/Pro国内购买·支付宝微信支付｜ChatGPT代充服务 - GETGPT Pro",
  description: "ChatGPT Plus/Pro 国内购买与订阅服务，支持支付宝、微信支付。",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=AW-18503715952"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'AW-18503715952');
              gtag('config', 'AW-18500682075');
            `,
          }}
        />
      </head>
      <body>
        <LenisProvider>{children}</LenisProvider>
      </body>
    </html>
  );
}
