import { useEffect, useRef, useState } from "react";
import Avatar from "../Avatar/Avatar";
import "./AppTopbar.css";
type Props = { title: string; subtitle?: string; userName: string; userInitials?: string; avatar?: string; avatarTone?: "primary" | "info"; searchLabel?: string; notificationCount?: number; notificationDot?: boolean; onSearch: (query: string) => void; onNotifications: () => void };
export default function AppTopbar({ title, subtitle, userName, userInitials, avatar, avatarTone = "primary", searchLabel = "Buscar alunos e turmas", notificationCount, notificationDot, onSearch, onNotifications }: Props) {
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); searchRef.current?.focus(); }
    };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);
  return <header className="ds-topbar">
    <div className="ds-topbar__titles"><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>
    <div className="ds-topbar__actions">
      <form className="ds-topbar__search" role="search" onSubmit={event => { event.preventDefault(); onSearch(query.trim()); }}>
        <img src="/design-system/imgIconSearch.svg" alt="" />
        <input ref={searchRef} type="search" aria-label={searchLabel} placeholder={`${searchLabel}…`} value={query} onChange={event => setQuery(event.target.value)} />
        <kbd title="Control ou Command + K">⌘K</kbd>
      </form>
      <button type="button" className="ds-topbar__notifications" aria-label={notificationCount ? "Abrir notificações: "+notificationCount+" não lidas" : "Abrir notificações"} onClick={onNotifications}><img src="/design-system/imgBell.svg" alt="" />{notificationDot ? <span className="ds-topbar__notification-dot" /> : Boolean(notificationCount) && <span className="ds-topbar__notification-count">{notificationCount}</span>}</button>
      <Avatar name={userName} initials={userInitials} src={avatar} tone={avatarTone} />
    </div>
  </header>;
}
