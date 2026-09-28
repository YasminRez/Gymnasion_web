import { useEffect, useRef } from "react";
// Mesmo visual do modal de confirmação de alunos (variação de alerta).
import "../StudentActionModal/StudentActionModal.css";
type Props = { title: string; description: string; confirmLabel: string; loading?: boolean; onClose: () => void; onConfirm: () => void };
function GroupConfirmModal({ title, description, confirmLabel, loading = false, onClose, onConfirm }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const focus = document.activeElement;
    const overflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => { dialog?.close(); document.body.style.overflow = overflow; if (focus instanceof HTMLElement && focus.isConnected) focus.focus(); };
  }, []);
  return <dialog ref={ref} className="student-action-modal student-action-modal--warning" aria-labelledby="group-confirm-title" aria-describedby="group-confirm-description" onCancel={(event) => { event.preventDefault(); if (!loading) onClose(); }}>
    <div className="student-action-modal__icon" aria-hidden="true">⚠</div>
    <h2 id="group-confirm-title">{title}</h2>
    <p id="group-confirm-description">{description}</p>
    <div className="student-action-modal__actions">
      <button type="button" autoFocus disabled={loading} onClick={onClose}>Cancelar</button>
      <button type="button" className="student-action-modal__confirm" disabled={loading} aria-busy={loading} onClick={onConfirm}>{loading ? "Aguarde..." : confirmLabel}</button>
    </div>
  </dialog>;
}
export default GroupConfirmModal;
