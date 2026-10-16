// src/services/sessionDetailService.ts
import { api } from "./api";
import { unpackPage, type PaginatedOrArray } from "../types/api";
import type {
  DesempenhoDetalheResponse,
  AuditoriaDesempenhoItem,
  CorrigirDesempenhoPayload,
  AtualizarSessaoTreinoPayload,
  ObservacaoFeedbackResponse,
} from "../types/sessionDetail";
import type { TrainingSession } from "../types/personalDashboard";

const base = "/api/personal-trainers";

export const sessionDetailService = {
  /**
   * Consulta os detalhes de planejamento e execução de uma sessão de treino
   */
  async obterSessao(sessionId: string): Promise<TrainingSession> {
    const { data } = await api.get<TrainingSession>(`${base}/rotinas/sessoes/${encodeURIComponent(sessionId)}`);
    return data;
  },

  /**
   * Consulta o registro de desempenho detalhado (US-23 C1) com métricas e status de preenchimento
   */
  async obterDesempenho(sessionId: string): Promise<DesempenhoDetalheResponse> {
    const { data } = await api.get<DesempenhoDetalheResponse>(
      `${base}/rotinas/sessoes/${encodeURIComponent(sessionId)}/desempenho`
    );
    return data;
  },

  /**
   * Valida a execução realizada pelo aluno (US-10 C6 / Figma 550:9331)
   */
  async validarExecucao(sessionId: string): Promise<TrainingSession> {
    const { data } = await api.patch<TrainingSession>(
      `${base}/rotinas/sessoes/${encodeURIComponent(sessionId)}/validar`
    );
    return data;
  },

  /**
   * Preenche métrica pendente do personal ou corrige valores com auditoria (US-23 C2 a C7)
   */
  async corrigirDesempenho(
    sessionId: string,
    payload: CorrigirDesempenhoPayload
  ): Promise<DesempenhoDetalheResponse> {
    const { data } = await api.patch<DesempenhoDetalheResponse>(
      `${base}/rotinas/sessoes/${encodeURIComponent(sessionId)}/desempenho`,
      payload
    );
    return data;
  },

  /**
   * Consulta o histórico de auditoria de alterações do desempenho (US-23 C5)
   */
  async consultarAuditoria(sessionId: string): Promise<AuditoriaDesempenhoItem[]> {
    const { data } = await api.get<PaginatedOrArray<AuditoriaDesempenhoItem>>(
      `${base}/rotinas/sessoes/${encodeURIComponent(sessionId)}/desempenho/auditoria`,
      { params: { size: 100 } }
    );
    return unpackPage(data);
  },

  /**
   * Edita o planejamento de uma sessão futura não executada (US-10 C2 / Figma 551:8884)
   */
  async editarSessaoFutura(
    sessionId: string,
    payload: AtualizarSessaoTreinoPayload
  ): Promise<TrainingSession> {
    const { data } = await api.put<TrainingSession>(
      `${base}/rotinas/sessoes/${encodeURIComponent(sessionId)}`,
      payload
    );
    return data;
  },

  /**
   * Registra um feedback para a aluna (US-26 / imutável)
   */
  async enviarFeedback(alunoId: string, conteudo: string): Promise<ObservacaoFeedbackResponse> {
    const { data } = await api.post<ObservacaoFeedbackResponse>(
      `${base}/alunos/${encodeURIComponent(alunoId)}/observacoes-feedbacks`,
      { conteudo }
    );
    return data;
  },

  /**
   * Lista observações e feedbacks do perfil do aluno (US-26)
   */
  async consultarFeedbacks(alunoId: string): Promise<ObservacaoFeedbackResponse[]> {
    const { data } = await api.get<PaginatedOrArray<ObservacaoFeedbackResponse>>(
      `${base}/alunos/${encodeURIComponent(alunoId)}/observacoes-feedbacks`,
      { params: { size: 100 } }
    );
    return unpackPage(data);
  },
};
