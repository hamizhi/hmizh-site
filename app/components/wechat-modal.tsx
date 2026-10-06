"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle, X } from "lucide-react";

type WechatModalProps = {
  isOpen: boolean;
  onClose: () => void;
  wechatId: string;
  qrCodeUrl?: string;
};

export default function WechatModal({
  isOpen,
  onClose,
  wechatId,
  qrCodeUrl,
}: WechatModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(wechatId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wechat-modal-title"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭微信客服弹窗"
          className="absolute right-4 top-4 text-gray-400 transition hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
          <MessageCircle className="h-6 w-6" />
        </div>
        <h2 id="wechat-modal-title" className="text-lg font-bold text-gray-900">
          微信人工极速充值
        </h2>
        <p className="mt-1 text-xs text-gray-500">
          添加客服微信咨询充值，客服会为你确认订单与发卡
        </p>

        <div className="my-5 flex justify-center">
          <div className="flex h-48 w-48 items-center justify-center rounded-xl border border-gray-100 bg-gray-50 p-2 shadow-inner">
            {qrCodeUrl ? (
              <img
                src={qrCodeUrl}
                alt="微信客服二维码"
                className="h-full w-full rounded-lg object-contain"
              />
            ) : (
              <div className="px-4 text-xs leading-5 text-gray-400">
                请在 `.env.local` 配置
                <br />
                `NEXT_PUBLIC_WECHAT_QR_CODE_URL`
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-gray-100 px-3 py-2 text-left text-sm text-gray-700">
          <span className="min-w-0 truncate font-mono font-medium">
            微信号：{wechatId}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="ml-3 flex shrink-0 items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copied ? "已复制" : "复制"}
          </button>
        </div>

        <p className="mt-3 text-[11px] text-gray-400">
          添加好友时请备注：【ChatGPT充值】
        </p>
      </div>
    </div>
  );
}
