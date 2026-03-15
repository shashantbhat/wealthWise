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
} from "react-native";
import { CATEGORIES, formatINR } from "./constants";

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

export function VoiceLogModal({
  visible,
  onClose,
  onSubmit,
  budgets,
  spendingByCategory,
}: Props) {
  const [voiceInput, setVoiceInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const handleLog = () => {
    if (!voiceInput.trim()) {
      Alert.alert("Error", "Please say or enter your expense");
      return;
    }
    const parts = voiceInput.toLowerCase().trim().split(" ");
    const amount = parseFloat(parts[0]);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Error", "Please start with the expense amount");
      return;
    }

    let category = "Other";
    const voiceWords = parts.slice(1).join(" ");
    for (const cat of CATEGORIES) {
      if (voiceWords.includes(cat.toLowerCase())) {
        category = cat;
        break;
      }
    }

    const description = voiceInput.substring(voiceInput.search(/\D/));
    const currentCategorySpend = spendingByCategory[category] || 0;
    const newCategorySpend = currentCategorySpend + amount;
    const categoryBudget = budgets[category];
    const willExceed = newCategorySpend > categoryBudget;

    onSubmit({ category, description: description || category, amount });
    setVoiceInput("");
    setIsRecording(false);
    onClose();

    if (willExceed) {
      Alert.alert(
        "⚠️ Budget Alert",
        `Expense of ${formatINR(amount)} logged! \n\nYour ${category} budget (${formatINR(categoryBudget)}) will be exceeded by ${formatINR(newCategorySpend - categoryBudget)}`,
      );
    } else {
      Alert.alert(
        "Success",
        `Expense of ${formatINR(amount)} logged successfully!`,
      );
    }
  };

  const handleCancel = () => {
    setVoiceInput("");
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
              <Text style={styles.voiceInfoText}>
                Say the amount and category
              </Text>
              <Text style={styles.voiceExample}>
                Example: &quot;₹500 food&quot; or &quot;₹2500 shopping&quot;
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.recordBtn, isRecording && styles.recordBtnActive]}
              onPress={() => setIsRecording(!isRecording)}
            >
              <Ionicons
                name="mic-outline"
                size={40}
                color={isRecording ? "#555555" : "#1A1A1A"}
              />
              <Text style={styles.recordBtnText}>
                {isRecording ? "Stop Recording" : "Start Recording"}
              </Text>
            </TouchableOpacity>

            {voiceInput ? (
              <View style={styles.voiceInputBox}>
                <Text style={styles.voiceInputLabel}>You said:</Text>
                <TextInput
                  style={styles.voiceInputField}
                  value={voiceInput}
                  onChangeText={setVoiceInput}
                  placeholder="Or type your expense here..."
                  placeholderTextColor="#666"
                />
              </View>
            ) : null}

            {!voiceInput && isRecording ? (
              <View style={styles.recordingIndicator}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingText}>Recording...</Text>
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.modalButtons}>
            <Button
              text="Cancel"
              onPress={handleCancel}
              style={styles.modalButton}
            />
            <Button
              text={voiceInput ? "Log Expense" : "Skip"}
              onPress={voiceInput ? handleLog : handleCancel}
              style={styles.modalButton}
            />
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
  recordingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 20,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#555555",
  },
  recordingText: {
    color: "#555555",
    fontSize: 14,
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
