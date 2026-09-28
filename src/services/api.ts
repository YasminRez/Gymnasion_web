import axios from "axios";
import type { ProblemDetail } from "../types/api";
import { session, SESSION_EXPIRED_EVENT } from "./session";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080",
  headers: {
    "Content-Type": "application/json",
  },
});

// 401 em uma requisição que levava token = sessão perdida.
// Sem token (ex.: login com senha errada) o erro é tratado pela própria tela.
export function isSessionError(err: unknown): boolean {
  return (
    axios.isAxiosError(err) &&
    err.response?.status === 401 &&
    Boolean(err.config?.headers?.Authorization)
  );
}

// Interceptor de Requisição: Injeta o JWT salvo
api.interceptors.request.use(
  (config) => {
    const token = session.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de Resposta: encerra a sessão quando o backend recusa o token
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isSessionError(error)) {
      session.clear();
      const detail = (error.response?.data as ProblemDetail | undefined)?.detail;
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, { detail }));
    }
    return Promise.reject(error);
  }
);
