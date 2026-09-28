import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "../../components/Navbar/Navbar";
import Button from "../../components/Button/Button";
import FormField from "../../components/FormField/FormField";
import { authService } from "../../services/authService";
import { PRIVATE_HOME } from "../../services/session";
import { handleApiError } from "../../utils/handleApiError";
import "../SignUp/SignUp.css";
import "./SignIn.css";

type Credentials = { email: string; password: string };

function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  // Página protegida que o usuário tentou abrir antes de ser mandado ao login
  const from = (location.state as { from?: string } | null)?.from;

  const [values, setValues] = useState<Credentials>({ email: "", password: "" });
  const [touched, setTouched] = useState<Partial<Record<keyof Credentials, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const errors: Partial<Record<keyof Credentials, string>> = {};

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Insira um email válido.";
  }
  if (!values.password) errors.password = "Preencha a senha.";

  function fieldProps(name: keyof Credentials) {
    return {
      value: values[name],
      "aria-invalid": touched[name] || submitted ? Boolean(errors[name]) : undefined,
      error: touched[name] || submitted ? errors[name] : undefined,
      onBlur: () => setTouched((previous) => ({ ...previous, [name]: true })),
      onChange: (event: ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setValues((previous) => ({ ...previous, [name]: value }));
        setNotice("");
      },
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setNotice("");

    const firstInvalidField = Object.keys(errors)[0];
    if (firstInvalidField) {
      const field = event.currentTarget.elements.namedItem(firstInvalidField);
      if (field instanceof HTMLElement) field.focus();
      return;
    }

    try {
      setIsSubmitting(true);

      const { role } = await authService.login({
        email: values.email.trim(),
        password: values.password,
      });

      // Por enquanto a área web só tem telas para o personal trainer
      if (role !== "PERSONAL_TRAINER") {
        authService.logout();
        toast.error("O acesso pela web é exclusivo para personal trainers.");
        return;
      }

      toast.success("Login realizado com sucesso!");
      navigate(from || PRIVATE_HOME, { replace: true });
    } catch (err) {
      handleApiError(err, "E-mail ou senha incorretos.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="signup__navigation"><Navbar /></div>
      <main className="signup signin">
        <section className="signup__content" aria-labelledby="signin-title">
          <h1 id="signin-title" className="signup__title">
            <span className="signup__desktop-title">Acesse sua <span>Conta</span></span>
            <span className="signup__mobile-title">Entrar na Conta</span>
          </h1>
          <p className="signup__subtitle">Informe seus dados para continuar</p>

          <form className="signup__form" onSubmit={handleSubmit} noValidate>
            <div className="signup__fields">
              <FormField id="signin-email" name="email" {...fieldProps("email")} label="Email" type="email" autoComplete="username" placeholder="exemplo@email.com" required />
              <FormField id="signin-password" name="password" {...fieldProps("password")} label="Senha" type="password" autoComplete="current-password" placeholder="Digite sua senha" required />
              <p className="signin__register">Ainda não tem uma conta? <Link to="/cadastro">Cadastre-se</Link></p>
            </div>

            <div className="signup__aside">
              <div className="signup__image">
                <p className="signup__message">Seu próximo <span>nível começa</span> aqui</p>
              </div>
              <div className="signup__captcha" aria-label="Espaço reservado para o captcha">
                <span className="signup__captcha-box" aria-hidden="true" />
                <div><span>Não sou um robô</span><small>Captcha em breve</small></div>
              </div>
            </div>

            {submitted && Object.keys(errors).length > 0 && (
              <p className="signup__error-summary" role="alert">Confira os campos destacados antes de continuar.</p>
            )}
            {notice && <p className="signin__notice" role="status">{notice}</p>}
            <Button type="submit" className="signup__submit" disabled={isSubmitting}>
              {isSubmitting ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </section>
      </main>
    </>
  );
}

export default SignIn;