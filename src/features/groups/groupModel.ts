import type { TurmaResponse } from "../../types/turma";

export const normalizeGroupText = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
export function filterGroups(groups: TurmaResponse[], search: string, modality: string) {
  return groups.filter(group => normalizeGroupText(group.nome).includes(normalizeGroupText(search.trim())) && (!modality || String(group.modalidadeId) === modality));
}
export function groupFormError(name: string, modality: string, schedule: string) {
  if (!name.trim()) return "Informe o nome da turma.";
  if (name.trim().length > 100) return "O nome deve ter no máximo 100 caracteres.";
  if (!modality) return "Selecione uma modalidade.";
  if (schedule && !Number.isFinite(new Date(schedule).getTime())) return "Informe uma data e um horário válidos.";
  return "";
}
export function removeGroupMember(group: TurmaResponse, id: string): TurmaResponse {
  const alunos = group.alunos.filter(student => student.id !== id);
  return { ...group, alunos, quantidadeAlunos: alunos.length };
}
export function groupIcon(name: string) {
  return ({ natacao: "imgIconWaves", tenis: "imgIconTennis", academia: "imgIconDumbbell2" } as Record<string,string>)[normalizeGroupText(name)] || "imgIconLayers1";
}
