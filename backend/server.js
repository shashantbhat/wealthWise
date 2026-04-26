import { createClient } from "@deepgram/sdk";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import multer from "multer";
import { parseTranscriptToExpenses } from "./parseExpenses.js";
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

// Deepgram client
if (!process.env.DEEPGRAM_API_KEY) {
  console.error("❌ DEEPGRAM_API_KEY is missing in .env");
  process.exit(1);
}

const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

app.get("/", (req, res) => {
  res.send("Deepgram backend running...");
});

// ----------------- TRANSCRIBE AUDIO -----------------
app.post("/transcribe", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const audioPath = req.file.path;
    const audioBuffer = fs.readFileSync(audioPath);

    const response = await deepgram.listen.prerecorded.transcribeFile(
      audioBuffer,
      {
        model: "nova-2",
        smart_format: true,
        language: "en",
      }
    );

    fs.unlinkSync(audioPath);

    const transcript =
      response?.result?.results?.channels?.[0]?.alternatives?.[0]?.transcript;

    if (!transcript) {
      console.log("Deepgram response:", JSON.stringify(response, null, 2));
      return res.status(500).json({ error: "Transcript not found" });
    }

    res.json({ success: true, text: transcript });
  } catch (error) {
    console.error("Deepgram transcription error:", error);
    res.status(500).json({ error: "Failed to transcribe audio" });
  }
});

// ----------------- PARSE EXPENSES -----------------
app.post("/parse-expenses", async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript || typeof transcript !== "string") {
      return res.status(400).json({
        error: "Transcript is required and must be a string",
      });
    }

    const expenses = await parseTranscriptToExpenses(transcript);

    res.json({
      success: true,
      transcript,
      expenses,
      count: expenses.length,
    });
  } catch (error) {
    console.error("Error parsing expenses:", error);

    res.status(500).json({
      success: false,
      error: "Failed to parse expenses from transcript",
      details: error.message,
    });
  }
});

// ----------------- BATCH PARSE -----------------
app.post("/parse-expenses-batch", async (req, res) => {
  try {
    const { transcripts } = req.body;

    if (!Array.isArray(transcripts) || transcripts.length === 0) {
      return res.status(400).json({
        error: "Transcripts array is required and must not be empty",
      });
    }

    const expenses = await parseMultipleTranscripts(transcripts);

    res.json({
      success: true,
      transcriptCount: transcripts.length,
      expenses,
      totalExpenses: expenses.length,
    });
  } catch (error) {
    console.error("Error parsing batch expenses:", error);

    res.status(500).json({
      success: false,
      error: "Failed to parse batch expenses",
      details: error.message,
    });
  }
});

// ----------------- START SERVER -----------------
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});