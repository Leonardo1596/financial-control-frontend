package com.example.app;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
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
    private static final String BACKEND_URL = "https://financial-control-442c.onrender.com/create-transaction";
    private OkHttpClient client = new OkHttpClient();
    private String lastNotificationKey = null;

    @Override
    public void onListenerConnected() {
        super.onListenerConnected();

        // Inicia ForegroundService se não estiver rodando
        Intent serviceIntent = new Intent(this, MyForegroundService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent);
        } else {
            startService(serviceIntent);
        }

        Log.d(TAG, "NotificationListener conectado e serviço iniciado.");
    }

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        super.onNotificationPosted(sbn);

        if (sbn.getKey().equals(lastNotificationKey)) return;
        lastNotificationKey = sbn.getKey();

        String packageName = sbn.getPackageName();

        CharSequence titleCs = sbn.getNotification().extras.getCharSequence("android.title");
        CharSequence textCs = sbn.getNotification().extras.getCharSequence("android.text");

        String title = titleCs != null ? titleCs.toString() : "";
        String text = textCs != null ? textCs.toString() : "";

        String normalizedTitle = title.toLowerCase().trim();
        String normalizedText = text.toLowerCase().trim();

        Log.d(TAG, "Package: " + packageName);
        Log.d(TAG, "Title: " + title);
        Log.d(TAG, "Text: " + text);

        // 🔥 NUBANK
        if (packageName.equals("com.nu.production")) {
            parseNubank(sbn);
        }

        // 🔥 RICO
        else if (packageName.equals("br.com.rico.mobile")) {
            parsePixReceivedRico(sbn);
            parsePixSentRico(sbn);
        }

        // 🔥 FAKE (SIMULANDO NUBANK)
        else if (packageName.equals("com.argonremote.notificationgenerator")) {

            if (normalizedTitle.contains("transferência recebida")) {
                Log.d(TAG, "FAKE -> NUBANK RECEBIDO");
                parseNubank(sbn);
            }

            else if (normalizedTitle.contains("compra no débito")) {
                Log.d(TAG, "FAKE -> NUBANK COMPRA");
                parseNubank(sbn);
            }

            // fallback antigo (rico)
            else if (normalizedText.contains("pix realizado") || normalizedText.contains("enviou um pix")) {
                Log.d(TAG, "FAKE -> PIX ENVIADO (RICO)");
                parsePixSentRico(sbn);
            }

            else if (normalizedText.contains("pix recebido") || normalizedText.contains("recebeu um pix")) {
                Log.d(TAG, "FAKE -> PIX RECEBIDO (RICO)");
                parsePixReceivedRico(sbn);
            }

            else if (normalizedText.contains("compra")) {
                Log.d(TAG, "FAKE -> COMPRA (RICO)");
                parsePixSentRico(sbn);
            }
        }
    }

    // =========================
    // 🔥 NUBANK PARSER
    // =========================
    private void parseNubank(StatusBarNotification sbn) {
        String fullMessage = getFullMessage(sbn);

        CharSequence titleCs = sbn.getNotification().extras.getCharSequence("android.title");
        String title = titleCs != null ? titleCs.toString().toLowerCase() : "";

        double amount = parseAmount(extractValue(fullMessage));

        Log.d(TAG, "NUBANK FULL: " + fullMessage);
        Log.d(TAG, "NUBANK VALUE: " + amount);

        if (amount <= 0) return;

        // 💰 RECEBIDO
        if (title.contains("transferência recebida")) {
            Log.d(TAG, "NUBANK -> INCOME");
            sendTransactionToBackend(amount, fullMessage, "income", "nubank");
        }

        // 💸 COMPRA
        else if (title.contains("compra no débito")) {
            Log.d(TAG, "NUBANK -> EXPENSE");
            sendTransactionToBackend(amount, fullMessage, "expense", "nubank");
        }
    }

    // =========================
    // 🔥 RICO
    // =========================
    private void parsePixReceivedRico(StatusBarNotification sbn) {
        String message = getFullMessage(sbn);

        if (message.contains("recebeu um Pix")) {
            double amount = parseAmount(extractValue(message));
            sendTransactionToBackend(amount, message, "income", "rico");
        }
    }

    private void parsePixSentRico(StatusBarNotification sbn) {
        String fullMessage = getFullMessage(sbn).toLowerCase();
        String originalMessage = getFullMessage(sbn);

        Log.d(TAG, "RICO FULL: " + fullMessage);

        // PIX ENVIADO
        if (fullMessage.contains("enviou um pix")) {
            double amount = parseAmount(extractValue(originalMessage));
            sendTransactionToBackend(amount, originalMessage, "expense", "rico");
        }

        // COMPRA
        else if (fullMessage.contains("compra")) {
            double amount = parseAmount(extractValue(originalMessage));

            if (amount > 0) {
                sendTransactionToBackend(amount, originalMessage, "expense", "rico");
            } else {
                Log.e(TAG, "VALOR NÃO IDENTIFICADO NA COMPRA RICO");
            }
        }
    }

    // =========================
    // 🧼 HELPERS
    // =========================
    private String getFullMessage(StatusBarNotification sbn) {
        CharSequence titleCs = sbn.getNotification().extras.getCharSequence("android.title");
        CharSequence textCs = sbn.getNotification().extras.getCharSequence("android.text");

        String title = titleCs != null ? titleCs.toString() : "";
        String text = textCs != null ? textCs.toString() : "";

        return (title + " " + text).trim();
    }

    private String extractValue(String text) {
        Pattern pattern = Pattern.compile("R\\$\\s?\\d{1,3}(\\.\\d{3})*(,\\d{2})?");
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) return matcher.group();
        return "0";
    }

    private double parseAmount(String valueStr) {
        try {
            String clean = valueStr.replaceAll("[^0-9,]", "").replace(",", ".");
            return Double.parseDouble(clean);
        } catch (Exception e) {
            return 0.0;
        }
    }

    private void sendTransactionToBackend(double amount, String description, String type, String source) {
        SharedPreferences prefs = getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);

        String userId = prefs.getString("_cap_userId", prefs.getString("userId", null));
        String bearerToken = prefs.getString("_cap_userToken", prefs.getString("userToken", null));

        String accountKey = "account_" + source.toLowerCase();
        String accountId = prefs.getString("_cap_" + accountKey, prefs.getString(accountKey, null));

        if (userId == null || bearerToken == null || accountId == null) {
            Log.e(TAG, "DADOS INCOMPLETOS para " + source);
            return;
        }

        String json = "{"
                + "\"user\":\"" + userId + "\","
                + "\"type\":\"" + type + "\","
                + "\"description\":\"" + description.replace("\"", "\\\"") + "\","
                + "\"amount\":" + amount + ","
                + "\"accountId\":\"" + accountId + "\","
                + "\"source\":\"" + source + "\""
                + "}";

        Log.d(TAG, "JSON ENVIADO: " + json);

        RequestBody body = RequestBody.create(json, MediaType.get("application/json; charset=utf-8"));
        Request request = new Request.Builder()
                .url(BACKEND_URL)
                .addHeader("Authorization", "Bearer " + bearerToken)
                .post(body)
                .build();

        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                Log.e(TAG, "Erro de rede: " + e.getMessage());
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                if (response.isSuccessful()) {
                    Log.i(TAG, "Transação de " + source + " enviada!");
                } else {
                    Log.e(TAG, "Erro Backend: " + response.code());
                }
                response.close();
            }
        });
    }
}