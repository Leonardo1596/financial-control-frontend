import { LocalNotifications } from '@capacitor/local-notifications';

// solicita permissão
export async function requestNotificationPermission() {
  const perm = await LocalNotifications.requestPermissions();
  return perm.display === 'granted';
}

// agenda notificação de uma conta
export async function schedulePaymentNotification(
  conta,
  daysBefore = 2,
  delay = 0,
  index = 0
){
  const now = new Date();

  const dueDate = new Date(conta.dueDate);
  const notifyDate = new Date(dueDate);
  notifyDate.setDate(dueDate.getDate() - daysBefore);

  // 🚫 evita agendar no passado
  if (notifyDate <= now) return;

  await LocalNotifications.schedule({
    notifications: [
      {
        id: 1000 + index,
        title: "Conta próxima do vencimento",
        body: `${conta.description} vence em ${daysBefore} dias: R$${conta.amount}`,
        schedule: { at: notifyDate },
        channelId: 'payments',
        sound: 'default',
      },
    ],
  });
}

// agenda notificações para várias contas
export async function scheduleAllPayments(contas) {
  const granted = await requestNotificationPermission();
  if (!granted) return;

  let index = 0;

  for (const conta of contas) {
    // 🔥 notificação 10 dias antes
    await schedulePaymentNotification(conta, 10, 0, index++);
    
    // 🔥 notificação 3 dias antes
    await schedulePaymentNotification(conta, 3, 0, index++);
  }
}

// cria canal de notificação (android)
export async function createNotificationChannel() {
  await LocalNotifications.createChannel({
    id: 'payments',
    name: 'Contas a pagar',
    description: 'Notificações de contas próximas do vencimento',
    importance: 5,
    visibility: 1,
    sound: 'default',
    vibration: true,
  });
}