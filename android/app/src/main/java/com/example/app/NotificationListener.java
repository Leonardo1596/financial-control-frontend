package com.example.app;

import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.util.Log;
import java.util.Map;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

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

import org.json.JSONObject;

public class NotificationListener extends NotificationListenerService {

    private static final String TAG = "NOTIFICATION_LISTENER";
    private static final String BACKEND_URL = "https://financial-control-442c.onrender.com/create-transaction";
    private static final String PENDING_URL = "https://financial-control-442c.onrender.com/pending-transactions";

    private OkHttpClient client = new OkHttpClient();

    @Override
    public void onListenerConnected() {
        super.onListenerConnected();
        Log.d(TAG, "NotificationListener conectado.");
    }

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        super.onNotificationPosted(sbn);

        if (sbn == null || sbn.getNotification() == null || sbn.getNotification().extras == null) return;

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

        // =========================
        // NUBANK
        // =========================
        if (packageName.equals("com.nu.production")) {
            parseNubank(sbn);
        }

        // =========================
        // RICO
        // =========================
        else if (packageName.equals("br.com.rico.mobile")) {
            parsePixReceivedRico(sbn);
            parsePixSentRico(sbn);
        }

        // =========================
        // APP FAKE (TESTE)
        // =========================
        else if (packageName.equals("com.argonremote.notificationgenerator")) {

    String fullMessage = getFullMessage(sbn).toLowerCase();

    if (fullMessage.contains("transferência recebida")) {
        parseNubank(sbn);
    }

    else if (fullMessage.contains("compra no débito")) {
        parseNubank(sbn);
    }

    else if (fullMessage.contains("pix realizado") || fullMessage.contains("enviou um pix")) {
        parsePixSentRico(sbn);
    }

    else if (fullMessage.contains("pix recebido") || fullMessage.contains("recebeu um pix")) {
        parsePixReceivedRico(sbn);
    }

    else if (fullMessage.contains("compra")) {
        parsePixSentRico(sbn);
    }
}
    }

    private void parseNubank(StatusBarNotification sbn) {
        String fullMessage = getFullMessage(sbn).toLowerCase();

        CharSequence titleCs = sbn.getNotification().extras.getCharSequence("android.title");
        String title = titleCs != null ? titleCs.toString().toLowerCase() : "";

        double amount = extractAmount(fullMessage);
        if (amount <= 0) return;

        if (fullMessage.contains("transferência recebida")) {
            sendPendingTransaction(amount, fullMessage, "income", "nubank");
        } 
        else if (fullMessage.contains("compra no débito")) {
            sendPendingTransaction(amount, fullMessage, "expense", "nubank");
        }
    }

    private void parsePixReceivedRico(StatusBarNotification sbn) {
        String message = getFullMessage(sbn);

        if (message.contains("recebeu um Pix")) {
            double amount = parseAmount(extractValue(message));
            
            sendPendingTransaction(amount, message, "income", "rico");
        }
    }

    private void parsePixSentRico(StatusBarNotification sbn) {

        String fullMessage = getFullMessage(sbn).toLowerCase(); // 🔥 CORREÇÃO
        String originalMessage = getFullMessage(sbn);

        if (fullMessage.contains("enviou um pix")) {
            double amount = parseAmount(extractValue(originalMessage));
            sendPendingTransaction(amount, originalMessage, "expense", "rico");
        } 
        
        else if (fullMessage.contains("compra")) {

            // 🚫 ignorar compras inválidas
            if (fullMessage.contains("negada") ||
                fullMessage.contains("não autorizada") ||
                fullMessage.contains("saldo insuficiente") ||
                fullMessage.contains("recusada") ||
                fullMessage.contains("falhou") ||
                fullMessage.contains("não foi possível")) {
                return;
            }

            double amount = parseAmount(extractValue(originalMessage));

            if (amount > 0) {
                sendPendingTransaction(amount, originalMessage, "expense", "rico");
            }
        }
    }

    // =========================
    // 🔥 NOVO FLUXO (PENDING)
    // =========================
    private void sendPendingTransaction(double amount, String description, String type, String source) {

    SharedPreferences prefs = getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);

    String userId = prefs.getString("_cap_userId",
            prefs.getString("userId", null));

    String bearerToken = prefs.getString("_cap_userToken",
            prefs.getString("userToken", null));

    String accountKey = "account_" + userId + "_" + source.toLowerCase().trim();

    String accountId = prefs.getString(accountKey, null);

    Map<String, ?> all = prefs.getAll();
    for (Map.Entry<String, ?> e : all.entrySet()) {
        Log.d(TAG, "PREF => " + e.getKey() + " = " + e.getValue());
    }

    if (userId == null || bearerToken == null || accountId == null) {
        Log.e(TAG, "Missing required data -> aborting request");
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

    RequestBody body = RequestBody.create(
            json,
            MediaType.get("application/json")
    );

    Request request = new Request.Builder()
            .url(PENDING_URL)
            .addHeader("Authorization", "Bearer " + bearerToken)
            .post(body)
            .build();

    client.newCall(request).enqueue(new Callback() {
        @Override
        public void onFailure(Call call, IOException e) {
            Log.e(TAG, "Erro pending: " + e.getMessage());
        }

        @Override
        public void onResponse(Call call, Response response) throws IOException {

            String res = response.body() != null ? response.body().string() : "";

            Log.d(TAG, "HTTP CODE: " + response.code());
            Log.d(TAG, "RESPOSTA BRUTA: " + res);

            try {
                JSONObject obj = new JSONObject(res);
                String pendingId = obj.optString("_id", null);

                if (pendingId == null) {
                    Log.e(TAG, "PendingId não encontrado na resposta");
                    return;
                }

                Log.d(TAG, "Pending criado com ID: " + pendingId);

                showNotification(pendingId, amount, description);

            } catch (Exception e) {
                Log.e(TAG, "Erro parse pendingId: " + e.getMessage());
            }

            response.close();
        }
    });
}

    // =========================
    // 🔔 NOTIFICAÇÃO LOCAL
    // =========================
    private void showNotification(String pendingId, double amount, String description) {

        Intent intent = new Intent(this, MainActivity.class);
        intent.putExtra("pendingId", pendingId);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);

        PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, "transactions_channel")
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle("Transação detectada")
                .setContentText("R$ " + amount + " - toque para revisar")
                .setContentIntent(pendingIntent)
                .setAutoCancel(true);

        NotificationManagerCompat.from(this)
                .notify((int) System.currentTimeMillis(), builder.build());
    }

    // =========================
    // UTIL
    // =========================
    private String getFullMessage(StatusBarNotification sbn) {
        CharSequence titleCs = sbn.getNotification().extras.getCharSequence("android.title");
        CharSequence textCs = sbn.getNotification().extras.getCharSequence("android.text");

        return (titleCs + " " + textCs).trim();
    }

    private String extractValue(String text) {
        Pattern pattern = Pattern.compile("R\\$\\s?\\d+[\\.,]?\\d*");
        Matcher matcher = pattern.matcher(text);
        return matcher.find() ? matcher.group() : "0";
    }

    private double parseAmount(String value) {
        try {
            return Double.parseDouble(value.replace("R$", "").replace(",", ".").trim());
        } catch (Exception e) {
            return 0;
        }
    }

    private double extractAmount(String text) {
    try {
        Pattern pattern = Pattern.compile("r\\$\\s*([0-9\\.]+,[0-9]{2})");
        Matcher matcher = pattern.matcher(text);

        if (matcher.find()) {
            String value = matcher.group(1)
                    .replace(".", "")
                    .replace(",", ".");
            return Double.parseDouble(value);
        }
    } catch (Exception e) {
        e.printStackTrace();
    }

    return 0;
}
}