import { api } from "./api";
import type { PaginatedOrArray } from "../types/api";
import { unpackPage } from "../types/api";
import type { StudentTracking, SessionExecution } from "../types/studentProfile";
import type { TrainingSession } from "../types/personalDashboard";
import type { RotinaResponse } from "../types/rotina";

const base = "/api/personal-trainers";
export const studentProfileService = {
  async tracking(studentId: string): Promise<StudentTracking> {
    const { data } = await api.get<StudentTracking>(`${base}/alunos/${encodeURIComponent(studentId)}/acompanhamento`);
    return data;
  },
  async routines(studentId: string, params?: { page?: number; size?: number }): Promise<RotinaResponse[]> {
    const { data } = await api.get<PaginatedOrArray<RotinaResponse>>(`${base}/rotinas/aluno/${encodeURIComponent(studentId)}`, {
      params: { size: 100, ...params },
    });
    return unpackPage(data);
  },
  async history(studentId: string, params?: { page?: number; size?: number }): Promise<TrainingSession[]> {
    const { data } = await api.get<PaginatedOrArray<TrainingSession>>(`${base}/rotinas/aluno/${encodeURIComponent(studentId)}/historico`, {
      params: { size: 100, ...params },
    });
    return unpackPage(data);
  },
  async execute(sessionId: string, payload: SessionExecution): Promise<TrainingSession> {
    const { data } = await api.post<TrainingSession>(`${base}/rotinas/sessoes/${encodeURIComponent(sessionId)}/execucao`, payload);
    return data;
  },
};
