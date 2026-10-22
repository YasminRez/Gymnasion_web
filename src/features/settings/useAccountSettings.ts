import { useEffect, useState } from "react";
import { session } from "../../services/session";
export type AccountSettings = { photo: string; showNotificationBadge: boolean };
const defaults: AccountSettings = { photo: "", showNotificationBadge: true };
const eventName = "gymnasion:settings";
export function settingsKey(id: string) { return "@Gymnasion:settings:" + id; }
export function readSettings(id: string): AccountSettings {
  try {
    const value = JSON.parse(localStorage.getItem(settingsKey(id)) || "{}");
    return { photo: typeof value.photo === "string" && /^data:image\/(png|jpeg|webp);base64,/.test(value.photo) ? value.photo : "", showNotificationBadge: typeof value.showNotificationBadge === "boolean" ? value.showNotificationBadge : true };
  } catch { return { ...defaults }; }
}
export function useAccountSettings() {
  const id = session.getUser()?.id || "";
  const [settings, setSettings] = useState(() => readSettings(id));
  useEffect(() => {
    const sync = () => setSettings(readSettings(id));
    sync();
    window.addEventListener(eventName, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(eventName, sync); window.removeEventListener("storage", sync); };
  }, [id]);
  function save(next: AccountSettings) {
    if (!id) throw new Error("Entre novamente para salvar suas preferências.");
    localStorage.setItem(settingsKey(id), JSON.stringify(next));
    setSettings(next);
    window.dispatchEvent(new Event(eventName));
  }
  return { settings, save };
}
