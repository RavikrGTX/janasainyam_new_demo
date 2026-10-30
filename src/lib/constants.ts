// Janasainyam Platform Constants and Configuration

export const SITE_CONFIG = {
  nameTelugu: "జనసైన్యం",
  nameEnglish: "Janasainyam",
  taglineTelugu: "నిజమైన ప్రజా గళం - తెలుగు దినపత్రిక & ఈ-పేపర్",
  taglineEnglish: "True Voice of the People - Telugu Daily & E-Paper",
  editionLocation: "హైదరాబాద్ & ఆంధ్రప్రదేశ్",
};

// Verified endpoints from user specification
export const WP_ENDPOINTS = {
  discovery: "/wp-json/",
  posts: "/wp-json/wp/v2/posts",
  media: "/wp-json/wp/v2/media",
  categories: "/wp-json/wp/v2/categories",
};

// Default Telugu Categories
export const NAV_CATEGORIES = [
  { id: "home", nameTelugu: "ముఖ్యాంశాలు", nameEnglish: "Home", href: "/" },
  { id: "epaper", nameTelugu: "ఈ-పేపర్", nameEnglish: "E-Paper", href: "/epaper" },
  { id: "andhra", nameTelugu: "ఆంధ్రప్రదేశ్", nameEnglish: "Andhra Pradesh", href: "/category/andhra" },
  { id: "telangana", nameTelugu: "తెలంగాణ", nameEnglish: "Telangana", href: "/category/telangana" },
  { id: "national", nameTelugu: "జాతీయం", nameEnglish: "National", href: "/category/national" },
  { id: "international", nameTelugu: "అంతర్జాతీయం", nameEnglish: "International", href: "/category/international" },
  { id: "politics", nameTelugu: "రాజకీయాలు", nameEnglish: "Politics", href: "/category/politics" },
  { id: "cinema", nameTelugu: "సినిమా", nameEnglish: "Cinema", href: "/category/cinema" },
  { id: "sports", nameTelugu: "క్రీడలు", nameEnglish: "Sports", href: "/category/sports" },
  { id: "business", nameTelugu: "వాణిజ్యం", nameEnglish: "Business", href: "/category/business" },
  { id: "editorial", nameTelugu: "సంపాదకీయం", nameEnglish: "Editorial", href: "/category/editorial" },
];

// Helper to format Telugu dates
export const TELUGU_MONTHS = [
  "జనవరి",
  "ఫిబ్రవరి",
  "మార్చి",
  "ఏప్రిల్",
  "మే",
  "జూన్",
  "జూలై",
  "ఆగస్టు",
  "సెప్టెంబర్",
  "అక్టోబర్",
  "నవంబర్",
  "డిసెంబర్",
];

export const TELUGU_DAYS = [
  "ఆదివారం",
  "సోమవారం",
  "మంగళవారం",
  "బుధవారం",
  "గురువారం",
  "శుక్రవారం",
  "శనివారం",
];

export function getFormattedTeluguDate(dateInput?: Date | string | number): string {
  const date = dateInput ? new Date(dateInput) : new Date();
  const dayName = TELUGU_DAYS[date.getDay()];
  const day = date.getDate();
  const monthName = TELUGU_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${monthName} ${year}, ${dayName}`;
}
