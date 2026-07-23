# Event Bus e Comunicação Inter-Domínios

## Visão Geral
Atualmente, a comunicação entre Canvas, CRM, Documentos e Pastas ocorre via chamadas diretas de funções passadas por props (*prop drilling*) no componente monolítico `CanvasPage.tsx` ou via `window.dispatchEvent(new CustomEvent(...))` não tipado.

A Arquitetura Alvo introduz um **Barramento de Eventos fortemente tipado (`TypedEventBus`)**, eliminando acoplamentos circulares e garantindo rastreabilidade e limpeza automática de listeners.

---

## 1. Funcionamento do Barramento de Eventos

```text
[Domínio CRM] ──(emit 'crm:lead-updated')──> [ TypedEventBus ] ──(on)──> [Domínio Canvas / Cards]
                                                      │
                                                      └──(on)──> [Domínio Documentos]
```

### Características Principais:
1. **Tipagem Estrita**: Todos os nomes de eventos e seus payloads são validados em tempo de compilação TypeScript via `AppEventMap`.
2. **Subscrição Segura com Cleanup**: O método `on()` retorna automaticamente uma função de unsubscribe, simplificando a limpeza em hooks React:
   ```typescript
   useEffect(() => {
       const unsubscribe = eventBus.on('crm:lead-updated', (payload) => {
           // Trata a atualização do lead sem reacoplar o componente
       });
       return unsubscribe; // Cleanup automático ao desmontar
   }, []);
   ```
3. **Sem Efeitos Colaterais Globais no Window**: O barramento é uma instância singleton limpa em memória (`src/renderer/shared/events/eventBus.ts`), isolada do objeto `window`.

---

## 2. Tabela de Eventos entre Domínios

| Evento | Origem | Destino | Payload | Descrição |
|---|---|---|---|---|
| `canvas:node-selected` | `canvas` | `crm` / `documents` | `{ canvasId, nodeId, nodeType }` | Notifica que um nó foi selecionado no Canvas |
| `canvas:request-open-document` | `canvas` | `documents` | `{ documentId }` | Solicita abertura de documento associado a um nó |
| `crm:lead-updated` | `crm` | `canvas` | `{ leadId, updates }` | Notifica atualização de dados de um lead do Kanban |
| `crm:reload-leads` | `crm` | `crm` | `{ boardId }` | Dispara recarregamento dos cards de um quadro |
| `workspace:changed` | `spaces` | `folders` / `canvas` | `{ newWorkspaceId }` | Reseta caches visuais e carrega o novo workspace |
