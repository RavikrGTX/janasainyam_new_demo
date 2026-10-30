"use client";

import Image from "next/image";
import {
  BookOpen,
  Download,
  Share2,
  FileCheck2,
  Eye,
  CheckCircle,
} from "lucide-react";
import { useState } from "react";
import { VerifiedNewspaperEdition } from "@/lib/wordpress";

interface TodayEditionHeroProps {
  edition: VerifiedNewspaperEdition | null;
  onOpenReader: () => void;
}

export default function TodayEditionHero({
  edition,
  onOpenReader,
}: TodayEditionHeroProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "జనసైన్యం ఈ-పేపర్ ఎడిషన్",
        text: "జనసైన్యం తాజా ఈ-పేపర్ సంచిక చదవండి",
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formattedDate = edition?.uploadDate
    ? new Date(edition.uploadDate).toLocaleDateString("te-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "సంచిక";

  return (
    <section className="bg-gradient-to-b from-slate-100/70 via-white to-slate-50 border-b border-slate-200 py-8 md:py-12">
      <div className="editorial-container">
        {/* Section Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#0f2b5c] pb-2.5 mb-8">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 bg-[#c9182b] rounded-full inline-block animate-pulse" />
            <h2 className="text-xl sm:text-2xl font-bold font-telugu text-[#0f2b5c] tracking-tight">
              ఈనాటి ఈ-పేపర్ (Today&apos;s E-Paper Edition)
            </h2>
          </div>
          <div className="text-xs font-semibold text-slate-500 font-telugu bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            హైదరాబాద్ & అమరావతి సంచిక
          </div>
        </div>

        {/* Primary Hero Layout */}
        {!edition ? (
          <div className="bg-white border-2 border-dashed border-slate-300 rounded-lg p-10 text-center max-w-xl mx-auto shadow-xs">
            <div className="p-3 bg-blue-50 text-[#0f2b5c] rounded-full inline-block mb-3">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="font-telugu font-bold text-lg text-slate-900 mb-2">
              ప్రస్తుతం ఈ-పేపర్ పిడిఎఫ్ ఏదీ అప్‌లోడ్ కాలేదు
            </h3>
            <p className="font-telugu text-sm text-slate-600 leading-relaxed mb-4">
              WordPress మీడియా లైబ్రరీలో ఉన్న పాత పిడిఎఫ్ తొలగించబడింది. మీరు WordPress అడ్మిన్ ప్యానెల్‌లో (<code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono text-slate-800">Media &gt; Add New Media File</code>) సరికొత్త వార్తాపత్రిక పిడిఎఫ్‌ను అప్‌లోడ్ చేసిన వెంటనే, ఆ తాజా సంచిక ఆటోమేటిక్‌గా ఇక్కడ ప్రధాన ఈ-పేపర్‌గా కనిపిస్తుంది.
            </p>
            <div className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full font-telugu font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>వర్డ్‌ప్రెస్ లైవ్ సింక్ సిద్ధంగా ఉంది (WordPress Live Sync Active)</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-xs">
            {/* Left Column: Real Newspaper Front Page Cover Preview */}
            <div className="lg:col-span-5 flex justify-center">
              <div
                onClick={onOpenReader}
                className="group relative cursor-pointer block max-w-sm w-full bg-white p-2.5 border border-slate-300 rounded shadow-md hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
              >
                {/* Newspaper Page Frame */}
                <div className="relative aspect-[700/1024] w-full overflow-hidden rounded-xs bg-slate-100 border border-slate-200">
                  {edition.coverImageUrl ? (
                    <Image
                      src={edition.coverImageUrl}
                      alt="జనసైన్యం దినపత్రిక మొదటి పేజీ - Janasainyam Newspaper Cover"
                      fill
                      sizes="(max-width: 768px) 100vw, 400px"
                      className="object-cover object-top transition duration-300 group-hover:scale-102"
                      priority
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
                      <BookOpen className="w-12 h-12 mb-2 text-slate-300" />
                      <span className="font-telugu text-xs">పిడిఎఫ్ ముఖచిత్రం</span>
                    </div>
                  )}

                  {/* Hover overlay for quick reading */}
                  <div className="absolute inset-0 bg-[#0f2b5c]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white p-4 text-center">
                    <div className="p-3 bg-white/20 rounded-full mb-3 backdrop-blur-xs">
                      <Eye className="w-8 h-8 text-white" />
                    </div>
                    <span className="font-telugu font-bold text-base sm:text-lg">
                      క్లిక్ చేసి చదవండి
                    </span>
                    <span className="text-xs text-blue-200 mt-1 font-mono">
                      Click to Open Full E-Paper
                    </span>
                  </div>
                </div>

                {/* Cover Bottom caption */}
                <div className="pt-2 text-center text-xs text-slate-500 flex items-center justify-between font-mono">
                  <span>FRONT PAGE</span>
                  <span className="text-[#0f2b5c] font-semibold">{edition.filename}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Newspaper Edition Details & Direct Reader Action */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
              <div>
                {/* Honest Sample Label & Verification Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0f2b5c] text-xs font-semibold mb-4 font-telugu">
                  <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>{edition.subtitle}</span>
                </div>

                {/* Title */}
                <h1 className="font-telugu-serif text-2xl sm:text-4xl font-bold text-[#0f2b5c] leading-tight mb-3">
                  {edition.title}
                </h1>

                {/* Description */}
                <p className="font-telugu text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
                  ప్రజా శ్రేయస్సే ధ్యేయంగా వెలువడుతున్న జనసైన్యం దినపత్రిక డిజిటల్ ఈ-పేపర్. 
                  కంప్యూటర్, టాబ్లెట్ లేదా మొబైల్ స్క్రీన్‌లలో స్పష్టంగా చదివేందుకు రూపొందించబడిన పూర్తి ఈ-పేపర్ ఎడిషన్.
                </p>

                {/* Edition Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-md text-xs sm:text-sm font-telugu mb-6">
                  <div>
                    <span className="block text-slate-400 text-[11px]">అప్‌లోడ్ తేదీ (Date)</span>
                    <span className="font-semibold text-slate-800">{formattedDate}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 text-[11px]">ఫైల్ సైజు (PDF Size)</span>
                    <span className="font-semibold text-slate-800 font-mono">{edition.fileSizeMb || "3.0 MB"}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 text-[11px]">వర్డ్‌ప్రెస్ మీడియా ID</span>
                    <span className="font-semibold text-emerald-700 font-mono">{edition.mediaId}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {/* Primary Read E-Paper Button */}
                <button
                  onClick={onOpenReader}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-[#0f2b5c] hover:bg-[#193661] text-white rounded-md font-telugu font-bold text-base transition shadow-sm hover:shadow cursor-pointer"
                >
                  <BookOpen className="w-5 h-5 text-yellow-400" />
                  <span>ఈ-పేపర్ చదవండి (Read E-Paper)</span>
                </button>

                {/* Direct PDF Download */}
                <a
                  href={edition.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={edition.filename}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-md font-telugu text-sm font-semibold transition cursor-pointer"
                >
                  <Download className="w-4 h-4 text-slate-600" />
                  <span>డౌన్‌లోడ్ PDF</span>
                </a>

                {/* Share button */}
                <button
                  onClick={handleShare}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-md font-telugu text-sm font-semibold transition cursor-pointer"
                >
                  {copied ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4 text-slate-600" />}
                  <span>{copied ? "లింక్ కాపీ అయింది" : "షేర్"}</span>
                </button>
              </div>

              {/* Honest verification note */}
              <div className="text-xs text-slate-400 font-telugu flex items-center gap-1.5 pt-1">
                <span>గమనిక: {edition.note}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
