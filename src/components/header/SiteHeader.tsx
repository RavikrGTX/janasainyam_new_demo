"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  BookOpen,
  Menu,
  X,
} from "lucide-react";
import { SITE_CONFIG, NAV_CATEGORIES, getFormattedTeluguDate } from "@/lib/constants";

interface SiteHeaderProps {
  onOpenReader?: () => void;
}

export default function SiteHeader({ onOpenReader }: SiteHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
            <span className="hidden sm:inline text-blue-300/60">|</span>
            <span className="hidden sm:inline text-blue-200 font-telugu">
              {SITE_CONFIG.editionLocation}
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

          {/* Center/Right: Edition Tagline & Badge */}
          <div className="hidden lg:flex flex-col items-end text-right">
            <p className="font-telugu-serif text-slate-800 text-sm font-semibold">
              నిజమైన ప్రజా గళం — విశ్వసనీయ సమాచారం
            </p>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              TELUGU DAILY & DIGITAL E-PAPER
            </p>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={onOpenReader}
              className="p-2 rounded bg-blue-50 text-[#0f2b5c] text-xs font-medium flex items-center gap-1"
            >
              <BookOpen className="w-4 h-4" />
              <span>ఈ-పేపర్</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-700 hover:bg-slate-100 transition"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Telugu Navigation Menu */}
      <nav className="bg-slate-100/80 border-t border-slate-200 hidden md:block">
        <div className="editorial-container">
          <ul className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none text-sm font-medium">
            {NAV_CATEGORIES.map((cat, idx) => (
              <li key={cat.id}>
                {cat.id === "epaper" ? (
                  <button
                    onClick={onOpenReader}
                    className="px-3.5 py-1.5 rounded text-[#0f2b5c] font-bold hover:bg-blue-100/70 font-telugu flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 text-[#c9182b]" />
                    <span>{cat.nameTelugu}</span>
                  </button>
                ) : (
                  <Link
                    href={cat.href}
                    className={`px-3.5 py-1.5 rounded transition font-telugu inline-block whitespace-nowrap ${
                      idx === 0
                        ? "text-[#0f2b5c] font-bold bg-white shadow-2xs"
                        : "text-slate-700 hover:text-[#0f2b5c] hover:bg-white/80"
                    }`}
                  >
                    {cat.nameTelugu}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 space-y-2 animate-in fade-in">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            వార్తా విభాగాలు (Categories)
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {NAV_CATEGORIES.map((cat) => (
              <div key={cat.id}>
                {cat.id === "epaper" ? (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenReader?.();
                    }}
                    className="w-full text-left px-3 py-2 rounded bg-blue-50 text-[#0f2b5c] font-bold font-telugu text-sm flex items-center gap-2"
                  >
                    <BookOpen className="w-4 h-4 text-[#c9182b]" />
                    <span>{cat.nameTelugu}</span>
                  </button>
                ) : (
                  <Link
                    href={cat.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded text-slate-700 hover:bg-slate-50 font-telugu text-sm"
                  >
                    {cat.nameTelugu}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
