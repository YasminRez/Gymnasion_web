import { useState, type ChangeEvent, type FormEvent } from "react";
import Navbar from "../../components/Navbar/Navbar";
import Button from "../../components/Button/Button";
import FormField from "../../components/FormField/FormField";
import "../SignUp/SignUp.css";
import "./SignIn.css";

type Credentials = { email: string; password: string };

function SignIn() {
  const [values, setValues] = useState<Credentials>({ email: "", password: "" });
  const [touched, setTouched] = useState<Partial<Record<keyof Credentials, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [notice, setNotice] = useState("");
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setNotice("");
    const firstInvalidField = Object.keys(errors)[0];
    if (firstInvalidField) {
      const field = event.currentTarget.elements.namedItem(firstInvalidField);
      if (field instanceof HTMLElement) field.focus();
      return;
    }
    // Substituir pelo envio das credenciais à API quando a autenticação estiver disponível.
    setNotice("O login ainda não está disponível. Tente novamente mais tarde.");
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
              <p className="signin__register">Ainda não tem uma conta? <a href="/cadastro">Cadastre-se</a></p>
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
            <Button type="submit" className="signup__submit">Entrar</Button>
          </form>
        </section>
      </main>
    </>
  );
}

export default SignIn;