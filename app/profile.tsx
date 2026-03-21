import { useUser, type Profile } from "@/context/user-context";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1A1A1A",
    letterSpacing: -0.5,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnText: {
    fontSize: 20,
    color: "#1A1A1A",
  },
  content: {
    flex: 1,
    paddingBottom: 24,
  },
  section: {
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#10605A",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1A1A1A",
    minHeight: 48,
  },
  inputRow: {
    flexDirection: "row",
    gap: 12,
  },
  inputRowItem: {
    flex: 1,
  },
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  pickerButtonText: {
    fontSize: 15,
    color: "#1A1A1A",
    fontWeight: "500",
  },
  pickerButtonArrow: {
    fontSize: 18,
    color: "#10605A",
  },
  summaryCard: {
    backgroundColor: "rgba(255, 255, 255, 0.35)",
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 14,
    padding: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255, 255, 255, 0.3)",
  },
  summaryRowLast: {
    borderBottomWidth: 0,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#666666",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  footer: {
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 12 : 20,
    gap: 12,
  },
  saveBtn: {
    backgroundColor: "#10605A",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#10605A",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  cancelBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.6)",
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  alertText: {
    fontSize: 13,
    color: "#666666",
    marginTop: 8,
    fontStyle: "italic",
  },
});

const PERSONAS = ["Student", "Professional", "Entrepreneur", "Retired"];
const RISK_LEVELS = ["Conservative", "Moderate", "Aggressive"];

export default function ProfileScreen() {
  const { profile, setProfile, userName } = useUser();
  const router = useRouter();

  const [editProfile, setEditProfile] = useState<Profile>({ ...profile });
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [showRiskMenu, setShowRiskMenu] = useState(false);

  const handleSave = () => {
    if (editProfile.monthlyIncome < 0) {
      Alert.alert("Error", "Monthly income cannot be negative");
      return;
    }

    if (editProfile.salaryDay < 1 || editProfile.salaryDay > 31) {
      Alert.alert("Error", "Salary day must be between 1 and 31");
      return;
    }

    setProfile(editProfile);
    Alert.alert("Success", "Profile updated successfully!");
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        {/* Personal Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Personal</Text>
          <Text style={styles.sectionTitle}>Your Information</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View
              style={[
                styles.input,
                {
                  backgroundColor: "rgba(0, 0, 0, 0.05)",
                  justifyContent: "center",
                },
              ]}
            >
              <Text
                style={{
                  fontSize: 15,
                  color: "#1A1A1A",
                  fontWeight: "500",
                }}
              >
                {userName || "User"}
              </Text>
            </View>
            <Text style={styles.alertText}>
              Name is set from your onboarding questionnaire and cannot be
              changed
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Persona</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowPersonaMenu(!showPersonaMenu)}
            >
              <Text style={styles.pickerButtonText}>{editProfile.persona}</Text>
              <Text style={styles.pickerButtonArrow}>▼</Text>
            </TouchableOpacity>
            {showPersonaMenu && (
              <View
                style={{
                  marginTop: 6,
                  backgroundColor: "rgba(255, 255, 255, 0.4)",
                  borderWidth: 0.5,
                  borderColor: "rgba(255, 255, 255, 0.6)",
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                {PERSONAS.map((persona) => (
                  <TouchableOpacity
                    key={persona}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderBottomWidth:
                        persona !== PERSONAS[PERSONAS.length - 1] ? 0.5 : 0,
                      borderBottomColor: "rgba(255, 255, 255, 0.3)",
                    }}
                    onPress={() => {
                      setEditProfile({ ...editProfile, persona });
                      setShowPersonaMenu(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.pickerButtonText,
                        {
                          color:
                            persona === editProfile.persona
                              ? "#10605A"
                              : "#1A1A1A",
                          fontWeight:
                            persona === editProfile.persona ? "700" : "500",
                        },
                      ]}
                    >
                      {persona}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Financial Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Financial</Text>
          <Text style={styles.sectionTitle}>Income & Budget</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Monthly Income (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor="#999999"
              keyboardType="numeric"
              value={editProfile.monthlyIncome.toString()}
              onChangeText={(text) =>
                setEditProfile({
                  ...editProfile,
                  monthlyIncome: parseInt(text) || 0,
                })
              }
            />
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputRowItem}>
              <Text style={styles.label}>Salary Day</Text>
              <TextInput
                style={styles.input}
                placeholder="1"
                placeholderTextColor="#999999"
                keyboardType="numeric"
                value={editProfile.salaryDay.toString()}
                onChangeText={(text) =>
                  setEditProfile({
                    ...editProfile,
                    salaryDay: parseInt(text) || 1,
                  })
                }
              />
              <Text style={styles.alertText}>Day of month (1-31)</Text>
            </View>

            <View style={styles.inputRowItem}>
              <Text style={styles.label}>Currency</Text>
              <TouchableOpacity style={styles.pickerButton} disabled>
                <Text style={styles.pickerButtonText}>
                  {editProfile.baseCurrency}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Risk Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Preferences</Text>
          <Text style={styles.sectionTitle}>Risk Profile</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Risk Level</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowRiskMenu(!showRiskMenu)}
            >
              <Text style={styles.pickerButtonText}>
                {editProfile.riskLevel}
              </Text>
              <Text style={styles.pickerButtonArrow}>▼</Text>
            </TouchableOpacity>
            {showRiskMenu && (
              <View
                style={{
                  marginTop: 6,
                  backgroundColor: "rgba(255, 255, 255, 0.4)",
                  borderWidth: 0.5,
                  borderColor: "rgba(255, 255, 255, 0.6)",
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                {RISK_LEVELS.map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderBottomWidth:
                        level !== RISK_LEVELS[RISK_LEVELS.length - 1] ? 0.5 : 0,
                      borderBottomColor: "rgba(255, 255, 255, 0.3)",
                    }}
                    onPress={() => {
                      setEditProfile({ ...editProfile, riskLevel: level });
                      setShowRiskMenu(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.pickerButtonText,
                        {
                          color:
                            level === editProfile.riskLevel
                              ? "#10605A"
                              : "#1A1A1A",
                          fontWeight:
                            level === editProfile.riskLevel ? "700" : "500",
                        },
                      ]}
                    >
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <Text style={styles.alertText}>
              {editProfile.riskLevel === "Conservative"
                ? "Low volatility, stable returns"
                : editProfile.riskLevel === "Moderate"
                  ? "Balanced growth and stability"
                  : "High growth potential, higher volatility"}
            </Text>
          </View>
        </View>

        {/* Summary Card */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Name</Text>
              <Text style={styles.summaryValue}>{userName || "-"}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Persona</Text>
              <Text style={styles.summaryValue}>{editProfile.persona}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Monthly Income</Text>
              <Text style={styles.summaryValue}>
                ₹{editProfile.monthlyIncome.toLocaleString("en-IN")}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Salary Day</Text>
              <Text style={styles.summaryValue}>{editProfile.salaryDay}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Risk Level</Text>
              <Text style={styles.summaryValue}>{editProfile.riskLevel}</Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryRowLast]}>
              <Text style={styles.summaryLabel}>Currency</Text>
              <Text style={styles.summaryValue}>
                {editProfile.baseCurrency}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
