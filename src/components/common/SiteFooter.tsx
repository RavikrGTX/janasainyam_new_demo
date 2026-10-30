import Image from "next/image";
import Link from "next/link";
import { NAV_CATEGORIES } from "@/lib/constants";
import { Mail, MapPin, Globe } from "lucide-react";

export default function SiteFooter() {
  return (
    <footer className="bg-[#081733] text-slate-300 border-t-4 border-[#0f2b5c] pt-10 pb-6">
      <div className="editorial-container">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-slate-800">
          {/* Brand Col */}
          <div className="md:col-span-5 space-y-4">
            <div className="bg-white p-2 rounded inline-block max-w-[200px]">
              <Image
                src="/images/logo.jpg"
                alt="జనసైన్యం లోగో"
                width={180}
                height={50}
                className="h-10 w-auto object-contain"
              />
            </div>
            <p className="font-telugu text-sm text-slate-300 leading-relaxed max-w-sm">
              జనసైన్యం తెలుగు దినపత్రిక & ఈ-పేపర్. ప్రజల సమస్యలపై నిరంతర పోరాటం, నిజాయితీతో కూడిన వార్తలు, లోతైన విశ్లేషణల కోసం విశ్వసనీయ వేదిక.
            </p>
            <div className="text-xs text-slate-400 font-mono">
              ISSN / RNI Registered • Digital E-Paper Edition
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="font-telugu font-bold text-white text-sm border-b border-slate-700 pb-1.5 inline-block">
              ముఖ్య విభాగాలు (Categories)
            </h4>
            <ul className="grid grid-cols-2 gap-2 text-xs font-telugu">
              {NAV_CATEGORIES.slice(0, 8).map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={cat.href}
                    className="hover:text-white transition hover:underline"
                  >
                    {cat.nameTelugu}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact / Edition Details */}
          <div className="md:col-span-3 space-y-3 text-xs font-telugu">
            <h4 className="font-bold text-white text-sm border-b border-slate-700 pb-1.5 inline-block">
              సంప్రదించండి (Contact)
            </h4>
            <div className="space-y-2 text-slate-300">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>హైదరాబాద్ & విజయవాడ, ఆంధ్రప్రదేశ్ / తెలంగాణ</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="font-mono">contact@janasainyam.in</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="font-mono">epaper.janasainyam.in</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-telugu">
          <p>© 2026 జనసైన్యం దినపత్రిక. సర్వహక్కులు ప్రత్యేకించబడ్డాయి.</p>
          <p className="font-mono text-[11px] text-slate-500">
            జనసైన్యం డిజిటల్ ఈ-పేపర్
          </p>
        </div>
      </div>
    </footer>
  );
}
