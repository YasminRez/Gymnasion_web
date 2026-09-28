export interface ProblemDetail {
  title?: string;
  status?: number;
  detail?: string;
  type?: string;
  invalidFields?: Record<string, string>;
}