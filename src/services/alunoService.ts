import { api } from "./api";
import type { PaginatedOrArray } from "../types/api";
import { unpackPage } from "../types/api";
import type { AlunoResponse } from "../types/student";
import type { PersonalNotification } from "../types/personalDashboard";
import type { PlanejamentoRotinaResponseDTO, RotinaResponse } from "../types/rotina";
import type {
  StudentEvolutionResponseDTO,
  StudentExecutionFormDTO,
  StudentExecutionPayloadDTO,
  StudentFeedbackDTO,
  StudentHistorySessionDTO,
} from "../types/studentArea";

const BASE_URL = "/api/alunos";

export const alunoService = {
  async obterMeuPerfil(): Promise<AlunoResponse> {
    const { data } = await api.get<AlunoResponse>(`${BASE_URL}/me`);
    return data;
  },

  async listarRotinas(params?: { page?: number; size?: number }): Promise<RotinaResponse[]> {
    const { data } = await api.get<PaginatedOrArray<RotinaResponse>>(`${BASE_URL}/rotinas`, {
      params: { size: 100, ...params },
    });
    return unpackPage(data);
  },

  async consultarPlanejamento(rotinaId: string): Promise<PlanejamentoRotinaResponseDTO> {
    const { data } = await api.get<PlanejamentoRotinaResponseDTO>(
      `${BASE_URL}/rotinas/${encodeURIComponent(rotinaId)}/planejamento`
    );
    return data;
  },

  async obterFormularioExecucao(sessaoId: string): Promise<StudentExecutionFormDTO> {
    const { data } = await api.get<StudentExecutionFormDTO>(
      `${BASE_URL}/rotinas/sessoes/${encodeURIComponent(sessaoId)}/execucao`
    );
    return data;
  },

  async registrarExecucao(
    sessaoId: string,
    payload: StudentExecutionPayloadDTO
  ): Promise<StudentHistorySessionDTO> {
    const { data } = await api.post<StudentHistorySessionDTO>(
      `${BASE_URL}/rotinas/sessoes/${encodeURIComponent(sessaoId)}/execucao`,
      payload
    );
    return data;
  },

  async consultarHistoricoRotina(
    rotinaId: string,
    params?: { page?: number; size?: number }
  ): Promise<StudentHistorySessionDTO[]> {
    const { data } = await api.get<PaginatedOrArray<StudentHistorySessionDTO>>(
      `${BASE_URL}/rotinas/${encodeURIComponent(rotinaId)}/historico`,
      { params: { size: 100, ...params } }
    );
    return unpackPage(data);
  },

  async listarNotificacoes(params?: { page?: number; size?: number }): Promise<PersonalNotification[]> {
    const { data } = await api.get<PaginatedOrArray<PersonalNotification>>(
      `${BASE_URL}/notificacoes`,
      { params: { size: 100, ...params } }
    );
    return unpackPage(data);
  },

  async lerNotificacao(id: string): Promise<PersonalNotification> {
    const { data } = await api.patch<PersonalNotification>(
      `${BASE_URL}/notificacoes/${encodeURIComponent(id)}/ler`
    );
    return data;
  },

  async lerTodasNotificacoes(): Promise<void> {
    await api.patch(`${BASE_URL}/notificacoes/marcar-como-lidas`);
  },

  async contagemNaoLidas(): Promise<number> {
    const { data } = await api.get<number>(`${BASE_URL}/notificacoes/contagem-nao-lidas`);
    return typeof data === "number" ? data : 0;
  },

  async listarFeedbacks(params?: { page?: number; size?: number }): Promise<StudentFeedbackDTO[]> {
    const { data } = await api.get<PaginatedOrArray<StudentFeedbackDTO>>(
      `${BASE_URL}/observacoes-feedbacks`,
      { params: { size: 100, ...params } }
    );
    return unpackPage(data);
  },

  async registrarObservacao(conteudo: string): Promise<StudentFeedbackDTO> {
    const { data } = await api.post<StudentFeedbackDTO>(`${BASE_URL}/observacoes-feedbacks`, {
      conteudo,
    });
    return data;
  },

  async consultarEvolucao(params?: {
    modalidadeId?: number;
    dataInicio?: string;
    dataFim?: string;
  }): Promise<StudentEvolutionResponseDTO> {
    const { data } = await api.get<StudentEvolutionResponseDTO>(`${BASE_URL}/evolucao`, {
      params,
    });
    return data;
  },
};
