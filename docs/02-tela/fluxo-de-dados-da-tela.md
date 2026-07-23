# 02 — Fluxo de Dados da Área Tela

## Visão Geral
Auditoria de como as informações trafegam entre a interface da Tela, o armazenamento em memória, a persistência local em `localStorage` e a sincronização remota com o Supabase.

---

## Ciclo de Vida e Tráfego de Dados

```mermaid
sequenceDiagram
    autonumber
    actor User as Usuário (UI)
    participant CP as CanvasPage.tsx
    participant IC as InfiniteCanvas.tsx (346KB)
    participant CS as canvasStorage.ts
    participant LS as LocalStorage (axe_offline_canvases)
    participant SM as syncManager.ts
    participant SB as Supabase Cloud (tabela nodes)

    User->>CP: Seleciona uma aba (Canvas / Documento / CRM)
    CP->>CS: Chama getCanvasData(id)
    CS->>LS: Leitura síncrona do cache offline
    LS-->>CS: Retorna payload JSON
    CS-->>CP: Dados da abas ativas
    CP->>IC: Monta componente com props de estado
    User->>IC: Interage (move nó, edita texto ou adiciona linha)
    IC->>CS: Dispara updateCanvasInfo() / flushPendingSave()
    CS->>LS: Grava objeto JSON atualizado no LocalStorage
    CS->>SM: Adiciona item na fila FIFO de sincronização
    SM->>SB: Envia Mutation HTTP/RPC assíncrona
```

---

## Diagnóstico Técnico Baseado em Evidências

1. **Gravação Síncrona Bloqueante no LocalStorage**:
   - *Confirmado no código*: Em `canvasStorage.ts`, a função `updateLocalCachedNodes()` é executada de forma síncrona dentro de blocos de manipulação de nós durante ações de drag/drop no canvas, forçando a serialização `JSON.stringify()` de matrizes pesadas.
2. **Duplicação de Payload em Memória**:
   - *Confirmado no código*: O estado `activeCanvasData` é mantido simultaneamente no React `useState` de `CanvasPage.tsx` e dentro do estado interno de `InfiniteCanvas.tsx`, dobrando o consumo de RAM da aba ativa.
3. **Ausência de Invalidação de Cache de Abas Inativas**:
   - *Provável — requer reprodução*: Ao manter abas em segundo plano no `openTabs`, alterações realizadas em um documento a partir de outro dispositivo ou aba não disparam invalidação automática até que o usuário feche e reabra a aba.
