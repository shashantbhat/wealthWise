import { startRecording, stopRecording } from "./recordAudio";
import { addExpense } from "./expenseStorage";
import type { ExpenseCategory } from "./expenseStorage";

const BACKEND_URL = "http://10.62.38.33:5001"; // Match your laptop IP

/**
 * Record audio and transcribe it to text
 * @returns {Promise<string>} The transcribed text
 */
export async function recordAndTranscribe(): Promise<string> {
  try {
    // Start recording
    const started = await startRecording();
    if (!started) {
      throw new Error("Failed to start recording");
    }

    // Note: The UI should handle the stop trigger (e.g., button press)
    // This function should be called after stopping

    return "Recording started - call stopAndTranscribe() when done";
  } catch (error) {
    console.error("Error in recordAndTranscribe:", error);
    throw error;
  }
}

/**
 * Stop recording, transcribe audio, and parse expenses
 * @returns {Promise<Object>} Object containing transcript and parsed expenses
 */
export async function stopAndTranscribe(): Promise<any> {
  try {
    // Stop recording and get the file URI
    const recordingUri = await stopRecording();
    if (!recordingUri) {
      throw new Error("Failed to stop recording");
    }

    // Create FormData to send audio file
    const formData = new FormData();
    const response = await fetch(recordingUri);
    const blob = await response.blob();
    formData.append("file", blob, "audio.m4a");

    // Send to backend for transcription
    const transcribeResponse = await fetch(`${BACKEND_URL}/transcribe`, {
      method: "POST",
      body: formData,
    });

    if (!transcribeResponse.ok) {
      throw new Error("Failed to transcribe audio");
    }

    const transcribeData = await transcribeResponse.json();
    const transcript = transcribeData.text;

    if (!transcript) {
      throw new Error("No transcript received");
    }

    // Parse expenses from transcript
    const expensesResponse = await fetch(`${BACKEND_URL}/parse-expenses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ transcript }),
    });

    if (!expensesResponse.ok) {
      throw new Error("Failed to parse expenses");
    }

    const expensesData = await expensesResponse.json();

    return {
      success: true,
      transcript,
      expenses: expensesData.expenses,
      expenseCount: expensesData.count,
    };
  } catch (error) {
    console.error("Error in stopAndTranscribe:", error);
    throw error;
  }
}

/**
 * Parse a text string directly into expenses (no recording needed)
 * @param {string} text - The text to parse
 * @returns {Promise<Object>} Object containing parsed expenses
 */
export async function parseTextToExpenses(text: string): Promise<any> {
  try {
    if (!text || text.trim().length === 0) {
      throw new Error("Text is required");
    }

    console.log("🔍 Parsing text:", text);
    console.log("📡 Backend URL:", `${BACKEND_URL}/parse-expenses`);

    const response = await fetch(`${BACKEND_URL}/parse-expenses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ transcript: text }),
    });

    console.log("📊 Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Error response:", errorText);
      throw new Error(`Failed to parse expenses: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("✅ Parsed response:", data);

    return {
      success: true,
      text,
      expenses: data.expenses || [],
      expenseCount: data.count || 0,
    };
  } catch (error) {
    console.error("❌ Error in parseTextToExpenses:", error);
    throw error;
  }
}

/**
 * Batch parse multiple text inputs into expenses
 * @param {string[]} texts - Array of texts to parse
 * @returns {Promise<Object>} Object containing all parsed expenses
 */
export async function batchParseToExpenses(texts: string[]): Promise<any> {
  try {
    if (!Array.isArray(texts) || texts.length === 0) {
      throw new Error("Texts array is required and must not be empty");
    }

    const response = await fetch(`${BACKEND_URL}/parse-expenses-batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ transcripts: texts }),
    });

    if (!response.ok) {
      throw new Error("Failed to parse batch expenses");
    }

    const data = await response.json();

    return {
      success: true,
      textCount: texts.length,
      expenses: data.expenses,
      totalExpenses: data.totalExpenses,
    };
  } catch (error) {
    console.error("Error in batchParseToExpenses:", error);
    throw error;
  }
}

/**
 * Interface for the expense object returned
 */
export interface ParsedExpense {
  amount: number;
  category:
    | "Food"
    | "Travel"
    | "Shopping"
    | "Health"
    | "Entertainment"
    | "Accommodation"
    | "Wellness";
  description: string;
}

/**
 * Save parsed expenses to device storage
 * @param {Array} expenses - Array of parsed expenses to save
 * @returns {Promise<Object>} Result with saved count and details
 */
export async function saveParsedExpenses(expenses: ParsedExpense[]): Promise<any> {
  try {
    if (!Array.isArray(expenses) || expenses.length === 0) {
      return {
        success: true,
        saved: 0,
        message: "No expenses to save",
        expenses: [],
      };
    }

    const savedExpenses = [];
    let errorCount = 0;

    for (const expense of expenses) {
      try {
        // Validate expense data
        if (!expense.amount || expense.amount <= 0) {
          console.warn("Invalid expense amount:", expense);
          errorCount++;
          continue;
        }

        if (!expense.category) {
          console.warn("Invalid expense category:", expense);
          errorCount++;
          continue;
        }

        // Save to AsyncStorage
        await addExpense(
          expense.category as ExpenseCategory,
          expense.amount,
          expense.description || "",
        );

        savedExpenses.push(expense);
      } catch (err) {
        console.error("Error saving individual expense:", err);
        errorCount++;
      }
    }

    return {
      success: errorCount === 0,
      saved: savedExpenses.length,
      failed: errorCount,
      expenses: savedExpenses,
      message: `Saved ${savedExpenses.length} expense(s)${
        errorCount > 0 ? ` (${errorCount} failed)` : ""
      }`,
    };
  } catch (error) {
    console.error("Error in saveParsedExpenses:", error);
    throw error;
  }
}

/**
 * Stop recording, transcribe, parse, AND save expenses - All in one!
 * @returns {Promise<Object>} Complete result with transcript, parsed, and saved expenses
 */
export async function recordTranscribeAndSaveExpenses(): Promise<any> {
  try {
    const transcriptionResult = await stopAndTranscribe();

    if (!transcriptionResult.success || !transcriptionResult.expenses) {
      throw new Error("Failed to transcribe or parse expenses");
    }

    // Save the parsed expenses
    const saveResult = await saveParsedExpenses(
      transcriptionResult.expenses,
    );

    return {
      success: saveResult.success,
      transcript: transcriptionResult.transcript,
      expenses: transcriptionResult.expenses,
      expenseCount: transcriptionResult.expenseCount,
      saved: saveResult.saved,
      failed: saveResult.failed,
      message: saveResult.message,
    };
  } catch (error) {
    console.error("Error in recordTranscribeAndSaveExpenses:", error);
    throw error;
  }
}

/**
 * Parse text, convert to expenses, AND save them
 * @param {string} text - The text to parse
 * @returns {Promise<Object>} Result with parsed and saved expenses
 */
export async function parseAndSaveExpenses(text: string): Promise<any> {
  try {
    const parseResult = await parseTextToExpenses(text);

    if (!parseResult.success || !parseResult.expenses) {
      throw new Error("Failed to parse expenses");
    }

    const saveResult = await saveParsedExpenses(parseResult.expenses);

    return {
      success: saveResult.success,
      text,
      expenses: parseResult.expenses,
      expenseCount: parseResult.expenseCount,
      saved: saveResult.saved,
      failed: saveResult.failed,
      message: saveResult.message,
    };
  } catch (error) {
    console.error("Error in parseAndSaveExpenses:", error);
    throw error;
  }
}
