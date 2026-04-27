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
    KeyboardAvoidingView,
    Platform,
    FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BROKER_LIST, BrokerInfo } from "@/app/utils/brokers/brokerConfig";

type Props = {
  visible: boolean;
  onClose: () => void;
  onConnect: (brokerId: string, apiKey: string) => Promise<void>;
  isLoading?: boolean;
};

export function BrokerConnectModal({
  visible,
  onClose,
  onConnect,
  isLoading = false,
}: Props) {
  const [selectedBroker, setSelectedBroker] = useState<BrokerInfo | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    if (!selectedBroker) {
      Alert.alert("Error", "Please select a broker");
      return;
    }

    if (!apiKey.trim()) {
      Alert.alert("Error", "Please enter your API key");
      return;
    }

    setConnecting(true);
    try {
      await onConnect(selectedBroker.id, apiKey);
      Alert.alert("Success", "Account connected successfully!");
      setApiKey("");
      setShowPassword(false);
      setSelectedBroker(null);
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to connect account";
      Alert.alert("Connection Failed", errorMessage);
    } finally {
      setConnecting(false);
    }
  };

  const handleCancel = () => {
    setApiKey("");
    setShowPassword(false);
    setSelectedBroker(null);
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
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.modalTitle}>
                {selectedBroker ? "Enter API Key" : "Connect Account"}
              </Text>
              <TouchableOpacity onPress={handleCancel}>
                <Ionicons name="close" size={24} color="#A9B2C2" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {!selectedBroker ? (
                <View style={styles.brokerListContainer}>
                  <Text style={styles.sectionTitle}>Select Your Broker</Text>
                  <FlatList
                    data={BROKER_LIST}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.brokerItem}
                        onPress={() => setSelectedBroker(item)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.brokerItemContent}>
                          <View style={styles.brokerIcon}>
                            <Ionicons
                              name="business"
                              size={20}
                              color="#4A9EFF"
                            />
                          </View>
                          <Text style={styles.brokerItemName}>
                            {item.displayName}
                          </Text>
                        </View>
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color="#A9B2C2"
                        />
                      </TouchableOpacity>
                    )}
                  />
                </View>
              ) : (
                <View style={styles.apiKeyContainer}>
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => setSelectedBroker(null)}
                  >
                    <Ionicons name="chevron-back" size={20} color="#4A9EFF" />
                    <Text style={styles.backButtonText}>Change Broker</Text>
                  </TouchableOpacity>

                  <View style={styles.selectedBrokerInfo}>
                    <View style={styles.brokerBadge}>
                      <Ionicons
                        name="business"
                        size={24}
                        color="#4A9EFF"
                      />
                    </View>
                    <Text style={styles.selectedBrokerName}>
                      {selectedBroker.displayName}
                    </Text>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>API Key *</Text>
                    <View style={styles.apiKeyInputWrapper}>
                      <TextInput
                        style={styles.apiKeyInput}
                        value={apiKey}
                        onChangeText={setApiKey}
                        placeholder="Enter your API key"
                        placeholderTextColor="#7A8294"
                        secureTextEntry={!showPassword}
                        editable={!connecting}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        disabled={connecting}
                      >
                        <Ionicons
                          name={showPassword ? "eye" : "eye-off"}
                          size={20}
                          color="#A9B2C2"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>

            {selectedBroker && (
              <View style={styles.footer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancel}
                  disabled={connecting}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.connectButton,
                    connecting && styles.connectButtonDisabled,
                  ]}
                  onPress={handleConnect}
                  disabled={connecting}
                >
                  {connecting ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.connectButtonText}>Connect</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1A1A1A",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    maxHeight: "80%",
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  apiKeyInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#242424",
    borderWidth: 1,
    borderColor: "#3A3A3A",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  apiKeyInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#3A3A3A",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#A9B2C2",
  },
  connectButton: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#4A9EFF",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  connectButtonDisabled: {
    opacity: 0.6,
  },
  connectButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  brokerListContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  brokerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#242424",
    borderWidth: 1,
    borderColor: "#3A3A3A",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
  },
  brokerItemContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  brokerIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "rgba(74, 158, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  brokerItemName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  apiKeyContainer: {
    flex: 1,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4A9EFF",
    marginLeft: 4,
  },
  selectedBrokerInfo: {
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: "rgba(74, 158, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(74, 158, 255, 0.15)",
    borderRadius: 12,
    marginBottom: 20,
  },
  brokerBadge: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: "rgba(74, 158, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  selectedBrokerName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
