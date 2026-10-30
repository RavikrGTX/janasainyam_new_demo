// WordPress REST API Client for Janasainyam
import { WP_ENDPOINTS } from "./constants";
import { WordPressPost, WordPressMedia } from "./types";

// Base URL strictly configured through environment variable
export function getWordPressBaseUrl(): string {
  const url = process.env.WORDPRESS_API_URL || process.env.NEXT_PUBLIC_WORDPRESS_API_URL;
  if (!url) {
    throw new Error(
      "WORDPRESS_API_URL is not defined in environment variables. Please check your .env.local file."
    );
  }
  return url.replace(/\/+$/, "");
}

export interface VerifiedNewspaperEdition {
  id: string;
  mediaId: number;
  title: string;
  subtitle: string;
  filename: string;
  pdfUrl: string;
  proxyPdfUrl: string;
  coverImageUrl: string;
  uploadDate: string;
  fileSizeMb: string;
  isSampleEdition: boolean;
  note: string;
}

/**
 * Fetch published posts with embedded media and terms.
 * Using cache: "no-store" so CMS changes reflect immediately.
 */
export async function getPublishedPosts(params?: {
  page?: number;
  perPage?: number;
  category?: number;
}): Promise<{ posts: WordPressPost[]; totalPosts: number; totalPages: number }> {
  const page = params?.page || 1;
  const perPage = params?.perPage || 10;

  const queryParams = new URLSearchParams({
    _embed: "true",
    page: String(page),
    per_page: String(perPage),
    status: "publish",
  });

  if (params?.category) {
    queryParams.append("categories", String(params.category));
  }

  try {
    const baseUrl = getWordPressBaseUrl();
    const endpoint = `${baseUrl}${WP_ENDPOINTS.posts}?${queryParams.toString()}`;

    const res = await fetch(endpoint, {
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(`Failed to fetch posts: ${res.status} ${res.statusText}`);
      return { posts: [], totalPosts: 0, totalPages: 0 };
    }

    const totalPosts = parseInt(res.headers.get("X-WP-Total") || "0", 10);
    const totalPages = parseInt(res.headers.get("X-WP-TotalPages") || "0", 10);
    const posts: WordPressPost[] = await res.json();

    return { posts, totalPosts, totalPages };
  } catch (error) {
    console.error("Error fetching WordPress posts:", error);
    return { posts: [], totalPosts: 0, totalPages: 0 };
  }
}

/**
 * Fetch all newspaper PDF attachments from WordPress Media Library,
 * ordered by upload date descending (newest first).
 * Uses cache: "no-store" so uploads/deletions reflect immediately.
 */
export async function getPdfEditionsFromWordPress(
  perPage: number = 20
): Promise<VerifiedNewspaperEdition[]> {
  try {
    const baseUrl = getWordPressBaseUrl();
    const queryParams = new URLSearchParams({
      mime_type: "application/pdf",
      orderby: "date",
      order: "desc",
      per_page: String(perPage),
    });

    const endpoint = `${baseUrl}${WP_ENDPOINTS.media}?${queryParams.toString()}`;

    const res = await fetch(endpoint, {
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(`Failed to fetch PDF media from WordPress: ${res.status}`);
      return [];
    }

    const items: WordPressMedia[] = await res.json();
    if (!Array.isArray(items)) {
      return [];
    }

    return items
      .filter((item) => item.mime_type === "application/pdf" && Boolean(item.source_url))
      .map((media) => {
        const sizes = media.media_details?.sizes;
        const coverUrl =
          sizes?.large?.source_url ||
          sizes?.full?.source_url ||
          sizes?.medium?.source_url ||
          sizes?.thumbnail?.source_url ||
          "";

        const fileSize = media.filesize || media.media_details?.filesize;
        const fileSizeMb = fileSize ? (fileSize / (1024 * 1024)).toFixed(1) + " MB" : "";

        return {
          id: `edition-wp-${media.id}`,
          mediaId: media.id,
          title: media.title?.rendered || "జనసైన్యం దినపత్రిక",
          subtitle: `తాజా సంచిక (Media ID: ${media.id})`,
          filename: media.filename || media.slug || `newspaper-${media.id}.pdf`,
          pdfUrl: media.source_url,
          proxyPdfUrl: `/api/pdf-proxy?url=${encodeURIComponent(media.source_url)}`,
          coverImageUrl: coverUrl,
          uploadDate: media.date,
          fileSizeMb,
          isSampleEdition: false,
          note: `WordPress మీడియా లైబ్రరీ నుండి లోడ్ చేయబడింది (ID: ${media.id})`,
        };
      });
  } catch (error) {
    console.error("Error fetching PDF editions from WordPress:", error);
    return [];
  }
}

/**
 * Get the latest uploaded newspaper PDF from WordPress.
 * Returns null if no PDFs exist in the media library.
 */
export async function getLatestNewspaperEdition(): Promise<VerifiedNewspaperEdition | null> {
  const editions = await getPdfEditionsFromWordPress(1);
  return editions.length > 0 ? editions[0] : null;
}
