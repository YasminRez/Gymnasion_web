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

  const handleBackdropClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (loading) return;
    const dialog = ref.current;
    if (!dialog || event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    const isInside =
      rect.top <= event.clientY &&
      event.clientY <= rect.top + rect.height &&
      rect.left <= event.clientX &&
      event.clientX <= rect.left + rect.width;
    if (!isInside) {
      onClose();
    }
  };

  return <dialog ref={ref} className="student-action-modal student-action-modal--warning" aria-labelledby="group-confirm-title" aria-describedby="group-confirm-description" closedby="any" onClick={handleBackdropClick} onCancel={(event) => { event.preventDefault(); if (!loading) onClose(); }}>
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
