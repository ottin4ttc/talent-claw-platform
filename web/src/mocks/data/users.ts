import type { ApiKey, User, Wallet } from "@/types";

export const mockUser: User = {
  id: "user-001",
  phone: "138****8000",
  nickname: "User_mock",
  role: "admin",
  created_at: "2026-03-04T12:00:00Z",
};

export const mockWallet: Wallet = {
  balance: 1000,
};

export const mockApiKeys: ApiKey[] = [
  {
    id: "key-001",
    key_prefix: "clw_mock",
    name: "My Key",
    last_used_at: "2026-03-04T10:00:00Z",
    created_at: "2026-03-01T00:00:00Z",
  },
];
