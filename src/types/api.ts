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

export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export type PaginatedOrArray<T> = PageResponse<T> | T[];

export function unpackPage<T>(data: PaginatedOrArray<T> | null | undefined): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && Array.isArray((data as PageResponse<T>).content)) {
    return (data as PageResponse<T>).content;
  }
  return [];
}

