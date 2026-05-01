import { SuccessModal } from "@/components/SuccessModal";
import { PrimaryButton } from "@/components/ui/primary-button";
import { SecondaryButton } from "@/components/ui/secondary-button";
import { useAuth } from "@/context/auth-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function SignupScreen() {
  const router = useRouter();
  const { signup, login, error } = useAuth();
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const validateInputs = (): boolean => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email");
      return false;
    }
    if (!email.includes("@")) {
      Alert.alert("Error", "Please enter a valid email");
      return false;
    }
    if (!password) {
      Alert.alert("Error", "Please enter a password");
      return false;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return false;
    }
    if (mode === "signup" && password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return false;
    }
    return true;
  };

  const handleAuth = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    try {
      if (mode === "signup") {
        await signup(email.trim(), password);
        setSuccessMessage("Account created successfully");
        setShowSuccess(true);
      } else {
        await login(email.trim(), password);
        setSuccessMessage("Logged in successfully");
        setShowSuccess(true);
      }
    } catch (err: any) {
      Alert.alert(
        mode === "signup" ? "Signup Failed" : "Login Failed",
        err.message || "Authentication failed",
      );
      setLoading(false);
    }
  };

  const handleSuccessDismiss = () => {
    setShowSuccess(false);
    // Navigate after modal dismisses
    router.replace("/onboarding?start=questionnaire");
    setLoading(false);
  };

  return (
    <LinearGradient
      colors={["#000000", "#0f0f0f"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <SafeAreaView style={styles.safeArea}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>
                {mode === "signup" ? "Create Account" : "Log In"}
              </Text>
              <Text style={styles.subtitle}>
                {mode === "signup"
                  ? "Join WealthWise and take control of your finances"
                  : "Welcome back to WealthWise"}
              </Text>
            </View>

            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  mode === "signup" && styles.modeButtonActive,
                ]}
                onPress={() => setMode("signup")}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.modeText,
                    mode === "signup" && styles.modeTextActive,
                  ]}
                >
                  Create Account
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  mode === "login" && styles.modeButtonActive,
                ]}
                onPress={() => setMode("login")}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.modeText,
                    mode === "login" && styles.modeTextActive,
                  ]}
                >
                  Log In
                </Text>
              </TouchableOpacity>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Error Message */}
              {error && (
                <View style={styles.errorContainer}>
                  <MaterialCommunityIcons
                    name="alert-circle"
                    size={20}
                    color="#ef4444"
                  />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputContainer}>
                  <MaterialCommunityIcons
                    name="email-outline"
                    size={20}
                    color="#888"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="your@email.com"
                    placeholderTextColor="#666"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputContainer}>
                  <MaterialCommunityIcons
                    name="lock-outline"
                    size={20}
                    color="#888"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Min 6 characters"
                    placeholderTextColor="#666"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    editable={!loading}
                  />
                  <MaterialCommunityIcons
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                    color="#888"
                    onPress={() => setShowPassword(!showPassword)}
                  />
                </View>
              </View>

              {mode === "signup" && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <View style={styles.inputContainer}>
                    <MaterialCommunityIcons
                      name="lock-outline"
                      size={20}
                      color="#888"
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Re-enter password"
                      placeholderTextColor="#666"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                      editable={!loading}
                    />
                    <MaterialCommunityIcons
                      name={showConfirmPassword ? "eye-off" : "eye"}
                      size={20}
                      color="#888"
                      onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    />
                  </View>
                </View>
              )}
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <PrimaryButton
                text={
                  loading
                    ? mode === "signup"
                      ? "Creating Account..."
                      : "Logging In..."
                    : mode === "signup"
                      ? "Create Account"
                      : "Log In"
                }
                onPress={handleAuth}
                disabled={loading}
              />
              <SecondaryButton
                text="Back"
                onPress={() => router.back()}
                disabled={loading}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>

      <SuccessModal
        visible={showSuccess}
        message={successMessage}
        onDismiss={handleSuccessDismiss}
        duration={2500}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  header: {
    marginBottom: 20,
    marginTop: 20,
  },
  modeToggle: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#2b2b2b",
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    backgroundColor: "#101010",
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  modeButtonActive: {
    backgroundColor: "#1f2937",
  },
  modeText: {
    color: "#9ca3af",
    fontWeight: "600",
    fontSize: 13,
  },
  modeTextActive: {
    color: "#ffffff",
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    marginBottom: 18,
  },
  googleButtonText: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.65,
  },
  separatorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    gap: 10,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#2b2b2b",
  },
  separatorText: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: "#aaa",
    lineHeight: 20,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: "#ef4444",
  },
  errorText: {
    color: "#ef4444",
    marginLeft: 10,
    fontSize: 13,
    flex: 1,
  },
  form: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: "#1a1a1a",
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    color: "#fff",
    fontSize: 14,
  },
  buttonContainer: {
    gap: 12,
    marginTop: "auto",
    marginBottom: 20,
  },
});
