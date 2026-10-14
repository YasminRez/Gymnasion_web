import { api } from "./api";
import type { CriarRotinaPayload, RotinaResponse } from "../types/rotina";

const BASE_URL = "/api/personal-trainers/rotinas";

export const rotinaService = {
  async vincularAlunos(id: string, alunosIds: string[]): Promise<RotinaResponse> {
    const { data } = await api.post<RotinaResponse>(`${BASE_URL}/${id}/alunos`, { alunosIds });
    return data;
  },
  async listar(): Promise<RotinaResponse[]> {
    const { data } = await api.get<RotinaResponse[]>(BASE_URL);
    return data;
  },

  async criar(payload: CriarRotinaPayload): Promise<RotinaResponse> {
    const { data } = await api.post<RotinaResponse>(BASE_URL, payload);
    return data;
  },
};
