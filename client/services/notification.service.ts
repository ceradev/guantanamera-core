import { API_URL, API_KEY } from '@/config/api-config'

export type NotificationType = 'ORDERS_UPDATED' | 'SETTINGS_UPDATED' | 'PRODUCTS_UPDATED' | 'CONNECTED';
type NotificationHandler = (data: any) => void;

class NotificationService {
  private eventSource: EventSource | null = null;
  private listeners: Map<NotificationType, Set<NotificationHandler>> = new Map();
  private isConnecting: boolean = false;
  private currentTypes: string[] = [];

  constructor() {
    this.listeners.set('ORDERS_UPDATED', new Set());
    this.listeners.set('SETTINGS_UPDATED', new Set());
    this.listeners.set('PRODUCTS_UPDATED', new Set());
    this.listeners.set('CONNECTED', new Set());
  }

  private getRequiredTypes(): string[] {
    const types: string[] = [];
    if (this.listeners.get('ORDERS_UPDATED')?.size! > 0) types.push('ORDERS_UPDATED');
    if (this.listeners.get('SETTINGS_UPDATED')?.size! > 0) types.push('SETTINGS_UPDATED');
    if (this.listeners.get('PRODUCTS_UPDATED')?.size! > 0) types.push('PRODUCTS_UPDATED');
    return types;
  }

  connect() {
    const requiredTypes = this.getRequiredTypes();
    
    // Si ya estamos conectados con los mismos tipos, no hacemos nada
    if (this.eventSource && this.currentTypes.sort().join(',') === requiredTypes.sort().join(',')) {
      return;
    }

    // Si los tipos han cambiado, cerramos la conexión anterior
    if (this.eventSource) {
      this.disconnect();
    }

    if (this.isConnecting) return;
    this.isConnecting = true;

    const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
    const url = new URL(`${baseUrl}/notifications`);
    
    if (API_KEY) {
      url.searchParams.append('apiKey', API_KEY);
    }

    if (requiredTypes.length > 0) {
      url.searchParams.append('types', requiredTypes.join(','));
    }

    this.currentTypes = requiredTypes;
    console.log('Connecting to SSE:', url.toString());
    
    this.eventSource = new EventSource(url.toString());

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const handlers = this.listeners.get(data.type);
        if (handlers) {
          handlers.forEach(handler => handler(data));
        }
      } catch (error) {
        console.error('Error parsing notification data:', error);
      }
    };

    this.eventSource.onopen = () => {
      this.isConnecting = false;
      console.log('SSE Connection established');
    };

    this.eventSource.onerror = (error) => {
      this.isConnecting = false;
      if (this.eventSource?.readyState === EventSource.CLOSED) {
        console.error('SSE Connection closed permanently. Attempting to reconnect in 5 seconds...');
        this.eventSource = null;
        
        // Intentar reconectar después de 5 segundos
        setTimeout(() => {
          if (this.currentTypes.length > 0) {
            this.connect();
          }
        }, 5000);
      }
    };
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.currentTypes = [];
      console.log('SSE Connection closed');
    }
  }

  subscribe(type: NotificationType, handler: NotificationHandler) {
    const handlers = this.listeners.get(type);
    if (handlers) {
      handlers.add(handler);
    }

    // Reconectar si los tipos necesarios han cambiado
    this.connect();

    return () => {
      this.unsubscribe(type, handler);
    };
  }

  unsubscribe(type: NotificationType, handler: NotificationHandler) {
    const handlers = this.listeners.get(type);
    if (handlers) {
      handlers.delete(handler);
    }
    
    // Si ya no hay suscriptores para nada, cerramos la conexión
    const totalSubscribers = Array.from(this.listeners.values()).reduce((acc, set) => acc + set.size, 0);
    if (totalSubscribers === 0) {
      this.disconnect();
    } else {
      // Si han cambiado los tipos necesarios, reconectamos con el nuevo filtro
      this.connect();
    }
  }
}

export const notificationService = new NotificationService();
