import { useQuery } from "@tanstack/react-query";
import { api, unwrapPaged } from "@/lib/api";
import type { Transaction, TransactionType } from "@/types";

interface TxParams {
  type?: TransactionType;
  page?: number;
  page_size?: number;
}

export function useTransactions(params: TxParams = {}) {
  return useQuery({
    queryKey: ["transactions", params],
    queryFn: () =>
      unwrapPaged<Transaction>(
        api.get("transactions", {
          searchParams: Object.fromEntries(
            Object.entries(params)
              .filter(([, v]) => v !== undefined && v !== "")
              .map(([k, v]) => [k, String(v)])
          ),
        })
      ),
  });
}
