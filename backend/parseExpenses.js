const CATEGORY_KEYWORDS = {
  Food: ["food", "lunch", "dinner", "breakfast", "restaurant", "snack", "khana"],
  Travel: ["uber", "ola", "cab", "bus", "train", "auto", "taxi", "flight"],
  Shopping: ["shirt", "jeans", "shoes", "clothes", "shopping", "buy", "bought", "purchase", "kapde"],
  Health: ["doctor", "medicine", "hospital", "clinic", "dawai"],
  Entertainment: ["movie", "netflix", "game", "concert", "show"],
  Accommodation: ["hotel", "stay", "room", "hostel"],
  Wellness: ["gym", "spa", "yoga", "massage"],
};

const SPENDING_KEYWORDS = [
  "paid", "spent", "cost", "price", "buy", "bought", "purchase", "for",
  "rupees", "rs", "₹",
  "diya", "kharcha", "liye", "liya", "ka", "ke"
];

export async function parseTranscriptToExpenses(transcript) {
  if (!transcript || transcript.trim().length === 0) return [];

  const text = transcript.toLowerCase();
  const expenses = [];

  const numberRegex = /\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\b/g;
  const matches = [...text.matchAll(numberRegex)];

  for (const match of matches) {
    const amount = parseFloat(match[0].replace(/,/g, ""));
    if (!amount || isNaN(amount)) continue;

    const idx = match.index;
    const startIndex = Math.max(0, idx - 60);
    const endIndex = Math.min(text.length, idx + 60);

    const context = text.substring(startIndex, endIndex);

    const isSpending = SPENDING_KEYWORDS.some((kw) => context.includes(kw));
    if (!isSpending) continue;

    let category = "Shopping"; // default
    for (const cat of Object.keys(CATEGORY_KEYWORDS)) {
      if (CATEGORY_KEYWORDS[cat].some((kw) => context.includes(kw))) {
        category = cat;
        break;
      }
    }

    let description = context
      .replace(match[0], "")
      .replace(/₹|rs|rupees/gi, "")
      .trim();

    if (description.length > 100) description = description.substring(0, 100);

    expenses.push({
      amount: parseFloat(amount.toFixed(2)),
      category,
      description,
    });
  }

  return expenses;
}

// ✅ THIS EXPORT WAS MISSING
export async function parseMultipleTranscripts(transcripts) {
  const results = [];

  for (const transcript of transcripts) {
    const expenses = await parseTranscriptToExpenses(transcript);
    results.push(...expenses);
  }

  return results;
}