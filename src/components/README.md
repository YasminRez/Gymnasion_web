# Componentes · Gymnasion v2

Referência: [Componentes no Figma](https://www.figma.com/design/Kw1G5FRZa0zVp2UBwC3kXK/Prototipo---Projeto-de-Software?node-id=396-45).

Abra `/design-system` no servidor de desenvolvimento para validar as variantes e interações. Essa rota não é registrada em produção. Os nomes e ações da galeria são exemplos locais, sem chamadas à API.

Cada componente mantém seu TSX e CSS na própria pasta e consome os tokens de `src/styles/tokens.css`.

| Componente | API principal |
| --- | --- |
| Button | `variant`: primary, secondary, ghost, danger; `icon`, `loading` e atributos nativos |
| FormField | `id`, `label`, `error`, `hint`; `options` para select; `type="password"` para mostrar/ocultar senha |
| Logo | `variant`: default, white, symbol |
| Avatar | `name`, `initials`, `src`, `tone`; fallback para iniciais quando a imagem falha |
| Badge | `tone`: success, warning, danger, neutral, info, primary; texto em children |
| SportTag | `sport`: natacao, tenis, academia, corrida, ciclismo, funcional |
| Checkbox | `label` e atributos nativos; aceita checked/onChange ou defaultChecked |
| Toast | `tone`: success, error, info; `title`, `message`, `onClose` |
| AppSidebar | `role`, `user`, `menu`, `general`, `footer`, `onLogout` |
| SidebarCallout | `variant="strava"` ou `variant="personal"`, com `onAction` |
| AppTopbar | título, subtítulo, usuário, `onSearch` e `onNotifications` |

Button e FormField evoluem os componentes existentes e preservam os atributos usados pelas telas. As páginas antigas ainda podem sobrescrever estilos; sua migração visual será feita por tela.

## Integração

AppSidebar aceita itens com `to` (NavLink com estado ativo automático) ou `onClick` (ação com `activeId`). Um item sem destino/ação fica desabilitado. Passe apenas rotas existentes. Dados de usuário, contagens e ações devem vir da página e dos serviços, nunca do componente.

AppTopbar envia a busca ao pressionar Enter; Ctrl/Command + K foca o campo. Toast é uma apresentação controlada: a página decide quando mostrar/remover ou conectar ao gerenciador de notificações.

Os SVGs oficiais foram baixados para `public/design-system`. Manter suas dimensões intrínsecas (logo 40px, navegação 20px, modalidades 14px) e não usar URLs temporárias do Figma. O mapa visual pode ser consultado nos componentes; os nomes dos arquivos correspondem às constantes exportadas pelo Figma.

## Validação desta etapa

- Build TypeScript/Vite e ESLint dos componentes.
- Conferência visual dos SVGs e dimensões no navegador.
- Checkbox controlado, seleção de modalidade, mostrar/ocultar senha.
- Botões de exemplo, navegação ativa, busca e fechamento de notificações.
