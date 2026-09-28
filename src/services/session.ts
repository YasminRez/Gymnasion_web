import type { LoginResponse, UserRole } from "../types/auth";

const TOKEN_KEY = "@Gymnasion:token";
const USER_KEY = "@Gymnasion:user";

// Disparado quando a API recusa o token (expirado, inválido ou conta desativada).
export const SESSION_EXPIRED_EVENT = "gymnasion:session-expired";

// Rota inicial da área autenticada do personal.
export const PRIVATE_HOME = "/alunos";

export interface SessionUser {
  id: string;
  role: UserRole;
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const { exp } = JSON.parse(atob(payload)) as { exp?: number };
    return typeof exp === "number" && exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export const session = {
  save(data: LoginResponse): void {
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify({ id: data.id, role: data.role }));
  },

  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  // Retorna o usuário apenas se houver um token ainda dentro da validade.
  getUser(): SessionUser | null {
    const token = localStorage.getItem(TOKEN_KEY);
    const user = localStorage.getItem(USER_KEY);
    if (!token || !user || isTokenExpired(token)) return null;

    try {
      return JSON.parse(user) as SessionUser;
    } catch {
      return null;
    }
  },
};
