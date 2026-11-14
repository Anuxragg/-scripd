"use client";

import { use, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/features/auth/hooks";
import {
  useDeleteList,
  useList,
  useRemoveBookFromList,
  useUpdateList,
} from "@/features/lists/hooks";
import { SiteHeader } from "@/components/SiteHeader";

export default function ListDetailPage({ params }: { params: Promise<{ listID: string }> }) {
  const { listID } = use(params);
  const router = useRouter();

  const userQuery = useCurrentUser();
  const currentUser = userQuery.data;

  const listQuery = useList(listID);
  const deleteListMutation = useDeleteList();
  const removeBookMutation = useRemoveBookFromList();
  const updateListMutation = useUpdateList();

  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIsPrivate, setEditIsPrivate] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const list = listQuery.data;
  const isOwner = Boolean(currentUser && list && currentUser.id === list.user_id);

  function openEditModal() {
    if (!list) return;
    setEditTitle(list.title);
    setEditDescription(list.description || "");
    setEditIsPrivate(list.is_private);
    setEditError(null);
    setEditOpen(true);
  }

  async function handleUpdateSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTitle.trim()) return;

    setEditError(null);
    try {
      await updateListMutation.mutateAsync({
        listID,
        input: {
          title: editTitle.trim(),
          description: editDescription.trim() || undefined,
          is_private: editIsPrivate,
        },
      });
      setEditOpen(false);
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : "Failed to update list");
    }
  }

  async function handleDeleteList() {
    if (!confirm("Are you sure you want to delete this list? This cannot be undone.")) {
      return;
    }
    await deleteListMutation.mutateAsync(listID);
    if (currentUser?.username) {
      router.push(`/u/${currentUser.username}`);
    } else {
      router.push("/library");
    }
  }

  async function handleRemoveBook(bookID: string) {
    await removeBookMutation.mutateAsync({ listID, bookID });
  }

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white selection:bg-[#9333ea]/30 selection:text-white">
      <SiteHeader theme="dark" />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Loading state */}
        {listQuery.isLoading && (
          <div className="space-y-6 animate-pulse">
            <div className="h-4 w-32 bg-white/10 rounded-full" />
            <div className="h-10 w-2/3 max-w-md bg-white/10 rounded-2xl" />
            <div className="h-4 w-1/2 bg-white/5 rounded-full" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 pt-8">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="aspect-[2/3] rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          </div>
        )}

        {/* Error / Not found state */}
        {listQuery.isError && (
          <div className="py-20 text-center space-y-4">
            <h2 className="text-xl font-bold text-white">List Not Found</h2>
            <p className="text-sm text-zinc-400">This list may be private or has been removed.</p>
            <Link
              href="/"
              className="inline-block rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium px-4 py-2 text-xs transition"
            >
              Back to Home
            </Link>
          </div>
        )}

        {/* List Content */}
        {list && (
          <div className="space-y-10">
            {/* Header / Meta */}
            <div className="rounded-3xl border border-white/10 bg-[#12151d] p-6 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

              <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="space-y-4 max-w-2xl">
                  {/* Privacy & Back Link */}
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/u/${list.author.username}`}
                      className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition flex items-center gap-1.5"
                    >
                      ← Back to {list.author.username}’s profile
                    </Link>
                    {list.is_private && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                        </svg>
                        Private
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white font-serif">
                    {list.title}
                  </h1>

                  {list.description && (
                    <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
                      {list.description}
                    </p>
                  )}

                  {/* Creator Byline */}
                  <div className="flex items-center gap-3 pt-2">
                    <Link
                      href={`/u/${list.author.username}`}
                      className="flex items-center gap-2.5 group"
                    >
                      {list.author.avatar_url ? (
                        <Image
                          src={list.author.avatar_url}
                          alt={list.author.username}
                          width={32}
                          height={32}
                          className="rounded-full object-cover ring-2 ring-white/10 group-hover:ring-purple-400 transition"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-purple-900/60 text-xs font-bold text-purple-200 flex items-center justify-center ring-2 ring-white/10 group-hover:ring-purple-400 transition">
                          {list.author.username.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <span className="text-xs sm:text-sm font-semibold text-white group-hover:text-purple-300 transition">
                          {list.author.display_name || list.author.username}
                        </span>
                        <span className="text-xs text-zinc-400 ml-1.5">
                          @{list.author.username}
                        </span>
                      </div>
                    </Link>

                    <span className="text-zinc-600">•</span>
                    <span className="text-xs text-zinc-400 font-medium">
                      {list.items?.length ?? 0} {(list.items?.length ?? 0) === 1 ? "book" : "books"}
                    </span>
                  </div>
                </div>

                {/* Owner Actions */}
                {isOwner && (
                  <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
                    <button
                      type="button"
                      onClick={openEditModal}
                      className="rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-medium px-3.5 py-2 text-xs transition"
                    >
                      Edit List
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteList}
                      disabled={deleteListMutation.isPending}
                      className="rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-medium px-3.5 py-2 text-xs transition disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Books Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Books in this Collection
                </h2>
                <span className="text-xs text-zinc-500">{list.items?.length ?? 0} total</span>
              </div>

              {!list.items || list.items.length === 0 ? (
                <div className="rounded-2xl border border-white/5 bg-[#12151d] py-16 text-center space-y-3">
                  <p className="text-sm text-zinc-400">
                    No books have been added to this collection yet.
                  </p>
                  <Link
                    href="/books"
                    className="inline-block rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium px-4 py-2 text-xs transition"
                  >
                    Explore Books to Add
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {list.items.map((item) => (
                    <div
                      key={item.book_id}
                      className="group relative flex flex-col rounded-2xl border border-white/5 bg-[#12151d] p-3 transition duration-200 hover:border-purple-500/30 hover:bg-[#161a24]"
                    >
                      {/* Cover */}
                      <Link
                        href={`/books/${item.book_id}`}
                        className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-[#0a0c10] border border-white/10 shadow-lg"
                      >
                        {item.book.cover_url ? (
                          <Image
                            src={item.book.cover_url}
                            alt={item.book.title}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                            className="object-cover group-hover:scale-105 transition duration-300"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center p-3 text-center text-xs text-zinc-500">
                            {item.book.title}
                          </div>
                        )}
                      </Link>

                      {/* Details */}
                      <div className="mt-3 flex-1 flex flex-col justify-between">
                        <div>
                          <Link
                            href={`/books/${item.book_id}`}
                            className="block font-semibold text-xs sm:text-sm text-white hover:text-purple-300 transition line-clamp-1"
                            title={item.book.title}
                          >
                            {item.book.title}
                          </Link>
                          <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                            {item.book.authors.join(", ") || "Unknown Author"}
                          </p>
                          {item.book.published_year && (
                            <p className="text-[10px] text-zinc-500 mt-0.5">
                              {item.book.published_year}
                            </p>
                          )}
                        </div>

                        {/* Notes if curator added any */}
                        {item.notes && (
                          <div className="mt-2.5 rounded-lg bg-white/5 border border-white/5 p-2 text-[11px] text-zinc-300 italic">
                            “{item.notes}”
                          </div>
                        )}

                        {/* Owner Remove Action */}
                        {isOwner && (
                          <button
                            type="button"
                            onClick={() => handleRemoveBook(item.book_id)}
                            disabled={removeBookMutation.isPending}
                            className="mt-3 text-[11px] text-zinc-500 hover:text-rose-400 transition text-left flex items-center gap-1"
                          >
                            <span>✕ Remove</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#12151c] p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-white/10">
                <h3 className="text-base font-bold text-white">Edit List</h3>
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="text-zinc-400 hover:text-white text-lg p-1 transition rounded-lg hover:bg-white/10"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdateSubmit} className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0e1117] px-3.5 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Description</label>
                  <textarea
                    rows={3}
                    maxLength={1000}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0e1117] px-3.5 py-2 text-sm text-white focus:border-purple-500 focus:outline-none resize-none"
                  />
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300 pt-1">
                  <input
                    type="checkbox"
                    checked={editIsPrivate}
                    onChange={(e) => setEditIsPrivate(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-900 text-purple-600 focus:ring-purple-500 h-4 w-4"
                  />
                  <div>
                    <span className="font-medium text-white">Private List</span>
                    <p className="text-[11px] text-zinc-500">Only you can view this list</p>
                  </div>
                </label>

                {editError && <p className="text-xs text-rose-400 font-medium">{editError}</p>}

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setEditOpen(false)}
                    className="rounded-xl px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!editTitle.trim() || updateListMutation.isPending}
                    className="rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-medium px-5 py-2 text-xs transition"
                  >
                    {updateListMutation.isPending ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
