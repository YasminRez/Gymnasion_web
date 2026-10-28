import { api } from "./api";
import type {
  UsuarioPerfilResponse,
  AtualizarUsuarioRequest,
  PreferenciaUsuarioResponse,
  PreferenciaUsuarioRequest,
  AlterarSenhaRequest,
  MensagemResponse,
} from "../types/account";

export const accountService = {
  async obterPerfil(): Promise<UsuarioPerfilResponse> {
    const { data } = await api.get<UsuarioPerfilResponse>("/api/usuarios/me");
    return data;
  },

  async atualizarPerfil(payload: AtualizarUsuarioRequest): Promise<UsuarioPerfilResponse> {
    const { data } = await api.put<UsuarioPerfilResponse>("/api/usuarios/me", payload);
    return data;
  },

  async obterPreferencias(): Promise<PreferenciaUsuarioResponse> {
    const { data } = await api.get<PreferenciaUsuarioResponse>("/api/usuarios/me/preferencias");
    return data;
  },

  async atualizarPreferencias(payload: PreferenciaUsuarioRequest): Promise<PreferenciaUsuarioResponse> {
    const { data } = await api.put<PreferenciaUsuarioResponse>("/api/usuarios/me/preferencias", payload);
    return data;
  },

  async alterarSenha(payload: AlterarSenhaRequest): Promise<MensagemResponse> {
    const { data } = await api.patch<MensagemResponse>("/api/usuarios/me/senha", payload);
    return data;
  },
};
