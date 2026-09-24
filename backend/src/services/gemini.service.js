const { GoogleGenAI } = require('@google/genai')

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
})

async function generateRecommendations(projectContext) {
  const prompt = `
You are an assistant for a government land acquisition project management system.

Analyze the following project data and provide practical corrective recommendations.

IMPORTANT RULES:
- Use only the information provided.
- Do not invent missing facts.
- Recommendations must be specific to this project.
- Focus on actions a project manager can actually take.
- Return 3 recommendations.
- Assign each recommendation a priority: HIGH, MEDIUM, or LOW.

PROJECT DATA:
${JSON.stringify(projectContext, null, 2)}
`

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            recommendation: {
              type: 'string',
            },
            priority: {
              type: 'string',
              enum: ['HIGH', 'MEDIUM', 'LOW'],
            },
          },
          required: ['recommendation', 'priority'],
        },
      },
    },
  })

  return JSON.parse(response.text)
}

module.exports = {
  generateRecommendations,
}