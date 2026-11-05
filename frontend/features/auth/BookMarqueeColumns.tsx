"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface BookItem {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  fallbackBg: string;
}

const COLUMN_1_BOOKS: BookItem[] = [
  {
    id: "c1-1",
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    coverUrl: "https://covers.openlibrary.org/b/id/8231856-L.jpg",
    fallbackBg: "from-amber-900/60 to-stone-900",
  },
  {
    id: "c1-2",
    title: "1984",
    author: "George Orwell",
    coverUrl: "https://covers.openlibrary.org/b/id/8235113-L.jpg",
    fallbackBg: "from-red-950/60 to-stone-950",
  },
  {
    id: "c1-3",
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    coverUrl: "https://covers.openlibrary.org/b/id/12847926-L.jpg",
    fallbackBg: "from-blue-950/60 to-slate-950",
  },
  {
    id: "c1-4",
    title: "Dune",
    author: "Frank Herbert",
    coverUrl: "https://covers.openlibrary.org/b/id/7222246-L.jpg",
    fallbackBg: "from-orange-950/60 to-amber-950",
  },
  {
    id: "c1-5",
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    coverUrl: "https://covers.openlibrary.org/b/id/12836262-L.jpg",
    fallbackBg: "from-emerald-950/60 to-stone-950",
  },
  {
    id: "c1-6",
    title: "Pride and Prejudice",
    author: "Jane Austen",
    coverUrl: "https://covers.openlibrary.org/b/id/10522964-L.jpg",
    fallbackBg: "from-rose-950/60 to-neutral-950",
  },
  {
    id: "c1-7",
    title: "Frankenstein",
    author: "Mary Shelley",
    coverUrl: "https://covers.openlibrary.org/b/id/8315147-L.jpg",
    fallbackBg: "from-teal-950/60 to-neutral-950",
  },
];

const COLUMN_2_BOOKS: BookItem[] = [
  {
    id: "c2-1",
    title: "Brave New World",
    author: "Aldous Huxley",
    coverUrl: "https://covers.openlibrary.org/b/id/8235113-L.jpg",
    fallbackBg: "from-indigo-950/60 to-zinc-950",
  },
  {
    id: "c2-2",
    title: "The Picture of Dorian Gray",
    author: "Oscar Wilde",
    coverUrl: "https://covers.openlibrary.org/b/id/10522964-L.jpg",
    fallbackBg: "from-purple-950/60 to-neutral-950",
  },
  {
    id: "c2-3",
    title: "Sapiens",
    author: "Yuval Noah Harari",
    coverUrl: "https://covers.openlibrary.org/b/id/8231856-L.jpg",
    fallbackBg: "from-amber-950/60 to-stone-950",
  },
  {
    id: "c2-4",
    title: "Atomic Habits",
    author: "James Clear",
    coverUrl: "https://covers.openlibrary.org/b/id/12847926-L.jpg",
    fallbackBg: "from-sky-950/60 to-slate-950",
  },
  {
    id: "c2-5",
    title: "The Alchemist",
    author: "Paulo Coelho",
    coverUrl: "https://covers.openlibrary.org/b/id/12836262-L.jpg",
    fallbackBg: "from-yellow-950/60 to-stone-950",
  },
  {
    id: "c2-6",
    title: "Little Women",
    author: "Louisa May Alcott",
    coverUrl: "https://covers.openlibrary.org/b/id/7222246-L.jpg",
    fallbackBg: "from-pink-950/60 to-neutral-950",
  },
  {
    id: "c2-7",
    title: "The Catcher in the Rye",
    author: "J.D. Salinger",
    coverUrl: "https://covers.openlibrary.org/b/id/8315147-L.jpg",
    fallbackBg: "from-red-950/60 to-stone-950",
  },
];

