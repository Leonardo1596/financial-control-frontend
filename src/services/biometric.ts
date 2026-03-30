import { NativeBiometric } from "capacitor-native-biometric";

export async function isBiometricAvailable() {
  try {
    const result = await NativeBiometric.isAvailable();
    return result.isAvailable;
  } catch {
    return false;
  }
}

export async function authenticateWithBiometric() {
  try {
    await NativeBiometric.verifyIdentity({
      reason: "Confirme sua identidade",
      title: "Entre na sua conta",
      subtitle: "Toque no sensor de impressão digital"
    });

    return true;
  } catch {
    return false;
  }
}