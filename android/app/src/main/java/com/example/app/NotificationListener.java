package com.example.app;

import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.util.Log;

import java.io.IOException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class NotificationListener extends NotificationListenerService {

    private static final String TAG = "NOTIFICATION_LISTENER";
    private static final String NUBANK_PACKAGE = "com.nu.production";
    private static final String RICO_PACKAGE = "br.com.rico.mobile";
    private static final String BACKEND_URL = "https://financial-control-442c.onrender.com/create-transaction";
    private static final String DEFAULT_ACCOUNT_ID = "69bcd19cd9cbab995f39effa";
    private static final String USER_ID = "6978356859d941e97715ea3f"; // Coloque o ObjectId do usuário
    private static final String BEARER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NzgzNTY4NTlkOTQxZTk3NzE1ZWEzZiIsImlhdCI6MTc3NDYxMDgxNCwiZXhwIjoxNzc1MjE1NjE0fQ.t5NELH7Z4XF42AKeHkL6y3Mf2cP8alUYZQCXuyUbcmw"; // Coloque o Bearer token válido

    private OkHttpClient client = new OkHttpClient();
    private String lastNotificationKey = null; // Para evitar duplicidade

    @Override
    public void onListenerConnected() {
        super.onListenerConnected();
        Log.e(TAG, "Listener conectado");
    }

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        super.onNotificationPosted(sbn);

        // Ignora se for a mesma notificação que já processamos
        if (sbn.getKey().equals(lastNotificationKey)) return;
        lastNotificationKey = sbn.getKey();

        String packageName = sbn.getPackageName();

        if (packageName.equals(NUBANK_PACKAGE)) {
            parsePixReceivedNubank(sbn);
        } else if (packageName.equals(RICO_PACKAGE)) {
            parsePixReceivedRico(sbn);
            parsePixSentRico(sbn);
        }
    }

    // --- Nubank ---
    private void parsePixReceivedNubank(StatusBarNotification sbn) {
        CharSequence title = sbn.getNotification().extras.getCharSequence("android.title");
        CharSequence text = sbn.getNotification().extras.getCharSequence("android.text");

        if (title == null || text == null) return;

        String titleStr = title.toString();
        String message = text.toString();

        if (titleStr.equalsIgnoreCase("Transferência recebida")) {
            String valueStr = extractValue(message);
            double amount = parseAmount(valueStr);

            Log.e(TAG, "Pix Recebido do Nubank detectado! Valor: " + amount);

            sendTransactionToBackend(amount, message, "income", "nubank");
        }
    }

    // --- Rico Pix Recebido ---
    private void parsePixReceivedRico(StatusBarNotification sbn) {
        CharSequence text = sbn.getNotification().extras.getCharSequence("android.text");
        if (text == null) return;

        String message = text.toString();

        if (message.startsWith("Você recebeu um Pix de")) {
            String valueStr = extractValue(message);
            double amount = parseAmount(valueStr);

            Pattern pattern = Pattern.compile("Você recebeu um Pix de (.*?), CPF");
            Matcher matcher = pattern.matcher(message);
            String sender = matcher.find() ? matcher.group(1) : "Rico";

            Log.e(TAG, "Pix Recebido da Rico detectado! Valor: " + amount + ", Remetente: " + sender);

            sendTransactionToBackend(amount, "Pix recebido de " + sender + " (Rico)", "income", "rico");
        }
    }

    // --- Rico Pix Enviado ---
    private void parsePixSentRico(StatusBarNotification sbn) {
        CharSequence text = sbn.getNotification().extras.getCharSequence("android.text");
        if (text == null) return;

        String message = text.toString();

        if (message.startsWith("Você enviou um Pix para")) {
            String valueStr = extractValue(message);
            double amount = parseAmount(valueStr);

            Pattern pattern = Pattern.compile("Você enviou um Pix para (.*?) no valor");
            Matcher matcher = pattern.matcher(message);
            String recipient = matcher.find() ? matcher.group(1) : "Rico";

            Log.e(TAG, "Pix Enviado da Rico detectado! Valor: " + amount + ", Destinatário: " + recipient);

            sendTransactionToBackend(amount, "Pix enviado para " + recipient + " (Rico)", "expense", "rico");
        }
    }

    // --- Funções comuns ---
    private String extractValue(String text) {
        Pattern pattern = Pattern.compile("R\\$\\s?\\d{1,3}(\\.\\d{3})*(,\\d{2})?");
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) return matcher.group();
        return null;
    }

    private double parseAmount(String valueStr) {
        if (valueStr == null) return 0;
        String normalized = valueStr.replace("R$", "")
                                    .replace("\u00A0", "")
                                    .replace(" ", "")
                                    .replace(".", "")
                                    .replace(",", ".")
                                    .trim();
        try {
            return Double.parseDouble(normalized);
        } catch (NumberFormatException e) {
            Log.e(TAG, "Erro ao parsear valor: " + valueStr);
            return 0;
        }
    }

    private void sendTransactionToBackend(double amount, String description, String type, String source) {
        String json = "{"
                + "\"user\":\"" + USER_ID + "\","
                + "\"type\":\"" + type + "\","
                + "\"description\":\"" + description.replace("\"", "\\\"") + "\","
                + "\"amount\":" + amount + ","
                + "\"accountId\":\"" + DEFAULT_ACCOUNT_ID + "\","
                + "\"source\":\"" + source + "\""
                + "}";

        RequestBody body = RequestBody.create(json, MediaType.get("application/json; charset=utf-8"));

        Request request = new Request.Builder()
                .url(BACKEND_URL)
                .addHeader("Authorization", "Bearer " + BEARER_TOKEN)
                .post(body)
                .build();

        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                Log.e(TAG, "Erro ao enviar transação: " + e.getMessage());
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                if (response.isSuccessful()) {
                    Log.e(TAG, "Transação enviada com sucesso! Código: " + response.code());
                } else {
                    Log.e(TAG, "Falha ao enviar transação. Código: " + response.code());
                }
            }
        });
    }
}