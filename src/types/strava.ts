export type CampoStrava =
  | 'DISTANCIA_KM'
  | 'DISTANCIA_METROS'
  | 'TEMPO_MOVIMENTO'
  | 'TEMPO_TOTAL'
  | 'DURACAO_MINUTOS'
  | 'VELOCIDADE_MEDIA_KMH'
  | 'VELOCIDADE_MAXIMA_KMH'
  | 'RITMO_MEDIO'
  | 'FREQUENCIA_CARDIACA_MEDIA'
  | 'FREQUENCIA_CARDIACA_MAXIMA'
  | 'CADENCIA_MEDIA'
  | 'POTENCIA_MEDIA_WATTS'
  | 'POTENCIA_MAXIMA_WATTS'
  | 'ELEVACAO_GANHO_METROS'
  | 'CALORIAS'
  | 'NENHUM';

export interface StravaAuthUrlResponse {
  authUrl: string;
  mock: boolean;
}

export interface StravaConectarRequest {
  code: string;
  scope?: string;
  state?: string;
}

export interface StravaStatusResponse {
  conectado: boolean;
  expirado: boolean;
  atletaId?: number | null;
  nomeAtleta?: string | null;
  mock: boolean;
}

export interface StravaAtividade {
  id: string;
  nome: string;
  tipo: string;
  esporte: string;
  data: string; // YYYY-MM-DD
  dataHora?: string;
  distanciaMetros?: number;
  distanciaKm?: number;
  distanciaFormatada?: string;
  tempoSegundos?: number;
  tempoFormatado?: string;
  duracaoMinutos?: number;
  frequenciaCardiacaMedia?: number | null;
  frequenciaCardiacaMaxima?: number | null;
  ritmoMedio?: string;
  tempoTotalFormatado?: string;
  cadenciaMedia?: number | null;
  potenciaMediaWatts?: number | null;
  potenciaMaximaWatts?: number | null;
  elevacaoGanhoMetros?: number | null;
  velocidadeMediaKmh?: number | null;
  velocidadeMaximaKmh?: number | null;
  calorias?: number | null;
}

export interface CampoStravaOption {
  value: CampoStrava;
  label: string;
  tiposValidos: string[];
}

export const CAMPO_STRAVA_OPTIONS: CampoStravaOption[] = [
  { value: 'NENHUM', label: 'Nenhum (Preenchimento Manual)', tiposValidos: ['NUMERICO', 'TEMPO', 'TEMPO_CRONOMETRO', 'FREQUENCIA_CARDIACA', 'TEXTO', 'TEXTO_OBSERVACAO'] },
  // Numéricos
  { value: 'DISTANCIA_KM', label: 'Distância em km (ex: 4.02)', tiposValidos: ['NUMERICO'] },
  { value: 'DISTANCIA_METROS', label: 'Distância em metros (ex: 4017)', tiposValidos: ['NUMERICO'] },
  { value: 'CADENCIA_MEDIA', label: 'Cadência Média - passos/min ou rpm (ex: 67)', tiposValidos: ['NUMERICO'] },
  { value: 'POTENCIA_MEDIA_WATTS', label: 'Potência Média em Watts (ex: 175)', tiposValidos: ['NUMERICO'] },
  { value: 'POTENCIA_MAXIMA_WATTS', label: 'Potência Máxima em Watts (ex: 406)', tiposValidos: ['NUMERICO'] },
  { value: 'ELEVACAO_GANHO_METROS', label: 'Ganho de Elevação em metros (ex: 120)', tiposValidos: ['NUMERICO'] },
  { value: 'VELOCIDADE_MEDIA_KMH', label: 'Velocidade Média em km/h (ex: 19.9)', tiposValidos: ['NUMERICO'] },
  { value: 'VELOCIDADE_MAXIMA_KMH', label: 'Velocidade Máxima em km/h (ex: 39.6)', tiposValidos: ['NUMERICO'] },
  { value: 'CALORIAS', label: 'Gasto Calórico em kcal (ex: 380)', tiposValidos: ['NUMERICO'] },
  { value: 'DURACAO_MINUTOS', label: 'Duração em minutos inteiros (ex: 35)', tiposValidos: ['NUMERICO'] },
  // Tempo
  { value: 'TEMPO_MOVIMENTO', label: 'Tempo em Movimento (ex: 34:40)', tiposValidos: ['TEMPO', 'TEMPO_CRONOMETRO'] },
  { value: 'TEMPO_TOTAL', label: 'Tempo Total / Elapsed Time (ex: 35:10)', tiposValidos: ['TEMPO', 'TEMPO_CRONOMETRO'] },
  // Frequência Cardíaca
  { value: 'FREQUENCIA_CARDIACA_MEDIA', label: 'Frequência Cardíaca Média em bpm (ex: 140)', tiposValidos: ['FREQUENCIA_CARDIACA'] },
  { value: 'FREQUENCIA_CARDIACA_MAXIMA', label: 'Frequência Cardíaca Máxima em bpm (ex: 178)', tiposValidos: ['FREQUENCIA_CARDIACA'] },
  // Texto / Ritmo
  { value: 'RITMO_MEDIO', label: 'Ritmo / Pace formatado (ex: 08:37 min/km)', tiposValidos: ['TEXTO', 'TEXTO_OBSERVACAO', 'NUMERICO'] }
];
