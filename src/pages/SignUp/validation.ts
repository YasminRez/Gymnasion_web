export type SignUpValues = {
  name: string; email: string; password: string; confirmPassword: string;
  cpf: string; phone: string; modality: string;
};
export type SignUpErrors = Partial<Record<keyof SignUpValues, string>>;

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;
  const prefix = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}`;
  return digits.length > 7 ? `${prefix}-${digits.slice(7)}` : prefix;
}

export const passwordRules = [
  { label: "Mín. 8 caracteres", test: (value: string) => value.length >= 8 },
  { label: "1 letra maiúscula", test: (value: string) => /[A-Z]/.test(value) },
  { label: "1 letra minúscula", test: (value: string) => /[a-z]/.test(value) },
  { label: "1 número", test: (value: string) => /[0-9]/.test(value) },
  { label: "1 caractere especial", test: (value: string) => /[^A-Za-z0-9\s]/.test(value) },
];
export function validateSignUp(values: SignUpValues): SignUpErrors {
  const errors: SignUpErrors = {};
  if (!values.name.trim()) errors.name = "Preencha o nome completo.";
  else if (values.name.trim().length > 150) errors.name = "Use até 150 caracteres.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = "Insira um e-mail válido.";
  else if (values.email.trim().length > 100) errors.email = "Use até 100 caracteres.";
  if (!values.password) errors.password = "Preencha a senha.";
  else if (!passwordRules.every(rule => rule.test(values.password))) errors.password = "Atenda aos requisitos de senha abaixo.";
  else if (values.password.length > 255) errors.password = "Use até 255 caracteres.";
  if (!values.confirmPassword) errors.confirmPassword = "Confirme a senha.";
  else if (values.confirmPassword !== values.password) errors.confirmPassword = "As senhas não coincidem.";
  if (values.cpf.replace(/\D/g, "").length !== 11) errors.cpf = "Preencha os 11 números do CPF.";
  if (!/^[1-9]{2}9\d{8}$/.test(values.phone.replace(/\D/g, ""))) errors.phone = "Informe um celular com DDD e 9 dígitos, começando por 9: (11) 99999-9999.";
  if (!values.modality || !Number.isSafeInteger(Number(values.modality)) || Number(values.modality) <= 0) errors.modality = "Selecione a modalidade principal.";
  return errors;
}
