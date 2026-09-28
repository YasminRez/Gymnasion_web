import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import PlatformHeader from "../../components/PlatformHeader/PlatformHeader";
import GroupToolbar from "../../components/GroupToolbar/GroupToolbar";
import RoutineCard from "../../components/RoutineCard/RoutineCard";
import RoutineFormModal from "../../components/RoutineFormModal/RoutineFormModal";
import RoutinesEmptyState from "../../components/RoutinesEmptyState/RoutinesEmptyState";
import StudentToast from "../../components/StudentToast/StudentToast";
import { rotinaService } from "../../services/rotinaService";
import { modalidadeService } from "../../services/modalidadeService";
import { personalTrainerService } from "../../services/personalTrainerService";
import { handleApiError } from "../../utils/handleApiError";
import { normalize } from "../Groups/groupData";
import type { Modalidade } from "../../types/modalidade";
import type { AlunoResponse } from "../../types/student";
import type { RotinaResponse } from "../../types/rotina";
import "../Groups/Groups.css";

function Routines() {
  const [routines, setRoutines] = useState<RotinaResponse[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [modalities, setModalities] = useState<Modalidade[]>([]);
  const [students, setStudents] = useState<AlunoResponse[]>([]);
  const [studentsLoaded, setStudentsLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState("");

  const closeNotice = useCallback(() => setNotice(""), []);

  const loadRoutines = useCallback(async () => {
    try {
      setRoutines(await rotinaService.listar());
      setLoadFailed(false);
    } catch (err) {
      handleApiError(err, "Não foi possível carregar as rotinas.");
      setLoadFailed(true);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadRoutines();
    modalidadeService.listarTodas().then(setModalities).catch((err) => handleApiError(err, "Erro ao carregar as modalidades."));
    // Alunos inativos não podem receber rotina.
    personalTrainerService.listarTodos()
      .then((data) => { setStudents(data.filter((aluno) => aluno.status === "ATIVO")); setStudentsLoaded(true); })
      .catch((err) => handleApiError(err, "Não foi possível carregar a lista de alunos."));
  }, [loadRoutines]);

  // Filtros: apenas as modalidades que já possuem rotina.
  const routineModalities = Array.from(new Map(routines.map((routine) => [routine.modalidadeId, { id: routine.modalidadeId, nome: routine.nomeModalidade }])).values())
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  const activeFilter = routineModalities.some((modality) => modality.id === filter) ? filter : null;
  const suggestedModalityIds = [...new Set([...routineModalities.map((m) => m.id), ...students.flatMap((aluno) => aluno.modalidades.map((m) => m.id))])];

  const term = normalize(search.trim());
  const visible = routines
    .filter((routine) => normalize(routine.titulo).includes(term) && (activeFilter === null || routine.modalidadeId === activeFilter))
    .sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"));

  function openCreate() {
    setNotice("");
    // US-10 - Cenário 4: sem alunos não há para quem montar a rotina.
    if (studentsLoaded && students.length === 0) {
      toast.error("É preciso pelo menos 1 (um) aluno cadastrado");
      return;
    }
    setCreating(true);
  }

  return (
    <>
      <PlatformHeader activePage="routines" />
      <main className="groups" aria-label="Rotinas">
        <h1 className="groups__sr-only">Rotinas</h1>
        <GroupToolbar search={search} onSearch={setSearch} modalities={routineModalities} filter={activeFilter} onFilter={setFilter} onRegister={openCreate} item="rotina" registerLabel="Criar rotina" />
        {loaded && !loadFailed && visible.length === 0 && <RoutinesEmptyState search={search.trim()} filtered={activeFilter !== null} onRegister={openCreate} />}
        {visible.length > 0 && (
          <section className="groups__grid" aria-label="Rotinas cadastradas">
            {visible.map((routine) => <RoutineCard key={routine.id} routine={routine} />)}
          </section>
        )}
      </main>
      {creating && (
        <RoutineFormModal
          modalities={modalities}
          suggestedModalityIds={suggestedModalityIds}
          students={students}
          onClose={() => setCreating(false)}
          // US-10 - Cenário 1: fecha o modal e volta para a lista de rotinas.
          onSaved={(message) => { setCreating(false); setNotice(message); loadRoutines(); }}
        />
      )}
      {notice && <StudentToast message={notice} onClose={closeNotice} />}
    </>
  );
}

export default Routines;
