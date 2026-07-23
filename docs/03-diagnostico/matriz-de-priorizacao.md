# 03 — Matriz de Priorização de Diagnósticos (P0 a P3)

## Visão Geral
Classificação de todos os itens diagnosticados com base no impacto técnico, risco de perda de dados e degradação da experiência do usuário.

---

## Tabela de Prioridade (P0 a P3)

| Identificador | Título do Item | Prioridade | Domínio | Justificativa da Prioridade |
|---|---|---|---|---|
| **MEM-001** | Listener `crm-reload-leads` sem cleanup no `CRMList.tsx` | **P0 (Crítico)** | CRM | Bug verificado que degrada progressivamente a memória RAM e multiplica execuções |
| **DATA-001** | Sobrescrita silenciosa entre abas no LocalStorage | **P0 (Crítico)** | Canvas / Docs | Risco iminente de perda de dados do usuário em sessões multi-aba |
| **PERF-001** | Gravação síncrona no LocalStorage durante Drag/Drop | **P0 (Crítico)** | Canvas 2D | Bloqueio de I/O na UI durante ações contínuas do mouse |
| **PERF-002** | Re-render da Tela por expansão de `expandedFolders` | **P1 (Alto)** | Pastas / Tela | Renderizações em cascata invalidando o Canvas 2D |
| **DATA-002** | Mutação de Lead sem Debounce no CRM Context | **P1 (Alto)** | CRM | Atualização síncrona excessiva no LocalStorage e Supabase |
| **BUG-001** | Sobrescrita silenciosa de estado de pastas na troca de Workspace | **P1 (Alto)** | Pastas | Estado residual alterando a árvore de navegação |
| **BUG-002** | Invalidação nula de formulário ao alternar card no CRM | **P1 (Alto)** | CRM | Risco de contaminação cruzada entre cadastros de leads |
| **MEM-002** | Listeners de mouse sem fechamento em resize de colunas | **P1 (Alto)** | CRM | Residual de eventos no `window` se solto fora da tela |
| **ARCH-001** | Monolito do Renderizador 2D `InfiniteCanvas.tsx` (346 KB) | **P2 (Médio)** | Canvas 2D | Dívida técnica que dificulta a aplicação de `React.memo` |
| **ARCH-002** | Modelo unificado heterogêneo `CanvasInfo` | **P2 (Médio)** | Arquitetura | Mantém o acoplamento de atributos entre documentos e canvas |
| **HIPO-001** | Degradação de FPS no Canvas 2D em escala (10 a 500 Nós) | **P2 (Médio)** | Canvas 2D | Hipótese que exige instrumentação prévia |
| **HIPO-002** | Vazamento de Heap por imagens Base64 | **P2 (Médio)** | Documentos | Hipótese de retentativa de memória por Data URLs |
| **DEP-001** | Otimização de Bundling do Package `@dnd-kit` | **P3 (Baixo)** | CRM | Otimização secundária do tamanho do chunk JS |
