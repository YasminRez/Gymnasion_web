import axios from "axios";
import type { ProblemDetail } from "../types/api";
import type { SignUpErrors, SignUpValues } from "../pages/SignUp/validation";

const fieldNames: Record<string, keyof SignUpValues> = { nome: "name", email: "email", password: "password", cpf: "cpf", celular: "phone", modalidade: "modality" };

export function authError(error: unknown, fallback: string): { message: string; fields: SignUpErrors } {
  if (!axios.isAxiosError(error)) return { message: fallback, fields: {} };
  if (!error.response) return { message: "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.", fields: {} };
  if (error.response.status >= 500) return { message: "O servidor está indisponível no momento. Tente novamente em instantes.", fields: {} };
  const problem = error.response.data as ProblemDetail | undefined;
  const message = problem?.detail || fallback;
  const fields: SignUpErrors = {};
  Object.entries(problem?.invalidFields || {}).forEach(([field, detail]) => {
    if (fieldNames[field]) fields[fieldNames[field]] = detail;
  });
  if (/cpf/i.test(message)) fields.cpf = message;
  if (/vinculado.*e-mail|e-mail.*cadastrad/i.test(message)) fields.email = message;
  return { message, fields };
}