const COLUMN_3_BOOKS: BookItem[] = [
  {
    id: "c3-1",
    title: "Fahrenheit 451",
    author: "Ray Bradbury",
    coverUrl: "https://covers.openlibrary.org/b/id/12847926-L.jpg",
    fallbackBg: "from-orange-950/60 to-stone-950",
  },
  {
    id: "c3-2",
    title: "The Metamorphosis",
    author: "Franz Kafka",
    coverUrl: "https://covers.openlibrary.org/b/id/12836262-L.jpg",
    fallbackBg: "from-zinc-900 to-black",
  },
  {
    id: "c3-3",
    title: "Animal Farm",
    author: "George Orwell",
    coverUrl: "https://covers.openlibrary.org/b/id/8235113-L.jpg",
    fallbackBg: "from-stone-900 to-black",
  },
  {
    id: "c3-4",
    title: "The Lord of the Rings",
    author: "J.R.R. Tolkien",
    coverUrl: "https://covers.openlibrary.org/b/id/7222246-L.jpg",
    fallbackBg: "from-emerald-950/60 to-black",
  },
  {
    id: "c3-5",
    title: "One Hundred Years of Solitude",
    author: "Gabriel García Márquez",
    coverUrl: "https://covers.openlibrary.org/b/id/10522964-L.jpg",
    fallbackBg: "from-amber-950/60 to-neutral-950",
  },
  {
    id: "c3-6",
    title: "Slaughterhouse-Five",
    author: "Kurt Vonnegut",
    coverUrl: "https://covers.openlibrary.org/b/id/8315147-L.jpg",
    fallbackBg: "from-violet-950/60 to-stone-950",
  },
  {
    id: "c3-7",
    title: "Norwegian Wood",
    author: "Haruki Murakami",
    coverUrl: "https://covers.openlibrary.org/b/id/8231856-L.jpg",
    fallbackBg: "from-rose-950/60 to-stone-950",
  },
];

const RECENT_COVERS_KEY = "scripd:auth-marquee:recent-covers";
const FALLBACK_BACKGROUNDS = [
  "from-amber-900/60 to-stone-900",
  "from-indigo-950/60 to-zinc-950",
  "from-emerald-950/60 to-black",
];

function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function getRecentCovers(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_COVERS_KEY);
    const parsed: unknown = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed)
      ? parsed.filter((cover): cover is string => typeof cover === "string")
      : [];
  } catch {
    return [];
  }
}

async function fetchOpenLibraryPage(page: number, columnIndex: number): Promise<BookItem[]> {
  const url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("q", "fiction");
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", "25");
  url.searchParams.set("fields", "key,title,author_name,cover_i");

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return [];

  const payload: { docs?: Record<string, unknown>[] } = await response.json();
  return (payload.docs ?? []).flatMap((doc) => {
    if (typeof doc.cover_i !== "number") return [];
    return [
      {
        id: typeof doc.key === "string" ? doc.key : String(doc.cover_i),
        title: typeof doc.title === "string" ? doc.title : "Untitled",
        author:
          Array.isArray(doc.author_name) && typeof doc.author_name[0] === "string"
            ? doc.author_name[0]
            : "Unknown Author",
        coverUrl: `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`,
        fallbackBg: FALLBACK_BACKGROUNDS[columnIndex],
      },
    ];
  });
}

