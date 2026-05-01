import { ArchivedMonth, MonthlyData } from "./expenseStorageOptimized";

const GEMINI_API_KEY = "AIzaSyDAa6DPPQ5WCsz3l6qqhFy2vDeCXgWh5bw"; // Replace with env variable in production

interface AnalysisResult {
  summary: string;
  spendingPatterns: string;
  projections: string;
  recommendations: string;
  riskAreas: string;
  positives: string;
}

export async function analyzeExpensesWithGemini(
  currentMonth: MonthlyData | null,
  archivedMonths: ArchivedMonth[],
  monthlyIncome: number,
): Promise<AnalysisResult> {
  try {
    // Prepare expense data summary
    const currentExpenses = currentMonth?.monthlyTotal || 0;
    const categoryBreakdown = currentMonth?.categoryBreakdown || {};

    // Calculate historical averages
    let totalHistorical = 0;
    let historicalCategoryBreakdown: Record<string, number> = {};

    archivedMonths.slice(0, 3).forEach((month) => {
      totalHistorical += month.monthlyTotal;
      Object.entries(month.categoryBreakdown).forEach(([cat, amount]) => {
        historicalCategoryBreakdown[cat] =
          (historicalCategoryBreakdown[cat] || 0) + amount;
      });
    });

    const averageMonthlyExpense =
      archivedMonths.length > 0
        ? totalHistorical / Math.min(archivedMonths.length, 3)
        : currentExpenses;

    // Sort categories by spending
    const topCategories = Object.entries(categoryBreakdown)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    // Project yearly savings
    const monthlySpending = (currentExpenses + averageMonthlyExpense) / 2;
    const monthlySavings = Math.max(0, monthlyIncome - monthlySpending);
    const yearlySavings = monthlySavings * 12;
    const yearlyExpenses = monthlySpending * 12;

    // Create a detailed prompt for Gemini
    const prompt = `You are a financial literacy expert and spending coach. Analyze this person's spending data and provide actionable, empowering insights.

FINANCIAL DATA:
- Monthly Income: ₹${monthlyIncome.toLocaleString("en-IN")}
- Current Month Spending: ₹${currentExpenses.toLocaleString("en-IN")}
- Average Monthly Spending (last 3 months): ₹${averageMonthlyExpense.toLocaleString("en-IN")}
- Projected Monthly Savings: ₹${monthlySavings.toLocaleString("en-IN")}
- Projected Yearly Savings: ₹${yearlySavings.toLocaleString("en-IN")}
- Projected Yearly Expenses: ₹${yearlyExpenses.toLocaleString("en-IN")}

TOP SPENDING CATEGORIES:
${topCategories.map(([cat, amount]) => `- ${cat}: ₹${amount.toLocaleString("en-IN")} (${((amount / currentExpenses) * 100).toFixed(1)}%)`).join("\n")}

CURRENT SPENDING BREAKDOWN:
${Object.entries(categoryBreakdown)
  .map(([cat, amount]) => `- ${cat}: ₹${amount.toLocaleString("en-IN")}`)
  .join("\n")}

Please provide analysis in exactly this JSON format with no markdown, no code blocks, and no extra text:
{
  "summary": "A brief 1-2 sentence overview of their financial health",
  "spendingPatterns": "Describe their spending patterns based on the data. What do they spend most on? Is spending increasing or stable?",
  "projections": "If they continue at this rate for a year, what will happen to their savings and expenses? Provide specific numbers.",
  "recommendations": "Provide 2-3 specific, actionable recommendations to improve their financial situation. Make it practical and achievable.",
  "riskAreas": "What spending categories pose the biggest risk to their savings goals? Why?",
  "positives": "What are they doing well? Highlight positive aspects of their spending"
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      },
    );

    const data = await response.json();

    if (!data.candidates || !data.candidates[0]) {
      throw new Error("Invalid Gemini response");
    }

    const responseText =
      data.candidates[0].content.parts[0].text || "Analysis unavailable";

    // Parse the JSON response
    let analysisData;
    try {
      // Try to extract JSON from the response (sometimes Gemini wraps it)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      analysisData = jsonMatch
        ? JSON.parse(jsonMatch[0])
        : JSON.parse(responseText);
    } catch {
      // Fallback if parsing fails
      analysisData = {
        summary: "Analysis in progress",
        spendingPatterns: responseText,
        projections: `If you continue spending ₹${monthlySpending.toLocaleString("en-IN")} monthly, you'll save ₹${yearlySavings.toLocaleString("en-IN")} yearly.`,
        recommendations: "Review your top spending categories and set limits.",
        riskAreas: "Monitor discretionary spending categories.",
        positives: "You're tracking your expenses consistently.",
      };
    }

    return analysisData as AnalysisResult;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
}
