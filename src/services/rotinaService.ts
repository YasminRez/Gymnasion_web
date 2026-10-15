import { api } from "./api";
import type {
  CriarRotinaPayload,
  PlanejamentoRotinaResponseDTO,
  ReutilizarRotinaPayload,
  RotinaResponse,
} from "../types/rotina";

const BASE_URL = "/api/personal-trainers/rotinas";

export const rotinaService = {
  async listar(): Promise<RotinaResponse[]> {
    const { data } = await api.get<RotinaResponse[]>(BASE_URL);
    return data;
  },

  async buscarPorId(id: string): Promise<RotinaResponse> {
    const { data } = await api.get<RotinaResponse>(`${BASE_URL}/${id}`);
    return data;
  },

  async listarPorAluno(alunoId: string): Promise<RotinaResponse[]> {
    const { data } = await api.get<RotinaResponse[]>(`${BASE_URL}/aluno/${alunoId}`);
    return data;
  },

  async criar(payload: CriarRotinaPayload): Promise<RotinaResponse> {
    const { data } = await api.post<RotinaResponse>(BASE_URL, payload);
    return data;
  },

  async excluir(id: string): Promise<{ mensagem?: string }> {
    const { data } = await api.delete<{ mensagem?: string }>(`${BASE_URL}/${id}`);
    return data;
  },

  async encerrar(id: string): Promise<RotinaResponse> {
    const { data } = await api.patch<RotinaResponse>(`${BASE_URL}/${id}/encerrar`);
    return data;
  },

  async vincularAlunos(id: string, alunosIds: string[]): Promise<RotinaResponse> {
    const { data } = await api.post<RotinaResponse>(`${BASE_URL}/${id}/alunos`, { alunosIds });
    return data;
  },

  async desvincularAluno(id: string, alunoId: string): Promise<{ mensagem?: string }> {
    const { data } = await api.delete<{ mensagem?: string }>(`${BASE_URL}/${id}/alunos/${alunoId}`);
    return data;
  },

  async reutilizar(id: string, payload: ReutilizarRotinaPayload): Promise<RotinaResponse> {
    const { data } = await api.post<RotinaResponse>(`${BASE_URL}/${id}/reutilizar`, payload);
    return data;
  },

  async consultarPlanejamento(id: string): Promise<PlanejamentoRotinaResponseDTO> {
    const { data } = await api.get<PlanejamentoRotinaResponseDTO>(`${BASE_URL}/${id}/planejamento`);
    return data;
  },
};
