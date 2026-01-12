import { getMessaging, isFirebaseConfigured } from './admin';

/**
 * Notification payload types - matches mobile app expectations
 */
export type NotificationType =
  | 'class_created'
  | 'class_updated'
  | 'class_cancelled'
  | 'class_reminder'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'announcement';

export interface ClassNotificationData {
  type: NotificationType;
  classId: string;
  gymId: string;
  title: string;
  startTime: string; // ISO 8601 format
  instructorName?: string;
}

export interface NotificationPayload {
  title: string;
  body: string;
  data: Record<string, string>;
}

/**
 * Send push notification to a gym topic
 * All users subscribed to gym_{gymId} will receive it
 */
export async function sendToGymTopic(
  gymId: string,
  payload: NotificationPayload
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Check if Firebase is configured
  if (!isFirebaseConfigured()) {
    console.warn('[Notification] Firebase not configured, skipping push notification');
    return { success: false, error: 'Firebase not configured' };
  }

  try {
    const messaging = getMessaging();
    const topic = `gym_${gymId}`;

    const message = {
      topic,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data,
      android: {
        priority: 'high' as const,
        notification: {
          channelId: 'classes', // Matches mobile app channel
          sound: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const messageId = await messaging.send(message);
    console.log(`[Notification] Sent to topic ${topic}, messageId: ${messageId}`);

    return { success: true, messageId };
  } catch (error) {
    console.error('[Notification] Error sending to topic:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send class created notification
 */
export async function sendClassCreatedNotification(
  data: ClassNotificationData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const formattedTime = formatTime(data.startTime);

  const payload: NotificationPayload = {
    title: 'Nueva clase disponible',
    body: `${data.title} a las ${formattedTime}. ¡Reserva ahora!`,
    data: {
      type: data.type,
      classId: data.classId,
      gymId: data.gymId,
      title: data.title,
      startTime: data.startTime,
      ...(data.instructorName && { instructorName: data.instructorName }),
    },
  };

  return sendToGymTopic(data.gymId, payload);
}

/**
 * Send class updated notification
 */
export async function sendClassUpdatedNotification(
  data: ClassNotificationData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const formattedTime = formatTime(data.startTime);

  const payload: NotificationPayload = {
    title: 'Clase actualizada',
    body: `${data.title} ha sido modificada. Nueva hora: ${formattedTime}`,
    data: {
      type: 'class_updated',
      classId: data.classId,
      gymId: data.gymId,
      title: data.title,
      startTime: data.startTime,
    },
  };

  return sendToGymTopic(data.gymId, payload);
}

/**
 * Send class cancelled notification
 */
export async function sendClassCancelledNotification(
  data: Omit<ClassNotificationData, 'startTime'> & { startTime?: string }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const payload: NotificationPayload = {
    title: 'Clase cancelada',
    body: `La clase ${data.title} ha sido cancelada.`,
    data: {
      type: 'class_cancelled',
      classId: data.classId,
      gymId: data.gymId,
      title: data.title,
      ...(data.startTime && { startTime: data.startTime }),
    },
  };

  return sendToGymTopic(data.gymId, payload);
}

/**
 * Format ISO time to readable string
 */
function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
}
