import { useEffect, useRef, type ReactNode } from "react";
import "./MetricDialog.css";
function MetricDialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => { dialog?.close(); document.body.style.overflow = overflow; if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus(); };
  }, []);

  const handleBackdropClick = (event: React.MouseEvent<HTMLDialogElement>) => {
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

  return <dialog ref={ref} className="metric-dialog" aria-labelledby="metric-dialog-title" closedby="any" onClick={handleBackdropClick} onCancel={(event) => { event.preventDefault(); onClose(); }}>
    <header><h2 id="metric-dialog-title">{title}</h2><button type="button" aria-label="Fechar modal" onClick={onClose}>×</button></header>{children}
  </dialog>;
}
export default MetricDialog;
