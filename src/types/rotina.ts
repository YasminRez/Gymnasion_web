import type { TipoMetrica } from "./metric";

export interface RotinaResponse {
  id: string;
  titulo: string;
  modalidadeId: number;
  nomeModalidade: string;
  frequenciaSemanal: number;
  objetivos: string | null;
  ativo?: boolean;
  alunos: { id: string; nome: string | null }[];
  metricas: { id: string; titulo: string; tipo: TipoMetrica; obrigatoria?: boolean; quemPreenche?: "ALUNO" | "PERSONAL" | "AMBOS" }[];
}

export interface CriarRotinaPayload {
  titulo: string;
  modalidadeId: number;
  frequenciaSemanal: number;
  objetivos: string;
  alunosIds: string[];
  metricasIds: string[];
}
