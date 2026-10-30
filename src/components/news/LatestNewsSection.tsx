import Image from "next/image";
import { Newspaper, Calendar, ArrowUpRight } from "lucide-react";
import { WordPressPost } from "@/lib/types";

interface LatestNewsSectionProps {
  posts: WordPressPost[];
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>?/gm, "").trim();
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("te-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function LatestNewsSection({ posts }: LatestNewsSectionProps) {
  return (
    <section className="py-10 bg-slate-50 border-b border-slate-200">
      <div className="editorial-container">
        {/* Section Header */}
        <div className="flex items-center justify-between border-b-2 border-[#0f2b5c] pb-3 mb-6">
          <div className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-[#0f2b5c]" />
            <h2 className="text-xl sm:text-2xl font-bold font-telugu text-[#0f2b5c]">
              తాజా వార్తలు (Latest Published Articles)
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-500 bg-white px-2.5 py-1 rounded border border-slate-200">
            WordPress API Live Feed
          </span>
        </div>

        {posts.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-md p-8 text-center">
            <p className="font-telugu text-slate-600">
              ప్రస్తుతం వెబ్‌సైట్‌లో ప్రచురితమైన కథనాలు లేవు. WordPress CMS లో కొత్త పోస్ట్‌లను ప్రచురించినప్పుడు అవి ఇక్కడ కనిపిస్తాయి.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => {
              const cleanTitle = stripHtml(post.title?.rendered || "వార్త కథనం");
              const cleanExcerpt = stripHtml(post.excerpt?.rendered || "");
              const postDate = formatDate(post.date);

              // Check for featured media from _embedded
              const featuredMedia = post._embedded?.["wp:featuredmedia"]?.[0];
              const imageUrl = featuredMedia?.source_url;

              return (
                <article
                  key={post.id}
                  className="bg-white border border-slate-200 rounded-md overflow-hidden hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    {/* Media Thumbnail or Editorial Placeholder */}
                    {imageUrl ? (
                      <div className="relative aspect-[16/9] w-full bg-slate-100">
                        <Image
                          src={imageUrl}
                          alt={cleanTitle}
                          fill
                          sizes="(max-width: 768px) 100vw, 350px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[16/9] w-full bg-slate-100 flex flex-col items-center justify-center text-slate-400 p-4 border-b border-slate-100">
                        <Newspaper className="w-8 h-8 text-slate-300 mb-1" />
                        <span className="text-xs font-telugu text-slate-400">
                          జనసైన్యం కథనం
                        </span>
                      </div>
                    )}

                    <div className="p-5">
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{postDate}</span>
                        <span>•</span>
                        <span className="text-[#0f2b5c] font-medium font-telugu">
                          ID: {post.id}
                        </span>
                      </div>

                      <h3 className="font-telugu font-bold text-base sm:text-lg text-slate-900 line-clamp-2 mb-2 leading-snug hover:text-[#0f2b5c] transition">
                        {cleanTitle}
                      </h3>

                      <p className="font-telugu text-slate-600 text-xs sm:text-sm line-clamp-3 leading-relaxed">
                        {cleanExcerpt || "వివరాలు త్వరలో..."}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-0">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0f2b5c] hover:underline font-telugu">
                      పూర్తి వివరాలు చదవండి <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
