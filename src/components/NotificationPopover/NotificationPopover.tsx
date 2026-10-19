import { useEffect, useRef } from "react";
import type { PersonalNotification } from "../../types/personalDashboard";
import "./NotificationPopover.css";

function formatNotificationTime(isoString?: string): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) {
    return "Agora mesmo";
  }
  if (diffMin < 60) {
    return `Há ${diffMin} ${diffMin === 1 ? "minuto" : "minutos"}`;
  }
  if (diffHours < 24 && date.getDate() === now.getDate()) {
    const hours = String(date.getHours()).padStart(2, "0");
    const mins = String(date.getMinutes()).padStart(2, "0");
    return `Hoje às ${hours}:${mins}`;
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  ) {
    const hours = String(date.getHours()).padStart(2, "0");
    const mins = String(date.getMinutes()).padStart(2, "0");
    return `Ontem às ${hours}:${mins}`;
  }
  if (diffDays < 7) {
    return `Há ${diffDays} ${diffDays === 1 ? "dia" : "dias"}`;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export interface NotificationPopoverProps {
  notifications: PersonalNotification[];
  loading?: boolean;
  error?: string;
  busy?: boolean;
  onClose: () => void;
  onRead: (id?: string) => Promise<boolean | void> | void;
  onRetry?: () => void;
}

export default function NotificationPopover({
  notifications,
  loading,
  error,
  busy,
  onClose,
  onRead,
  onRetry,
}: NotificationPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((item) => !item.lida).length;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    // Use timeout to prevent catching the trigger click
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
      clearTimeout(timer);
    };
  }, [onClose]);

  return (
    <div
      ref={popoverRef}
      className="notification-popover"
      role="dialog"
      aria-modal="false"
      aria-label="Central de notificações"
    >
      <div className="notification-popover__header">
        <div className="notification-popover__title-wrap">
          <h2 className="notification-popover__title">Notificações</h2>
          {unreadCount > 0 && (
            <span className="notification-popover__badge" aria-label={`${unreadCount} notificações não lidas`}>
              {unreadCount} {unreadCount === 1 ? "nova" : "novas"}
            </span>
          )}
        </div>
        <button
          type="button"
          className="notification-popover__mark-all"
          disabled={busy || unreadCount === 0}
          onClick={() => void onRead()}
          title="Marcar todas as notificações como lidas"
        >
          Marcar todas como lidas
        </button>
      </div>

      <div className="notification-popover__content">
        {loading ? (
          <div className="notification-popover__loading" role="status">
            <span className="notification-popover__spinner" aria-hidden="true" />
            <p>Carregando notificações…</p>
          </div>
        ) : error ? (
          <div className="notification-popover__error" role="alert">
            <p>{error}</p>
            {onRetry && (
              <button type="button" className="workspace-link" onClick={onRetry}>
                Tentar novamente
              </button>
            )}
          </div>
        ) : notifications.length === 0 ? (
          <div className="notification-popover__empty">
            <img src="/design-system/imgBell.svg" alt="" className="notification-popover__empty-icon" />
            <strong>Tudo em dia!</strong>
            <p>Nenhuma notificação por enquanto.</p>
          </div>
        ) : (
          <ul className="notification-popover__list">
            {notifications.map((item) => (
              <li key={item.id} className="notification-popover__item">
                <button
                  type="button"
                  disabled={busy}
                  className={`notification-popover__entry ${item.lida ? "is-read" : "is-unread"}`}
                  onClick={() => {
                    if (!item.lida) {
                      void onRead(item.id);
                    }
                  }}
                  aria-label={`${item.titulo}. ${item.mensagem}. ${
                    item.lida ? "Notificação lida" : "Não lida. Clique para marcar como lida"
                  }`}
                >
                  <span
                    className={`notification-popover__dot ${item.lida ? "is-read" : "is-unread"}`}
                    aria-hidden="true"
                  />
                  <div className="notification-popover__body">
                    <strong className="notification-popover__entry-title">{item.titulo}</strong>
                    <p className="notification-popover__entry-msg">{item.mensagem}</p>
                    <time className="notification-popover__entry-time" dateTime={item.dataCriacao}>
                      {formatNotificationTime(item.dataCriacao)}
                    </time>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="notification-popover__footer">
        <span>
          {notifications.length}{" "}
          {notifications.length === 1 ? "notificação" : "notificações"}
        </span>
        <button type="button" className="notification-popover__close-btn" onClick={onClose}>
          Fechar
        </button>
      </div>
    </div>
  );
}
