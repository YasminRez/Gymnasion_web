import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Clock3, Link2, ShieldCheck } from "lucide-react";
import AuthLayout from "../../components/AuthLayout/AuthLayout";
import Button from "../../components/Button/Button";
import Checkbox from "../../components/Checkbox/Checkbox";
import FormField from "../../components/FormField/FormField";
import PasswordRules from "../../components/PasswordRules/PasswordRules";
import TermsModal from "../../components/TermsModal/TermsModal";
import { formatPhone, validateStudentSignUp, type SignUpValues, type SignUpErrors } from "../SignUp/validation";
import { authService } from "../../services/authService";
import { authError } from "../../utils/authError";
import "./SingUpStudent.css";

type Values = Omit<SignUpValues, "modality">;
const initialValues: Values = { name: "", email: "", phone: "", cpf: "", password: "", confirmPassword: "" };

export default function SignUpStudent() {
  const [params] = useSearchParams();
  const token = params.get("token")?.trim();
  const [values, setValues] = useState<Values>(initialValues);
  const [touched, setTouched] = useState<Partial<Record<keyof Values, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [notice, setNotice] = useState("");
  const [serverErrors, setServerErrors] = useState<SignUpErrors>({});
  const errors = validateStudentSignUp(values);

  function fieldProps(name: keyof Values) {
    return {
      name, value: values[name], disabled: busy,
      error: serverErrors[name] || (submitted || touched[name] ? errors[name] : undefined),
      onBlur: () => setTouched(previous => ({ ...previous, [name]: true })),
      onChange: (event: ChangeEvent<HTMLInputElement>) => {
        let value = event.target.value;
        if (name === "phone") value = formatPhone(value);
        if (name === "cpf") value = value.replace(/\D/g, "").slice(0, 11).replace(/^(\d{3})(\d)/, "$1.$2").replace(/^(\d{3}\.\d{3})(\d)/, "$1.$2").replace(/^(\d{3}\.\d{3}\.\d{3})(\d)/, "$1-$2");
        setValues(previous => ({ ...previous, [name]: value }));
        setServerErrors(previous => ({ ...previous, [name]: undefined }));
        setNotice("");
      },
    };
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !token) return;
    setSubmitted(true);
    setNotice("");
    const firstInvalid = Object.keys(errors)[0];
    if (firstInvalid || !accepted) {
      if (!firstInvalid && !accepted) {
        setNotice("É obrigatório aceitar os Termos de Uso e Política de Privacidade para criar sua conta");
      }
      const field = event.currentTarget.elements.namedItem(firstInvalid || "terms");
      if (field instanceof HTMLElement) field.focus();
      return;
    }
    setBusy(true);
    setServerErrors({});
    try {
      await authService.registroAlunoConvite(token, {
        nome: values.name.trim(), email: values.email.trim().toLowerCase(),
        password: values.password, cpf: values.cpf.replace(/\D/g, ""), celular: values.phone.replace(/\D/g, ""),
        aceitouTermos: true,
      });
      setSuccess(true);
      setValues(initialValues);
    } catch (error) {
      const result = authError(error, "Não foi possível cadastrar. Se o convite expirou, peça um novo link ao seu personal.");
      setNotice(result.message);
      setServerErrors(result.fields);
    } finally { setBusy(false); }
  }

  return <AuthLayout variant="student">
    {!token ? <section className="auth-form student-signup student-signup__state" aria-labelledby="invite-title">
      <span className="student-signup__icon"><Link2 aria-hidden="true" /></span>
      <div className="auth-form__heading"><h1 id="invite-title">Você precisa de um convite</h1><p>Para criar sua conta de aluno, abra o link enviado pelo seu personal. Se ele não funcionar, solicite um novo convite.</p></div>
      <Link className="auth-form__link" to="/">Voltar ao site</Link>
    </section> : success ? <section className="auth-form student-signup student-signup__state" aria-labelledby="student-success" role="status">
      <span className="student-signup__icon"><Clock3 aria-hidden="true" /></span>
      <div className="auth-form__heading"><h1 id="student-success">Cadastro enviado!</h1><p>Sua conta está aguardando aprovação do personal.</p></div>
      <p className="auth-form__notice">Seu personal recebeu a solicitação. Aguarde a aprovação para começar a acompanhar seus treinos.</p>
      <Link className="auth-form__link" to="/">Voltar ao site</Link>
    </section> : <form className="auth-form student-signup" onSubmit={submit} noValidate aria-labelledby="student-title">
      <div className="auth-form__heading"><h1 id="student-title">Complete seu cadastro</h1><p>Preencha seus dados para se vincular ao seu personal. Seus dados não precisam ser enviados por terceiros.</p></div>
      <div className="student-signup__invite"><ShieldCheck size={24} aria-hidden="true" /><div><strong>Cadastro por convite</strong><p>Sua solicitação será enviada ao personal responsável pelo link.</p></div></div>
      {notice && <p className="auth-form__error" role="alert">{notice}</p>}
      <div className="student-signup__grid">
        <FormField id="student-name" {...fieldProps("name")} label="Nome completo" placeholder="Seu nome completo" autoComplete="name" maxLength={150} required />
        <FormField id="student-email" {...fieldProps("email")} label="E-mail" type="email" placeholder="seu@email.com" autoComplete="email" maxLength={100} required />
        <FormField id="student-cpf" {...fieldProps("cpf")} label="CPF" inputMode="numeric" placeholder="000.000.000-00" maxLength={14} required />
        <FormField id="student-phone" {...fieldProps("phone")} label="Contato (celular)" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="(00) 00000-0000" maxLength={15} required />
        <FormField id="student-password" {...fieldProps("password")} label="Senha" type="password" autoComplete="new-password" placeholder="Crie sua senha" maxLength={255} required />
        <FormField id="student-confirm" {...fieldProps("confirmPassword")} label="Confirmar senha" type="password" autoComplete="new-password" placeholder="Repita sua senha" maxLength={255} required />
      </div>
      <PasswordRules password={values.password} />
      <div className="student-signup__terms"><Checkbox name="terms" label="Li e aceito os" checked={accepted} disabled={busy} onChange={event => setAccepted(event.target.checked)} aria-invalid={submitted && !accepted || undefined} aria-describedby={submitted && !accepted ? "student-terms-error" : undefined} /><button type="button" className="auth-form__link" onClick={() => setTermsOpen(true)}>Termos de Uso e Política de Privacidade</button></div>
      {submitted && !accepted && <p className="auth-form__error" id="student-terms-error" role="alert">É obrigatório aceitar os Termos de Uso e Política de Privacidade para criar sua conta</p>}
      <Button type="submit" className="auth-form__submit" loading={busy}>{busy ? "Cadastrando..." : "Criar minha conta"}</Button>
    </form>}
    {termsOpen && <TermsModal onClose={() => setTermsOpen(false)} onAccept={() => { setAccepted(true); setTermsOpen(false); }} />}
  </AuthLayout>;
}
