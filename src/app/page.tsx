import { Suspense } from "react";
import { getPdfEditionsFromWordPress, getPublishedPosts } from "@/lib/wordpress";
import HomePageClient from "@/components/home/HomePageClient";

async function NewspaperHomeContent() {
  // Fetch real PDF editions (ordered newest first) and published posts from WordPress REST API
  const [editions, { posts }] = await Promise.all([
    getPdfEditionsFromWordPress(12),
    getPublishedPosts({ perPage: 6 }),
  ]);

  const latestEdition = editions.length > 0 ? editions[0] : null;
  const archiveEditions = editions.length > 1 ? editions.slice(1) : [];

  return (
    <HomePageClient
      edition={latestEdition}
      archiveEditions={archiveEditions}
      posts={posts}
    />
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-10 h-10 border-3 border-[#0f2b5c] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="font-telugu text-[#0f2b5c] font-semibold text-base">
            జనసైన్యం దినపత్రిక లోడ్ అవుతోంది...
          </p>
        </div>
      }
    >
      <NewspaperHomeContent />
    </Suspense>
  );
}
