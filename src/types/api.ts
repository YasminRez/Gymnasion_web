export interface ProblemDetail {
  title?: string;
  status?: number;
  detail?: string;
  type?: string;
  invalidFields?: Record<string, string>;
}

export interface MensagemResponse {
  mensagem: string;
}
