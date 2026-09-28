import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "../../components/Navbar/Navbar";
import Button from "../../components/Button/Button";
import FormField from "../../components/FormField/FormField";
import { authService } from "../../services/authService";
import { handleApiError } from "../../utils/handleApiError";
import "../SignUp/SignUp.css";

function SignUpStudent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    cpf: "",
    phone: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redireciona se o link de convite não contiver um token válido
  useEffect(() => {
    if (!token) {
      toast.error("Link de convite inválido ou expirado.");
      navigate("/login");
    }
  }, [token, navigate]);

  function handleChange(field: keyof typeof values, value: string) {
    if (field === "cpf") value = value.replace(/\D/g, "").slice(0, 11);
    if (field === "phone") value = value.replace(/\D/g, "").slice(0, 11);
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      toast.error("Token de convite ausente.");
      return;
    }

    if (values.password !== values.confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    try {
      setIsSubmitting(true);

      await authService.registroAlunoConvite(token, {
        nome: values.name,
        email: values.email,
        password: values.password,
        cpf: values.cpf,
        celular: values.phone,
      });

      toast.success("Cadastro realizado com sucesso! Aguarde a aprovação do seu Personal Trainer.");
      navigate("/login");
    } catch (err) {
      handleApiError(err, "Falha ao realizar o cadastro pelo convite.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="signup__navigation"><Navbar /></div>
      <main className="signup">
        <section className="signup__content">
          <h1 className="signup__title">
            <span className="signup__desktop-title">Cadastro de <span>Aluno</span></span>
          </h1>
          <p className="signup__subtitle">Conclua seu cadastro para acessar seus treinos</p>

          <form className="signup__form" onSubmit={handleSubmit} noValidate>
            <div className="signup__fields">
              <FormField
                id="student-name"
                name="name"
                label="Nome completo"
                placeholder="Seu nome"
                value={values.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
              <FormField
                id="student-email"
                name="email"
                label="E-mail"
                type="email"
                placeholder="seu@email.com"
                value={values.email}
                onChange={(e) => handleChange("email", e.target.value)}
                required
              />
              <FormField
                id="student-password"
                name="password"
                label="Senha"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={values.password}
                onChange={(e) => handleChange("password", e.target.value)}
                required
              />
              <FormField
                id="student-confirmPassword"
                name="confirmPassword"
                label="Confirme a senha"
                type="password"
                placeholder="Repita a senha"
                value={values.confirmPassword}
                onChange={(e) => handleChange("confirmPassword", e.target.value)}
                required
              />
              <FormField
                id="student-cpf"
                name="cpf"
                label="CPF"
                placeholder="Apenas números"
                value={values.cpf}
                onChange={(e) => handleChange("cpf", e.target.value)}
                required
              />
              <FormField
                id="student-phone"
                name="phone"
                label="Celular"
                placeholder="DDD + Número"
                value={values.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="signup__submit" disabled={isSubmitting}>
              {isSubmitting ? "Cadastrando..." : "Concluir Cadastro"}
            </Button>

            <p className="signup__login-link">
              Já possui uma conta? <Link to="/login">Entrar</Link>
            </p>
          </form>
        </section>
      </main>
    </>
  );
}

export default SignUpStudent;