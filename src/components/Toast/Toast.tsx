import "./Toast.css";
export type ToastProps = { tone?: "success" | "error" | "info"; title: string; message?: string; iconSrc?: string; onClose?: () => void };
const icons = { success: "imgIconCheckc", error: "imgIconAlert", info: "imgIconInfo" };
export default function Toast({ tone = "success", title, message, iconSrc, onClose }: ToastProps) {
  return <div className={`ds-toast ds-toast--${tone}`} role={tone === "error" ? "alert" : "status"} aria-atomic="true">
    <span className="ds-toast__icon"><img src={iconSrc || `/design-system/${icons[tone]}.svg`} alt="" /></span>
    <div className="ds-toast__text"><p>{title}</p>{message && <p>{message}</p>}</div>
    {onClose && <button type="button" className="ds-toast__close" aria-label={`Fechar notificação: ${title}`} onClick={onClose}><img src="/design-system/imgIconX.svg" alt="" /></button>}
  </div>;
}
