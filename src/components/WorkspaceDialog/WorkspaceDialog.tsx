import { useEffect, useId, useRef, type ReactNode } from "react";
import "./WorkspaceDialog.css";

export default function WorkspaceDialog({ title, description, icon, tone = "primary", children, actions, onClose, busy = false, wide = false, className = "" }: { title: string; description?: string; icon?: string; tone?: "primary" | "danger" | "success"; children?: ReactNode; actions?: ReactNode; onClose: () => void; busy?: boolean; wide?: boolean; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => { dialog?.close(); document.body.style.overflow = overflow; if (previous instanceof HTMLElement && previous.isConnected) previous.focus(); };
  }, []);

  const handleBackdropClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (busy) return;
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

  return <dialog ref={ref} className={`workspace-dialog workspace-dialog--${tone}${wide ? " workspace-dialog--wide" : ""} ${className}`} aria-labelledby={id} closedby="any" onClick={handleBackdropClick} onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <header className="workspace-dialog__header">
      {icon && <span className="workspace-dialog__icon"><img src={icon} alt="" /></span>}
      <div><h2 id={id}>{title}</h2>{description && <p>{description}</p>}</div>
      <button type="button" aria-label="Fechar modal" disabled={busy} onClick={onClose}><img src="/auth/close.svg" alt="" /></button>
    </header>
    {children}
    {actions && <footer className="workspace-dialog__actions">{actions}</footer>}
  </dialog>;
}
