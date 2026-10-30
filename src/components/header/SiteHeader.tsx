"use client";

import Image from "next/image";
import Link from "next/link";
import { Calendar, BookOpen } from "lucide-react";
import { getFormattedTeluguDate } from "@/lib/constants";

interface SiteHeaderProps {
  onOpenReader?: () => void;
}

export default function SiteHeader({ onOpenReader }: SiteHeaderProps) {
  const formattedToday = getFormattedTeluguDate();

  return (
    <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* 1. Top Information Bar */}
      <div className="bg-[#0f2b5c] text-white text-xs py-1.5 px-4">
        <div className="editorial-container flex flex-wrap items-center justify-between gap-2">
          {/* Left: Date & Location */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-telugu text-blue-100">
              <Calendar className="w-3.5 h-3.5 text-blue-300" />
              {formattedToday}
            </span>

          </div>

          {/* Right: Quick E-paper link & Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={onOpenReader}
              className="inline-flex items-center gap-1.5 bg-[#c9182b] hover:bg-[#a61322] text-white px-2.5 py-0.5 rounded text-xs font-medium transition cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>ఈ-పేపర్ చదవండి</span>
            </button>
            <span className="text-blue-300/60 hidden md:inline">|</span>
            <span className="hidden md:inline text-blue-200 text-xs">
              తెలుగు దినపత్రిక
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Masthead Section */}
      <div className="border-b border-slate-200 py-3 md:py-4 bg-white">
        <div className="editorial-container flex items-center justify-between gap-4">
          {/* Left: Newspaper Brand Logo & Identity */}
          <div className="flex items-center gap-4">
            <Link href="/" className="inline-block relative">
              <div className="flex items-center gap-3">
                <Image
                  src="/images/logo.jpg"
                  alt="జనసైన్యం లోగో - Janasainyam Telugu Daily"
                  width={240}
                  height={65}
                  priority
                  className="h-12 md:h-16 w-auto object-contain"
                />
              </div>
            </Link>
          </div>

          {/* Center/Right: Logo tagline text */}
          <div className="hidden lg:flex flex-col items-end text-right">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-medium">
              ప్రజల పక్షం
            </p>
            <p className="font-telugu-serif text-[#c9182b] text-xl font-bold leading-tight">
              జనసైన్యం
            </p>
          </div>

          {/* Mobile: E-paper button only */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={onOpenReader}
              className="p-2 rounded bg-blue-50 text-[#0f2b5c] text-xs font-medium flex items-center gap-1"
            >
              <BookOpen className="w-4 h-4" />
              <span>ఈ-పేపర్</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
