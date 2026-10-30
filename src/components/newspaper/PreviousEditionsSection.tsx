"use client";

import { useState } from "react";
import Image from "next/image";
import { Calendar, Archive, BookOpen, AlertCircle } from "lucide-react";
import { VerifiedNewspaperEdition } from "@/lib/wordpress";

interface PreviousEditionsSectionProps {
  editions: VerifiedNewspaperEdition[];
  onSelectEdition: (edition: VerifiedNewspaperEdition) => void;
}

export default function PreviousEditionsSection({
  editions,
  onSelectEdition,
}: PreviousEditionsSectionProps) {
  const [selectedDate, setSelectedDate] = useState("");

  const filteredEditions = selectedDate
    ? editions.filter((ed) => ed.uploadDate.startsWith(selectedDate))
    : editions;

  return (
    <section className="py-10 bg-white border-b border-slate-200">
      <div className="editorial-container">
        {/* Section Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-slate-300 pb-3 mb-6">
          <div className="flex items-center gap-2.5">
            <Archive className="w-5 h-5 text-[#0f2b5c]" />
            <h2 className="text-xl sm:text-2xl font-bold font-telugu text-[#0f2b5c]">
              గత సంచికల భాండాగారం (Newspaper Archives)
            </h2>
          </div>

          {/* Simple Date Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-telugu text-slate-500 hidden sm:inline">
              తేదీని ఎంచుకోండి:
            </span>
            <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-md text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-slate-800 text-xs focus:outline-hidden font-mono cursor-pointer"
              />
            </div>
            {selectedDate && (
              <button
                onClick={() => setSelectedDate("")}
                className="text-xs text-blue-600 hover:underline font-telugu cursor-pointer"
              >
                అన్నీ చూపించు
              </button>
            )}
          </div>
        </div>

        {/* Editions Grid or Empty State */}
        {filteredEditions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredEditions.map((ed) => {
              const formattedDate = ed.uploadDate
                ? new Date(ed.uploadDate).toLocaleDateString("te-IN", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "సంచిక";

              return (
                <div
                  key={ed.id}
                  className="bg-slate-50 border border-slate-200 rounded-md overflow-hidden hover:border-[#0f2b5c] transition group flex flex-col justify-between"
                >
                  <div>
                    <div
                      onClick={() => onSelectEdition(ed)}
                      className="relative aspect-[3/4] w-full bg-slate-200 overflow-hidden cursor-pointer"
                    >
                      {ed.coverImageUrl ? (
                        <Image
                          src={ed.coverImageUrl}
                          alt={ed.title}
                          fill
                          sizes="(max-width: 640px) 100vw, 250px"
                          className="object-cover object-top transition duration-200 group-hover:scale-102"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <BookOpen className="w-8 h-8" />
                        </div>
                      )}
                      <div className="absolute top-2 left-2 bg-[#0f2b5c] text-white text-[11px] font-telugu px-2 py-0.5 rounded font-medium shadow-xs">
                        గత సంచిక
                      </div>
                    </div>

                    <div className="p-4">
                      <span className="text-xs text-slate-500 font-mono block mb-1">
                        {formattedDate}
                      </span>
                      <h3 className="font-telugu font-bold text-sm text-slate-900 line-clamp-1 mb-1">
                        {ed.title}
                      </h3>
                      {ed.fileSizeMb && (
                        <span className="text-xs text-slate-500 font-mono">
                          సైజు: {ed.fileSizeMb}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="px-4 pb-4 pt-1">
                    <button
                      onClick={() => onSelectEdition(ed)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-[#0f2b5c] hover:bg-[#193661] text-white rounded text-xs font-telugu font-semibold transition cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>ఈ సంచికను చదవండి</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-md p-8 text-center max-w-lg mx-auto">
            <div className="p-3 bg-slate-100 rounded-full text-slate-400 inline-block mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="font-telugu font-bold text-sm text-slate-700 mb-1">
              గత సంచికలు లేవు
            </h4>
            <p className="font-telugu text-xs text-slate-500 leading-relaxed">
              WordPress CMS లో ఒకటికి మించి పిడిఎఫ్ ఫైళ్లు అప్‌లోడ్ చేసినప్పుడు మునుపటి సంచికలు ఆర్కైవ్‌గా ఇక్కడ కనిపిస్తాయి.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
