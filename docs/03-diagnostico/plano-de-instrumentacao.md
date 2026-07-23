# 03 — Plano de Instrumentação e Medição sem Alteração de Código

## Visão Geral
Metodologia detalhada de medição e validação para as hipóteses de performance e memória, utilizando ferramentas nativas do Chrome DevTools e logs sem modificar o código do projeto.

---

## 1. Instrumentação de FPS no Canvas 2D (`HIPO-001`)

### Cenário de Teste
- **Massa de Dados**: Mudar a massa de dados via Console DevTools gerando 10, 50, 100 e 500 nós no `InfiniteCanvas`.
- **Métrica Observada**: Frames Per Second (FPS) durante o evento continuo de Pan de 10 segundos.
- **Ferramenta**: Chrome DevTools Performance Panel + Rendering Tab ("FPS Meter").
- **Resultado Esperado se Hipótese Verdadeira**: Média de FPS < 30 FPS no teste de 100 nós, caindo para < 15 FPS no de 500 nós.
- **Resultado Esperado se Hipótese Falsa**: Manutenção de 60 FPS estáveis mesmo com 500 nós.

---

## 2. Instrumentação de Memória Heap e Data URLs (`HIPO-002`)

### Cenário de Teste
- **Cenário**: Colar 10 imagens Base64 no editor TipTap e realizar 20 ações de undo/redo (`Ctrl+Z` / `Ctrl+Y`).
- **Métrica Observada**: Tamanho total do JS Heap retido (MB) após disparar o Garbage Collection manual.
- **Ferramenta**: Chrome DevTools Memory Panel -> Allocation Instrumentation on Timeline & Heap Snapshots.
- **Resultado Esperado se Hipótese Verdadeira**: O Heap Snapshot retém referências de strings Base64 do TipTap sem liberação.
- **Resultado Esperado se Hipótese Falsa**: A memória é liberada completamente após o GC.

---

## 3. Instrumentação do Listener `crm-reload-leads` (`MEM-001`)

### Cenário de Teste
- **Cenário**: Alternar entre a aba Canvas e CRM 5 vezes.
- **Métrica Observada**: Quantidade de ouvintes ativos no objeto `window` para o evento `crm-reload-leads`.
- **Ferramenta**: Console do DevTools executando `getEventListeners(window)['crm-reload-leads']`.
- **Resultado Esperado se Hipótese Verdadeira**: O array de listeners retorna 5 funções registradas acumuladas.
- **Resultado Esperado se Hipótese Falsa**: O array retorna exatamente 1 ou 0 ouvintes.
