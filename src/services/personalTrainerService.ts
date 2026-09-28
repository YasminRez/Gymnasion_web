import { api } from "./api";
import type { MensagemResponse } from "../types/api";
import type {
  AlunoResponse,
  ConviteAlunoPayload,
  ConviteAlunoResponse,
} from "../types/student";

export const personalTrainerService = {
  async gerarConvite(modalidadeId: number): Promise<ConviteAlunoResponse> {
    const payload: ConviteAlunoPayload = { modalidadeId };
    const { data } = await api.post<ConviteAlunoResponse>(
      "/api/personal-trainers/convites",
      payload
    );
    return data;
  },

  async listarPendentes(): Promise<AlunoResponse[]> {
    const { data } = await api.get<AlunoResponse[]>(
      "/api/personal-trainers/alunos/pendentes"
    );
    return data;
  },

  async listarTodos(): Promise<AlunoResponse[]> {
    const { data } = await api.get<AlunoResponse[]>(
      "/api/personal-trainers/alunos"
    );
    return data;
  }, 

  async aprovarAtleta(alunoId: string): Promise<void> {
    await api.patch(`/api/personal-trainers/alunos/${alunoId}/aprovar`);
  },

  async recusarAtleta(alunoId: string): Promise<void> {
    await api.patch(`/api/personal-trainers/alunos/${alunoId}/recusar`);
  },

  async desativarAtleta(alunoId: string): Promise<MensagemResponse> {
    const { data } = await api.patch<MensagemResponse>(
      `/api/personal-trainers/alunos/${alunoId}/desativar`
    );
    return data;
  },

  async reativarAtleta(alunoId: string): Promise<MensagemResponse> {
    const { data } = await api.patch<MensagemResponse>(
      `/api/personal-trainers/alunos/${alunoId}/reativar`
    );
    return data;
  },
};