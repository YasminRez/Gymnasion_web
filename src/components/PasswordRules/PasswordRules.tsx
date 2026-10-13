import { passwordRules } from "../../pages/SignUp/validation";
import "./PasswordRules.css";

export default function PasswordRules({ password }: { password: string }) {
  return <ul className="password-rules" aria-label="Requisitos da senha">{passwordRules.map(rule => {
    const met = rule.test(password);
    return <li key={rule.label} className={met ? "password-rules__met" : ""}><img src={`/auth/${met ? "check" : "unmet"}.svg`} alt={met ? "Atendido:" : "Pendente:"} />{rule.label}</li>;
  })}</ul>;
}
