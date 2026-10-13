import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import "./Button.css";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  icon?: ReactNode;
  loading?: boolean;
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { children, className = "", type = "button", variant = "primary", icon, loading = false, disabled, ...props }, ref,
) {
  return <button {...props} ref={ref} type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={`button button--${variant} ${className}`.trim()}>
    {loading ? <span className="button__spinner" aria-hidden="true" /> : icon && <span className="button__icon" aria-hidden="true">{icon}</span>}
    {children}
  </button>;
});
export default Button;
