import { useEffect, useState } from "react";
import { session } from "../../services/session";
import { accountService } from "../../services/accountService";

export type AccountSettings = {
  photo: string;
  showNotificationBadge: boolean;
  notificacoesEmail: boolean;
  notificacoesPush: boolean;
};

const defaults: AccountSettings = {
  photo: "",
  showNotificationBadge: true,
  notificacoesEmail: false,
  notificacoesPush: false,
};

const eventName = "gymnasion:settings";

export function settingsKey(id: string) {
  return "@Gymnasion:settings:" + id;
}

export function readSettings(id: string): AccountSettings {
  try {
    const value = JSON.parse(localStorage.getItem(settingsKey(id)) || "{}");
    return {
      photo:
        typeof value.photo === "string" && /^data:image\/(png|jpeg|webp);base64,/.test(value.photo)
          ? value.photo
          : "",
      showNotificationBadge:
        typeof value.showNotificationBadge === "boolean" ? value.showNotificationBadge : true,
      notificacoesEmail:
        typeof value.notificacoesEmail === "boolean" ? value.notificacoesEmail : false,
      notificacoesPush:
        typeof value.notificacoesPush === "boolean" ? value.notificacoesPush : false,
    };
  } catch {
    return { ...defaults };
  }
}

export function useAccountSettings() {
  const id = session?.getUser?.()?.id || "";
  const [settings, setSettings] = useState(() => readSettings(id));

  useEffect(() => {
    const sync = () => setSettings(readSettings(id));
    sync();

    if (id && accountService?.obterPreferencias) {
      accountService
        .obterPreferencias()
        .then((pref) => {
          setSettings((prev) => {
            const next = {
              ...prev,
              showNotificationBadge: pref.showNotificationBadge,
              notificacoesEmail: pref.notificacoesEmail,
              notificacoesPush: pref.notificacoesPush,
            };
            try {
              localStorage.setItem(settingsKey(id), JSON.stringify(next));
            } catch {
              // ignore
            }
            return next;
          });
        })
        .catch(() => {
          // fallback para localstorage
        });
    }

    window.addEventListener(eventName, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(eventName, sync);
      window.removeEventListener("storage", sync);
    };
  }, [id]);

  async function save(next: AccountSettings) {
    if (!id) throw new Error("Entre novamente para salvar suas preferências.");
    localStorage.setItem(settingsKey(id), JSON.stringify(next));
    setSettings(next);
    window.dispatchEvent(new Event(eventName));

    if (accountService?.atualizarPreferencias) {
      await accountService.atualizarPreferencias({
        showNotificationBadge: next.showNotificationBadge,
        notificacoesEmail: next.notificacoesEmail,
        notificacoesPush: next.notificacoesPush,
      });
    }
  }

  return { settings, save };
}
