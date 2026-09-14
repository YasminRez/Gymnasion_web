export type SignUpValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  cpf: string;
  modality: string;
};

export type SignUpErrors = Partial<Record<keyof SignUpValues, string>>;

export function validateSignUp(values: SignUpValues): SignUpErrors {
  const errors: SignUpErrors = {};

  if (!values.name.trim()) errors.name = "Preencha o nome completo.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Insira um email válido.";
  }

  const password = values.password;
  if (!password) {
    errors.password = "Preencha a senha.";
  } else if (
    password.length < 8 ||
    !/[A-Z]/.test(password) ||
    !/[a-z]/.test(password) ||
    !/[0-9]/.test(password) ||
    !/[!@#$%¨&*]/.test(password)
  ) {
    errors.password = "A senha deve ter no mínimo 8 caracteres, uma letra maiúscula, uma minúscula, um número e um caractere especial (!@#$%¨&*).";
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Confirme a senha.";
  } else if (values.confirmPassword !== password) {
    errors.confirmPassword = "As senhas não coincidem.";
  }

  if (!/^[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2}$/.test(values.cpf)) {
    errors.cpf = "Preencha os 11 números do CPF.";
  }
  if (!values.modality) errors.modality = "Selecione a modalidade principal.";

  return errors;
}