import type { ButtonHTMLAttributes } from "react";
import "./Button.css";

function Button({ children, className = "", type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} type={type} className={`button ${className}`.trim()}>
      {children}
    </button>
  );
}

export default Button;
