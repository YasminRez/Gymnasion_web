import { api } from "./api";
import type { PersonalNotification, StudentHistory, TrainingSession } from "../types/personalDashboard";

const base = "/api/personal-trainers";
export const personalDashboardService = {
  async notifications(): Promise<PersonalNotification[]> {
    const { data } = await api.get<PersonalNotification[]>(base + "/notificacoes");
    return data;
  },
  async readNotification(id: string): Promise<PersonalNotification> {
    const { data } = await api.patch<PersonalNotification>(base + "/notificacoes/" + id + "/ler");
    return data;
  },
  async readAllNotifications(): Promise<void> {
    await api.patch(base + "/notificacoes/ler-todas");
  },
  async history(alunoId: string): Promise<StudentHistory> {
    const { data } = await api.get<TrainingSession[]>(base + "/rotinas/aluno/" + alunoId + "/historico");
    return { alunoId, sessions: data };
  },
  // Limit parallel requests because the API exposes history per student.
  async histories(ids: string[]): Promise<StudentHistory[]> {
    const results: StudentHistory[] = [];
    let cursor = 0;
    await Promise.all(Array.from({length:Math.min(4,ids.length)}, async () => {
      while (cursor < ids.length) {
        const id = ids[cursor++];
        results.push(await personalDashboardService.history(id));
      }
    }));
    return results;
  },
};