function BookCard({ book }: { book: BookItem }) {
  const [hasError, setHasError] = useState(false);

  return (
    <div className="group relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-[#141517] shadow-xl border border-white/5 transition duration-300 hover:border-white/20 select-none">
      {!hasError ? (
        <Image
          src={book.coverUrl}
          alt={book.title}
          fill
          sizes="212px"
          className="object-cover transition duration-500 group-hover:contrast-105"
          onError={() => setHasError(true)}
          unoptimized
        />
      ) : (
        <div
          className={`flex h-full w-full flex-col justify-between p-3 sm:p-4 bg-gradient-to-b ${book.fallbackBg} text-white`}
        >
          <div className="h-2 w-8 rounded-full bg-white/20" />
          <div>
            <h4 className="font-serif text-xs sm:text-sm font-bold leading-tight">{book.title}</h4>
            <p className="mt-1 text-[11px] text-white/60">{book.author}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function MarqueeColumn({ books, animationClass }: { books: BookItem[]; animationClass: string }) {
  // Duplicate for seamless 50% loop
  const duplicated = [...books, ...books];

  return (
    <div className="relative h-full w-[212px] max-w-full overflow-hidden">
      <div className={`flex flex-col gap-4 will-change-transform ${animationClass}`}>
        {duplicated.map((book, idx) => (
          <BookCard key={`${book.id}-${idx}`} book={book} />
        ))}
      </div>
    </div>
  );
}

function MarqueeSkeletonColumn({ animationClass }: { animationClass: string }) {
  return (
    <div className="relative h-full w-[212px] max-w-full overflow-hidden">
      <div className={`flex flex-col gap-4 will-change-transform ${animationClass}`}>
        {Array.from({ length: 8 }, (_, index) => (
          <div
            key={index}
            className="aspect-[2/3] w-full animate-pulse rounded-xl bg-[#17191c] ring-1 ring-white/5"
          />
        ))}
      </div>
    </div>
  );
}

export function BookMarqueeColumns() {
  const [columns, setColumns] = useState<BookItem[][] | null>(null);

  useEffect(() => {
    async function loadFreshCovers() {
      try {
        const pages = shuffle(Array.from({ length: 100 }, (_, index) => index + 1)).slice(0, 3);
        const results = await Promise.all(
          pages.map((page, columnIndex) => fetchOpenLibraryPage(page, columnIndex)),
        );
        const uniqueCovers = new Map<string, BookItem>();

        results.forEach((result, columnIndex) => {
          result.forEach((book) => {
            if (uniqueCovers.has(book.coverUrl)) return;
            uniqueCovers.set(book.coverUrl, {
              ...book,
              fallbackBg: FALLBACK_BACKGROUNDS[columnIndex],
            });
          });
        });

        const candidates = shuffle([...uniqueCovers.values()]);
        const recentCovers = getRecentCovers();
        const freshCandidates = candidates.filter((book) => !recentCovers.includes(book.coverUrl));
        const selectionPool = freshCandidates.length > 0 ? freshCandidates : candidates;
        const selectedBooks = selectionPool.slice(0, 21);
        if (selectedBooks.length === 0) {
          setColumns([COLUMN_1_BOOKS, COLUMN_2_BOOKS, COLUMN_3_BOOKS]);
          return;
        }

        const nextColumns: BookItem[][] = [[], [], []];
        selectedBooks.forEach((book, index) => nextColumns[index % 3].push(book));
        const fallbackColumns = [COLUMN_1_BOOKS, COLUMN_2_BOOKS, COLUMN_3_BOOKS];
        nextColumns.forEach((column, columnIndex) => {
          while (column.length < 3) {
            const fallbackBooks = fallbackColumns[columnIndex];
            column.push(fallbackBooks[column.length % fallbackBooks.length]);
          }
        });
        setColumns(nextColumns);

        try {
          localStorage.setItem(
            RECENT_COVERS_KEY,
            JSON.stringify(
              [...selectedBooks.map((book) => book.coverUrl), ...recentCovers].slice(0, 84),
            ),
          );
        } catch {
          // Random selections still work if browser storage is unavailable.
        }
      } catch {
        setColumns([COLUMN_1_BOOKS, COLUMN_2_BOOKS, COLUMN_3_BOOKS]);
      }
    }

    void loadFreshCovers();
  }, []);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#0a0b0d] flex items-center justify-center p-3 sm:p-4">
      {/* 3 Vertical Columns - exactly 212px wide for a physical 4.7 cm measurement */}
      <div className="grid h-full grid-cols-[repeat(3,minmax(0,212px))] justify-center gap-4">
        {/* Column 1: UPWARD */}
        {columns ? (
          <MarqueeColumn books={columns[0]} animationClass="animate-marquee-up-1" />
        ) : (
          <MarqueeSkeletonColumn animationClass="animate-marquee-up-1" />
        )}

        {/* Column 2: DOWNWARD */}
        {columns ? (
          <MarqueeColumn books={columns[1]} animationClass="animate-marquee-down-2" />
        ) : (
          <MarqueeSkeletonColumn animationClass="animate-marquee-down-2" />
        )}

        {/* Column 3: UPWARD */}
        {columns ? (
          <MarqueeColumn books={columns[2]} animationClass="animate-marquee-up-3" />
        ) : (
          <MarqueeSkeletonColumn animationClass="animate-marquee-up-3" />
        )}
      </div>
    </div>
  );
}
