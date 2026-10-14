import { useState } from "react";
import DashboardPanel from "../DashboardPanel/DashboardPanel";
import { usePersonal } from "../../features/personal/PersonalContext";
import "./DashboardNotifications.css";
export default function DashboardNotifications() {
  const {notifications,notificationBusy,busyId,readNotification} = usePersonal();
  const [expanded,setExpanded] = useState(false);
  const unread = notifications.data.filter(item=>!item.lida).length;
  return <DashboardPanel title="Notificações" subtitle={unread+" não lidas"} id="notificacoes">
    {notifications.loading ? <p className="dashboard-panel__empty">Carregando notificações...</p> : notifications.error ? <p role="alert" className="dashboard-panel__empty">{notifications.error}</p> : !notifications.data.length ? <p className="dashboard-panel__empty">Nenhuma notificação por enquanto.</p> : <>
      {notifications.data.slice(0,expanded?undefined:3).map(item=><button key={item.id} disabled={notificationBusy || Boolean(busyId)} className={"dashboard-v2__notification"+(item.lida?" is-read":"")} aria-label={item.titulo+(item.lida?" — lida":" — marcar como lida")} onClick={()=>{if(!item.lida)void readNotification(item.id);}}><span aria-hidden="true"/><div><strong>{item.titulo}</strong><small>{item.mensagem}</small><time dateTime={item.dataCriacao}>{new Date(item.dataCriacao).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}</time></div></button>)}
      <div className="dashboard-notifications__actions"><button className="workspace-link" disabled={notificationBusy || Boolean(busyId) || !unread} onClick={()=>void readNotification()}>Marcar como lidas</button>{notifications.data.length>3 && <button className="workspace-link" onClick={()=>setExpanded(value=>!value)}>{expanded?"Mostrar menos":"Ver todas"}</button>}</div>
    </>}
  </DashboardPanel>;
}
