import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap, unwrapPaged } from "@/lib/api";
import type { ApiKey, CreateApiKeyRequest } from "@/types";

export function useApiKeys() {
  return useQuery({
    queryKey: ["api-keys"],
    queryFn: () => unwrapPaged<ApiKey>(api.get("api-keys")),
  });
}

export function useCreateApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateApiKeyRequest) =>
      unwrap<ApiKey>(api.post("api-keys", { json: data })),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["api-keys"] }),
  });
}

export function useDeleteApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unwrap<void>(api.delete(`api-keys/${id}`)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["api-keys"] }),
  });
}
