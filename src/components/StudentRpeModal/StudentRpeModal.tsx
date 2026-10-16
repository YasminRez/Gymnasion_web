import { useEffect, useId, useRef, useState } from "react";
import Button from "../Button/Button";
import { getBorgInfo } from "../../features/studentArea/studentAreaModel";
import "./StudentRpeModal.css";

interface StudentRpeModalProps {
  initialRpe?: number | null;
  busy?: boolean;
  onClose: () => void;
  onConfirm: (rpe: number | null) => void;
}

export default function StudentRpeModal({
  initialRpe = 7,
  busy = false,
  onClose,
  onConfirm,
}: StudentRpeModalProps) {
  const [selectedRpe, setSelectedRpe] = useState<number | null>(initialRpe);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
      if (previous instanceof HTMLElement && previous.isConnected) {
        previous.focus();
      }
    };
  }, []);

  const borgInfo = getBorgInfo(selectedRpe);

  return (
    <dialog
      ref={dialogRef}
      className="student-rpe-modal"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <div className="student-rpe-modal__header">
        <span className="student-rpe-modal__icon" aria-hidden="true">
          <img src="/student-profile/imgIconFlame.svg" alt="" />
        </span>
        <div className="student-rpe-modal__titles">
          <h2 id={titleId}>Como você avalia seu nível de esforço nesta sessão?</h2>
          <p>Escala de Borg CR-10 · campo opcional</p>
        </div>
        <button
          type="button"
          className="student-rpe-modal__close"
          aria-label="Fechar modal"
          disabled={busy}
          onClick={onClose}
        >
          <img src="/auth/close.svg" alt="" />
        </button>
      </div>

      <div className="student-rpe-modal__scale-buttons" role="group" aria-label="Nível de esforço de 1 a 10">
        {Array.from({ length: 10 }, (_, idx) => idx + 1).map((level) => {
          const isSelected = selectedRpe === level;
          const toneClass =
            level <= 4
              ? "student-rpe-modal__btn--green"
              : level <= 6
              ? "student-rpe-modal__btn--amber"
              : level <= 8
              ? "student-rpe-modal__btn--orange"
              : "student-rpe-modal__btn--red";

          return (
            <button
              key={level}
              type="button"
              className={`student-rpe-modal__btn ${toneClass}${isSelected ? " is-selected" : ""}`}
              aria-pressed={isSelected}
              disabled={busy}
              onClick={() => setSelectedRpe(level)}
            >
              {level}
            </button>
          );
        })}
      </div>

      <div className="student-rpe-modal__scale-labels" aria-hidden="true">
        <span>Muito leve</span>
        <span>Moderado</span>
        <span>Máximo</span>
      </div>

      <div className="student-rpe-modal__callout" role="status">
        <span className={`student-rpe-modal__callout-badge student-rpe-modal__callout-badge--${borgInfo.tone}`}>
          {borgInfo.levelLabel}
        </span>
        <div className="student-rpe-modal__callout-text">
          <strong>{borgInfo.title}</strong>
          <p>{borgInfo.description}</p>
        </div>
      </div>

      <footer className="student-rpe-modal__footer">
        <button
          type="button"
          className="student-rpe-modal__skip"
          disabled={busy}
          onClick={() => onConfirm(null)}
        >
          Pular
        </button>
        <Button loading={busy} onClick={() => onConfirm(selectedRpe)}>
          Salvar sessão
        </Button>
      </footer>
    </dialog>
  );
}
