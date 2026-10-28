import { api } from "./api";
import type { PaginatedOrArray } from "../types/api";
import { unpackPage } from "../types/api";
import type { PersonalNotification, StudentHistory, TrainingSession } from "../types/personalDashboard";

const base = "/api/personal-trainers";
export const personalDashboardService = {
  async notifications(params?: { page?: number; size?: number }): Promise<PersonalNotification[]> {
    const { data } = await api.get<PaginatedOrArray<PersonalNotification>>(base + "/notificacoes", {
      params: { size: 100, ...params },
    });
    return unpackPage(data);
  },
  async readNotification(id: string): Promise<PersonalNotification> {
    const { data } = await api.patch<PersonalNotification>(base + "/notificacoes/" + id + "/ler");
    return data;
  },
  async readAllNotifications(): Promise<void> {
    try {
      await api.patch(base + "/notificacoes/marcar-como-lidas");
    } catch {
      await api.patch(base + "/notificacoes/ler-todas");
    }
  },
  async history(alunoId: string, params?: { page?: number; size?: number }): Promise<StudentHistory> {
    const { data } = await api.get<PaginatedOrArray<TrainingSession>>(base + "/rotinas/aluno/" + alunoId + "/historico", {
      params: { size: 100, ...params },
    });
    return { alunoId, sessions: unpackPage(data) };
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
