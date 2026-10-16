import { api } from "./api";
import type { MensagemResponse, PaginatedOrArray } from "../types/api";
import { unpackPage } from "../types/api";
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

  async listarPendentes(params?: { page?: number; size?: number }): Promise<AlunoResponse[]> {
    const { data } = await api.get<PaginatedOrArray<AlunoResponse>>(
      "/api/personal-trainers/alunos/pendentes",
      { params: { size: 100, ...params } }
    );
    return unpackPage(data);
  },

  async listarTodos(params?: { page?: number; size?: number }): Promise<AlunoResponse[]> {
    const { data } = await api.get<PaginatedOrArray<AlunoResponse>>(
      "/api/personal-trainers/alunos",
      { params: { size: 100, ...params } }
    );
    return unpackPage(data);
  },

  async listarInativos(params?: { page?: number; size?: number }): Promise<AlunoResponse[]> {
    const { data } = await api.get<PaginatedOrArray<AlunoResponse>>(
      "/api/personal-trainers/alunos/inativos",
      { params: { size: 100, ...params } }
    );
    return unpackPage(data);
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