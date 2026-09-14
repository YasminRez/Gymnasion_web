import "./InviteResult.css";
function InviteResult({ success, email, onClose, onRetry, onViewStudents }: { success: boolean; email: string; onClose: () => void; onRetry: () => void; onViewStudents: () => void }) {
  return <div className={`invite-result ${success ? "invite-result--success" : "invite-result--duplicate"}`}>
    <p className="student-invite__hint">{success ? "O link de convite foi enviado para:" : "Já existe um aluno vinculado a este e-mail:"}</p>
    <p className="invite-result__email"><span aria-hidden="true">✉ </span>{email}</p>
    <p className="student-invite__hint">{success ? "O convite mantém o prazo de 15 minutos a partir da geração." : "Tente um e-mail diferente ou verifique os alunos cadastrados."}</p>
    <div className="student-invite__actions student-invite__divider">{success ? <button type="button" className="invite-result__ok" onClick={onClose}>OK</button> : <><button type="button" onClick={onRetry}>Tentar outro e-mail</button><button type="button" className="invite-result__view" onClick={onViewStudents}>Ver alunos</button></>}</div>
  </div>;
}
export default InviteResult;
