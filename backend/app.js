import dotenv from "dotenv";
dotenv.config();

import { createClient } from "@deepgram/sdk";
import cors from "cors";
import express from "express";
import fs from "fs";
import multer from "multer";
import {
  parseMultipleTranscripts,
  parseTranscriptToExpenses,
} from "./parseExpenses.js";

const app = express();

app.use(cors());
app.use(express.json());

const upload = multer({ dest: "/tmp/uploads/" }); // IMPORTANT for Lambda

// Deepgram client
if (!process.env.DEEPGRAM_API_KEY) {
  console.error("❌ DEEPGRAM_API_KEY is missing");
}

// Gemini Key
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is missing");
}

const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

app.get("/", (req, res) => {
  res.send("backend running...");
});

// TRANSCRIBE AUDIO
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
      return res.status(500).json({ error: "Transcript not found" });
    }

    res.json({ success: true, text: transcript });
  } catch (error) {
    console.error("Deepgram transcription error:", error);
    res.status(500).json({ error: "Failed to transcribe audio" });
  }
});

// PARSE EXPENSES
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
    res.status(500).json({
      success: false,
      error: "Failed to parse expenses from transcript",
      details: error.message,
    });
  }
});

// BATCH PARSE
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
    res.status(500).json({
      success: false,
      error: "Failed to parse batch expenses",
      details: error.message,
    });
  }
});

// POSITIONS
app.get("/positions", async (req, res) => {
  try {
    const { apiKey } = req.query;

    if (!apiKey || typeof apiKey !== "string") {
      return res.status(400).json({
        error: "API key is required as query parameter",
      });
    }

    const response = await fetch("https://api.dhan.co/v2/positions", {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "access-token": apiKey,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.message || "Failed to fetch positions from Dhan API",
      });
    }

    res.json({
      success: true,
      data: data.data || data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch positions",
      details: error.message,
    });
  }
});

export default app;