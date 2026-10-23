export interface UsuarioPerfilResponse {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  celular: string;
  role: "PERSONAL_TRAINER" | "ALUNO" | "ADMIN";
  modalidadePrincipal?: string | null;
  modalidadePrincipalId?: number | null;
  modalidadesAluno?: string[];
  dataCriacao?: string;
}

export interface AtualizarUsuarioRequest {
  nome: string;
  celular: string;
}

export interface PreferenciaUsuarioResponse {
  showNotificationBadge: boolean;
  notificacoesEmail: boolean;
  notificacoesPush: boolean;
}

export interface PreferenciaUsuarioRequest {
  showNotificationBadge?: boolean;
  notificacoesEmail?: boolean;
  notificacoesPush?: boolean;
}

export interface AlterarSenhaRequest {
  senhaAtual: string;
  novaSenha: string;
  confirmacaoNovaSenha: string;
}

export interface MensagemResponse {
  mensagem: string;
}
