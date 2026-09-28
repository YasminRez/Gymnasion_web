import { useState } from "react";
import NotificationItem from "../NotificationItem/NotificationItem";
import type { Notification } from "./notificationData";
import "./Notifications.css";
type Filter = "all" | "unread" | "students" | "system";
function Notifications({ notifications, onRead }: { notifications: Notification[]; onRead: (id: number) => void }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [notice, setNotice] = useState("");
  const visible = notifications.filter((item) => filter === "all" || (filter === "unread" ? item.unread : item.category === filter));
  return <section className="notifications" aria-labelledby="notifications-greeting">
    <h1 id="notifications-greeting">Olá, @personal</h1>
    <section className="notifications__panel" aria-labelledby="notifications-title">
      <h2 id="notifications-title">Notificações</h2>
      <div className="notifications__filters" role="group" aria-label="Filtrar notificações">
        {([["all", "Todas"], ["unread", "Não lidas"], ["students", "Alunos"], ["system", "Sistema"]] as const).map(([value, label]) => <button type="button" key={value} aria-pressed={filter === value} onClick={() => { setFilter(value); setNotice(""); }}>{label}</button>)}
      </div>
      <ul className="notifications__list">{visible.map((item) => <NotificationItem key={item.id} notification={item} onRead={(id) => { onRead(id); if (item.unread) setNotice("Notificação marcada como lida."); }} />)}</ul>
      {visible.length === 0 && <p className="notifications__empty">{filter === "unread" ? "Você está em dia! Nenhuma notificação não lida." : "Nenhuma notificação encontrada."}</p>}
      <p className="notifications__announcement" role="status">{notice}</p>
    </section>
    <p className="notifications__demo">Notificações demonstrativas · Clique em uma notificação para marcá-la como lida.</p>
  </section>;
}
export default Notifications;
