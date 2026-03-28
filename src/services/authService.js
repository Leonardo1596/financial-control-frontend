import { NativeBiometric } from 'capacitor-native-biometric';

const BIOMETRIC_SERVER = "financial_app";

export const authService = {

  async saveToken(token) {
    await NativeBiometric.setCredentials({
      username: "user",
      password: token,
      server: BIOMETRIC_SERVER
    });
  },

  async getToken() {
    try {
      const creds = await NativeBiometric.getCredentials({
        server: BIOMETRIC_SERVER
      });

      return creds.password;
    } catch (err) {
      return null;
    }
  },

  async hasBiometric() {
    try {
      const result = await NativeBiometric.isAvailable();
      return result.isAvailable;
    } catch {
      return false;
    }
  },

  async authenticateWithBiometric() {
    try {
      await NativeBiometric.verifyIdentity({
        reason: "Desbloquear app"
      });
      return true;
    } catch {
      return false;
    }
  },

  async clear() {
    await NativeBiometric.deleteCredentials({
      server: BIOMETRIC_SERVER
    });
  }
};