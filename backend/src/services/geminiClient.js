const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY || "";

if (!apiKey) {
  console.warn("[Gemini] Missing GEMINI_API_KEY.");
}

let genAI = null;
if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
}

async function generateRecommendations(prompt) {
  if (!genAI) {
    return "Gemini API key not set.";
  }

 
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
  });

  const result = await model.generateContent(prompt);
  return result.response.text();
}

module.exports = { generateRecommendations };