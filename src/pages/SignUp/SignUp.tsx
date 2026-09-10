import { useState, type FormEvent } from "react";
import Navbar from "../../components/Navbar/Navbar";
import Button from "../../components/Button/Button";
import FormField from "../../components/FormField/FormField";
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
  const [cpf, setCpf] = useState("");
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Integrar o cadastro após implementar a validação e o captcha.
  }

  return (
    <>
      <Navbar />
      <main className="signup">
      <section className="signup__content" aria-labelledby="signup-title">
        <h1 id="signup-title" className="signup__title">
          Cadastre-se <span>Agora</span>
        </h1>

        <form className="signup__form" onSubmit={handleSubmit}>
          <div className="signup__fields">
            <FormField id="signup-name" name="name" label="Nome (completo)" autoComplete="name" required />
            <FormField id="signup-email" name="email" label="Email" type="email" autoComplete="email" required />
            <FormField id="signup-password" name="password" label="Senha" type="password" autoComplete="new-password" required />
            <FormField id="signup-confirm-password" name="confirmPassword" label="Confirme a senha" type="password" autoComplete="new-password" required />
            <FormField
              id="signup-cpf"
              name="cpf"
              label="CPF"
              type="text"
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={(event) => setCpf(formatCpf(event.target.value))}
              pattern="[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2}"
              title="Informe os 11 números do CPF no formato 000.000.000-00"
              required
            />
            <FormField id="signup-modality" name="modality" label="Modalidade principal" options={modalities} defaultValue="" required />
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

          <Button type="submit" className="signup__submit">Cadastrar</Button>
        </form>
      </section>
      </main>
    </>
  );
}

export default SignUp;
