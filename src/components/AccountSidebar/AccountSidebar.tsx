import "./AccountSidebar.css";
function AccountSidebar() {
  return <aside className="account-sidebar" aria-label="Área da conta">
    <div className="account-sidebar__stripe" />
    <div className="account-sidebar__avatar" role="img" aria-label="Avatar padrão do personal">
      <svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="50" fill="#accded" /><path d="M12 100V87c0-23 76-23 76 0v13" fill="#efad34" /><path d="M37 62h26v21c-5 10-21 10-26 0" fill="#ad7048" /><ellipse cx="50" cy="43" rx="24" ry="30" fill="#b9784c" /><path d="M26 40c-8-28 15-34 30-29 16 1 24 14 19 28L60 24 31 31z" fill="#253348" /><rect x="23" y="27" width="57" height="25" rx="10" fill="#f1f1e8" /><rect x="38" y="29" width="39" height="21" rx="8" fill="#66ac65" /><path d="M49 60h15q-7 12-15 0" fill="white" /></svg>
    </div>
    <nav className="account-sidebar__links" aria-label="Opções da conta">
      <button type="button" disabled title="Em breve">Conta</button>
      <button type="button" disabled title="Em breve">Configurações</button>
      <button type="button" disabled title="Em breve">Ajuda</button>
    </nav>
    <button className="account-sidebar__share" type="button" disabled title="Em breve">Compartilhar</button>
  </aside>;
}
export default AccountSidebar;
