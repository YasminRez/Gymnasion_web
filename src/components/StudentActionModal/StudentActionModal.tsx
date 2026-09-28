import { useEffect, useRef } from "react";
import type { Student } from "../../pages/Students/studentData";
import "./StudentActionModal.css";
export type StudentAction = { type: "approved" | "rejected" | "deactivate" | "reactivate"; student: Student };
function StudentActionModal({ action, loading = false, onClose, onConfirm }: { action: StudentAction; loading?: boolean; onClose: () => void; onConfirm: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const confirmation = action.type === "deactivate" || action.type === "reactivate";
  const warning = action.type === "deactivate";
  const rejected = action.type === "rejected";
  const title = { approved: "Aluno aprovado com sucesso!", rejected: "Aluno recusado com sucesso!", deactivate: "Desativar aluno?", reactivate: "Reativar aluno?" }[action.type];
  useEffect(() => {
    const dialog = ref.current;
    const focus = document.activeElement;
    const overflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => { dialog?.close(); document.body.style.overflow = overflow; if (focus instanceof HTMLElement && focus.isConnected) focus.focus(); };
  }, []);
  return <dialog ref={ref} className={`student-action-modal ${warning ? "student-action-modal--warning" : rejected ? "student-action-modal--rejected" : "student-action-modal--success"}`} aria-labelledby="student-action-title" aria-describedby="student-action-description" onCancel={(event) => { event.preventDefault(); if (!loading) onClose(); }}>
    <div className="student-action-modal__icon" aria-hidden="true">{rejected ? "×" : warning ? "⚠" : action.type === "reactivate" ? "↻" : "✓"}</div>
    <h2 id="student-action-title">{title}</h2>
    <p id="student-action-description">
      {action.type === "approved" && `${action.student.name} foi adicionado à sua lista de alunos.`}
      {action.type === "rejected" && `A solicitação de ${action.student.name} foi recusada.`}
      {warning && <>{action.student.name} perderá o acesso à plataforma. O histórico de treinos será preservado.<br />Esta ação pode ser desfeita a qualquer momento.</>}
      {action.type === "reactivate" && `${action.student.name} voltará a ter acesso à plataforma e poderá receber treinos.`}
    </p>
    <div className="student-action-modal__actions">
      {confirmation ? <><button type="button" autoFocus disabled={loading} onClick={onClose}>Cancelar</button><button type="button" className="student-action-modal__confirm" disabled={loading} aria-busy={loading} onClick={onConfirm}>{loading ? "Aguarde..." : warning ? "Desativar aluno" : "Reativar aluno"}</button></> : <button type="button" autoFocus className="student-action-modal__ok" onClick={onClose}>OK</button>}
    </div>
  </dialog>;
}
export default StudentActionModal;
