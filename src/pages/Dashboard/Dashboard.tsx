import AccountSidebar from "../../components/AccountSidebar/AccountSidebar";
import PlatformHeader from "../../components/PlatformHeader/PlatformHeader";
import HomeNavigation from "../../components/HomeNavigation/HomeNavigation";
import HomeOverview from "../../components/HomeOverview/HomeOverview";
import "./Dashboard.css";
import { useEffect, useState } from "react";
import Notifications from "../../components/Notifications/Notifications";
import { notificationData } from "../../components/Notifications/notificationData";
// Prévia da área autenticada. Conectar a sessão e o nome do personal à API.
function Dashboard({ section = "overview" }: { section?: "overview" | "notifications" }) {
  const [readIds, setReadIds] = useState<number[]>(() => {
    try { const saved: unknown = JSON.parse(sessionStorage.getItem("gymnasion.notifications.read.v1") || "[]"); return Array.isArray(saved) ? saved.filter((id): id is number => typeof id === "number") : []; } catch { return []; }
  });
  useEffect(() => { try { sessionStorage.setItem("gymnasion.notifications.read.v1", JSON.stringify(readIds)); } catch { /* Mantém a leitura em memória quando o armazenamento está indisponível. */ } }, [readIds]);
  const notifications = notificationData.map((item) => ({ ...item, unread: item.unread && !readIds.includes(item.id) }));
  return <div className="dashboard">
    <a className="dashboard__skip" href="#dashboard-content">Ir para o conteúdo</a>
    <AccountSidebar />
    <div className="dashboard__body">
      <PlatformHeader />
      <HomeNavigation activeSection={section} unreadCount={notifications.filter((item) => item.unread).length} />
      <main id="dashboard-content">{section === "notifications" ? <Notifications notifications={notifications} onRead={(id) => setReadIds((previous) => previous.includes(id) ? previous : [...previous, id])} /> : <HomeOverview />}</main>
    </div>
  </div>;
}
export default Dashboard;
