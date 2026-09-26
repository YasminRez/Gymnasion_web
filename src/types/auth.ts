export interface SignUpAlunoPayload {
  nome: string;
  email: string;
  password: string;
  cpf: string;
  celular: string;
}

export interface SignUpAlunoResponse {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  celular: string;
  role: string;
}

export interface SignUpPersonalPayload {
  nome: string;
  email: string;
  password: string;
  cpf: string;       
  celular: string;   
  modalidade: number; 
}

export interface SignUpPersonalResponse {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  celular: string;
  role: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  id: string;
  role: "ROLE_PERSONAL_TRAINER" | "ROLE_ALUNO";
}