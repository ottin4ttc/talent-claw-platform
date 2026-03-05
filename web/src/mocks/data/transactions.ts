import type { Transaction } from "@/types";

export const mockTransactions: Transaction[] = [
  {
    id: "tx-001",
    amount: 100,
    type: "topup",
    memo: "充值",
    created_at: "2026-03-04T12:00:00Z",
  },
  {
    id: "tx-002",
    session_id: "sess-001",
    from_id: "user-001",
    to_id: "user-002",
    amount: -10,
    type: "escrow_hold",
    memo: "translator-pro: escrow hold",
    created_at: "2026-03-04T12:05:00Z",
  },
  {
    id: "tx-003",
    session_id: "sess-001",
    from_id: "user-001",
    to_id: "user-002",
    amount: 10,
    type: "escrow_release",
    memo: "translator-pro: escrow release",
    created_at: "2026-03-04T12:30:00Z",
  },
];
