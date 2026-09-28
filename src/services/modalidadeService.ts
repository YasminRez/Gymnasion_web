import { api } from "./api";
import type { Modalidade } from "../types/modalidade";

export const modalidadeService = {
  async listarTodas(): Promise<Modalidade[]> {
    const { data } = await api.get<Modalidade[]>("/api/modalidades");
    return data;
  },
};