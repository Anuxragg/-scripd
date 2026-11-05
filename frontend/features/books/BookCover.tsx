"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { getBookCoverByISBN } from "@/features/books/api";

export function BookCover({
  title,
  coverURL,
  isbn13,
  authors = [],
  className = "",
}: {
  title: string;
  coverURL?: string;
  isbn13?: string;
  authors?: string[];
  className?: string;
}) {
  const [fallback, setFallback] = useState<{ sourceKey: string; url?: string }>();
  const lookupISBN = normalizeISBN13(isbn13) || (coverURL ? extractISBN13(coverURL) : undefined);
  const authorKey = authors
    .slice(0, 5)
    .map((author) => author.trim())
    .join("\u0000");
  const lookupKey = coverURL || `missing:${lookupISBN || ""}:${title}:${authorKey}`;
  const preferredCoverURL = optimizeBookCoverURL(coverURL);
  const activeFallback = fallback?.sourceKey === lookupKey ? fallback : undefined;
  const displayedURL = activeFallback ? activeFallback.url : preferredCoverURL;
  const canLookup = Boolean(lookupISBN || authors.some((author) => author.trim()));
  const attemptedLookupRef = useRef<string>("");

  useEffect(() => {
    if (coverURL || !canLookup || activeFallback || attemptedLookupRef.current === lookupKey)
      return;

    let cancelled = false;
    const sourceKey = lookupKey;
    attemptedLookupRef.current = sourceKey;
    void getBookCoverByISBN({ title, authors, isbn13: lookupISBN })
      .then((fallbackURL) => {
        if (!cancelled && fallbackURL) {
          const optimized = optimizeBookCoverURL(fallbackURL);
          setFallback({ sourceKey, url: optimized });
        }
      })
      .catch(() => {
        // Keep the title-based fallback when Google Books has no matching cover.
      });

    return () => {
      cancelled = true;
    };
  }, [activeFallback, authors, canLookup, coverURL, lookupISBN, lookupKey, title]);

  const handleImageError = (failedURL: string) => {
    const sourceKey = lookupKey;
    // Set fallback to undefined URL so we display typographic fallback while/if fetching
    setFallback({ sourceKey, url: undefined });
    if (!canLookup) return;

    void getBookCoverByISBN({ title, authors, isbn13: lookupISBN })
      .then((fallbackURL) => {
        const optimized = optimizeBookCoverURL(fallbackURL);
        if (optimized === failedURL) return;
        setFallback((current) =>
          current?.sourceKey === sourceKey ? { sourceKey, url: optimized } : current,
        );
      })
      .catch(() => {
        // Keep the title-based fallback when Google Books has no matching cover.
      });
  };

  return (
    <div
      className={`relative isolate overflow-hidden rounded-xl bg-[#e8e3d8] shadow-md shadow-[#25291f]/10 ${className}`}
    >
      {displayedURL ? (
        <Image
          alt={`Cover of ${title}`}
          className="object-cover"
          fill
          onError={() => handleImageError(displayedURL)}
          sizes="(max-width: 640px) 38vw, (max-width: 1024px) 22vw, 180px"
          src={displayedURL}
          unoptimized
        />
      ) : (
        <div
          aria-label={`No cover available for ${title}`}
          className="absolute inset-0 flex flex-col justify-between bg-[linear-gradient(155deg,#71826d_0%,#365744_72%)] p-3 text-[#f5f0df] sm:p-4"
          role="img"
        >
          <span className="text-[0.5rem] font-semibold uppercase tracking-[0.16em] opacity-75 sm:text-[0.58rem] sm:tracking-[0.2em]">
            Scripd · No cover available
          </span>
          <div className="min-h-0">
            <span className="mb-2 block font-serif text-4xl leading-none opacity-90 sm:text-6xl">
              {title.trim().slice(0, 1).toUpperCase() || "?"}
            </span>
            <span className="line-clamp-4 break-words font-serif text-xs font-semibold leading-snug sm:text-sm">
              {title}
            </span>
          </div>
          <span className="h-px w-8 bg-[#d8c68e] sm:w-10" />
        </div>
      )}
    </div>
  );
}

function normalizeISBN13(value?: string): string | undefined {
  const normalized = value?.replace(/[^0-9]/g, "");
  return normalized?.length === 13 ? normalized : undefined;
}

function extractISBN13(coverURL: string): string | undefined {
  return coverURL.match(/\/isbn\/(\d{13})(?:[-/.?]|$)/i)?.[1];
}

export function optimizeBookCoverURL(coverURL?: string): string | undefined {
  if (!coverURL) {
    return undefined;
  }

  // 1. Google Books cover optimization: remove edge curl distortion and request highest resolution zoom=0
  if (/books\.google\.com/i.test(coverURL) || /\.googleusercontent\.com/i.test(coverURL)) {
    try {
      const parsed = new URL(coverURL);
      parsed.protocol = "https:";
      parsed.searchParams.delete("edge");
      if (parsed.searchParams.has("zoom")) {
        parsed.searchParams.set("zoom", "0");
      }
      return parsed.toString();
    } catch {
      return coverURL.replace(/[?&]edge=curl/gi, "").replace(/zoom=[1-9]/gi, "zoom=0");
    }
  }

  // 2. Open Library cover optimization: upgrade small/medium to -L.jpg and ensure ?default=false
  if (/^https?:\/\/covers\.openlibrary\.org\/b\//i.test(coverURL)) {
    let upgraded = coverURL.replace(/-[SM]\.jpg(?=[?#]|$)/i, "-L.jpg");
    if (!upgraded.includes("default=")) {
      upgraded += (upgraded.includes("?") ? "&" : "?") + "default=false";
    }
    return upgraded;
  }

  return coverURL;
}
