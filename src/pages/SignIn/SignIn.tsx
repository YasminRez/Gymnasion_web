import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import AuthLayout from "../../components/AuthLayout/AuthLayout";
import AuthCaptcha from "../../components/AuthCaptcha/AuthCaptcha";
import Button from "../../components/Button/Button";
import FormField from "../../components/FormField/FormField";
import Checkbox from "../../components/Checkbox/Checkbox";
import Toast from "../../components/Toast/Toast";
import { authService } from "../../services/authService";
import { PRIVATE_HOME } from "../../services/session";
import { authError } from "../../utils/authError";
import "./SignIn.css";

type Credentials = { email: string; password: string };

export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state as { from?: string; registered?: boolean; email?: string } | null;
  const [values, setValues] = useState<Credentials>({ email: routeState?.email || "", password: "" });
  const [touched, setTouched] = useState<Partial<Record<keyof Credentials, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const errors: Partial<Record<keyof Credentials, string>> = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = "Insira um e-mail válido.";
  if (!values.password) errors.password = "Preencha a senha.";

  function fieldProps(name: keyof Credentials) {
    return {
      value: values[name],
      error: touched[name] || submitted ? errors[name] : undefined,
      onBlur: () => setTouched(previous => ({ ...previous, [name]: true })),
      onChange: (event: ChangeEvent<HTMLInputElement>) => {
        setValues(previous => ({ ...previous, [name]: event.target.value }));
        setError("");
      },
      disabled: isSubmitting,
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setSubmitted(true);
    setError("");
    const firstInvalid = Object.keys(errors)[0];
    if (firstInvalid) {
      const field = event.currentTarget.elements.namedItem(firstInvalid);
      if (field instanceof HTMLElement) field.focus();
      return;
    }
    setIsSubmitting(true);
    try {
      const { role } = await authService.login({ email: values.email.trim().toLowerCase(), password: values.password }, remember);
      if (role !== "PERSONAL_TRAINER") {
        authService.logout();
        setError("O acesso pela web é exclusivo para personal trainers.");
        return;
      }
      const from = routeState?.from;
      navigate(from && from.startsWith("/") && !from.startsWith("//") ? from : PRIVATE_HOME, { replace: true });
    } catch (err) {
      setError(authError(err, "E-mail ou senha inválidos.").message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return <AuthLayout variant="login">
    {error && <div className="auth-form__toast"><Toast tone="error" title={error} message="Verifique os dados e tente novamente." onClose={() => setError("")} /></div>}
    <form className="auth-form signin-form" onSubmit={handleSubmit} noValidate aria-labelledby="signin-title">
      <div className="auth-form__heading"><h1 id="signin-title">Bem-vindo de volta</h1><p>Acesse sua conta para gerenciar alunos, turmas e treinos.</p></div>
      {routeState?.registered && <p className="auth-form__notice" role="status">Cadastro realizado com sucesso! Entre para continuar.</p>}
      <FormField id="signin-email" name="email" {...fieldProps("email")} label="E-mail" type="email" autoComplete="username" placeholder="seu@email.com" required />
      <FormField id="signin-password" name="password" {...fieldProps("password")} label="Senha" type="password" autoComplete="current-password" placeholder="Digite sua senha" required />
      <div className="signin-form__options"><Checkbox label="Lembrar de mim" checked={remember} onChange={event => setRemember(event.target.checked)} disabled={isSubmitting} /><Link className="auth-form__link" to="/recuperar-senha">Esqueci minha senha</Link></div>
      <AuthCaptcha />
      <Button type="submit" className="auth-form__submit" loading={isSubmitting}>{isSubmitting ? "Entrando..." : "Entrar"}</Button>
      <div className="signin-form__divider"><span>ou</span></div>
      <p className="auth-form__switch">Ainda não tem conta? <Link className="auth-form__link" to="/cadastro">Cadastre-se grátis</Link></p>
    </form>
  </AuthLayout>;
}
