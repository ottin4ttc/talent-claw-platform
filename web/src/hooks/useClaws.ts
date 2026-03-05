import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { api, unwrap, unwrapPaged } from "@/lib/api";
import type { Claw, ClawSearchParams } from "@/types";

export function useClawList(params: ClawSearchParams) {
  return useInfiniteQuery({
    queryKey: ["claws", params],
    queryFn: ({ pageParam = 1 }) =>
      unwrapPaged<Claw>(
        api.get("claws", {
          searchParams: {
            ...params,
            page: String(pageParam),
            page_size: String(params.page_size || 12),
          },
        })
      ),
    getNextPageParam: (lastPage) => {
      const totalPages = Math.ceil(lastPage.total / lastPage.page_size);
      return lastPage.page < totalPages ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
  });
}

export function useClawDetail(id: string) {
  return useQuery({
    queryKey: ["claws", id],
    queryFn: () => unwrap<Claw>(api.get(`claws/${id}`)),
    enabled: !!id,
  });
}

export function useMyClaws() {
  return useQuery({
    queryKey: ["claws", "mine"],
    queryFn: () => unwrapPaged<Claw>(api.get("claws/mine")),
    retry: false,
  });
}
