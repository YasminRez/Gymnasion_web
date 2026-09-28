import toast from "react-hot-toast";
import axios from "axios";
import type { ProblemDetail } from "../types/api";
import { isSessionError } from "../services/api";

export function handleApiError(err: unknown, defaultMessage = "Ocorreu um erro. Tente novamente.") {
  // Sessão perdida já é avisada e redirecionada pelo App.
  if (isSessionError(err)) return;

  if (axios.isAxiosError(err) && err.response?.data) {
    const problem = err.response.data as ProblemDetail;

    if (problem.invalidFields && Object.keys(problem.invalidFields).length > 0) {
      const messages = Object.values(problem.invalidFields).join("\n");
      toast.error(messages);
      return;
    }

    toast.error(problem.detail || problem.title || defaultMessage);
    return;
  }

  toast.error(defaultMessage);
}