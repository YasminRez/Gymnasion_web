import { useCallback, useEffect, useState } from "react";
import Navbar from "../../components/Navbar/Navbar";
import StudentCard from "../../components/StudentCard/StudentCard";
import StudentToolbar from "../../components/StudentToolbar/StudentToolbar";
import PendingStudent from "../../components/PendingStudent/PendingStudent";
import StudentInviteModal from "../../components/StudentInviteModal/StudentInviteModal";
import { initialStudents, type Student, type StudentStatus } from "./studentData";
import "./Students.css";
import StudentActionModal, { type StudentAction } from "../../components/StudentActionModal/StudentActionModal";
import StudentsEmptyState from "../../components/StudentsEmptyState/StudentsEmptyState";
import StudentToast from "../../components/StudentToast/StudentToast";

const storageKey = "gymnasion.students.demo.v1";
function loadStudents(): Student[] {
  try {
    const saved: unknown = JSON.parse(sessionStorage.getItem(storageKey) || "null");
    if (Array.isArray(saved) && saved.every((student) => student && typeof student.id === "number" && typeof student.name === "string" && student.name.trim() && typeof student.sport === "string" && ["active", "inactive", "pending"].includes(student.status))) return saved;
  } catch { /* A demonstração também funciona quando o armazenamento está indisponível. */ }
  return initialStudents;
}

function Students() {
  const [students, setStudents] = useState(loadStudents);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StudentStatus | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [action, setAction] = useState<StudentAction | null>(null);
  const closeNotice = useCallback(() => setNotice(""), []);
  useEffect(() => {
    try { sessionStorage.setItem(storageKey, JSON.stringify(students)); } catch { /* Sem persistência, mantém a atualização imediata em memória. */ }
  }, [students]);
  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const visible = students.filter((student) => normalize(student.name).includes(normalize(search.trim())) && (!filter || student.status === filter));
  const enrolled = visible.filter((student) => student.status !== "pending");
  const pending = visible.filter((student) => student.status === "pending");
  const counts = { active: 0, inactive: 0, pending: 0 };
  students.forEach((student) => counts[student.status]++);

  function handleDecision(student: Student, accept: boolean) {
    // Simulação local: substituir por requisição à API antes de usar em produção.
    setStudents((previous) => accept ? previous.map((item) => item.id === student.id ? { ...item, status: "active" } : item) : previous.filter((item) => item.id !== student.id));
    setNotice("");
    setAction({ type: accept ? "approved" : "rejected", student });
  }

  function confirmStatus() {
    if (!action || (action.type !== "deactivate" && action.type !== "reactivate")) return;
    const status = action.type === "deactivate" ? "inactive" : "active";
    setStudents((previous) => previous.map((student) => student.id === action.student.id ? { ...student, status } : student));
    setAction(null);
    setNotice(`${action.student.name}: aluno ${status === "active" ? "reativado" : "desativado"} com sucesso!`);
  }

  return (
    <>
      <Navbar />
      <main className="students" aria-label="Alunos">
        <h1 className="students__sr-only">Alunos</h1>
        <StudentToolbar search={search} onSearch={setSearch} filter={filter} onFilter={setFilter} counts={counts} onRegister={() => setInviteOpen(true)} />
        {visible.length === 0 && <StudentsEmptyState search={search.trim()} filtered={Boolean(filter)} onRegister={() => setInviteOpen(true)} />}
        {enrolled.length > 0 && (
          <section className="students__grid" aria-label="Alunos cadastrados">
            {enrolled.map((student) => <StudentCard key={student.id} student={student} onStatusChange={(selected) => { setNotice(""); setAction({ type: selected.status === "active" ? "deactivate" : "reactivate", student: selected }); }} />)}
          </section>
        )}
        {pending.length > 0 && (
          <section className="students__pending" aria-labelledby="pending-title">
            <h2 id="pending-title">Pendentes</h2>
            <div className="students__pending-grid">
              {pending.map((student) => <PendingStudent key={student.id} student={student} onDecision={handleDecision} />)}
            </div>
          </section>
        )}
        <p className="students__demo">Dados demonstrativos · Alterações salvas nesta aba. Acesso à plataforma e e-mails dependem da integração com o servidor.</p>
      </main>
      {inviteOpen && <StudentInviteModal onClose={() => setInviteOpen(false)} onViewStudents={() => { setInviteOpen(false); setSearch(""); setFilter(null); }} />}
      {action && <StudentActionModal action={action} onClose={() => setAction(null)} onConfirm={confirmStatus} />}
      {notice && <StudentToast message={notice} onClose={closeNotice} />}
    </>
  );
}
export default Students;
