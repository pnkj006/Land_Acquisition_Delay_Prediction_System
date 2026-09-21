/**
 * @fileoverview Swagger configuration for express-jsdoc-swagger
 */

const options = {
  info: {
    version: '1.0.0',
    title: 'Land Acquisition Delay Prediction API',
    description: 'API for managing projects, predicting risks, and tracking status.',
  },
  security: {
    BearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    },
  },
  baseDir: __dirname,
  filesPattern: ['../routes/*.js', '../controllers/*.js'],
  swaggerUIPath: '/api-docs',
  exposeSwaggerUI: true,
  exposeApiDocs: false,
  apiDocsPath: '/v3/api-docs',
  notRequiredAsNullable: false,
  swaggerUiOptions: {},
  multiple: true,
};

module.exports = options;
