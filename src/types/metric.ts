export type TipoMetrica = 'NUMERICO' | 'TEMPO' | 'FREQUENCIA_CARDIACA' | 'TEXTO';

export interface MetricaResponseDTO {
  id: string;
  titulo: string;
  tipo: TipoMetrica;
  modalidadeId: number;
  nomeModalidade: string;
  ativo: boolean;
  quantidadeAlunosComRegistros: number;
}

export interface CriarMetricaRequestDTO {
  modalidadeId: number;
  titulo: string;
  tipo: TipoMetrica;
}

export interface AtualizarMetricaRequestDTO {
  titulo: string;
  tipo: TipoMetrica;
}

export interface MensagemResponseDTO {
  mensagem: string;
}