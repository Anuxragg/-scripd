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
    coverUrl: "https://covers.openlibrary.org/b/id/8432047-L.jpg?default=false",
    fallbackBg: "from-amber-900/60 to-stone-900",
  },
  {
    id: "c1-2",
    title: "1984",
    author: "George Orwell",
    coverUrl: "https://covers.openlibrary.org/b/id/7222246-L.jpg?default=false",
    fallbackBg: "from-red-950/60 to-stone-950",
  },
  {
    id: "c1-3",
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    coverUrl: "https://covers.openlibrary.org/b/id/8225261-L.jpg?default=false",
    fallbackBg: "from-blue-950/60 to-slate-950",
  },
  {
    id: "c1-4",
    title: "Dune",
    author: "Frank Herbert",
    coverUrl: "https://covers.openlibrary.org/b/id/8740578-L.jpg?default=false",
    fallbackBg: "from-orange-950/60 to-amber-950",
  },
  {
    id: "c1-5",
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    coverUrl: "https://covers.openlibrary.org/b/id/8406782-L.jpg?default=false",
    fallbackBg: "from-emerald-950/60 to-stone-950",
  },
  {
    id: "c1-6",
    title: "Pride and Prejudice",
    author: "Jane Austen",
    coverUrl: "https://covers.openlibrary.org/b/id/8258649-L.jpg?default=false",
    fallbackBg: "from-rose-950/60 to-neutral-950",
  },
  {
    id: "c1-7",
    title: "Frankenstein",
    author: "Mary Shelley",
    coverUrl: "https://covers.openlibrary.org/b/id/8315147-L.jpg?default=false",
    fallbackBg: "from-teal-950/60 to-neutral-950",
  },
];

const COLUMN_2_BOOKS: BookItem[] = [
  {
    id: "c2-1",
    title: "Brave New World",
    author: "Aldous Huxley",
    coverUrl: "https://covers.openlibrary.org/b/id/8235113-L.jpg?default=false",
    fallbackBg: "from-indigo-950/60 to-zinc-950",
  },
  {
    id: "c2-2",
    title: "The Picture of Dorian Gray",
    author: "Oscar Wilde",
    coverUrl: "https://covers.openlibrary.org/b/id/10522964-L.jpg?default=false",
    fallbackBg: "from-purple-950/60 to-neutral-950",
  },
  {
    id: "c2-3",
    title: "Sapiens",
    author: "Yuval Noah Harari",
    coverUrl: "https://covers.openlibrary.org/b/id/8367448-L.jpg?default=false",
    fallbackBg: "from-amber-950/60 to-stone-950",
  },
  {
    id: "c2-4",
    title: "Atomic Habits",
    author: "James Clear",
    coverUrl: "https://covers.openlibrary.org/b/id/12539702-L.jpg?default=false",
    fallbackBg: "from-sky-950/60 to-slate-950",
  },
  {
    id: "c2-5",
    title: "The Alchemist",
    author: "Paulo Coelho",
    coverUrl: "https://covers.openlibrary.org/b/id/7414780-L.jpg?default=false",
    fallbackBg: "from-yellow-950/60 to-stone-950",
  },
  {
    id: "c2-6",
    title: "Harry Potter and the Philosopher's Stone",
    author: "J.K. Rowling",
    coverUrl: "https://covers.openlibrary.org/b/id/10521270-L.jpg?default=false",
    fallbackBg: "from-pink-950/60 to-neutral-950",
  },
  {
    id: "c2-7",
    title: "The Catcher in the Rye",
    author: "J.D. Salinger",
    coverUrl: "https://covers.openlibrary.org/b/id/8225631-L.jpg?default=false",
    fallbackBg: "from-red-950/60 to-stone-950",
  },
];

