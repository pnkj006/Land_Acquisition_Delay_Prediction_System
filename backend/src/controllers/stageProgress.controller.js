const stageProgressService = require('../services/stateProgress.service');
const { sendSuccess } = require('../utils/response');

exports.getStageProgress = async (req, res, next) => {
  try {
    const result = await stageProgressService.getStageProgress(
      req.params.projectId,
      req.user
    );

    return sendSuccess(
      res,
      result,
      'Stage progress retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
};

exports.updateStageProgress = async (req, res, next) => {
  try {
    const result = await stageProgressService.updateStageProgress(
      req.params.projectId,
      req.body,
      req.user
    );

    return sendSuccess(
      res,
      result,
      'Stage progress updated successfully'
    );
  } catch (err) {
    next(err);
  }
};