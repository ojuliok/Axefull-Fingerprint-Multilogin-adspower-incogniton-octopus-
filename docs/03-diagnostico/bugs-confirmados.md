# 03 — Catálogo de Bugs Confirmados

## Visão Geral
Listagem formal de bugs funcionais e de comportamento confirmados diretamente na leitura da base de código.

---

## BUG-001 — Sobrescrita Silenciosa de Estado de Pastas na Troca de Workspace

- **Tipo**: Bug de Comportamento / Perda de Estado
- **Status**: Confirmado no código
- **Prioridade**: P1
- **Domínio afetado**: Pastas / Espaços
- **Localização exata**: `src/renderer/pages/CanvasPage.tsx`, função `reloadCanvasList` (linha 223)
- **Sintoma observado**: Ao alternar o workspace ativo no dropdown superior, o estado `expandedFolders` (`Set<string>`) permanece populado com IDs do workspace anterior.
- **Evidência técnica**: O `useEffect` que recarrega os canvas ao mudar `currentWorkspace` altera o `canvasList`, mas não executa `setExpandedFolders(new Set())`.
- **Causa raiz**: Falta de limpeza de estado derivado do workspace anterior.
- **Impacto no usuário**: Exibição de nós órfãos ou inconsistência visual na árvore lateral.
- **Impacto técnico**: Erros de referência nula ao tentar renderizar filhos de pastas não pertencentes ao workspace atual.
- **Frequência**: Sempre que o usuário possui pastas expandidas e altera o workspace ativo.
- **Dados ou estados envolvidos**: `expandedFolders`, `currentWorkspace`, `canvasList`.
- **Risco de regressão**: Baixo.
- **Forma de reprodução**: Abrir uma pasta na sidebar da Tela, trocar de workspace e observar a sidebar.
- **Como instrumentar ou medir**: Inspecionar o estado de `expandedFolders` via React DevTools ao trocar `currentWorkspace`.
- **Correção recomendada**: Adicionar `setExpandedFolders(new Set())` dentro do `useEffect` de troca de workspace em `CanvasPage.tsx`.
- **Ordem de implementação**: Fase 3.1 de Estabilização.
- **Critério de aceite**: `expandedFolders` é resetado limpo a cada alteração de `currentWorkspace`.
- **Estratégia de rollback**: Reverter a adição do resetador.
- **Dependências para correção**: Nenhuma.

---

## BUG-002 — Invalidação Nula de Formulário do Lead ao Alternar de Card no CRM

- **Tipo**: Bug de Interface / Estado Residual
- **Status**: Confirmado no código
- **Prioridade**: P1
- **Domínio afetado**: CRM
- **Localização exata**: `src/renderer/features/CRM/LeadDetailModal.tsx` (linhas 80-140)
- **Sintoma observado**: Dados de rascunhos editados em um lead aparecem preenchidos ao abrir um segundo lead rapidamente sem fechar o modal.
- **Evidência técnica**: O estado interno do formulário é inicializado com `useState(lead.properties)` na montagem do modal, sem `useEffect` resetando quando a prop `lead.id` muda.
- **Causa raiz**: Falta de sincronização de estado com alterações de props (`lead.id`).
- **Impacto no usuário**: Risco de salvar informações do Lead A dentro do cadastro do Lead B.
- **Impacto técnico**: Contaminação cruzada de payloads no `localStorage` (`axe_crm_leads`).
- **Frequência**: Alta em operações rápidas de navegação no Kanban.
- **Dados ou estados envolvidos**: Prop `lead`, estado local do formulário em `LeadDetailModal.tsx`.
- **Risco de regressão**: Baixo.
- **Forma de reprodução**: Abrir um lead, alterar um texto sem salvar, selecionar outro lead diretamente.
- **Como instrumentar ou medir**: Monitorar os dados preenchidos no modal ao receber props com `lead.id` diferente.
- **Correção recomendada**: Adicionar `key={lead.id}` na chamada do `<LeadDetailModal />` para forçar a remontagem limpa ao trocar de lead.
- **Ordem de implementação**: Fase 3.1 de Estabilização.
- **Critério de aceite**: Cada alteração de `lead.id` resulta em um modal com estado zerado.
- **Estratégia de rollback**: Remover a prop `key`.
- **Dependências para correção**: Nenhuma.
