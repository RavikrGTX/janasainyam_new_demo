// Types for Janasainyam Platform

export interface WordPressPost {
  id: number;
  date: string;
  modified: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
    protected: boolean;
  };
  excerpt: {
    rendered: string;
    protected: boolean;
  };
  author: number;
  featured_media: number;
  categories: number[];
  tags: number[];
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      id: number;
      source_url: string;
      alt_text?: string;
      media_details?: {
        width?: number;
        height?: number;
      };
    }>;
    'wp:term'?: Array<
      Array<{
        id: number;
        name: string;
        slug: string;
      }>
    >;
  };
}

export interface WordPressMediaSize {
  file?: string;
  width?: number;
  height?: number;
  mime_type?: string;
  source_url?: string;
  filesize?: number;
}

export interface WordPressMedia {
  id: number;
  date: string;
  slug: string;
  source_url: string;
  title: {
    rendered: string;
  };
  mime_type: string;
  filename?: string;
  filesize?: number;
  media_details?: {
    filesize?: number;
    width?: number;
    height?: number;
    sizes?: {
      full?: WordPressMediaSize;
      large?: WordPressMediaSize;
      medium?: WordPressMediaSize;
      thumbnail?: WordPressMediaSize;
    };
  };
}

export interface NewspaperEdition {
  id: string;
  editionDate: string; // ISO date string e.g. "2026-10-28"
  formattedTeluguDate: string; // e.g. "28 అక్టోబర్ 2026, బుధవారం"
  title: string;
  pdfUrl: string;
  pageCount: number;
  thumbnailUrl?: string;
  cityEdition?: string; // e.g. "హైదరాబాద్ / అమరావతి"
}

export interface NewsArticleItem {
  id: string | number;
  title: string;
  excerpt: string;
  content?: string;
  category: string;
  publishedAt: string;
  imageUrl?: string;
  author?: string;
  slug: string;
}

export interface NavCategory {
  id: string;
  nameTelugu: string;
  nameEnglish: string;
  href: string;
  isPopular?: boolean;
}
