import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api";
import type { TopupRequest, Wallet } from "@/types";

export function useWallet() {
  return useQuery({
    queryKey: ["wallet", "me"],
    queryFn: () => unwrap<Wallet>(api.get("wallets/me")),
  });
}

export function useTopup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TopupRequest) =>
      unwrap<Wallet>(api.post("wallets/topup", { json: data })),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}
