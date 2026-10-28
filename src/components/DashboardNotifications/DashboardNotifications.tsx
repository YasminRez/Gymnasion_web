import { useMemo, useState } from "react";
import DashboardPanel from "../DashboardPanel/DashboardPanel";
import { usePersonal } from "../../features/personal/PersonalContext";
import {
  formatNotificationTime,
  getNotificationCategoryMeta,
  splitNotificationsByReadState,
} from "../../features/notifications/notificationModel";
import "./DashboardNotifications.css";

export default function DashboardNotifications() {
  const { notifications, notificationBusy, busyId, readNotification } = usePersonal();
  const [expanded, setExpanded] = useState(false);

  const { sorted, unreadCount } = useMemo(
    () => splitNotificationsByReadState(notifications.data),
    [notifications.data]
  );

  const visible = expanded ? sorted : sorted.slice(0, 3);

  return (
    <DashboardPanel
      title="Notificações"
      subtitle={
        unreadCount > 0
          ? `${unreadCount} ${unreadCount === 1 ? "não lida · Prioridade" : "não lidas · Prioridade"}`
          : "Tudo em dia · Nenhuma não lida"
      }
      id="notificacoes"
    >
      {notifications.loading ? (
        <p className="dashboard-panel__empty">Carregando notificações...</p>
      ) : notifications.error ? (
        <p role="alert" className="dashboard-panel__empty">
          {notifications.error}
        </p>
      ) : !sorted.length ? (
        <p className="dashboard-panel__empty">Nenhuma notificação por enquanto.</p>
      ) : (
        <>
          {visible.map((item) => {
            const meta = getNotificationCategoryMeta(item);
            const isUnread = !item.lida;
            return (
              <button
                key={item.id}
                disabled={notificationBusy || Boolean(busyId)}
                className={
                  "dashboard-v2__notification" + (item.lida ? " is-read" : " is-unread")
                }
                aria-label={
                  item.titulo + (item.lida ? " — lida" : " — marcar como lida")
                }
                onClick={() => {
                  if (isUnread) void readNotification(item.id);
                }}
              >
                <span aria-hidden="true" />
                <div className="dashboard-notifications__item-body">
                  <div className="dashboard-notifications__item-meta">
                    <small
                      className={`dashboard-notifications__pill dashboard-notifications__pill--${meta.tone}`}
                    >
                      {meta.label}
                    </small>
                    {isUnread && (
                      <small className="dashboard-notifications__unread-tag">
                        Não lida
                      </small>
                    )}
                    <time dateTime={item.dataCriacao}>
                      {formatNotificationTime(item.dataCriacao)}
                    </time>
                  </div>
                  <strong>{item.titulo}</strong>
                  <small>{item.mensagem}</small>
                </div>
              </button>
            );
          })}
          <div className="dashboard-notifications__actions">
            <button
              className="workspace-link"
              disabled={notificationBusy || Boolean(busyId) || !unreadCount}
              onClick={() => void readNotification()}
            >
              Marcar como lidas
            </button>
            {sorted.length > 3 && (
              <button
                className="workspace-link"
                onClick={() => setExpanded((value) => !value)}
              >
                {expanded ? "Mostrar menos" : `Ver todas (${sorted.length})`}
              </button>
            )}
          </div>
        </>
      )}
    </DashboardPanel>
  );
}
