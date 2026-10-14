import { useState } from "react";
import WorkspaceDialog from "../WorkspaceDialog/WorkspaceDialog";
import Button from "../Button/Button";
import { usePersonal } from "../../features/personal/PersonalContext";
import type { StudentMutation } from "../../features/personal/studentModel";
import type { AlunoResponse } from "../../types/student";
import "./StudentStatusDialog.css";

export default function StudentStatusDialog({ student, action, onClose }: { student: AlunoResponse; action: Exclude<StudentMutation, "approve">; onClose: () => void }) {
  const { mutate, busyId, actionError } = usePersonal();
  const [failed, setFailed] = useState(false);
  const reject = action === "reject";
  const deactivate = action === "deactivate";
  const verb = reject ? "Recusar" : deactivate ? "Desativar" : "Reativar";
  return <WorkspaceDialog title={`${verb} ${student.usuario.nome}?`} tone={action === "reactivate" ? "success" : "danger"}
    icon={reject ? "/workspace/402-2031-imgIconX.svg" : deactivate ? "/workspace/402-2299-imgIconPower.svg" : "/design-system/imgIconCheckc.svg"}
    description={reject ? "A solicitação pendente será removida da sua lista de alunos." : deactivate ? "Use para alunos que pausaram os treinos. Você pode reativar a qualquer momento." : "O aluno voltará à lista de ativos e poderá receber novas rotinas."}
    busy={Boolean(busyId)} onClose={onClose}
    actions={<><Button variant="secondary" onClick={onClose} disabled={Boolean(busyId)}>Cancelar</Button><Button variant={action === "reactivate" ? "primary" : "danger"} loading={busyId === student.id} disabled={Boolean(busyId)} onClick={async () => { setFailed(false); if (await mutate(student, action)) onClose(); else setFailed(true); }}>{verb} aluno</Button></>}>
    {deactivate && <div className="student-status-details"><p><img src="/workspace/402-2299-imgIconShield.svg" alt="" />O histórico de treinos e métricas será preservado.</p><p><img src="/workspace/402-2299-imgIconLayers.svg" alt="" />O aluno ficará identificado como inativo.</p></div>}
    {failed && <p className="workspace-dialog__error" role="alert">{actionError || "A alteração não foi salva. Tente novamente."}</p>}
  </WorkspaceDialog>;
}
