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
  return <dialog ref={ref} className="metric-dialog" aria-labelledby="metric-dialog-title" onCancel={(event) => { event.preventDefault(); onClose(); }}>
    <header><h2 id="metric-dialog-title">{title}</h2><button type="button" aria-label="Fechar modal" onClick={onClose}>×</button></header>{children}
  </dialog>;
}
export default MetricDialog;
