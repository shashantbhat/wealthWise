import { Audio } from "expo-av";

let recording: Audio.Recording | null = null;

export async function startRecording() {
  try {
    // Ask permission
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) {
      throw new Error("Microphone permission not granted");
    }

    // Configure audio mode
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    // Create new recording instance
    recording = new Audio.Recording();

    // Prepare recording settings (m4a format)
    await recording.prepareToRecordAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );

    // Start recording
    await recording.startAsync();

    console.log("Recording started...");
    return true;
  } catch (error) {
    console.log("Error starting recording:", error);
    return false;
  }
}

export async function stopRecording() {
  try {
    if (!recording) {
      throw new Error("No active recording found");
    }

    console.log("Stopping recording...");

    await recording.stopAndUnloadAsync();

    const uri = recording.getURI(); // local file URI
    recording = null;

    if (!uri) {
      throw new Error("Recording URI not found");
    }

    console.log("Recording saved at:", uri);

    return uri;
  } catch (error) {
    console.log("Error stopping recording:", error);
    return null;
  }
}