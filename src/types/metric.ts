import type { CampoStrava } from './strava';

export type { CampoStrava };

export type TipoMetrica =
  | 'NUMERICO'
  | 'TEMPO'
  | 'TEMPO_CRONOMETRO'
  | 'FREQUENCIA_CARDIACA'
  | 'TEXTO'
  | 'TEXTO_OBSERVACAO';

export type ResponsavelPreenchimento = 'ALUNO' | 'PERSONAL' | 'AMBOS';

export interface MetricaResponseDTO {
  id: string;
  titulo: string;
  tipo: TipoMetrica;
  modalidadeId: number;
  nomeModalidade?: string;
  modalidade?: { id: number; nome: string };
  obrigatoria?: boolean;
  quemPreenche?: ResponsavelPreenchimento;
  campoStrava?: CampoStrava | null;
  ativo?: boolean;
  descontinuada?: boolean;
  quantidadeAlunosComRegistros?: number;
  quantidadeAlunosComRegistro?: number;
}

export interface CriarMetricaRequestDTO {
  modalidadeId: number;
  titulo: string;
  tipo: TipoMetrica;
  obrigatoria?: boolean;
  quemPreenche?: ResponsavelPreenchimento;
  campoStrava?: CampoStrava | null;
}

export interface AtualizarMetricaRequestDTO {
  titulo: string;
  tipo: TipoMetrica;
  obrigatoria?: boolean;
  quemPreenche?: ResponsavelPreenchimento;
  campoStrava?: CampoStrava | null;
}

export interface MensagemResponseDTO {
  mensagem: string;
}

export function getMetricStudentCount(m: MetricaResponseDTO): number {
  return m.quantidadeAlunosComRegistro ?? m.quantidadeAlunosComRegistros ?? 0;
}

export function isMetricActive(m: MetricaResponseDTO): boolean {
  if (typeof m.descontinuada === 'boolean') {
    return !m.descontinuada;
  }
  if (typeof m.ativo === 'boolean') {
    return m.ativo;
  }
  return true;
}