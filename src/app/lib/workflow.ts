export type WorkflowStageKey =
  | 'medical-reports'
  | 'psychosocial-reports'
  | 'cell-stays'
  | 'belongings'
  | 'freedom-tickets'
  | 'seguimiento';

export interface WorkflowStage {
  key: WorkflowStageKey;
  label: string;
  route: string;
  subtitle: string;
  index: number;
}

export const WORKFLOW_STAGES: WorkflowStage[] = [
  {
    key: 'medical-reports',
    label: 'Reporte médico',
    route: 'medical-reports',
    subtitle: 'Primera valoración clínica del infractor.',
    index: 0
  },
  {
    key: 'psychosocial-reports',
    label: 'Reporte psicosocial',
    route: 'psychosocial-reports',
    subtitle: 'Segunda etapa de valoración interdisciplinaria.',
    index: 1
  },
  {
    key: 'cell-stays',
    label: 'Estadía en celda',
    route: 'cell-stays',
    subtitle: 'Registro de resguardo y control operativo.',
    index: 2
  },
  {
    key: 'belongings',
    label: 'Pertenencias',
    route: 'belongings',
    subtitle: 'Inventario y custodia de objetos asegurados.',
    index: 3
  },
  {
    key: 'freedom-tickets',
    label: 'Boleta de libertad',
    route: 'freedom-tickets',
    subtitle: 'Cierre administrativo del egreso.',
    index: 4
  },
  {
    key: 'seguimiento',
    label: 'Seguimiento',
    route: 'seguimiento',
    subtitle: 'Control posterior del caso.',
    index: 5
  }
];

const STAGE_BY_KEY = new Map<WorkflowStageKey, WorkflowStage>(WORKFLOW_STAGES.map((stage) => [stage.key, stage]));

export function getWorkflowStage(stageKey: WorkflowStageKey): WorkflowStage {
  const stage = STAGE_BY_KEY.get(stageKey);
  if (!stage) {
    throw new Error(`Unknown workflow stage: ${stageKey}`);
  }
  return stage;
}

export function getPreviousWorkflowStage(stageKey: WorkflowStageKey): WorkflowStage | null {
  const currentStage = getWorkflowStage(stageKey);
  return WORKFLOW_STAGES[currentStage.index - 1] ?? null;
}

export function getNextWorkflowStage(stageKey: WorkflowStageKey): WorkflowStage | null {
  const currentStage = getWorkflowStage(stageKey);
  return WORKFLOW_STAGES[currentStage.index + 1] ?? null;
}

export function getWorkflowActionLabel(stageKey: WorkflowStageKey, processed?: boolean): string {
  const nextStage = getNextWorkflowStage(stageKey);
  const previousStage = getPreviousWorkflowStage(stageKey);

  if (processed) {
    return previousStage ? `Regresar a ${previousStage.label}` : 'Regresar';
  }

  return nextStage ? `Procesar y continuar a ${nextStage.label}` : 'Marcar como procesado';
}

export interface WorkflowSeed {
  nextStage: WorkflowStage | null;
  lookupFilter: Record<string, string>;
  payload: Record<string, string>;
}

function getRecordOffenderId(record: any): string | null {
  return record?.offender?.id ?? record?.cellStay?.offender?.id ?? record?.cellStay?.id_offender ?? record?.id_offender ?? record?.idOffender ?? null;
}

function getRecordCellStayId(record: any): string | null {
  return record?.cellStay?.id ?? record?.id_cell_stay ?? record?.idCellStay ?? null;
}

export function getWorkflowSeed(stageKey: WorkflowStageKey, record: any): WorkflowSeed | null {
  const nextStage = getNextWorkflowStage(stageKey);
  if (!nextStage) {
    return null;
  }

  switch (stageKey) {
    case 'medical-reports':
    case 'psychosocial-reports': {
      const idOffender = getRecordOffenderId(record);
      if (!idOffender) {
        return null;
      }

      return {
        nextStage,
        lookupFilter: { id_offender: `$eq:${idOffender}` },
        payload: { id_offender: idOffender }
      };
    }
    case 'cell-stays': {
      const idCellStay = record?.id ?? getRecordCellStayId(record);
      if (!idCellStay) {
        return null;
      }

      return {
        nextStage,
        lookupFilter: { id_cell_stay: `$eq:${idCellStay}` },
        payload: { id_cell_stay: idCellStay }
      };
    }
    case 'belongings': {
      const idCellStay = getRecordCellStayId(record);
      if (!idCellStay) {
        return null;
      }

      return {
        nextStage,
        lookupFilter: { idCellStay: `$eq:${idCellStay}` },
        payload: { idCellStay }
      };
    }
    case 'freedom-tickets': {
      const idOffender = getRecordOffenderId(record);
      const idCellStay = getRecordCellStayId(record);
      if (!idOffender || !idCellStay) {
        return null;
      }

      return {
        nextStage,
        lookupFilter: { idOffender: `$eq:${idOffender}` },
        payload: { idOffender }
      };
    }
  }

  return null;
}

export function extractCreatedRecordId(response: any): string | null {
  return response?.id ?? response?.data?.id ?? response?.data?.[0]?.id ?? null;
}
