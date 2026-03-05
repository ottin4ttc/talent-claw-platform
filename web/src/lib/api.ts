import ky from "ky";
import { API_BASE } from "./constants";
import { clearToken, getToken } from "./auth";
import type { ApiResponse, PagedData } from "@/types";

export const api = ky.create({
  prefixUrl: API_BASE,
  timeout: 10000,
  hooks: {
    beforeRequest: [
      (request) => {
        const token = getToken();
        if (token) {
          request.headers.set("Authorization", `Bearer ${token}`);
        }
      },
    ],
    afterResponse: [
      async (request, _options, response) => {
        if (response.status === 401) {
          const url = new URL(request.url);
          if (url.pathname.endsWith("/claws/mine")) {
            return;
          }

          clearToken();
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
        }
      },
    ],
  },
});

export async function unwrap<T>(promise: Promise<Response>): Promise<T> {
  const resp: ApiResponse<T> = await promise.then((r) => r.json());
  if (resp.code !== 0) {
    throw new Error(resp.message || "API error");
  }
  return resp.data;
}

export async function unwrapPaged<T>(promise: Promise<Response>): Promise<PagedData<T>> {
  const resp: ApiResponse<PagedData<T>> = await promise.then((r) => r.json());
  if (resp.code !== 0) {
    throw new Error(resp.message || "API error");
  }
  return resp.data;
}
