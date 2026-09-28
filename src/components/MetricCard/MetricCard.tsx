import React from 'react';
import { MetricaResponseDTO } from '../../types/metric';
import './MetricCard.css';

interface MetricCardProps {
  metrica: MetricaResponseDTO;
  onEdit: () => void;
  onDelete: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({ metrica, onEdit, onDelete }) => {
  const descontinuada = !metrica.ativo;

  return (
    <article className={`metric-card${descontinuada ? ' metric-card--discontinued' : ''}`}>
      <span className="metric-card__sport">{metrica.nomeModalidade}</span>
      <h3>{metrica.titulo}</h3>
      <p>{metrica.tipo}</p>
      <p className="metric-card__count">
        {metrica.quantidadeAlunosComRegistros}{' '}
        {metrica.quantidadeAlunosComRegistros === 1 ? 'aluno com registros' : 'alunos com registros'}
      </p>

      {descontinuada ? (
        <span className="metric-card__archived">Métrica descontinuada · Histórico preservado</span>
      ) : (
        <div className="metric-card__actions">
          <button type="button" onClick={onEdit} aria-label={`Editar ${metrica.titulo}`}>
            Editar
          </button>
          <button type="button" onClick={onDelete} aria-label={`Excluir ${metrica.titulo}`}>
            Excluir
          </button>
        </div>
      )}
    </article>
  );
};

export default MetricCard;