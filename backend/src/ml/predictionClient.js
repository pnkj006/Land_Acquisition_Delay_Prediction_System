/**
 * @fileoverview ML Prediction Client.
 */
const logger = require('../config/logger');
const axios = require('axios');
const prisma = require('../config/database');

exports.triggerRiskPrediction = async (projectId) => {
  logger.info(`[STUB] triggerRiskPrediction called for project ${projectId}`);
  
  // Example of how the real integration calls the FastAPI service:
  try {
    const mlApiUrl = process.env.ML_API_URL || 'http://localhost:8000';
    
    // In a real flow, you'd fetch the project data from prisma and build the payload
    const payload = {
      project_type: 'Road',
      land_area_hectares: 100,
      number_of_affected_families: 50,
    };

    // The FastAPI call requires the X-Internal-Token env var to match
    const response = await axios.post(`${mlApiUrl}/predict`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': process.env.X_INTERNAL_TOKEN
      }
    });
    
    // logger.info('Prediction success', response.data);
  } catch (error) {
    logger.error('Prediction failed or ML service down (MOCKED behavior)', error.message);
  }

  return { status: 'mocked_success' };
};
