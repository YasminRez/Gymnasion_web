import { api } from "./api";
import {
  MetricaResponseDTO,
  CriarMetricaRequestDTO,
  AtualizarMetricaRequestDTO,
  MensagemResponseDTO,
} from '../types/metric';

export const metricaService = {
  async listarPorModalidade(modalidadeId: number): Promise<MetricaResponseDTO[]> {
    const response = await api.get<MetricaResponseDTO[]>('/api/personal-trainers/metricas', {
      params: { modalidadeId },
    });
    return response.data;
  },

  async criarMetrica(data: CriarMetricaRequestDTO): Promise<MetricaResponseDTO> {
    const response = await api.post<MetricaResponseDTO>('/api/personal-trainers/metricas', data);
    return response.data;
  },

  async atualizarMetrica(
    id: string,
    data: AtualizarMetricaRequestDTO
  ): Promise<MetricaResponseDTO> {
    const response = await api.put<MetricaResponseDTO>(
      `/api/personal-trainers/metricas/${id}`,
      data
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