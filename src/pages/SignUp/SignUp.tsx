import { useState, type FormEvent } from "react";
import Navbar from "../../components/Navbar/Navbar";
import Button from "../../components/Button/Button";
import FormField from "../../components/FormField/FormField";
import { validateSignUp, type SignUpValues } from "./validation";
import "./SignUp.css";

const modalities = [
  { value: "musculacao", label: "Musculação" },
  { value: "natacao", label: "Natação" },
  { value: "tenis", label: "Tênis" },
  { value: "outra", label: "Outra" },
];

function formatCpf(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3}\.\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3}\.\d{3}\.\d{3})(\d)/, "$1-$2");
}

function SignUp() {
  const [values, setValues] = useState<SignUpValues>({
    name: "", email: "", password: "", confirmPassword: "", cpf: "", modality: "",
  });
  const [touched, setTouched] = useState<Partial<Record<keyof SignUpValues, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const errors = validateSignUp(values);

  function fieldProps(name: keyof SignUpValues) {
    return {
      value: values[name],
      "aria-invalid": touched[name] || submitted ? Boolean(errors[name]) : undefined,
      error: touched[name] || submitted ? errors[name] : undefined,
      onBlur: () => setTouched((previous) => ({ ...previous, [name]: true })),
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const value = name === "cpf" ? formatCpf(event.target.value) : event.target.value;
        setValues((previous) => ({ ...previous, [name]: value }));
      },
    };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    const firstInvalidField = Object.keys(errors)[0];
    if (firstInvalidField) {
      const field = event.currentTarget.elements.namedItem(firstInvalidField);
      if (field instanceof HTMLElement) field.focus();
      return;
    }
    // Integrar o cadastro após implementar o captcha.
  }

  return (
    <>
      <div className="signup__navigation"><Navbar /></div>
      <main className="signup">
      <section className="signup__content" aria-labelledby="signup-title">
        <h1 id="signup-title" className="signup__title">
          <span className="signup__desktop-title">Cadastre-se <span>Agora</span></span>
          <span className="signup__mobile-title">Criar Conta</span>
        </h1>
        <p className="signup__subtitle">Preencha seus dados para continuar</p>

        <form className="signup__form" onSubmit={handleSubmit} noValidate>
          <div className="signup__fields">
            <FormField id="signup-name" name="name" {...fieldProps("name")} placeholder="Ex: Maria Oliveira" label="Nome (completo)" autoComplete="name" required />
            <FormField id="signup-email" name="email" {...fieldProps("email")} placeholder="exemplo@email.com" label="Email" type="email" autoComplete="email" required />
            <FormField id="signup-password" name="password" {...fieldProps("password")} placeholder="Mínimo 8 caracteres" label="Senha" type="password" autoComplete="new-password" required />
            <FormField id="signup-confirm-password" name="confirmPassword" {...fieldProps("confirmPassword")} placeholder="Repita a senha" label="Confirme a senha" type="password" autoComplete="new-password" required />
            <FormField
              id="signup-cpf"
              name="cpf" {...fieldProps("cpf")}
              label="CPF"
              type="text"
              inputMode="numeric"
              placeholder="000.000.000-00"
              pattern="[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2}"
              title="Informe os 11 números do CPF no formato 000.000.000-00"
              required
            />
            <FormField id="signup-modality" name="modality" {...fieldProps("modality")} label="Modalidade principal" options={modalities} required />
          </div>

          <div className="signup__aside">
            <div className="signup__image">
              <p className="signup__message">
                Torne-se <span>um parceiro<br />agora do</span> Gymnasion
              </p>
            </div>
            {/* Substituir este espaço pelo widget de captcha na integração. */}
            <div className="signup__captcha" aria-label="Espaço reservado para o captcha">
              <span className="signup__captcha-box" aria-hidden="true" />
              <div>
                <span>Não sou um robô</span>
                <small>Captcha em breve</small>
              </div>
            </div>
          </div>

          {submitted && Object.keys(errors).length > 0 && (
            <p className="signup__error-summary" role="alert">
              Confira os campos destacados antes de continuar.
            </p>
          )}
          <Button type="submit" className="signup__submit">Cadastrar</Button>
        </form>
      </section>
      </main>
    </>
  );
}

export default SignUp;
