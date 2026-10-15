import { Link } from "react-router-dom";
import { KeyRound } from "lucide-react";
import AuthLayout from "../../components/AuthLayout/AuthLayout";
import FormField from "../../components/FormField/FormField";
import Button from "../../components/Button/Button";
import "./PasswordRecovery.css";

export default function PasswordRecovery() {
  return <AuthLayout variant="login">
    <section className="auth-form password-recovery" aria-labelledby="recovery-title">
      <span className="password-recovery__icon"><KeyRound size={28} aria-hidden="true" /></span>
      <div className="auth-form__heading"><h1 id="recovery-title">Esqueceu sua senha?</h1><p>Recupere o acesso à sua conta Gymnasion.</p></div>
      <p className="auth-form__notice" id="recovery-availability" role="status">A recuperação de senha ainda não está disponível. O envio do link será habilitado assim que o serviço estiver disponível.</p>
      <FormField id="recovery-email" label="E-mail da sua conta" type="email" placeholder="seu@email.com" autoComplete="email" disabled aria-describedby="recovery-availability" />
      <Button className="auth-form__submit" disabled aria-describedby="recovery-availability">Enviar link de recuperação</Button>
      <p className="auth-form__switch"><Link className="auth-form__link" to="/login">Voltar para o login</Link></p>
    </section>
  </AuthLayout>;
}
