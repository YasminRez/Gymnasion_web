import { useEffect, useRef, useState } from "react";
import { turmaService } from "../../services/turmaService";
import { handleApiError } from "../../utils/handleApiError";
import { initials } from "../../pages/Students/studentData";
import { avatarColor } from "../../pages/Groups/groupData";
import type { AlunoResponse } from "../../types/student";
import type { TurmaResponse } from "../../types/turma";
// Mesmo visual do modal de turma.
import "../GroupFormModal/GroupFormModal.css";
import "./GroupAddStudentModal.css";

type Props = { group: TurmaResponse; students: AlunoResponse[]; onClose: () => void; onAdded: (message: string) => void };

// US-09 - Cenários 3 e 4: quem já está na turma continua na lista para o backend responder "Aluno já pertence a essa turma".
function GroupAddStudentModal({ group, students, onClose, onAdded }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = "hidden";
    return () => { element?.close(); document.body.style.overflow = previousOverflow; if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus(); };
  }, []);

  const members = new Set(group.alunos.map((aluno) => aluno.id));
  const options = [...students].sort((a, b) => a.usuario.nome.localeCompare(b.usuario.nome, "pt-BR"));

  async function add(studentId: string) {
    setAddingId(studentId);
    try {
      const { mensagem } = await turmaService.adicionarAluno(group.id, studentId);
      onAdded(mensagem || "Aluno adicionado com sucesso");
    } catch (err) {
      handleApiError(err, "Não foi possível adicionar o aluno à turma.");
    } finally {
      setAddingId(null);
    }
  }

  return <dialog ref={dialog} className="group-form group-add" aria-labelledby="group-add-title" aria-describedby="group-add-subtitle" onCancel={(event) => { event.preventDefault(); if (!addingId) onClose(); }}>
    <header className="group-form__header">
      <h2 id="group-add-title">Adicionar aluno</h2>
      <button type="button" className="group-form__close" aria-label="Fechar" disabled={addingId !== null} onClick={onClose}>×</button>
    </header>
    <div className="group-form__body">
      <p id="group-add-subtitle" className="group-form__label">{group.nome}</p>
      {options.length === 0
        ? <p className="group-form__empty">Você ainda não tem alunos ativos. <a href="/alunos">Cadastre um aluno</a> para adicioná-lo à turma.</p>
        : <ul className="group-form__students">
          {options.map((aluno) => (
            <li key={aluno.id} className="group-add__row">
              <span className="group-form__avatar" style={{ background: avatarColor(aluno.usuario.nome) }} aria-hidden="true">{initials(aluno.usuario.nome)}</span>
              <span className="group-form__student">{aluno.usuario.nome}<small>{members.has(aluno.id) ? "Já está na turma" : aluno.modalidades.map((m) => m.nome).join(", ") || "Geral"}</small></span>
              <button type="button" disabled={addingId !== null} aria-busy={addingId === aluno.id} aria-label={`Adicionar ${aluno.usuario.nome} à turma`} onClick={() => add(aluno.id)}>
                {addingId === aluno.id ? "..." : "Adicionar"}
              </button>
            </li>
          ))}
        </ul>}
    </div>
    <footer className="group-form__actions">
      <button type="button" disabled={addingId !== null} onClick={onClose}>Fechar</button>
    </footer>
  </dialog>;
}

export default GroupAddStudentModal;
