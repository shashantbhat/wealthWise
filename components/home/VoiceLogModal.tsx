import { Button } from "@/components/ui/primary-button";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { CATEGORIES, formatINR } from "./constants";

// ✅ Import recordAudio helpers
import { startRecording, stopRecording } from "@/app/utils/recordAudio"

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (expense: {
    category: string;
    description: string;
    amount: number;
  }) => void;
  budgets: Record<string, number>;
  spendingByCategory: Record<string, number>;
};

import { Audio } from "expo-av";

let sound: Audio.Sound | null = null;

export async function playRecording(uri: string) {
  try {
    if (sound) {
      await sound.unloadAsync();
      sound = null;
    }

    const result = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true }
    );

    sound = result.sound;
  } catch (error) {
    console.log("Error playing recording:", error);
  }
}

export async function stopPlayback() {
  try {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      sound = null;
    }
  } catch (error) {
    console.log("Error stopping playback:", error);
  }
}

export function VoiceLogModal({
  visible,
  onClose,
  onSubmit,
  budgets,
  spendingByCategory,
}: Props) {
  const [voiceInput, setVoiceInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);

  const transcribeAudio = async (uri: string) => {
    setIsTranscribing(true);

    try {
      const formData = new FormData();

      // @ts-ignore
      formData.append("file", {
        uri,
        name: "audio.m4a",
        type: "audio/m4a",
      });

      // ⚠️ Use your laptop IP (not localhost)
      const response = await fetch("http://192.168.1.6:5001/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.text) {
        setVoiceInput(data.text);
      } else {
        Alert.alert("Transcription Error", "Could not understand audio.");
      }
    } catch (err) {
      console.log(err);
      Alert.alert("Network Error", "Failed to connect to backend.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleStartRecording = async () => {
    const started = await startRecording();
    if (started) {
      setIsRecording(true);
    } else {
      Alert.alert("Error", "Could not start recording.");
    }
  };

  const handleStopRecording = async () => {
    setIsRecording(false);

    const uri = await stopRecording();
    if (uri) {
      setAudioUri(uri); // ✅ store uri here
      transcribeAudio(uri);
    } else {
      Alert.alert("Error", "Could not stop recording properly.");
    }
  };

  const handleLog = () => {
    if (!voiceInput.trim()) {
      Alert.alert("Error", "Please say or enter your expense");
      return;
    }

    const cleanInput = voiceInput.replace(/[₹,]/g, "").trim();
    const parts = cleanInput.toLowerCase().split(" ");

    const amount = parseFloat(parts.find((p) => !isNaN(parseFloat(p))) || "0");

    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Error", "Could not find a valid amount in your input.");
      return;
    }

    let category = "Other";

    for (const cat of CATEGORIES) {
      if (cleanInput.toLowerCase().includes(cat.toLowerCase())) {
        category = cat;
        break;
      }
    }

    const description = cleanInput;
    const currentCategorySpend = spendingByCategory[category] || 0;
    const newCategorySpend = currentCategorySpend + amount;
    const categoryBudget = budgets[category];
    const willExceed = categoryBudget && newCategorySpend > categoryBudget;

    onSubmit({ category, description: description || category, amount });
    setVoiceInput("");
    onClose();

    if (willExceed) {
      Alert.alert(
        "⚠️ Budget Alert",
        `Expense of ${formatINR(amount)} logged! \n\nYour ${category} budget will be exceeded.`
      );
    }
  };

  const handleCancel = () => {
    setVoiceInput("");
    setAudioUri(null);
    setIsRecording(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Log Expense by Voice</Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.voiceModalScroll}
          >
            <View style={styles.voiceInfo}>
              <Text style={styles.voiceInfoText}>Say the amount and category</Text>
              <Text style={styles.voiceExample}>
                Example: "500 for food" or "2500 for shopping"
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.recordBtn, isRecording && styles.recordBtnActive]}
              onPress={isRecording ? handleStopRecording : handleStartRecording}
              disabled={isTranscribing}
            >
              {isTranscribing ? (
                <ActivityIndicator size="large" color="#1A1A1A" />
              ) : (
                <Ionicons
                  name={isRecording ? "stop-circle" : "mic-outline"}
                  size={40}
                  color={isRecording ? "#FF4444" : "#1A1A1A"}
                />
              )}

              <Text style={styles.recordBtnText}>
                {isTranscribing
                  ? "Processing..."
                  : isRecording
                  ? "Stop Recording"
                  : "Start Recording"}
              </Text>
            </TouchableOpacity>

            {voiceInput ? (
              <View style={styles.voiceInputBox}>
                <Text style={styles.voiceInputLabel}>Recognized Text:</Text>
                <TextInput
                  style={styles.voiceInputField}
                  value={voiceInput}
                  onChangeText={setVoiceInput}
                  multiline
                />
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.modalButtons}>
            <Button text="Cancel" onPress={handleCancel} style={styles.modalButton} />
            <Button
              text={voiceInput ? "Log Expense" : "Close"}
              onPress={voiceInput ? handleLog : handleCancel}
              style={styles.modalButton}
              disabled={isTranscribing}
            />
            <Button
              text="Play Recording"
              onPress={() => {
                if (audioUri) playRecording(audioUri);
              }}
            />

            <Button text="Stop" onPress={stopPlayback} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "90%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 20,
    textAlign: "center",
  },
  voiceModalScroll: { marginBottom: 16 },
  voiceInfo: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  voiceInfoText: {
    color: "#1A1A1A",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  voiceExample: {
    color: "#666666",
    fontSize: 12,
    fontStyle: "italic",
  },
  recordBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  recordBtnActive: {
    borderColor: "#555555",
    backgroundColor: "#F0F0F0",
  },
  recordBtnText: {
    color: "#1A1A1A",
    fontSize: 16,
    fontWeight: "600",
  },
  voiceInputBox: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  voiceInputLabel: {
    color: "#999999",
    fontSize: 12,
    marginBottom: 8,
    fontWeight: "500",
  },
  voiceInputField: {
    backgroundColor: "#FAFAFA",
    borderRadius: 8,
    padding: 12,
    color: "#1A1A1A",
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  modalButton: { flex: 1 },
});