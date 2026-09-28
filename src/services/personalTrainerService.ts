import { api } from "./api";
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
};