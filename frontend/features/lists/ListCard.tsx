"use client";

import Image from "next/image";
import Link from "next/link";
import type { BookList } from "@/features/lists/api";

export function ListCard({ list }: { list: BookList }) {
  const covers = list.sample_covers || [];

  return (
    <Link
      href={`/lists/${list.id}`}
      className="group flex flex-col rounded-xl border border-white/10 bg-[#13161f] p-4 transition duration-200 hover:border-purple-500/40 hover:bg-[#181c28] hover:shadow-xl hover:shadow-purple-950/20"
    >
      {/* Cover Mosaic / Preview Box */}
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-[#0c0e14] border border-white/5 flex items-center justify-center">
        {covers.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-zinc-600 gap-1.5 p-4 text-center">
            <svg
              className="w-8 h-8 opacity-40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
              <path d="M6 6h10" />
              <path d="M6 10h10" />
            </svg>
            <span className="text-[11px] font-medium text-zinc-500">Empty Collection</span>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full w-full px-3 py-2 -space-x-4 sm:-space-x-6 overflow-hidden">
            {covers.slice(0, 4).map((cover, idx) => (
              <div
                key={`${cover}-${idx}`}
                className="relative h-[85%] aspect-[2/3] shrink-0 rounded-lg overflow-hidden border border-white/20 shadow-lg transform transition duration-300 group-hover:scale-105 group-hover:-translate-y-1"
                style={{ zIndex: idx }}
              >
                <Image src={cover} alt="Book cover" fill sizes="120px" className="object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* Private Badge */}
        {list.is_private && (
          <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-full bg-black/70 backdrop-blur-md px-2 py-0.5 text-[10px] font-semibold text-zinc-300 border border-white/10">
            <svg className="w-2.5 h-2.5 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
            </svg>
            Private
          </span>
        )}
      </div>

      {/* Meta */}
      <div className="mt-3.5 flex flex-col flex-1 justify-between">
        <div>
          <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition line-clamp-1">
            {list.title}
          </h3>
          {list.description && (
            <p className="mt-1 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
              {list.description}
            </p>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2 truncate">
            {list.author.avatar_url ? (
              <Image
                src={list.author.avatar_url}
                alt={list.author.username}
                width={20}
                height={20}
                className="rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-purple-900/60 text-[10px] font-bold text-purple-200 flex items-center justify-center shrink-0">
                {list.author.username.slice(0, 1).toUpperCase()}
              </div>
            )}
            <span className="truncate hover:text-white transition">
              {list.author.display_name || list.author.username}
            </span>
          </div>

          <span className="shrink-0 font-medium text-zinc-500">
            {list.item_count} {list.item_count === 1 ? "book" : "books"}
          </span>
        </div>
      </div>
    </Link>
  );
}
