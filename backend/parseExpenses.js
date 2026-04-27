import { GoogleGenerativeAI } from "@google/generative-ai";

const CATEGORY_LIST = [
  "Food",
  "Travel",
  "Shopping",
  "Health",
  "Entertainment",
  "Accommodation",
  "Wellness",
  "Bills",
  "Education",
  "Other",
];

let genAI = null;

function initializeGenAI() {
  if (genAI) return genAI;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("❌ GEMINI_API_KEY missing in env");
  }

  genAI = new GoogleGenerativeAI(apiKey);
  return genAI;
}

export async function parseTranscriptToExpenses(transcript) {
  if (!transcript || transcript.trim().length === 0) return [];

  const ai = initializeGenAI();
  const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
You are an expense extraction assistant.

Extract ALL expenses from the transcript below.
Return ONLY a valid JSON array.

Each object must contain:
- amount (number)
- category (one of: ${CATEGORY_LIST.join(", ")})
- description (short string)

Rules:
- If multiple expenses exist, return multiple objects.
- Ignore OTPs, dates, phone numbers, and irrelevant numbers.
- If category is unclear, use "Other".
- Keep description under 80 characters.
- Output must be ONLY JSON (no explanation, no markdown).

Transcript:
"${transcript}"
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Gemini sometimes wraps JSON inside ```json ... ```
    const cleaned = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const expenses = JSON.parse(cleaned);

    if (!Array.isArray(expenses)) return [];

    return expenses
      .filter((e) => typeof e.amount === "number" && e.amount > 0)
      .map((e) => ({
        amount: parseFloat(Number(e.amount).toFixed(2)),
        category: CATEGORY_LIST.includes(e.category) ? e.category : "Other",
        description: (e.description || "").toString().slice(0, 80),
      }));
  } catch (err) {
    console.error("Gemini parsing failed:", err);
    return [];
  }
}

export async function parseMultipleTranscripts(transcripts) {
  const results = [];

  for (const transcript of transcripts) {
    const expenses = await parseTranscriptToExpenses(transcript);
    results.push(...expenses);
  }

  return results;
}
