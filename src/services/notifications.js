import { LocalNotifications } from '@capacitor/local-notifications';

// solicita permissão
export async function requestNotificationPermission() {
  const perm = await LocalNotifications.requestPermissions();
  return perm.display === 'granted';
}

// agenda notificação de uma conta
export async function schedulePaymentNotification(conta, daysBefore = 2) {
  const dueDate = new Date(conta.dueDate);
  const notifyDate = new Date(dueDate);
  notifyDate.setDate(dueDate.getDate() - daysBefore);

  if (notifyDate <= new Date()) return;

  await LocalNotifications.schedule({
    notifications: [
      {
        id: Number(conta._id.slice(-6), 16),
        title: "Conta próxima do vencimento",
        body: `${conta.description} vence em ${daysBefore} dias: R$${conta.amount}`,
        schedule: { at: notifyDate },
        sound: null,
      },
    ],
  });
}

// agenda notificações para várias contas
export async function scheduleAllPayments(contas, daysBefore = 2) {
  const granted = await requestNotificationPermission();
  if (!granted) return;

  contas.forEach(conta => schedulePaymentNotification(conta, daysBefore));
}