# 03 — Análise de Concorrência e Integridade de Dados

## Visão Geral
Diagnóstico de riscos de perda de dados, sobrescrita silenciosa, ausência de versionamento e inconsistência de concorrência na Área Tela.

---

## DATA-001 — Sobrescrita Silenciosa entre Abas no `localStorage` (`axe_offline_canvases`)

- **Tipo**: Concorrência / Integridade de Dados
- **Status**: Confirmado no código
- **Prioridade**: P0
- **Domínio afetado**: Canvas 2D / Documentos
- **Localização exata**: `src/renderer/features/Canvas/canvasStorage.ts` (funções `getCanvasList`, `updateCanvasInfo`)
- **Sintoma observado**: Alterações feitas em um documento ou canvas aberto em uma janela/aba secundária são sobrescritas ao alternar de aba na janela principal.
- **Evidência técnica**: A leitura e gravação da chave `axe_offline_canvases` no `localStorage` ocorre sem controle de timestamp de modificação (Vector Clock / Last-Write-Wins validado) ou mutex. A gravação mais recente substitui todo o payload do array.
- **Causa raiz**: Falta de controle de concorrência e ausência de bloqueio otimista (optimistic locking).
- **Impacto no usuário**: Perda irreparável de edições de texto ou traços de desenho em sessões multi-aba.
- **Impacto técnico**: Corrupção da fonte de verdade local e disparo de dados desatualizados para a fila do `syncManager.ts`.
- **Frequência**: Alta quando o usuário trabalha com múltiplos documentos ou abas abertas simultaneamente.
- **Dados ou estados envolvidos**: `localStorage` (`axe_offline_canvases`), `openTabs`.
- **Risco de regressão**: Médio. Exige validação atenta no sincronizador.
- **Forma de reprodução**: Abrir a aplicação em duas instâncias/janelas, editar o mesmo documento em ambas e verificar qual versão prevalece.
- **Como instrumentar ou medir**: Monitorar a chave `axe_offline_canvases` no Application Tab do DevTools durante gravações simultâneas.
- **Correção recomendada**: Adicionar timestamp `updatedAt` em cada item e rejeitar gravações locais com timestamp inferior ao já persistido.
- **Ordem de implementação**: Fase 3.1 de Estabilização (Prioridade 4 no plano inicial).
- **Critério de aceite**: Concorrência tratada por mesclagem de atributos ou recusa com notificação ao usuário.
- **Estratégia de rollback**: Manter a substituição direta.
- **Dependências para correção**: Nenhuma.

---

## DATA-002 — Mutação de Objeto Lead sem Debounce no CRM Context

- **Tipo**: Concorrência de Estado em Memória
- **Status**: Confirmado no código
- **Prioridade**: P1
- **Domínio afetado**: CRM
- **Localização exata**: `src/renderer/features/CRM/CRMContext.tsx` e `crmStorage.ts`
- **Sintoma observado**: Digitação rápida de texto no formulário de lead pode gerar travamentos ou estado inconsistente no Kanban se o modal for fechado antes do término do evento.
- **Evidência técnica**: A função `updateLead` no `CRMContext` chama `saveLeadsToStorage` sem aplicar filtro de debounce ou fila de gravação.
- **Causa raiz**: Mutação síncrona do contexto global React diretamente conectada aos eventos `onChange` de inputs HTML.
- **Impacto no usuário**: Inconsistência nos campos gravados no LocalStorage se a janela for fechada durante a escrita.
- **Impacto técnico**: Disparo excessivo de atualizações no `syncManager.ts`.
- **Frequência**: Sempre que o usuário edita dados de um lead rapidamente.
- **Dados ou estados envolvidos**: `CRMContext`, `localStorage` (`axe_crm_leads`).
- **Risco de regressão**: Baixo.
- **Forma de reprodução**: Digitar uma frase longa no campo de descrição de um lead e inspecionar os eventos do `syncManager`.
- **Como instrumentar ou medir**: Contar o número de execuções de `saveLeadsToStorage` durante 5 segundos de digitação contínua.
- **Correção recomendada**: Aplicar debounce de 300ms na gravação para o LocalStorage e Supabase no `CRMContext`.
- **Ordem de implementação**: Fase 3.1 de Estabilização.
- **Critério de aceite**: Apuração de apenas 1 chamada de gravação ao término da digitação.
- **Estratégia de rollback**: Remover o debounce.
- **Dependências para correção**: Nenhuma.
