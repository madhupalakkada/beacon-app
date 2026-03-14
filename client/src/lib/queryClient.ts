import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const token = localStorage.getItem("beacon_token");
        const url = queryKey[0] as string;
        const res = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) {
          if (res.status === 401) return null;
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      },
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export async function apiRequest(
  method: string,
  url: string,
  body?: unknown,
) {
  const token = localStorage.getItem("beacon_token");
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }
  return res.json();
}
