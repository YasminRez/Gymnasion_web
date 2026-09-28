export interface Modalidade {
  id: number;
  nome: string;
  descricao: string;
}

export interface ModalidadeResponseDTO {
  id: number;
  nome: string;
  descricao?: string;
}