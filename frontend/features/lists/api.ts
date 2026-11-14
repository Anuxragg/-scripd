import { z } from "zod";
import { apiRequest } from "@/lib/api/client";

function jsonRequest(body: unknown, method = "POST"): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

const authorSummarySchema = z.object({
  id: z.string(),
  username: z.string(),
  display_name: z.string().nullish(),
  avatar_url: z.string().nullish(),
});

const bookSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  authors: z.array(z.string()).default([]),
  cover_url: z.string().nullish(),
  published_year: z.number().int().nullish(),
});

const listItemSchema = z.object({
  list_id: z.string(),
  book_id: z.string(),
  position: z.number(),
  notes: z.string().nullish(),
  book: bookSummarySchema,
  created_at: z.string(),
});

export const bookListSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  title: z.string(),
  description: z.string().nullish(),
  is_private: z.boolean().default(false),
  item_count: z.number().default(0),
  sample_covers: z.array(z.string()).default([]),
  author: authorSummarySchema,
  items: z.array(listItemSchema).optional().default([]),
  created_at: z.string(),
  updated_at: z.string(),
});

const listResponseSchema = z.object({ data: bookListSchema });
const listsResponseSchema = z.object({
  data: z
    .array(bookListSchema)
    .nullish()
    .transform((val) => val ?? []),
});
const itemResponseSchema = z.object({ data: listItemSchema });
const bookListsResponseSchema = z.object({
  data: z
    .array(z.string())
    .nullish()
    .transform((val) => val ?? []),
});
const statusResponseSchema = z.object({
  data: z.record(z.string(), z.unknown()),
});

export type AuthorSummary = z.infer<typeof authorSummarySchema>;
export type BookSummary = z.infer<typeof bookSummarySchema>;
export type ListItem = z.infer<typeof listItemSchema>;
export type BookList = z.infer<typeof bookListSchema>;

export type CreateListInput = {
  title: string;
  description?: string;
  is_private?: boolean;
};

export type UpdateListInput = {
  title?: string;
  description?: string;
  is_private?: boolean;
};

export type AddBookInput = {
  book_id: string;
  title?: string;
  notes?: string;
  position?: number;
};

export type UpdateItemInput = {
  notes?: string;
  position?: number;
};

export function createList(input: CreateListInput): Promise<BookList> {
  return apiRequest("/api/v1/lists", listResponseSchema, jsonRequest(input)).then(
    (res) => res.data,
  );
}

export function getList(listID: string): Promise<BookList> {
  return apiRequest(`/api/v1/lists/${listID}`, listResponseSchema).then((res) => res.data);
}

export function getUserLists(username: string): Promise<BookList[]> {
  return apiRequest(`/api/v1/users/${username}/lists`, listsResponseSchema).then((res) => res.data);
}

export function getMyLists(): Promise<BookList[]> {
  return apiRequest("/api/v1/lists/my", listsResponseSchema).then((res) => res.data);
}

export function getBookLists(bookID: string): Promise<string[]> {
  return apiRequest(`/api/v1/lists/book/${bookID}`, bookListsResponseSchema).then(
    (res) => res.data,
  );
}

export function updateList(listID: string, input: UpdateListInput): Promise<BookList> {
  return apiRequest(`/api/v1/lists/${listID}`, listResponseSchema, jsonRequest(input, "PUT")).then(
    (res) => res.data,
  );
}

export function deleteList(listID: string): Promise<void> {
  return apiRequest(`/api/v1/lists/${listID}`, statusResponseSchema, {
    method: "DELETE",
  }).then(() => undefined);
}

export function addBookToList(listID: string, input: AddBookInput): Promise<ListItem> {
  return apiRequest(`/api/v1/lists/${listID}/books`, itemResponseSchema, jsonRequest(input)).then(
    (res) => res.data,
  );
}

export function removeBookFromList(listID: string, bookID: string): Promise<void> {
  return apiRequest(`/api/v1/lists/${listID}/books/${bookID}`, statusResponseSchema, {
    method: "DELETE",
  }).then(() => undefined);
}

export function updateListItem(
  listID: string,
  bookID: string,
  input: UpdateItemInput,
): Promise<void> {
  return apiRequest(
    `/api/v1/lists/${listID}/books/${bookID}`,
    statusResponseSchema,
    jsonRequest(input, "PUT"),
  ).then(() => undefined);
}
