import type { TrainingSession } from "./personalDashboard";

export interface StudentTracking {
  alunoId: string;
  rotinaAtivaId: string | null;
  quantidadeMetricasPendentes: number;
  sessoes: (Omit<TrainingSession, "id" | "rotinaTreinoId"> & {
    sessaoId: string;
    temPendenciasPersonal: boolean;
    quantidadePendenciasPersonal: number;
  })[];
}
export interface SessionExecution {
  alunoId: string;
  dataReal: string;
  duracao: number | null;
  nivelCansaco: number | null;
  resultados: { metricaId: string; valor: string }[];
}
