"use client";

import { useState } from "react";
import { FaAmazon, FaApple } from "react-icons/fa";
import { SiAudible, SiGoogleplay } from "react-icons/si";

interface WhereToReadProps {
  title: string;
  authorNames: string;
}

export function WhereToReadSection({ title, authorNames }: WhereToReadProps) {
  const [showAll, setShowAll] = useState(false);

  const encodedBook = encodeURIComponent(`${title} ${authorNames}`);

  const providers = [
    {
      name: "Google Play Books",
      url: `https://play.google.com/store/search?q=${encodedBook}&c=books`,
      badges: ["EBOOK", "BUY"],
      logo: (
        <div className="h-7 w-7 rounded-lg bg-white flex items-center justify-center p-1 shrink-0 shadow-sm ring-1 ring-black/5">
          <SiGoogleplay aria-hidden="true" className="h-4 w-4 text-[#34a853]" />
        </div>
      ),
    },
    {
      name: "Amazon Kindle",
      url: `https://www.amazon.com/s?k=${encodeURIComponent(`${title} ${authorNames} kindle`)}`,
      badges: ["KINDLE", "BUY"],
      logo: (
        <div className="h-7 w-7 rounded-lg bg-white flex items-center justify-center p-1 shrink-0 shadow-sm ring-1 ring-black/5">
          <FaAmazon aria-hidden="true" className="h-[17px] w-[17px] text-[#131921]" />
        </div>
      ),
    },
    {
      name: "Audible Audio",
      url: `https://www.audible.com/search?keywords=${encodedBook}`,
      badges: ["AUDIO", "LISTEN"],
      logo: (
        <div className="h-7 w-7 rounded-lg bg-[#111820] flex items-center justify-center p-1 shrink-0 border border-amber-400/25 shadow-sm">
          <SiAudible aria-hidden="true" className="h-4 w-4 text-[#f7991c]" />
        </div>
      ),
    },
    {
      name: "Apple Books",
      url: `https://books.apple.com/search?term=${encodedBook}`,
      badges: ["EBOOK"],
      logo: (
        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#ff6942] to-[#f43b16] flex items-center justify-center p-1 shrink-0 shadow-sm ring-1 ring-white/10">
          <FaApple aria-hidden="true" className="h-4 w-4 text-white" />
        </div>
      ),
    },
  ];

  const visibleProviders = showAll ? providers : providers.slice(0, 3);
  const remainingCount = providers.length - 3;

  return (
    <div className="w-full">
      {/* WHERE TO READ Letterboxd-style Card */}
      <div className="w-full rounded-2xl border border-[#2b333e] bg-[#1a2027] overflow-hidden font-[Inter,sans-serif] text-xs shadow-xl">
        {/* Header Bar */}
        <div className="flex items-center px-3.5 py-2.5 bg-[#1f2630] border-b border-[#28323e]">
          <span className="text-[11px] font-bold tracking-wider text-[#93a2b2] uppercase select-none">
            Where to Read
          </span>
        </div>

        {/* Brand Rows */}
        <div className="divide-y divide-[#232c37]">
          {visibleProviders.map((provider) => (
            <a
              key={provider.name}
              href={provider.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3.5 py-2.5 hover:bg-[#222a35] transition group cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                {provider.logo}
                <span className="font-semibold text-[#d5dfeb] group-hover:text-white text-xs truncate">
                  {provider.name}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {provider.badges.map((badge) => (
                  <span
                    key={badge}
                    className="text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded-[3px] bg-[#222a35] group-hover:bg-[#2b3543] text-[#8697a8] group-hover:text-[#bdd0e2] border border-[#2e3948] transition"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </a>
          ))}

          {/* Show More / Show Less Toggle Row */}
          {providers.length > 3 && (
            <button
              type="button"
              onClick={() => setShowAll((prev) => !prev)}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-[#222a35] transition text-[#8697a8] hover:text-[#c8d4e0] cursor-pointer"
            >
              <div className="h-6 w-6 rounded-md bg-[#222a35] flex items-center justify-center shrink-0 border border-[#2e3948]">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <circle cx="5" cy="12" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="19" cy="12" r="2" />
                </svg>
              </div>
              <span className="text-[11px] font-medium">
                {showAll ? "Show less" : `Show ${remainingCount} more`}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
