"use client";

import { useState } from "react";
import {
  Download,
  Share2,
  X,
  Check,
  Copy,
} from "lucide-react";

interface ClippingModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  editionTitle: string;
  editionDate?: string;
}

export default function ClippingModal({
  isOpen,
  onClose,
  imageUrl,
  editionTitle,
  editionDate,
}: ClippingModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [sharing, setSharing] = useState(false);

  if (!isOpen || !imageUrl) return null;

  const shareText = `జనసైన్యం దినపత్రిక వార్తా క్లిప్పింగ్ - ${editionTitle} (${editionDate || "ఈ-పేపర్"})\nమరిన్ని వార్తల కోసం: ${typeof window !== "undefined" ? window.location.href : ""}`;

  // Direct download
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `janasainyam-clipping-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Native share with file support (WhatsApp, Telegram, etc.)
  const handleNativeShare = async () => {
    try {
      setSharing(true);
      // Convert data URL to Blob/File for native image sharing
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const file = new File([blob], "janasainyam-news-clipping.png", {
        type: "image/png",
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "జనసైన్యం వార్తా క్లిప్పింగ్",
          text: shareText,
        });
      } else if (navigator.share) {
        await navigator.share({
          title: "జనసైన్యం వార్తా క్లిప్పింగ్",
          text: shareText,
          url: window.location.href,
        });
      } else {
        handleWhatsAppShare();
      }
    } catch {
      // User cancelled or unsupported
    } finally {
      setSharing(false);
    }
  };

  // WhatsApp direct share
  const handleWhatsAppShare = () => {
    const encodedText = encodeURIComponent(
      `📰 *జనసైన్యం దినపత్రిక వార్తా కథనం*\n${editionTitle}\n\nపూర్తి ఈ-పేపర్ చదవడానికి క్లిక్ చేయండి:\n${window.location.href}`
    );
    window.open(`https://api.whatsapp.com/send?text=${encodedText}`, "_blank");
  };

  // Facebook share
  const handleFacebookShare = () => {
    const shareUrl = encodeURIComponent(window.location.href);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
      "_blank",
      "width=600,height=500"
    );
  };

  // Twitter / X share
  const handleTwitterShare = () => {
    const text = encodeURIComponent(
      `జనసైన్యం దినపత్రిక వార్తా క్లిప్పింగ్: ${editionTitle}`
    );
    const shareUrl = encodeURIComponent(window.location.href);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${shareUrl}`,
      "_blank",
      "width=600,height=500"
    );
  };

  // Copy Image to clipboard
  const handleCopyImage = async () => {
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      if (navigator.clipboard && navigator.clipboard.write) {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      } else {
        navigator.clipboard.writeText(window.location.href);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
    } catch {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-300">
        {/* Header */}
        <div className="bg-[#0f2b5c] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-telugu font-bold text-sm sm:text-base">
              వార్తా క్లిప్పింగ్ (News Clipping Ready)
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/20 transition cursor-pointer"
            title="మూసివేయి"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Clipped Image Preview Box */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-100 flex items-center justify-center">
          <div className="relative shadow-lg border border-slate-300 bg-white rounded-xs overflow-hidden max-h-[60vh] flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="కత్తిరించిన వార్తా భాగం"
              className="max-h-[58vh] max-w-full object-contain"
            />
          </div>
        </div>

        {/* Share & Download Actions */}
        <div className="bg-slate-50 border-t border-slate-200 p-3 sm:p-5 space-y-3">
          {/* Primary Quick Share Bar */}
          <div className="flex flex-col sm:flex-row gap-2">
            {/* WhatsApp Share - Most used */}
            <button
              onClick={handleWhatsAppShare}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1da850] text-white rounded-md font-telugu text-sm font-bold shadow-sm transition cursor-pointer"
            >
              <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.81 13.47 3.81 11.91C3.81 7.37 7.5 3.67 12.05 3.67Z" />
              </svg>
              <span>వాట్సాప్‌లో షేర్ చేయండి (WhatsApp)</span>
            </button>

            {/* Native Device Share (Shares the cropped picture) */}
            <button
              onClick={handleNativeShare}
              disabled={sharing}
              className="flex items-center justify-center gap-1.5 py-3 px-4 bg-[#0f2b5c] hover:bg-[#193661] text-white rounded-md font-telugu text-sm font-semibold shadow-sm transition cursor-pointer"
            >
              <Share2 className="w-4 h-4 shrink-0" />
              <span>షేర్ (Share)</span>
            </button>
          </div>

          {/* Secondary Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded font-telugu text-xs font-semibold shadow-2xs transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>డౌన్‌లోడ్</span>
            </button>

            <button
              onClick={handleCopyImage}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded font-telugu text-xs font-semibold shadow-2xs transition cursor-pointer"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
              <span>{copiedLink ? "కాపీ అయింది!" : "కాపీ (Copy)"}</span>
            </button>

            <button
              onClick={handleFacebookShare}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-slate-100 text-[#1877F2] border border-slate-300 rounded font-telugu text-xs font-semibold shadow-2xs transition cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>ఫేస్‌బుక్</span>
            </button>

            <button
              onClick={handleTwitterShare}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 rounded font-telugu text-xs font-semibold shadow-2xs transition cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>ట్విట్టర్ (X)</span>
            </button>
          </div>

          <div className="flex items-center justify-end pt-2 border-t border-slate-200 text-xs">
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-800 transition font-telugu cursor-pointer"
            >
              మళ్లీ చదవండి (Back to Reading)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
