const expressJSDocSwagger = require('express-jsdoc-swagger');
const swaggerOptions = require('../src/config/swagger');
const express = require('express');
const fs = require('fs');

const app = express();
const instance = expressJSDocSwagger(app)(swaggerOptions);

instance.on('finish', (data) => {
  fs.writeFileSync('openapi.json', JSON.stringify(data, null, 2));
  console.log('openapi.json generated successfully');
  process.exit(0);
});
