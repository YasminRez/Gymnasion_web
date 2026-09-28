import { api } from "./api";
import type { MensagemResponse } from "../types/api";
import type { AtualizarTurmaPayload, CriarTurmaPayload, TurmaResponse } from "../types/turma";

const BASE_URL = "/api/personal-trainers/turmas";

export const turmaService = {
  async listar(): Promise<TurmaResponse[]> {
    const { data } = await api.get<TurmaResponse[]>(BASE_URL);
    return data;
  },

  async buscarPorId(turmaId: string): Promise<TurmaResponse> {
    const { data } = await api.get<TurmaResponse>(`${BASE_URL}/${turmaId}`);
    return data;
  },

  async criar(payload: CriarTurmaPayload): Promise<TurmaResponse> {
    const { data } = await api.post<TurmaResponse>(BASE_URL, payload);
    return data;
  },

  async atualizar(turmaId: string, payload: AtualizarTurmaPayload): Promise<TurmaResponse> {
    const { data } = await api.put<TurmaResponse>(`${BASE_URL}/${turmaId}`, payload);
    return data;
  },

  async adicionarAluno(turmaId: string, alunoId: string): Promise<MensagemResponse> {
    const { data } = await api.post<MensagemResponse>(`${BASE_URL}/${turmaId}/alunos/${alunoId}`);
    return data;
  },

  // Se for o último aluno, o backend apaga a turma automaticamente.
  async removerAluno(turmaId: string, alunoId: string): Promise<MensagemResponse> {
    const { data } = await api.delete<MensagemResponse>(`${BASE_URL}/${turmaId}/alunos/${alunoId}`);
    return data;
  },
};
