import { useEffect, useRef, useState, type FormEvent } from "react";
import { turmaService } from "../../services/turmaService";
import { handleApiError } from "../../utils/handleApiError";
import { initials } from "../../pages/Students/studentData";
import { avatarColor, toDateTimeLocal } from "../../pages/Groups/groupData";
import type { Modalidade } from "../../types/modalidade";
import type { AlunoResponse } from "../../types/student";
import type { TurmaResponse } from "../../types/turma";
import "./GroupFormModal.css";

type StudentOption = { id: string; name: string; detail: string };
type Props = {
  group?: TurmaResponse;
  modalities: Modalidade[];
  suggestedModalityIds: number[];
  students: AlunoResponse[];
  onClose: () => void;
  onSaved: (message: string) => void;
};

// Criação: nome, modalidade, horário e alunos (US-07). Edição: nome, modalidade e horário (US-09 - Cenário 1);
// os alunos da turma são gerenciados direto no card.
function GroupFormModal({ group, modalities, suggestedModalityIds, students, onClose, onSaved }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const editing = Boolean(group);
  const [name, setName] = useState(group?.nome ?? "");
  const [modalityId, setModalityId] = useState<number | null>(group?.modalidadeId ?? null);
  const [schedule, setSchedule] = useState(toDateTimeLocal(group?.horario ?? null));
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [showAllModalities, setShowAllModalities] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = "hidden";
    return () => { element?.close(); document.body.style.overflow = previousOverflow; if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus(); };
  }, []);

  const options: StudentOption[] = students
    .map((aluno) => ({ id: aluno.id, name: aluno.usuario.nome, detail: aluno.modalidades.map((m) => m.nome).join(", ") || "Geral" }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  const shortList = modalities.filter((m) => suggestedModalityIds.includes(m.id) || m.id === modalityId);
  const visibleModalities = showAllModalities || shortList.length === 0 ? modalities : shortList;
  const canExpand = shortList.length > 0 && shortList.length < modalities.length;

  const errors = {
    name: !name.trim() ? "Informe o nome da turma." : name.trim().length > 100 ? "O nome deve ter no máximo 100 caracteres." : "",
    modality: modalityId === null ? "Selecione uma modalidade." : "",
    students: !editing && selected.size === 0 ? "Selecione pelo menos 1 aluno." : "",
  };
  const invalid = Object.values(errors).some(Boolean);

  function toggleStudent(id: string) {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (invalid || modalityId === null) return;

    const payload = { nome: name.trim(), modalidadeId: modalityId, horario: schedule ? new Date(schedule).toISOString() : null };
    setSaving(true);
    try {
      if (!group) {
        await turmaService.criar({ ...payload, alunosIds: Array.from(selected) });
        onSaved("Turma criada com sucesso!");
        return;
      }

      await turmaService.atualizar(group.id, payload);
      onSaved("Turma atualizada com sucesso!");
    } catch (err) {
      handleApiError(err, editing ? "Não foi possível atualizar a turma." : "Não foi possível criar a turma.");
    } finally {
      setSaving(false);
    }
  }

  return <dialog ref={dialog} className="group-form" aria-labelledby="group-form-title" onCancel={(event) => { event.preventDefault(); if (!saving) onClose(); }}>
    <form onSubmit={handleSubmit} noValidate>
      <header className="group-form__header">
        <h2 id="group-form-title">{editing ? "Editar turma" : "Nova turma"}</h2>
        <button type="button" className="group-form__close" aria-label="Fechar" disabled={saving} onClick={onClose}>×</button>
      </header>

      <div className="group-form__body">
        <label className="group-form__label" htmlFor="group-name">Nome da turma</label>
        <input id="group-name" className="group-form__input" maxLength={100} placeholder="Ex: Natação Intermediário – Tarde" value={name} onChange={(event) => setName(event.target.value)} aria-invalid={submitted && Boolean(errors.name)} aria-describedby={submitted && errors.name ? "group-name-error" : undefined} autoFocus />
        {submitted && errors.name && <p className="group-form__error" id="group-name-error">{errors.name}</p>}

        <fieldset>
          <legend className="group-form__label">Modalidade</legend>
          <div className="group-form__chips" data-invalid={submitted && Boolean(errors.modality)}>
            {visibleModalities.map((modality) => (
              <button key={modality.id} type="button" aria-pressed={modalityId === modality.id} onClick={() => setModalityId(modality.id)}>{modality.nome}</button>
            ))}
            {canExpand && <button type="button" className="group-form__more" onClick={() => setShowAllModalities(!showAllModalities)}>{showAllModalities ? "Menos" : "+ Outras"}</button>}
          </div>
          {submitted && errors.modality && <p className="group-form__error">{errors.modality}</p>}
        </fieldset>

        <label className="group-form__label" htmlFor="group-schedule">Horário <span>(opcional)</span></label>
        <input id="group-schedule" className="group-form__input" type="datetime-local" value={schedule} onChange={(event) => setSchedule(event.target.value)} />

        {!editing && <fieldset>
          <legend className="group-form__label">Alunos ({selected.size} {selected.size === 1 ? "selecionado" : "selecionados"})</legend>
          {options.length === 0
            ? <p className="group-form__empty">Você ainda não tem alunos ativos. <a href="/alunos">Cadastre um aluno</a> para criar uma turma.</p>
            : <ul className="group-form__students" data-invalid={submitted && Boolean(errors.students)}>
              {options.map((option) => (
                <li key={option.id}>
                  <label>
                    <input type="checkbox" checked={selected.has(option.id)} onChange={() => toggleStudent(option.id)} />
                    <span className="group-form__avatar" style={{ background: avatarColor(option.name) }} aria-hidden="true">{initials(option.name)}</span>
                    <span className="group-form__student">{option.name}<small>{option.detail}</small></span>
                  </label>
                </li>
              ))}
            </ul>}
          {submitted && errors.students && options.length > 0 && <p className="group-form__error">{errors.students}</p>}
        </fieldset>}
      </div>

      <footer className="group-form__actions">
        <button type="button" disabled={saving} onClick={onClose}>Cancelar</button>
        <button type="submit" className="group-form__primary" disabled={saving || (!editing && options.length === 0)} aria-busy={saving}>
          {saving ? "Salvando..." : editing ? "Salvar" : "Criar turma"}
        </button>
      </footer>
    </form>
  </dialog>;
}

export default GroupFormModal;
