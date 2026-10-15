import { api } from "./api";
import type { StudentTracking, SessionExecution } from "../types/studentProfile";
import type { TrainingSession } from "../types/personalDashboard";
import type { RotinaResponse } from "../types/rotina";

const base = "/api/personal-trainers";
export const studentProfileService = {
  async tracking(studentId: string): Promise<StudentTracking> {
    const { data } = await api.get<StudentTracking>(`${base}/alunos/${encodeURIComponent(studentId)}/acompanhamento`);
    return data;
  },
  async routines(studentId: string): Promise<RotinaResponse[]> {
    const { data } = await api.get<RotinaResponse[]>(`${base}/rotinas/aluno/${encodeURIComponent(studentId)}`);
    return data;
  },
  async history(studentId: string): Promise<TrainingSession[]> {
    const { data } = await api.get<TrainingSession[]>(`${base}/rotinas/aluno/${encodeURIComponent(studentId)}/historico`);
    return data;
  },
  async execute(sessionId: string, payload: SessionExecution): Promise<TrainingSession> {
    const { data } = await api.post<TrainingSession>(`${base}/rotinas/sessoes/${encodeURIComponent(sessionId)}/execucao`, payload);
    return data;
  },
};
