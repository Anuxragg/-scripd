"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addBookToList,
  createList,
  deleteList,
  getBookLists,
  getList,
  getMyLists,
  getUserLists,
  removeBookFromList,
  updateList,
  updateListItem,
  type AddBookInput,
  type CreateListInput,
  type UpdateItemInput,
  type UpdateListInput,
} from "@/features/lists/api";

export function useList(listID: string, enabled = true) {
  return useQuery({
    queryKey: ["lists", "detail", listID],
    queryFn: () => getList(listID),
    enabled: Boolean(listID) && enabled,
    staleTime: 30_000,
  });
}

export function useUserLists(username: string, enabled = true) {
  return useQuery({
    queryKey: ["lists", "user", username],
    queryFn: () => getUserLists(username),
    enabled: Boolean(username) && enabled,
    staleTime: 30_000,
  });
}

export function useMyLists(enabled = true) {
  return useQuery({
    queryKey: ["lists", "my"],
    queryFn: () => getMyLists(),
    enabled,
    staleTime: 30_000,
  });
}

export function useBookLists(bookID: string, enabled = true) {
  return useQuery({
    queryKey: ["lists", "book", bookID],
    queryFn: () => getBookLists(bookID),
    enabled: Boolean(bookID) && enabled,
    staleTime: 15_000,
  });
}

export function useCreateList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateListInput) => createList(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lists"] });
    },
  });
}

export function useUpdateList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ listID, input }: { listID: string; input: UpdateListInput }) =>
      updateList(listID, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lists", "detail", variables.listID] });
      queryClient.invalidateQueries({ queryKey: ["lists", "user"] });
      queryClient.invalidateQueries({ queryKey: ["lists", "my"] });
    },
  });
}

export function useDeleteList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (listID: string) => deleteList(listID),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lists"] });
    },
  });
}

export function useAddBookToList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ listID, input }: { listID: string; input: AddBookInput }) =>
      addBookToList(listID, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lists", "detail", variables.listID] });
      queryClient.invalidateQueries({ queryKey: ["lists", "book"] });
      queryClient.invalidateQueries({ queryKey: ["lists", "my"] });
      queryClient.invalidateQueries({ queryKey: ["lists", "user"] });
    },
  });
}

export function useRemoveBookFromList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ listID, bookID }: { listID: string; bookID: string }) =>
      removeBookFromList(listID, bookID),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lists", "detail", variables.listID] });
      queryClient.invalidateQueries({ queryKey: ["lists", "book"] });
      queryClient.invalidateQueries({ queryKey: ["lists", "my"] });
      queryClient.invalidateQueries({ queryKey: ["lists", "user"] });
    },
  });
}

export function useUpdateListItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      listID,
      bookID,
      input,
    }: {
      listID: string;
      bookID: string;
      input: UpdateItemInput;
    }) => updateListItem(listID, bookID, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lists", "detail", variables.listID] });
    },
  });
}
