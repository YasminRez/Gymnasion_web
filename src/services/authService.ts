import { api, TOKEN_KEY, USER_KEY } from "./api";
import type { LoginPayload, LoginResponse, SignUpPersonalPayload, SignUpPersonalResponse, SignUpAlunoPayload, SignUpAlunoResponse } from "../types/auth";

export const authService = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>("/api/auth/login", payload);

    // Salva o JWT e dados básicos no localStorage
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify({ id: data.id, role: data.role }));

    return data;
  },

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  async registroPersonal(payload: SignUpPersonalPayload): Promise<SignUpPersonalResponse> {
    const { data } = await api.post<SignUpPersonalResponse>("/api/auth/registro-personal", payload);
    return data;
  },

  async registroAlunoConvite(token: string, payload: SignUpAlunoPayload): Promise<SignUpAlunoResponse> {
    const { data } = await api.post<SignUpAlunoResponse>(
      "/api/auth/registro-aluno-convite",
      payload,
      { params: { token } }
    );
    return data;
  },
};