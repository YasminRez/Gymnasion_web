import { useRef, useState, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { Bell, Camera, ShieldCheck } from "lucide-react";
import SettingsSection from "../../components/SettingsSection/SettingsSection";
import Avatar from "../../components/Avatar/Avatar";
import Button from "../../components/Button/Button";
import Checkbox from "../../components/Checkbox/Checkbox";
import UnavailableAction from "../../components/UnavailableAction/UnavailableAction";
import { useAccountSettings } from "../../features/settings/useAccountSettings";
import "./Settings.css";

export default function Settings() {
  const { settings, save } = useAccountSettings();
  const [draft, setDraft] = useState(settings);
  const [reading, setReading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const changed = draft.photo !== settings.photo || draft.showNotificationBadge !== settings.showNotificationBadge;
  async function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(""); setMessage("");
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setError("Escolha uma imagem JPG, PNG ou WebP de até 2 MB."); return;
    }
    setReading(true);
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = 256; canvas.height = 256;
      const context = canvas.getContext("2d");
      if (!context) throw new Error();
      const size = Math.min(image.width, image.height);
      context.drawImage(image, (image.width-size)/2, (image.height-size)/2, size, size, 0, 0, 256, 256);
      const photo = canvas.toDataURL("image/png");
      setDraft(previous => ({ ...previous, photo }));
    } catch { setError("Não foi possível abrir essa imagem. Escolha outro arquivo."); }
    finally { URL.revokeObjectURL(url); setReading(false); }
  }
  function saveSettings() {
    setError(""); setMessage("");
    try { save(draft); setMessage("Preferências salvas neste navegador."); }
    catch { setError("Não foi possível salvar. Verifique se o navegador permite armazenamento local."); }
  }
  return <div className="settings-page">
    <p className="settings-page__notice">Estas preferências são salvas para sua conta somente neste navegador. A sincronização entre dispositivos ainda não está disponível.</p>
    <div className="settings-page__grid"><div className="settings-page__sections">
      <SettingsSection title="Imagem de perfil" description="Personalize a imagem exibida no menu e no cabeçalho. Ela não será compartilhada com outros usuários.">
        <div className="settings-page__photo"><Avatar name="Minha conta" src={draft.photo} className="settings-page__avatar" /><div><div className="settings-page__buttons"><Button icon={<Camera size={18}/>} loading={reading} onClick={() => input.current?.click()}>Escolher imagem</Button><Button variant="ghost" disabled={!draft.photo || reading} onClick={() => setDraft(previous => ({...previous, photo:""}))}>Remover</Button></div><p>JPG, PNG ou WebP, até 2 MB. Recorte central quadrado.</p></div></div>
        <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={choosePhoto} />
      </SettingsSection>
      <SettingsSection title="Notificações" description="Escolha como deseja acompanhar as novidades.">
        <div className="settings-page__preference"><Bell size={22}/><div><Checkbox label="Mostrar indicador de notificações não lidas" checked={draft.showNotificationBadge} onChange={event => setDraft(previous => ({...previous,showNotificationBadge:event.target.checked}))}/><p>Controla o contador e o ponto no sino. Você ainda poderá abrir e consultar todas as notificações.</p></div></div>
        <div className="settings-page__unavailable"><div><strong>Notificações por e-mail</strong><p>Receba novidades na sua caixa de entrada.</p></div><UnavailableAction variant="secondary" reason="O backend ainda não oferece preferências de notificações por e-mail.">Em breve</UnavailableAction></div>
        <div className="settings-page__unavailable"><div><strong>Notificações push</strong><p>Receba alertas fora da página.</p></div><UnavailableAction variant="secondary" reason="Notificações push ainda não estão integradas.">Em breve</UnavailableAction></div>
      </SettingsSection>
    </div><SettingsSection title="Conta e segurança" description="Gerencie o acesso à sua conta."><ShieldCheck size={28}/><p>Precisa redefinir sua senha? Use o fluxo de recuperação por e-mail.</p><Link className="settings-page__link" to="/recuperar-senha">Redefinir senha →</Link><UnavailableAction variant="secondary" reason="A edição dos dados cadastrais ainda não possui integração disponível.">Editar dados cadastrais</UnavailableAction></SettingsSection></div>
    <footer className="settings-page__footer"><div aria-live="polite">{message && <p>{message}</p>}{error && <p role="alert" className="settings-page__error">{error}</p>}</div><div className="settings-page__buttons"><Button variant="secondary" disabled={!changed || reading} onClick={() => {setDraft(settings);setError("");setMessage("");}}>Descartar alterações</Button><Button disabled={!changed || reading} onClick={saveSettings}>Salvar preferências</Button></div></footer>
  </div>;
}
