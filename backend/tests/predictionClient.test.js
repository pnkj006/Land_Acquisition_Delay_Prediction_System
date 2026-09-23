const { triggerRiskPrediction } = require('../src/ml/predictionClient');
const axios = require('axios');

jest.mock('axios');

describe('predictionClient', () => {
  let originalEnv;

  beforeAll(() => {
    originalEnv = process.env.X_INTERNAL_TOKEN;
    process.env.X_INTERNAL_TOKEN = 'test-token';
  });

  afterAll(() => {
    process.env.X_INTERNAL_TOKEN = originalEnv;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('G2. Should send X-Internal-Token header when calling ML service', async () => {
    axios.post.mockResolvedValueOnce({ data: { status: 'success' } });

    await triggerRiskPrediction(1);

    expect(axios.post).toHaveBeenCalled();
    const config = axios.post.mock.calls[0][2];
    expect(config.headers).toHaveProperty('X-Internal-Token', 'test-token');
  });
});
