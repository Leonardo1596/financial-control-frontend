package com.example.app;

import android.content.Context;
import android.content.SharedPreferences;
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
    public void onNotificationPosted(StatusBarNotification sbn) {
        super.onNotificationPosted(sbn);
        if (sbn.getKey().equals(lastNotificationKey)) return;
        lastNotificationKey = sbn.getKey();

        String packageName = sbn.getPackageName();

        if (packageName.equals("com.nu.production")) {
            parsePixReceivedNubank(sbn);
        } else if (packageName.equals("br.com.rico.mobile")) {
            parsePixReceivedRico(sbn);
            parsePixSentRico(sbn);
        }
    }

    private void parsePixReceivedNubank(StatusBarNotification sbn) {
        CharSequence text = sbn.getNotification().extras.getCharSequence("android.text");
        if (text == null) return;
        String message = text.toString();
        
        // Verifica se é transferência recebida (ajuste o título se necessário)
        sendTransactionToBackend(parseAmount(extractValue(message)), message, "income", "nubank");
    }

    private void parsePixReceivedRico(StatusBarNotification sbn) {
        CharSequence text = sbn.getNotification().extras.getCharSequence("android.text");
        if (text == null) return;
        String message = text.toString();
        
        if (message.contains("recebeu um Pix")) {
            sendTransactionToBackend(parseAmount(extractValue(message)), message, "income", "rico");
        }
    }

    private void parsePixSentRico(StatusBarNotification sbn) {
        CharSequence text = sbn.getNotification().extras.getCharSequence("android.text");
        if (text == null) return;
        String message = text.toString();
        
        if (message.contains("enviou um Pix")) {
            sendTransactionToBackend(parseAmount(extractValue(message)), message, "expense", "rico");
        }
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
        
        // Tenta buscar com o prefixo _cap_ (padrão Capacitor) e sem (fallback)
        String userId = prefs.getString("_cap_userId", prefs.getString("userId", null));
        String bearerToken = prefs.getString("_cap_userToken", prefs.getString("userToken", null));
        
        // Busca a conta específica: account_nubank ou account_rico
        String accountKey = "account_" + source.toLowerCase();
        String accountId = prefs.getString("_cap_" + accountKey, prefs.getString(accountKey, null));

        if (userId == null || bearerToken == null || accountId == null) {
            Log.e(TAG, "DADOS INCOMPLETOS para " + source + ". Verifique o Login.");
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