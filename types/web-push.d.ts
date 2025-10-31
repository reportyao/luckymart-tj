// web-push 模块的类型声明

declare module 'web-push' {
  interface VapidDetails {
    subject: string;
    publicKey: string;
    privateKey: string;
  }

  interface PushSubscription {
    endpoint: string;
    expirationTime: number | null;
    keys: {
      p256dh: string;
      auth: string;
    };
  }

  interface NotificationOptions {
    title: string;
    body?: string;
    icon?: string;
    badge?: string;
    image?: string;
    vibrate?: number[];
    sound?: string;
    dir?: 'auto' | 'ltr' | 'rtl';
    lang?: string;
    renotify?: boolean;
    requireInteraction?: boolean;
    silent?: boolean;
    tag?: string;
    data?: any;
    actions?: Array<{
      action: string;
      title: string;
      icon?: string;
    }>;
  }

  interface SendResponse {
    statusCode: number;
    body: string;
    headers: Record<string, string>;
  }

  export function setVapidDetails(
    subject: string,
    publicKey: string,
    privateKey: string
  ): void;

  export function generateVAPIDKeys(): {
    publicKey: string;
    privateKey: string;
  };

  export function sendNotification(
    subscription: PushSubscription,
    payload: string | NotificationOptions,
    options?: {
      TTL?: number;
      urgency?: 'very-low' | 'low' | 'normal' | 'high';
      topic?: string;
      collapseKey?: string;
    }
  ): Promise<SendResponse>;
}