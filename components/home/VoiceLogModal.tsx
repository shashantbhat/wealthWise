import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { CATEGORIES, formatINR } from "../../app/utils/constants";
import { SecondaryButton } from "../ui/secondary-button";
import {BASE_URL} from "../../config/api"

import { startRecording, stopRecording } from "@/app/utils/recordAudio";
import {
  ParsedExpense,
  parseTextToExpenses,
} from "@/app/utils/transcriptToExpenses";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (expenses: {
    category: string;
    description: string;
    amount: number;
  }[]) => void;
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
    const result = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
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
  const [parsedExpenses, setParsedExpenses] = useState<ParsedExpense[]>([]);
  const [isParsing, setIsParsing] = useState(false);

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

      const response = await fetch(`${BASE_URL}/transcribe`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.text) {
        setVoiceInput(data.text);
        await parseExpensesFromText(data.text);
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

  const parseExpensesFromText = async (text: string) => {
    setIsParsing(true);
    try {
      const result = await parseTextToExpenses(text);
      if (result.success && result.expenses) {
        setParsedExpenses(result.expenses);
        console.log("✅ Parsed Expenses:", result.expenses);
      }
    } catch (err) {
      console.error("Error parsing expenses:", err);
      setParsedExpenses([]);
    } finally {
      setIsParsing(false);
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
      setAudioUri(uri);
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
        `Expense of ${formatINR(amount)} logged! \n\nYour ${category} budget will be exceeded.`,
      );
    }
  };

  const handleCancel = () => {
    setVoiceInput("");
    setAudioUri(null);
    setIsRecording(false);
    setParsedExpenses([]);
    onClose();
  };

  const handleLogParsedExpenses = () => {
    if (parsedExpenses.length === 0) {
      Alert.alert("Error", "No expenses to log");
      return;
    }

    // Log each parsed expense
    let budgetWarnings: string[] = [];
    onSubmit(parsedExpenses);
    parsedExpenses.forEach((expense) => {
      // Check for budget warnings
      const currentCategorySpend = spendingByCategory[expense.category] || 0;
      const newCategorySpend = currentCategorySpend + expense.amount;
      const categoryBudget = budgets[expense.category];
      if (categoryBudget && newCategorySpend > categoryBudget) {
        budgetWarnings.push(
          `${expense.category}: ${formatINR(expense.amount)}`,
        );
      }
    });

    setVoiceInput("");
    setAudioUri(null);
    setParsedExpenses([]);
    onClose();

    // Show success message
    if (budgetWarnings.length > 0) {
      Alert.alert(
        "⚠️ Budget Alerts",
        `${parsedExpenses.length} expense(s) logged!\n\nBudget exceeded for: ${budgetWarnings.join(", ")}`,
      );
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <View style={styles.modalOverlay}>
        {/* ✅ Wrapper groups close button + sheet so they slide together */}
        <View style={styles.modalWrapper}>
          {/* ✅ Close button outside the white sheet, top-right, in normal flow */}
          <TouchableOpacity
              onPress={handleCancel}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle-outline" size={32} color="black" />
            </TouchableOpacity>

          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Voice Expense Logger</Text>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.voiceModalScroll}
            >
              <View style={styles.voiceInfo}>
                <Text style={styles.voiceInfoText}>
                  Just say what you bought, and get it all logged
                </Text>
                <Text style={styles.voiceExample}>
                  Example: "I bought pizza for 350 with a coke for 90 rupees..."
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.recordBtn,
                  isRecording && styles.recordBtnActive,
                ]}
                onPress={
                  isRecording ? handleStopRecording : handleStartRecording
                }
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
                <View>
                  <View style={styles.voiceInputBox}>
                    <Text style={styles.voiceInputLabel}>Recognized Text:</Text>
                    <TextInput
                      style={styles.voiceInputField}
                      value={voiceInput}
                      onChangeText={setVoiceInput}
                      multiline
                    />
                  </View>
                  {isParsing ? (
                    <View style={styles.parsingBox}>
                      <ActivityIndicator size="small" color="#1A1A1A" />
                      <Text style={styles.parsingText}>
                        Parsing expenses...
                      </Text>
                    </View>
                  ) : parsedExpenses.length > 0 ? (
                    <View style={styles.parsedExpensesBox}>
                      <Text style={styles.parsedExpensesLabel}>
                        Parsed Expenses ({parsedExpenses.length}):
                      </Text>
                      {parsedExpenses.map((expense, index) => (
                        <View key={index} style={styles.expenseCard}>
                          <View style={styles.expenseHeader}>
                            <Text style={styles.expenseCategory}>
                              {expense.category}
                            </Text>
                            <Text style={styles.expenseAmount}>
                              ₹{expense.amount.toFixed(2)}
                            </Text>
                          </View>
                          <Text style={styles.expenseDescription}>
                            {expense.description}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.noExpensesBox}>
                      <Text style={styles.noExpensesText}>
                        No expenses detected in the transcript
                      </Text>
                    </View>
                  )}
                </View>
              ) : null}
            </ScrollView>

            {/* Log Button - Only show if parsed expenses exist */}
            {parsedExpenses.length > 0 && (
              <SecondaryButton
                text={`Log ${parsedExpenses.length} Expense${parsedExpenses.length !== 1 ? "s" : ""}`}
                onPress={handleLogParsedExpenses}
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  // ✅ Groups close button + white sheet in normal vertical flow
  modalWrapper: {
    width: "100%",
  },
  // ✅ Sits above the white sheet, aligned to the right
  closeBtn: {
    alignSelf: "flex-end",
    marginRight: 16,
    marginBottom: 8,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "100%",
  },
  modalHeader: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
  },
  voiceModalScroll: {
    marginBottom: 16,
  },
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
  parsingBox: {
    backgroundColor: "#F0F0F0",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  parsingText: {
    color: "#666666",
    fontSize: 14,
    fontWeight: "500",
  },
  parsedExpensesBox: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
  },
  parsedExpensesLabel: {
    color: "#1A1A1A",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
  },
  expenseCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  expenseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  expenseCategory: {
    color: "#1A1A1A",
    fontSize: 14,
    fontWeight: "600",
  },
  expenseAmount: {
    color: "black",
    fontSize: 16,
    fontWeight: "700",
  },
  expenseDescription: {
    color: "#666666",
    fontSize: 12,
    fontStyle: "italic",
  },
  noExpensesBox: {
    backgroundColor: "#FFF3CD",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FFE69C",
  },
  noExpensesText: {
    color: "#856404",
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
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
});
