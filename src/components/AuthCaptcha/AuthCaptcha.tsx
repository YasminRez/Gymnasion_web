import Checkbox from "../Checkbox/Checkbox";
import "./AuthCaptcha.css";

// The current authentication API has no CAPTCHA verification contract.
export default function AuthCaptcha() {
  return <div className="auth-captcha">
    <div><Checkbox label="Não sou um robô" disabled checked={false} readOnly /><small>Verificação indisponível nesta versão.</small></div>
    <span><img src="/auth/refresh.svg" alt="" /><small>reCAPTCHA</small></span>
  </div>;
}
