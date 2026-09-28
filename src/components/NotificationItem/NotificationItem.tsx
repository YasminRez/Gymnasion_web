import type { Notification } from "../Notifications/notificationData";
import "./NotificationItem.css";
function NotificationItem({ notification, onRead }: { notification: Notification; onRead: (id: number) => void }) {
  return <li>
    <button type="button" className={`notification-item notification-item--${notification.kind}${notification.unread ? " notification-item--unread" : ""}`} onClick={() => onRead(notification.id)} aria-label={`${notification.message} ${notification.time}. ${notification.unread ? "Não lida. Marcar como lida" : "Lida"}`}>
      <span className="notification-item__kind" aria-hidden="true" />
      <span className="notification-item__content"><span className="notification-item__message">{notification.message}</span><span className="notification-item__time">{notification.time}</span></span>
      {notification.unread && <span className="notification-item__unread" aria-hidden="true" />}
    </button>
  </li>;
}
export default NotificationItem;
