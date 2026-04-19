import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import dotenv from "dotenv";
import { createClient } from "@deepgram/sdk";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

app.get("/", (req, res) => {
  res.send("Deepgram backend running...");
});

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

    res.json({ text: transcript });
  } catch (error) {
    console.error("Deepgram transcription error:", error);
    res.status(500).json({ error: "Failed to transcribe audio" });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});