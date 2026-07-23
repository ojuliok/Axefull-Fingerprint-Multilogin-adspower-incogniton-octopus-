// src/renderer/shared/events/eventBus.ts
// Barramento de Eventos fortemente tipado para comunicação desacoplada entre domínios

export interface AppEventMap {
    'canvas:node-selected': { canvasId: string; nodeId: string; nodeType: string };
    'canvas:request-open-document': { documentId: string };
    'crm:lead-updated': { leadId: string; updates: Record<string, any> };
    'crm:reload-leads': { boardId?: string };
    'workspace:changed': { newWorkspaceId: string };
}

type EventHandler<T> = (payload: T) => void;

class TypedEventBus {
    private listeners = new Map<keyof AppEventMap, Function[]>();

    public on<K extends keyof AppEventMap>(event: K, handler: EventHandler<AppEventMap[K]>): () => void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)!.push(handler as Function);

        // Retorna função de unsubscribe automático
        return () => this.off(event, handler);
    }

    public off<K extends keyof AppEventMap>(event: K, handler: EventHandler<AppEventMap[K]>): void {
        const eventListeners = this.listeners.get(event);
        if (!eventListeners) return;
        this.listeners.set(event, eventListeners.filter(h => h !== handler));
    }

    public emit<K extends keyof AppEventMap>(event: K, payload: AppEventMap[K]): void {
        const eventListeners = this.listeners.get(event);
        if (!eventListeners) return;
        eventListeners.forEach(handler => {
            try {
                (handler as EventHandler<AppEventMap[K]>)(payload);
            } catch (err) {
                console.error(`[EventBus] Erro ao processar evento "${String(event)}":`, err);
            }
        });
    }
}

export const eventBus = new TypedEventBus();
