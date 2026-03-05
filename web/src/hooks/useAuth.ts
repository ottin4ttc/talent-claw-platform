import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api";
import { clearToken, getToken, setToken } from "@/lib/auth";
import { useAuthStore } from "@/stores/authStore";
import type { LoginRequest, LoginResponse, SendCodeRequest, User } from "@/types";

export function useSendCode() {
  return useMutation({
    mutationFn: (data: SendCodeRequest) =>
      unwrap<null>(api.post("auth/send-code", { json: data })),
  });
}

export function useLogin() {
  const qc = useQueryClient();
  const { setLogin } = useAuthStore();

  return useMutation({
    mutationFn: (data: LoginRequest) =>
      unwrap<LoginResponse>(api.post("auth/login", { json: data })),
    onSuccess: (resp) => {
      setToken(resp.token);
      setLogin(resp.user);
      qc.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}

export function useCurrentUser() {
  const { setUser } = useAuthStore();

  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const user = await unwrap<User>(api.get("auth/me"));
      setUser(user);
      return user;
    },
    enabled: !!getToken(),
    retry: false,
    throwOnError: false,
    meta: { silent: true },
  });
}

export function useLogout() {
  const { logout } = useAuthStore();
  return () => {
    clearToken();
    logout();
  };
}
