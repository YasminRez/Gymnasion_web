export interface AlunoResumo {
  id: string;
  nome: string | null;
  email: string | null;
}

export interface TurmaResponse {
  id: string;
  nome: string;
  modalidadeId: number;
  nomeModalidade: string;
  horario: string | null;
  quantidadeAlunos: number;
  alunos: AlunoResumo[];
}

export interface CriarTurmaPayload {
  nome: string;
  modalidadeId: number;
  horario?: string | null;
  alunosIds: string[];
}

export interface AtualizarTurmaPayload {
  nome: string;
  modalidadeId: number;
  horario?: string | null;
}
