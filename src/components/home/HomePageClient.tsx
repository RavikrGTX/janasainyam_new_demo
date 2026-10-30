"use client";

import { useState } from "react";
import SiteHeader from "@/components/header/SiteHeader";
import TodayEditionHero from "@/components/newspaper/TodayEditionHero";
import PreviousEditionsSection from "@/components/newspaper/PreviousEditionsSection";
import LatestNewsSection from "@/components/news/LatestNewsSection";
import SiteFooter from "@/components/common/SiteFooter";
import EpaperReaderModal from "@/components/reader/EpaperReaderModal";
import { WordPressPost } from "@/lib/types";
import { VerifiedNewspaperEdition } from "@/lib/wordpress";

interface HomePageClientProps {
  edition: VerifiedNewspaperEdition | null;
  archiveEditions?: VerifiedNewspaperEdition[];
  posts: WordPressPost[];
}

export default function HomePageClient({
  edition,
  archiveEditions = [],
  posts,
}: HomePageClientProps) {
  const [selectedReaderEdition, setSelectedReaderEdition] =
    useState<VerifiedNewspaperEdition | null>(null);

  const openReader = (ed: VerifiedNewspaperEdition | null) => {
    if (ed) {
      setSelectedReaderEdition(ed);
    }
  };

  const closeReader = () => {
    setSelectedReaderEdition(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      {/* 1. Newspaper Header */}
      <SiteHeader onOpenReader={() => openReader(edition)} />

      {/* 2. Today's Newspaper — Primary Focus (Latest Uploaded PDF) */}
      <TodayEditionHero
        edition={edition}
        onOpenReader={() => openReader(edition)}
      />

      {/* 3. Previous Editions / Archives */}
      <PreviousEditionsSection
        editions={archiveEditions}
        onSelectEdition={(ed) => openReader(ed)}
      />

      {/* 4. Latest News (WordPress REST API) */}
      <LatestNewsSection posts={posts} />

      {/* 5. Footer */}
      <SiteFooter />

      {/* Custom PDF.js Newspaper Reader */}
      {selectedReaderEdition && (
        <EpaperReaderModal
          isOpen={Boolean(selectedReaderEdition)}
          onClose={closeReader}
          pdfUrl={selectedReaderEdition.proxyPdfUrl}
          editionTitle={selectedReaderEdition.title}
          editionSubtitle={selectedReaderEdition.subtitle}
        />
      )}
    </div>
  );
}
