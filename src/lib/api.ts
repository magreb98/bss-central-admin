import axios, { AxiosError } from "axios";
import { toast } from "sonner";

export const TOKEN_KEY = "bss_admin_token";

export const getToken = () =>
  typeof window === "undefined" ? null : window.localStorage.getItem(TOKEN_KEY);

export const setToken = (token: string) => {
  window.localStorage.setItem(TOKEN_KEY, token);
};

export const clearToken = () => {
  if (typeof window !== "undefined") window.localStorage.removeItem(TOKEN_KEY);
};

export const api = axios.create({
  baseURL: (import.meta.env['VITE_API_URL'] as string | undefined) ?? "http://localhost:8000",
  headers: { Accept: "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    if (!error.response) {
      toast.error("Impossible de joindre le serveur.");
    } else if (status === 401) {
      clearToken();
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    } else if (status && status >= 500) {
      toast.error("Une erreur serveur est survenue. Veuillez réessayer.");
    }
    return Promise.reject(error);
  },
);

/** Maps a Laravel-style 422 payload onto react-hook-form setError. */
export function applyValidationErrors(
  error: unknown,
  setError: (field: never, err: { type: string; message: string }) => void,
): boolean {
  const axiosError = error as AxiosError<{ errors?: Record<string, string[]> }>;
  const errors = axiosError.response?.data?.errors;
  if (axiosError.response?.status !== 422 || !errors) return false;
  Object.entries(errors).forEach(([field, messages]) => {
    setError(field as never, { type: "server", message: messages[0] ?? "Champ invalide." });
  });
  return true;
}
