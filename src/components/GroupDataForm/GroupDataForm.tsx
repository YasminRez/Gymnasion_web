import { useRef, useState, type FormEvent, type ChangeEvent } from "react";
import Button from "../Button/Button";
import FormField from "../FormField/FormField";
import Avatar from "../Avatar/Avatar";
import { turmaService } from "../../services/turmaService";
import { groupFormError, normalizeGroupText } from "../../features/groups/groupModel";
import { toDateTimeLocal } from "../../pages/Groups/groupData";
import type { Modalidade } from "../../types/modalidade";
import type { AlunoResponse } from "../../types/student";
import type { TurmaResponse } from "../../types/turma";
import "./GroupDataForm.css";
const modalityIcons: Record<string, string> = { natacao: "imgIconWaves1", tenis: "imgIconTennis1", academia: "imgIconDumbbell3", corrida: "imgFrame" };
type Props = { group?: TurmaResponse; modalities: Modalidade[]; students?: AlunoResponse[]; onSaved: (group: TurmaResponse) => void; onCancel: () => void; onBusy?: (busy: boolean) => void };
export default function GroupDataForm({ group, modalities, students = [], onSaved, onCancel, onBusy }: Props) {
  const [name, setName] = useState(group?.nome || "");
  const [modality, setModality] = useState(String(group?.modalidadeId || ""));
  const [schedule, setSchedule] = useState(toDateTimeLocal(group?.horario || null));
  const [selected, setSelected] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (lock.current) return;
    const validation = groupFormError(name, modality, schedule) || (!group && !selected.length ? "Selecione pelo menos um aluno." : "");
    if (validation) { setError(validation); return; }
    lock.current = true; setBusy(true); onBusy?.(true); setError("");
    try {
      const payload = { nome: name.trim(), modalidadeId: Number(modality), horario: schedule ? new Date(schedule).toISOString() : null };
      onSaved(group ? await turmaService.atualizar(group.id, payload) : await turmaService.criar({ ...payload, alunosIds: selected }));
    } catch (error) {
      setError((error as { response?: { data?: { detail?: string } } }).response?.data?.detail || "Não foi possível salvar a turma. Tente novamente.");
    } finally { lock.current = false; setBusy(false); onBusy?.(false); }
  }
  return <form className={"group-data-form" + (group ? " group-data-form--edit" : "")} onSubmit={submit}>
    <fieldset disabled={busy} className="group-data-form__fields">
      <div className="group-data-form__row">
        <FormField id="group-name" label="Nome da turma" placeholder="Ex.: Natação — Manhã" required maxLength={100} value={name} onChange={(event: ChangeEvent<HTMLInputElement>) => setName(event.target.value)} />
        <FormField id="group-schedule" label="Horário (opcional)" type="datetime-local" value={schedule} onChange={(event: ChangeEvent<HTMLInputElement>) => setSchedule(event.target.value)} />
      </div>
      <p className="group-data-form__hint">Data e horário únicos. A agenda semanal ainda não está disponível.</p>
      {group ? <FormField id="group-modality" label="Modalidade" required value={modality} options={modalities.map(item => ({ value: String(item.id), label: item.nome }))} onChange={(event: ChangeEvent<HTMLSelectElement>) => setModality(event.target.value)} /> : <fieldset className="group-data-form__modalities">
        <legend>Modalidade</legend><div>{(expanded ? modalities : modalities.slice(0, 4)).map(item => {
          const icon = modalityIcons[normalizeGroupText(item.nome)];
          return <button type="button" key={item.id} aria-pressed={modality === String(item.id)} onClick={() => setModality(String(item.id))}>{icon && <img src={"/groups/" + icon + ".svg"} alt="" />}{item.nome}</button>;
        })}
        {modalities.length > 4 && <button type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? "Mostrar menos" : "+ " + (modalities.length - 4) + " outras"}</button>}</div>
      </fieldset>}
      {!group && <fieldset className="group-data-form__selection"><legend>Alunos <span>{selected.length} selecionados</span></legend>
        <div className="group-data-form__students">{students.filter(item => item.status === "ATIVO").map(student => <label key={student.id} className={selected.includes(student.id) ? "is-selected" : ""}>
          <input type="checkbox" checked={selected.includes(student.id)} onChange={event => setSelected(previous => event.target.checked ? [...previous, student.id] : previous.filter(id => id !== student.id))} />
          <Avatar name={student.usuario.nome} /><span>{student.usuario.nome}</span>
        </label>)}</div>
        <p className="group-data-form__hint"><img src="/groups/imgIconInfo.svg" alt="" /> Alunos inativos não aparecem nesta lista.</p>
      </fieldset>}
    </fieldset>
    {error && <p className="workspace-error" role="alert">{error}</p>}
    <footer className="group-data-form__actions"><Button variant="secondary" disabled={busy} onClick={onCancel}>Cancelar</Button><Button type="submit" loading={busy}>{group ? "Salvar alterações" : "Criar turma"}</Button></footer>
  </form>;
}
