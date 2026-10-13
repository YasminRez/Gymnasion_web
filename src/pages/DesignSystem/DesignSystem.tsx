import { useState } from "react";
import Button from "../../components/Button/Button";
import FormField from "../../components/FormField/FormField";
import Logo from "../../components/Logo/Logo";
import Avatar from "../../components/Avatar/Avatar";
import Badge, { type BadgeTone } from "../../components/Badge/Badge";
import SportTag, { type Sport } from "../../components/SportTag/SportTag";
import Checkbox from "../../components/Checkbox/Checkbox";
import Toast, { type ToastProps } from "../../components/Toast/Toast";
import AppSidebar, { type SidebarItem } from "../../components/AppSidebar/AppSidebar";
import AppTopbar from "../../components/AppTopbar/AppTopbar";
import SidebarCallout from "../../components/SidebarCallout/SidebarCallout";
import "./DesignSystem.css";

const personalItems = [["home", "Início", "imgIconHome"], ["students", "Alunos", "imgIconUsers"], ["groups", "Turmas", "imgIconLayers"], ["routines", "Rotinas de treino", "imgIconDumbbell"], ["metrics", "Métricas", "imgIconActivity"], ["sports", "Modalidades", "imgIconGrid"], ["progress", "Evolução", "imgIconChart"], ["reports", "Relatórios", "imgIconFile"]];
const studentItems = [["panel", "Meu painel", "imgIconHome"], ["workouts", "Meus treinos", "imgIconDumbbell"], ["evolution", "Minha evolução", "imgIconChart"], ["my-reports", "Meus relatórios", "imgIconFile"]];
const generalItems = [["settings", "Configurações", "imgIconSliders"], ["terms", "Termos e privacidade", "imgIconShield"]];
const options = [{ value: "natacao", label: "Natação" }, { value: "academia", label: "Academia" }, { value: "tenis", label: "Tênis" }];
const tones: BadgeTone[] = ["success", "warning", "danger", "neutral", "info", "primary"];
const sports: Sport[] = ["natacao", "tenis", "academia", "corrida", "ciclismo", "funcional"];

export default function DesignSystem() {
  const [notice, setNotice] = useState<ToastProps | null>(null);
  const [active, setActive] = useState("");
  const [checked, setChecked] = useState(true);
  const [showToasts, setShowToasts] = useState(["success", "error", "info"]);
  const notify = (message: string) => setNotice({ title: "Demonstração", message, tone: "info" });
  const items = (source: string[][]): SidebarItem[] => source.map(([id, label, icon]) => ({ id, label, icon, count: id === "students" ? 3 : undefined, onClick: () => { setActive(id); notify(`Navegação selecionada: ${label}.`); } }));
  return <main className="design-system">
    <h1 className="text-title-1">Componentes</h1>
    <p className="design-system__intro">Gymnasion v2 · Biblioteca para validação. As ações desta página são demonstrações.</p>
    <section aria-label="Logos" className="design-system__row">
      <Logo /><div className="design-system__dark"><Logo variant="white" /></div><Logo variant="symbol" />
    </section>
    <section aria-label="Botões" className="design-system__row">
      {(["primary", "secondary", "ghost", "danger"] as const).map(variant => <Button key={variant} variant={variant} onClick={() => notify(`Botão ${variant} acionado.`)}>Botão</Button>)}
      <Button icon={<img src="/design-system/imgIcon.svg" alt="" />} onClick={() => notify("Botão com ícone acionado.")}>Com ícone</Button>
      <Button disabled>Desabilitado</Button><Button loading>Carregando</Button>
    </section>
    <section aria-label="Campos" className="design-system__fields">
      <FormField id="ds-text-default" label="Rótulo" placeholder="Digite aqui" />
      <FormField id="ds-text-focus" label="Foco ao clicar" placeholder="Digite aqui" />
      <FormField id="ds-text-filled" label="Preenchido" defaultValue="Digite aqui" />
      <FormField id="ds-text-error" label="Com erro" defaultValue="Digite aqui" error="Mensagem de ajuda" />
      <FormField id="ds-select-default" label="Rótulo" options={options} defaultValue="" selectPlaceholder="Digite aqui" />
      <FormField id="ds-select-focus" label="Foco ao clicar" options={options} defaultValue="" selectPlaceholder="Digite aqui" />
      <FormField id="ds-select-filled" label="Preenchido" options={options} defaultValue="natacao" />
      <FormField id="ds-select-error" label="Com erro" options={options} defaultValue="academia" error="Mensagem de ajuda" />
      <FormField id="ds-password" label="Senha" type="password" defaultValue="gymnasion" hint="Use o botão para mostrar ou ocultar." />
      <FormField id="ds-disabled" label="Desabilitado" placeholder="Indisponível" disabled />
    </section>
    <section aria-label="Badges, modalidades e seleção" className="design-system__row">
      {tones.map(tone => <Badge key={tone} tone={tone}>Ativo</Badge>)}
      {sports.map(sport => <SportTag key={sport} sport={sport} />)}
      <Avatar name="Rafael Souza" />
      <Checkbox label="Selecionado" checked={checked} onChange={event => setChecked(event.target.checked)} />
      <Checkbox label="Não selecionado" /><Checkbox label="Desabilitado" disabled />
    </section>
    <section aria-label="Notificações" className="design-system__row">
      {(["success", "error", "info"] as const).filter(tone => showToasts.includes(tone)).map(tone => <Toast key={tone} tone={tone} title="Tudo certo!" message="Mensagem descritiva do evento." onClose={() => setShowToasts(current => current.filter(value => value !== tone))} />)}
      {showToasts.length < 3 && <Button variant="ghost" onClick={() => setShowToasts(["success", "error", "info"])}>Restaurar notificações</Button>}
    </section>
    <section aria-label="Layouts" className="design-system__layouts">
      <AppSidebar user={{ name: "Rafael Souza", subtitle: "Personal Trainer" }} menu={items(personalItems)} general={items(generalItems)} activeId={active} footer={<SidebarCallout variant="strava" onAction={() => notify("Conexão Strava: exemplo de ação do componente.")} />} onLogout={() => notify("Sair da conta: exemplo de ação do componente.")} />
      <div className="design-system__topbar"><AppTopbar title="Título da página" subtitle="Subtítulo de apoio da página" userName="Rafael Souza" onSearch={query => notify(query ? `Busca por “${query}”.` : "Digite um nome para buscar.")} onNotifications={() => notify("Notificações abertas.")} /></div>
      <AppSidebar role="student" user={{ name: "Ana Beatriz Silva", subtitle: "Aluna" }} menu={items(studentItems)} general={items([["integrations", "Integrações", "imgIconZap"], ...generalItems])} activeId={active} footer={<SidebarCallout variant="personal" name="Rafael Souza" registration="CREF 012345-G/DF" onAction={() => notify("Enviar mensagem: exemplo de ação do componente.")} />} onLogout={() => notify("Sair da conta: exemplo de ação do componente.")} />
    </section>
    {notice && <div className="design-system__notice"><Toast {...notice} onClose={() => setNotice(null)} /></div>}
  </main>;
}
