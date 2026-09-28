import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "../../components/Navbar/Navbar";
import Button from "../../components/Button/Button";
import FormField from "../../components/FormField/FormField";
import { validateSignUp, type SignUpValues } from "./validation";
import { modalidadeService } from "../../services/modalidadeService";
import { authService } from "../../services/authService";
import { handleApiError } from "../../utils/handleApiError";
import "./SignUp.css";

function formatCpf(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3}\.\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3}\.\d{3}\.\d{3})(\d)/, "$1-$2");
}

function formatPhone(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function SignUp() {
  const navigate = useNavigate();

  const [values, setValues] = useState<SignUpValues & { phone: string }>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    cpf: "",
    phone: "",
    modality: "",
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  const [modalitiesOptions, setModalitiesOptions] = useState<{ value: string; label: string }[]>([]);
  const [loadingModalities, setLoadingModalities] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const errors = validateSignUp(values);

  useEffect(() => {
    async function fetchModalidades() {
      try {
        setLoadingModalities(true);
        const modalidades = await modalidadeService.listarTodas();
        const options = modalidades.map((m) => ({
          value: String(m.id),
          label: m.nome,
        }));

        setModalitiesOptions([
          { value: "", label: "Selecione uma modalidade" },
          ...options,
        ]);
      } catch (err) {
        handleApiError(err, "Erro ao carregar lista de modalidades.");
      } finally {
        setLoadingModalities(false);
      }
    }

    fetchModalidades();
  }, []);

  function fieldProps(name: keyof typeof values) {
    return {
      value: values[name],
      "aria-invalid": touched[name] || submitted ? Boolean(errors[name as keyof SignUpValues]) : undefined,
      error: touched[name] || submitted ? errors[name as keyof SignUpValues] : undefined,
      onBlur: () => setTouched((previous) => ({ ...previous, [name]: true })),
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        let value = event.target.value;
        if (name === "cpf") value = formatCpf(value);
        if (name === "phone") value = formatPhone(value);
        setValues((previous) => ({ ...previous, [name]: value }));
      },
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);

    const firstInvalidField = Object.keys(errors)[0];
    if (firstInvalidField) {
      toast.error("Preencha corretamente os campos destacados.");
      const field = event.currentTarget.elements.namedItem(firstInvalidField);
      if (field instanceof HTMLElement) field.focus();
      return;
    }

    try {
      setIsSubmitting(true);

      await authService.registroPersonal({
        nome: values.name,
        email: values.email,
        password: values.password,
        cpf: values.cpf.replace(/\D/g, ""),
        celular: values.phone.replace(/\D/g, ""),
        modalidade: Number(values.modality),
      });

      toast.success("Cadastro realizado com sucesso!");
      navigate("/login");
    } catch (err) {
      handleApiError(err, "Não foi possível realizar o cadastro.");
    } finally {
      setIsSubmitting(false);
    }
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
                name="cpf"
                {...fieldProps("cpf")}
                label="CPF"
                type="text"
                inputMode="numeric"
                placeholder="000.000.000-00"
                required
              />

              <FormField
                id="signup-phone"
                name="phone"
                {...fieldProps("phone")}
                label="Celular"
                type="text"
                inputMode="numeric"
                placeholder="(00) 00000-0000"
                required
              />

              <FormField
                id="signup-modality"
                name="modality"
                {...fieldProps("modality")}
                label="Modalidade principal"
                options={
                  loadingModalities
                    ? [{ value: "", label: "Carregando modalidades..." }]
                    : modalitiesOptions
                }
                disabled={loadingModalities}
                required
              />
            </div>

            <div className="signup__aside">
              <div className="signup__image">
                <p className="signup__message">
                  Torne-se <span>um parceiro<br />agora do</span> Gymnasion
                </p>
              </div>
              <div className="signup__captcha" aria-label="Espaço reservado para o captcha">
                <span className="signup__captcha-box" aria-hidden="true" />
                <div>
                  <span>Não sou um robô</span>
                  <small>Captcha em breve</small>
                </div>
              </div>
            </div>

            <Button type="submit" className="signup__submit" disabled={isSubmitting || loadingModalities}>
              {isSubmitting ? "Cadastrando..." : "Cadastrar"}
            </Button>

            <p className="signup__login-link">
              Já tem uma conta? <Link to="/login">Entrar</Link>
            </p>
          </form>
        </section>
      </main>
    </>
  );
}

export default SignUp;