const COLUMN_3_BOOKS: BookItem[] = [
  {
    id: "c3-1",
    title: "Fahrenheit 451",
    author: "Ray Bradbury",
    coverUrl: "https://covers.openlibrary.org/b/id/8780366-L.jpg?default=false",
    fallbackBg: "from-orange-950/60 to-stone-950",
  },
  {
    id: "c3-2",
    title: "The Metamorphosis",
    author: "Franz Kafka",
    coverUrl: "https://covers.openlibrary.org/b/id/8231856-L.jpg?default=false",
    fallbackBg: "from-zinc-900 to-black",
  },
  {
    id: "c3-3",
    title: "Crime and Punishment",
    author: "Fyodor Dostoevsky",
    coverUrl: "https://covers.openlibrary.org/b/id/8235116-L.jpg?default=false",
    fallbackBg: "from-stone-900 to-black",
  },
  {
    id: "c3-4",
    title: "Rich Dad, Poor Dad",
    author: "Robert T. Kiyosaki",
    coverUrl: "https://covers.openlibrary.org/b/id/8315603-L.jpg?default=false",
    fallbackBg: "from-emerald-950/60 to-black",
  },
  {
    id: "c3-5",
    title: "The Psychology of Money",
    author: "Morgan Housel",
    coverUrl: "https://covers.openlibrary.org/b/id/10389354-L.jpg?default=false",
    fallbackBg: "from-amber-950/60 to-neutral-950",
  },
  {
    id: "c3-6",
    title: "The 48 Laws of Power",
    author: "Robert Greene",
    coverUrl: "https://covers.openlibrary.org/b/id/6424160-L.jpg?default=false",
    fallbackBg: "from-violet-950/60 to-stone-950",
  },
  {
    id: "c3-7",
    title: "The Hunger Games",
    author: "Suzanne Collins",
    coverUrl: "https://covers.openlibrary.org/b/id/12646537-L.jpg?default=false",
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

async function fetchTrendingBooks(): Promise<BookItem[]> {
  const endpoints = [
    "https://openlibrary.org/trending/weekly.json?limit=40",
    "https://openlibrary.org/trending/daily.json?limit=40",
    "https://openlibrary.org/trending/monthly.json?limit=40",
  ];
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, { cache: "no-store" });
      if (!response.ok) continue;
      const payload: {
        works?: Array<{
          key?: string;
          title?: string;
          author_name?: string[];
          cover_i?: number;
        }>;
      } = await response.json();
      if (!Array.isArray(payload.works) || payload.works.length === 0) continue;

      const items: BookItem[] = payload.works.flatMap((work, index) => {
        if (typeof work.cover_i !== "number" || work.cover_i <= 0) return [];
        return [
          {
            id: typeof work.key === "string" ? work.key : String(work.cover_i),
            title: typeof work.title === "string" ? work.title : "Untitled",
            author:
              Array.isArray(work.author_name) && typeof work.author_name[0] === "string"
                ? work.author_name[0]
                : "Unknown Author",
            coverUrl: `https://covers.openlibrary.org/b/id/${work.cover_i}-L.jpg?default=false`,
            fallbackBg: FALLBACK_BACKGROUNDS[index % 3],
          },
        ];
      });

      if (items.length >= 15) {
        return items;
      }
    } catch {
      // Try next endpoint or fall back
    }
  }
  return [];
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
        const trendingBooks = await fetchTrendingBooks();
        const basePool = [...COLUMN_1_BOOKS, ...COLUMN_2_BOOKS, ...COLUMN_3_BOOKS];
        const combined = trendingBooks.length > 0 ? [...trendingBooks, ...basePool] : basePool;

        const uniqueCovers = new Map<string, BookItem>();
        combined.forEach((book, index) => {
          if (!uniqueCovers.has(book.coverUrl)) {
            uniqueCovers.set(book.coverUrl, {
              ...book,
              fallbackBg: FALLBACK_BACKGROUNDS[index % 3],
            });
          }
        });

        const candidates = shuffle([...uniqueCovers.values()]);
        const recentCovers = getRecentCovers();
        const freshCandidates = candidates.filter((book) => !recentCovers.includes(book.coverUrl));
        const selectionPool = freshCandidates.length >= 21 ? freshCandidates : candidates;
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
