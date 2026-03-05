export interface ApiResponse<T> {
  code: number;
  data: T;
  message?: string;
}

export interface PagedData<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface User {
  id: string;
  phone: string;
  nickname: string;
  created_at: string;
}

export interface LoginRequest {
  phone: string;
  code: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface SendCodeRequest {
  phone: string;
}

export interface ApiKey {
  id: string;
  key?: string;
  key_prefix: string;
  name: string;
  last_used_at?: string;
  created_at: string;
}

export interface CreateApiKeyRequest {
  name: string;
}

export interface Capability {
  name: string;
  description: string;
  input_schema?: Record<string, unknown>;
  output_schema?: Record<string, unknown>;
}

export interface Pricing {
  model: "per_call" | "negotiable";
  amount: number;
  description?: string;
}

export interface Claw {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  capabilities: Capability[];
  tags: string[];
  pricing: Pricing | null;
  status: "online" | "offline";
  rating_avg: number;
  rating_count: number;
  total_calls: number;
  created_at: string;
  updated_at: string;
}

export interface ClawSearchParams {
  q?: string;
  tags?: string;
  status?: string;
  sort_by?: string;
  order?: "asc" | "desc";
  page?: number;
  page_size?: number;
}

export interface Wallet {
  balance: number;
}

export type TransactionType = "topup" | "escrow_hold" | "escrow_release" | "escrow_refund";

export interface Transaction {
  id: string;
  session_id?: string;
  from_id?: string;
  to_id?: string;
  amount: number;
  type: TransactionType;
  memo?: string;
  created_at: string;
}

export interface TopupRequest {
  amount: number;
}
