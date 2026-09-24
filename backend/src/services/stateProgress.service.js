const prisma = require('../config/database');
const { assertProjectInScope } = require('../utils/scope');
const { resolveProjectWhere } = require('../utils/resolveProject');

const STAGES = [
  'NOTIFICATION',
  'APPROVAL',
  'LAND_ACQUISITION',
  'COMPENSATION',
  'REHABILITATION',
  'POSSESSION',
];

async function getScopedProject(projectIdParam, user) {
  const where = resolveProjectWhere(projectIdParam);

  const project = await prisma.project.findFirst({
    where,
  });

  if (!project) {
    const err = new Error('Project not found');
    err.statusCode = 404;
    err.code = 'PROJECT_NOT_FOUND';
    throw err;
  }

  return assertProjectInScope(user, project.id);
}

exports.getStageProgress = async (projectIdParam, user) => {
  const project = await getScopedProject(projectIdParam, user);

  const progressRows = await prisma.stageProgress.findMany({
    where: {
      project_id: project.id,
    },
    orderBy: {
      id: 'asc',
    },
  });

  const progressMap = new Map(
    progressRows.map((row) => [row.stage, row.progress_pct])
  );

  const stages = STAGES.map((stage) => ({
    stage,
    progressPct: progressMap.get(stage) ?? 0,
  }));

  return {
    projectId: project.project_id,
    currentStage: project.current_stage,
    stages,
    updatedAt: project.updated_at,
  };
};

exports.updateStageProgress = async (
  projectIdParam,
  data,
  user
) => {
  const project = await getScopedProject(projectIdParam, user);

  const { stage, progressPct } = data;

  const stageIndex = STAGES.indexOf(stage);

  if (stageIndex === -1) {
    const err = new Error('Invalid project stage');
    err.statusCode = 400;
    err.code = 'INVALID_STAGE';
    throw err;
  }

  if (
    typeof progressPct !== 'number' ||
    progressPct < 0 ||
    progressPct > 100
  ) {
    const err = new Error(
      'progressPct must be a number between 0 and 100'
    );
    err.statusCode = 400;
    err.code = 'INVALID_PROGRESS';
    throw err;
  }

  await prisma.$transaction(async (tx) => {
    await tx.project.update({
      where: {
        id: project.id,
      },
      data: {
        current_stage: stage,
      },
    });

    for (let i = 0; i < STAGES.length; i++) {
      const currentStage = STAGES[i];

      let progress;

      if (i < stageIndex) {
        progress = 100;
      } else if (i === stageIndex) {
        progress = progressPct;
      } else {
        progress = 0;
      }

      await tx.stageProgress.upsert({
        where: {
          project_id_stage: {
            project_id: project.id,
            stage: currentStage,
          },
        },
        update: {
          progress_pct: progress,
          updated_by: user.id,
        },
        create: {
          project_id: project.id,
          stage: currentStage,
          progress_pct: progress,
          updated_by: user.id,
        },
      });
    }
  });

  const progressRows = await prisma.stageProgress.findMany({
    where: {
      project_id: project.id,
    },
    orderBy: {
      id: 'asc',
    },
  });

  return {
    projectId: project.project_id,
    currentStage: stage,
    stages: progressRows.map((row) => ({
      stage: row.stage,
      progressPct: row.progress_pct,
    })),
    updatedAt: new Date(),
  };
};