import { z } from "zod";
import { apiRequest } from "@/lib/api/client";

export const favoriteBookSchema = z.object({
  open_library_key: z.string(),
  title: z.string(),
  authors: z.array(z.string()),
  cover_url: z.string(),
  published_year: z.number().int().optional(),
  position: z.number().int(),
});

export const publicProfileSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  display_name: z.string(),
  bio: z.string(),
  avatar_url: z.string(),
  favorite_books: z.array(favoriteBookSchema).default([]),
  created_at: z.string(),
});

export const profileStatsSchema = z.object({
  books_read: z.number().int(),
  currently_reading: z.number().int(),
  want_to_read: z.number().int(),
  reviews_count: z.number().int(),
});

const profileResponseSchema = z.object({
  data: publicProfileSchema,
});

const statsResponseSchema = z.object({
  data: profileStatsSchema,
});

export const followStatusSchema = z.object({
  is_following: z.boolean(),
  followers_count: z.number().int(),
  following_count: z.number().int(),
});

const followStatusResponseSchema = z.object({
  data: followStatusSchema,
});

const followMutationResponseSchema = z.object({
  following: z.boolean().optional(),
  unfollowed: z.boolean().optional(),
});

export type PublicProfile = z.infer<typeof publicProfileSchema>;
export type FavoriteBook = z.infer<typeof favoriteBookSchema>;
export type ProfileStats = z.infer<typeof profileStatsSchema>;
export type FollowStatus = z.infer<typeof followStatusSchema>;

export type UpdateProfileInput = {
  username?: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
};

export type AddFavoriteBookInput = {
  open_library_key: string;
  title: string;
  authors: string[];
  cover_url?: string;
  published_year?: number;
};

export async function getProfile(username: string): Promise<PublicProfile> {
  const response = await apiRequest(`/api/v1/users/${username}`, profileResponseSchema);
  return response.data;
}

export async function getProfileStats(username: string): Promise<ProfileStats> {
  const response = await apiRequest(`/api/v1/users/${username}/stats`, statsResponseSchema);
  return response.data;
}

export async function updateProfile(input: UpdateProfileInput): Promise<PublicProfile> {
  const response = await apiRequest("/api/v1/users/me", profileResponseSchema, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return response.data;
}

export async function addFavoriteBook(input: AddFavoriteBookInput): Promise<FavoriteBook> {
  const response = await apiRequest(
    "/api/v1/users/me/favorites",
    z.object({ data: favoriteBookSchema }),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  return response.data;
}

export async function removeFavoriteBook(openLibraryKey: string): Promise<void> {
  const query = new URLSearchParams({ open_library_key: openLibraryKey });
  await apiRequest(
    `/api/v1/users/me/favorites?${query.toString()}`,
    z.object({ data: z.object({ deleted: z.boolean() }) }),
    { method: "DELETE" },
  );
}

export async function getFollowStatus(username: string): Promise<FollowStatus> {
  const response = await apiRequest(
    `/api/v1/users/${username}/follow-status`,
    followStatusResponseSchema,
  );
  return response.data;
}

export async function followUser(username: string): Promise<void> {
  await apiRequest(`/api/v1/users/${username}/follow`, followMutationResponseSchema, {
    method: "POST",
  });
}

export async function unfollowUser(username: string): Promise<void> {
  await apiRequest(`/api/v1/users/${username}/follow`, followMutationResponseSchema, {
    method: "DELETE",
  });
}
