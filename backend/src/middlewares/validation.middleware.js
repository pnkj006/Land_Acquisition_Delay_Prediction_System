/**
 * @fileoverview Generic Joi validation wrapper.
 * Usage: router.post('/', validate(projectCreateSchema), controller.create)
 * By default validates req.body; pass { source: 'query' } for query params.
 */
module.exports = (schema, options = {}) => {
  const source = options.source || 'body';

  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const err = new Error(error.details.map((d) => d.message).join(', '));
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      return next(err);
    }

    req[source] = value;
    next();
  };
};