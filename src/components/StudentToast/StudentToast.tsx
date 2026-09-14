import { useEffect } from "react";
import "./StudentToast.css";
function StudentToast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => { const timer = window.setTimeout(onClose, 5000); return () => window.clearTimeout(timer); }, [message, onClose]);
  return <div className="student-toast" role="status"><span aria-hidden="true">✓</span><p>{message}</p><button type="button" aria-label="Fechar notificação" onClick={onClose}>×</button></div>;
}
export default StudentToast;
