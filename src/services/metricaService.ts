import { api } from "./api";
import type { PaginatedOrArray } from "../types/api";
import { unpackPage } from "../types/api";
import {
  MetricaResponseDTO,
  CriarMetricaRequestDTO,
  AtualizarMetricaRequestDTO,
  MensagemResponseDTO,
} from '../types/metric';

function sanitizeBackendTipo(tipo: string): 'FREQUENCIA_CARDIACA' | 'TEXTO' | 'TEMPO' | 'NUMERICO' {
  if (tipo === 'TEMPO_CRONOMETRO' || tipo === 'TEMPO') return 'TEMPO';
  if (tipo === 'TEXTO_OBSERVACAO' || tipo === 'TEXTO') return 'TEXTO';
  if (tipo === 'FREQUENCIA_CARDIACA') return 'FREQUENCIA_CARDIACA';
  return 'NUMERICO';
}

export const metricaService = {
  async listarTodas(params?: { page?: number; size?: number }): Promise<MetricaResponseDTO[]> {
    const response = await api.get<PaginatedOrArray<MetricaResponseDTO>>('/api/personal-trainers/metricas', {
      params: { size: 100, ...params },
    });
    return unpackPage(response.data);
  },

  async listarPorModalidade(modalidadeId: number, params?: { page?: number; size?: number }): Promise<MetricaResponseDTO[]> {
    const response = await api.get<PaginatedOrArray<MetricaResponseDTO>>('/api/personal-trainers/metricas', {
      params: { modalidadeId, size: 100, ...params },
    });
    return unpackPage(response.data);
  },

  async criarMetrica(data: CriarMetricaRequestDTO): Promise<MetricaResponseDTO> {
    const payload = {
      ...data,
      tipo: sanitizeBackendTipo(data.tipo),
    };
    const response = await api.post<MetricaResponseDTO>('/api/personal-trainers/metricas', payload);
    return response.data;
  },

  async atualizarMetrica(
    id: string,
    data: AtualizarMetricaRequestDTO
  ): Promise<MetricaResponseDTO> {
    const payload = {
      ...data,
      tipo: sanitizeBackendTipo(data.tipo),
    };
    const response = await api.put<MetricaResponseDTO>(
      `/api/personal-trainers/metricas/${id}`,
      payload
    );
    return response.data;
  },

  async excluirMetrica(id: string): Promise<MensagemResponseDTO> {
    const response = await api.delete<MensagemResponseDTO>(
      `/api/personal-trainers/metricas/${id}`
    );
    return response.data;
  },
};