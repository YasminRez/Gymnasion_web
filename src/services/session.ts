import type { LoginResponse, UserRole } from "../types/auth";

const TOKEN_KEY = "@Gymnasion:token";
const USER_KEY = "@Gymnasion:user";

// Disparado quando a API recusa o token (expirado, inválido ou conta desativada).
export const SESSION_EXPIRED_EVENT = "gymnasion:session-expired";

// Rota inicial da área autenticada do personal.
export const PRIVATE_HOME = "/home";

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
  save(data: LoginResponse, remember = false): void {
    session.clear();
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem(TOKEN_KEY, data.token);
    storage.setItem(USER_KEY, JSON.stringify({ id: data.id, role: data.role }));
  },

  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  },

  getToken(): string | null {
    const token = sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
    if (token && isTokenExpired(token)) {
      session.clear();
      return null;
    }
    return token;
  },

  // Retorna o usuário apenas se houver um token ainda dentro da validade.
  getUser(): SessionUser | null {
    const token = session.getToken();
    const user = sessionStorage.getItem(TOKEN_KEY) ? sessionStorage.getItem(USER_KEY) : localStorage.getItem(USER_KEY);
    if (!token || !user || isTokenExpired(token)) return null;

    try {
      return JSON.parse(user) as SessionUser;
    } catch {
      return null;
    }
  },
};
