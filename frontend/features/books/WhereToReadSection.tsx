"use client";

import { useState } from "react";

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
        <div className="h-6 w-6 rounded-md bg-white flex items-center justify-center p-0.5 shrink-0 shadow-xs">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5">
            <path
              fill="#4285F4"
              d="M3.6 2.4C3.4 2.7 3.2 3.1 3.2 3.7v16.6c0 .6.2 1 .4 1.3l.1.1 9.3-9.3v-.2L3.6 2.4z"
            />
            <path
              fill="#34A853"
              d="M16.1 15.5l-3.1-3.1v-.2l3.1-3.1.1.1 3.7 2.1c1.1.6 1.1 1.6 0 2.2l-3.8 2z"
            />
            <path fill="#FBBC05" d="M13 12.2l-9.4 9.4c.4.4 1 .4 1.7 0l10.8-6.1-3.1-3.3z" />
            <path fill="#EA4335" d="M13 11.8l3.1-3.1L5.3 2.6C4.6 2.2 4 2.2 3.6 2.6L13 11.8z" />
          </svg>
        </div>
      ),
    },
    {
      name: "Amazon Kindle",
      url: `https://www.amazon.com/s?k=${encodeURIComponent(`${title} ${authorNames} kindle`)}`,
      badges: ["KINDLE", "BUY"],
      logo: (
        <div className="h-6 w-6 rounded-md bg-white flex items-center justify-center p-0.5 shrink-0 shadow-xs">
          <svg viewBox="0 0 24 24" className="w-4 h-4">
            <path
              fill="#111"
              d="M13.7 13.9c-.3.4-.8.6-1.3.6-.8 0-1.3-.5-1.3-1.3 0-1.1.9-1.6 2.6-1.7v2.4zm1.9 3.5c-.1.2-.4.3-.6.2-.8-.4-1.1-.7-1.4-1-.8.9-1.8 1.2-2.9 1.2-1.8 0-3.1-1.1-3.1-2.9 0-1.5.9-2.6 2.4-3.1 1.3-.4 3.1-.5 3.1-1.2 0-.6-.4-.9-1.3-.9-.9 0-1.4.3-1.6 1.1 0 .2-.2.3-.4.3l-1.5-.2c-.2 0-.3-.2-.3-.4.4-1.7 1.8-2.6 3.8-2.6 2 0 3.3.9 3.3 2.7v4.6c0 .9.3 1.3.7 1.8.2.2.2.4 0 .6l-1.2 1.3-.5-.4z"
            />
            <path
              fill="#ff9900"
              d="M19.3 19.8c-2.3 1.7-5.7 2.6-8.6 2.6-4.1 0-7.8-1.5-10.6-4-.2-.2-.2-.5.1-.7.4-.3.8-.6 1.2-1 .2-.2.5-.1.7.1 2.4 2 5.3 3.2 8.6 3.2 2.4 0 5.2-.7 7.2-2.1.3-.2.6 0 .7.3.2.5.4 1.1.7 1.6z"
            />
            <path
              fill="#ff9900"
              d="M20.2 18.2c-.3-.4-1.9-.2-2.8-.1-.3 0-.4-.2-.2-.4.9-1.2 2.3-1.7 2.6-1.3.3.4.1 1.9-.8 2.9-.2.2-.4.1-.3-.1.3-.4.6-.9.7-1z"
            />
          </svg>
        </div>
      ),
    },
    {
      name: "Audible Audio",
      url: `https://www.audible.com/search?keywords=${encodedBook}`,
      badges: ["AUDIO", "LISTEN"],
      logo: (
        <div className="h-6 w-6 rounded-md bg-[#0f141b] flex items-center justify-center p-0.5 shrink-0 border border-amber-500/20 shadow-xs">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5">
            <path
              fill="#f7991c"
              d="M12 4a8 8 0 0 0-8 8c0 2.4 1.1 4.6 2.8 6.1l1.4-1.4A6 6 0 0 1 6 12a6 6 0 0 1 12 0c0 1.8-.8 3.4-2.2 4.7l1.4 1.4A8 8 0 0 0 20 12a8 8 0 0 0-8-8z"
            />
            <path
              fill="#f7991c"
              d="M12 7a5 5 0 0 0-5 5c0 1.5.7 2.9 1.8 3.8l1.4-1.4A3 3 0 0 1 9 12a3 3 0 0 1 6 0c0 1-.5 1.9-1.2 2.4l1.4 1.4A5 5 0 0 0 17 12a5 5 0 0 0-5-5z"
            />
            <circle cx="12" cy="12" r="1.5" fill="#f7991c" />
          </svg>
        </div>
      ),
    },
    {
      name: "Apple Books",
      url: `https://books.apple.com/search?term=${encodedBook}`,
      badges: ["EBOOK"],
      logo: (
        <div className="h-6 w-6 rounded-md bg-gradient-to-br from-[#fc5c30] to-[#f73809] flex items-center justify-center p-0.5 shrink-0 shadow-xs">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white">
            <path d="M12 6.2c-1.8-1.5-4.2-2.2-6.5-2.2H4v13.5h1.5c2 0 4 .6 5.5 1.8 1.5-1.2 3.5-1.8 5.5-1.8H18V4h-1.5c-2.3 0-4.7.7-6.5 2.2zm-1 10.3c-1.4-.9-3-1.4-4.7-1.4H5.5V5.5h.8c1.9 0 3.7.6 5.1 1.7v9.3zm7-1.4c-1.7 0-3.3.5-4.7 1.4V7.2c1.4-1.1 3.2-1.7 5.1-1.7h.8v9.6h-.8z" />
          </svg>
        </div>
      ),
    },
  ];

  const visibleProviders = showAll ? providers : providers.slice(0, 3);
  const remainingCount = providers.length - 3;

  return (
    <div className="w-full">
      {/* WHERE TO READ Letterboxd-style Card */}
      <div className="w-full rounded-2xl border border-[#2b333e] bg-[#1a2027] overflow-hidden text-xs shadow-xl">
        {/* Header Bar with Letterboxd Trailer-style Audiobook button */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#1f2630] border-b border-[#28323e]">
          <span className="text-[11px] font-bold tracking-wider text-[#93a2b2] uppercase select-none">
            Where to Read
          </span>
          <a
            href={`https://www.audible.com/search?keywords=${encodedBook}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#2a3442] hover:bg-[#344152] text-[#c0d0e0] hover:text-white text-[10.5px] font-bold tracking-tight border border-[#374455] transition cursor-pointer select-none"
            title="Listen to Audiobook"
          >
            <svg className="h-2.5 w-2.5 fill-current" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            <span>Audiobook</span>
          </a>
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
              <div className="flex items-center gap-2.5 min-w-0">
                {provider.logo}
                <span className="font-semibold text-[#c8d4e0] group-hover:text-white text-xs truncate">
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
