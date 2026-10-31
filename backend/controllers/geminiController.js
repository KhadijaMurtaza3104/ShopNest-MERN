
const { GoogleGenAI } = require("@google/genai");

const generateDescription = async (req, res) => {
  try {
    const {
      name,
      category,
      language = "English",
    } = req.body || {};

    if (
      typeof name !== "string" ||
      !name.trim()
    ) {
      return res.status(400).json({
        message: "Product name is required.",
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        message: "Gemini API key is not configured.",
      });
    }

    const selectedLanguage =
      language === "German" ? "German" : "English";

    const model =
      process.env.GEMINI_MODEL ||
      "gemini-3.1-flash-lite";

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const prompt = `
Write a professional e-commerce product description.

Product name: ${name.trim()}
Category: ${String(category || "General").trim()}
Language: ${selectedLanguage}

Requirements:
- Write in ${selectedLanguage}.
- Use 60 to 100 words.
- Make the description clear and attractive.
- Use only product details supplied above.
- Do not invent specifications, warranties, or certifications.
- Return only the description.
`;

    console.log(
      "[Gemini] Model:",
      model
    );

    const startedAt = Date.now();

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        maxOutputTokens: 250,
        httpOptions: {
          timeout: 45000,
        },
      },
    });

    console.log(
      "[Gemini] Completed in:",
      Date.now() - startedAt,
      "ms"
    );

    const description = response.text?.trim();

    if (!description) {
      return res.status(502).json({
        message:
          "Gemini returned an empty description.",
      });
    }

    return res.status(200).json({
      description,
    });
  } catch (error) {
    console.error(
      "[Gemini] Error:",
      error.message
    );

    console.error(
      "[Gemini] Status:",
      error.status || error.code || "Unknown"
    );

    const details = String(error.message || "");

    if (
      error.status === 504 ||
      /timeout|timed out|deadline|abort/i.test(
        details
      )
    ) {
      return res.status(504).json({
        message:
          "Gemini API timed out. Please try again.",
      });
    }

    if (
      error.status === 429 ||
      /quota|rate limit|resource_exhausted/i.test(
        details
      )
    ) {
      return res.status(429).json({
        message:
          "Gemini API rate limit reached. Try again later.",
      });
    }

    if (
      error.status === 404 ||
      /model.*not found|model.*no longer available/i.test(
        details
      )
    ) {
      return res.status(502).json({
        message:
          "Gemini model unavailable. Check GEMINI_MODEL.",
      });
    }

    return res.status(502).json({
      message:
        "Gemini request failed. Check backend terminal.",
    });
  }
};

module.exports = { generateDescription };
