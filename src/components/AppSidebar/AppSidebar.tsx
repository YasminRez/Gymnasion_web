import { useAccountSettings } from "../../features/settings/useAccountSettings";
import { NavLink } from "react-router-dom";
import type { ReactNode } from "react";
import Avatar from "../Avatar/Avatar";
import Logo from "../Logo/Logo";
import UnavailableAction from "../UnavailableAction/UnavailableAction";
import "./AppSidebar.css";

export type SidebarItem = { id: string; label: string; icon: string; to?: string; onClick?: () => void; count?: number };
type Props = {
  role?: "personal" | "student";
  user: { name: string; subtitle: string; avatar?: string; initials?: string };
  menu: SidebarItem[];
  general: SidebarItem[];
  activeId?: string;
  footer?: ReactNode;
  onLogout: () => void;
  onCloseMobile?: () => void;
};
export default function AppSidebar({ role = "personal", user, menu, general, activeId, footer, onLogout, onCloseMobile }: Props) {
  const { settings } = useAccountSettings();
  const renderItem = (item: SidebarItem) => {
    const content = <><img src={`/design-system/${item.icon}.svg`} alt="" /><span>{item.label}</span>{item.count !== undefined && item.count > 0 && <span className="ds-sidebar__count">{item.count}</span>}</>;
    return item.to
      ? <NavLink key={item.id} to={item.to} end={item.to === "/" || item.to === "/home" || item.to === "/conta"} className={({ isActive }) => `ds-sidebar__item ${isActive ? "ds-sidebar__item--active" : ""}`}>{content}</NavLink>
      : !item.onClick ? <UnavailableAction key={item.id} variant="ghost" className="ds-sidebar__item" reason="Esta funcionalidade ainda não está disponível nesta versão.">{content}</UnavailableAction>
      : <button key={item.id} type="button" onClick={() => { item.onClick?.(); onCloseMobile?.(); }} aria-current={activeId === item.id ? "page" : undefined} className={`ds-sidebar__item ${activeId === item.id ? "ds-sidebar__item--active" : ""}`}>{content}</button>;
  };
  return <aside className="ds-sidebar" aria-label={role === "student" ? "Área do aluno" : "Área do personal"}>
    <div className="ds-sidebar__brand">
      <Logo />
      {onCloseMobile && (
        <button
          type="button"
          className="ds-sidebar__close-mobile"
          aria-label="Fechar menu de navegação"
          onClick={onCloseMobile}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
    {role === "student" && <span className="ds-sidebar__role">Área do aluno</span>}
    <nav aria-label="Menu principal"><h2 className="ds-sidebar__section">Menu</h2>{menu.map(renderItem)}</nav>
    <nav aria-label="Geral"><h2 className="ds-sidebar__section">Geral</h2>{general.map(renderItem)}</nav>
    <div className="ds-sidebar__spacer" />
    {footer}
    <div className="ds-sidebar__user">
      <Avatar name={user.name} initials={user.initials} src={settings.photo || user.avatar} tone={role === "student" ? "info" : "primary"} />
      <div><strong>{user.name}</strong><span>{user.subtitle}</span></div>
      <button type="button" onClick={onLogout} aria-label="Sair da conta"><img src="/design-system/imgIconLogout.svg" alt="" /></button>
    </div>
  </aside>;
}
