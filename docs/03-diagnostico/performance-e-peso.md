# 03 — Análise de Performance e Peso de Renderização

## Visão Geral
Mapeamento de gargalos de processamento, re-renderizações em cascata e operações bloqueantes identificados na Área Tela.

---

## PERF-001 — Gravação Síncrona Bloqueante no LocalStorage durante Drag/Drop no Canvas

- **Tipo**: Performance / I/O Bloqueante
- **Status**: Confirmado no código
- **Prioridade**: P0
- **Domínio afetado**: Canvas 2D
- **Localização exata**: `src/renderer/features/Canvas/canvasStorage.ts`, função `updateLocalCachedNodes()` (linhas 25-52)
- **Sintoma observado**: Micro-travamentos ("stuttering") do ponteiro do mouse durante o movimento de arrastar nós no canvas.
- **Evidência técnica**: A cada movimento de mouse durante o arrasto, `updateLocalCachedNodes()` executa `localStorage.setItem()` com a serialização `JSON.stringify()` da matriz completa de nós do workspace.
- **Causa raiz**: Falta de debounce/throttling na chamada de persistência no LocalStorage.
- **Impacto no usuário**: Sensação de peso e falta de fluidez ao organizar o canvas.
- **Impacto técnico**: Bloqueio da Event Loop principal da UI do Chromium no Electron durante operações de gravação de arquivos grandes em disco.
- **Frequência**: A cada evento de movimento de mouse durante drag/drop.
- **Dados ou estados envolvidos**: `localStorage`, `CanvasNode[]`.
- **Risco de regressão**: Baixo se mantido o flush ao soltar o mouse.
- **Forma de reprodução**: Mover um nó com dezenas de elementos no canvas e observar a taxa de FPS com o Performance Profiler do Chrome DevTools.
- **Como instrumentar ou medir**: Medir a frequência de execuções de `localStorage.setItem` por segundo durante o drag.
- **Correção recomendada**: Tirar a gravação do LocalStorage do evento de movimento e realizar o salvamento apenas ao soltar o elemento (`onPointerUp`) ou via debounce de 500ms.
- **Ordem de implementação**: Fase 3.1 de Estabilização (Prioridade 3 no plano inicial).
- **Critério de aceite**: Zero chamadas a `localStorage.setItem` durante o evento contínuo de `pointermove`.
- **Estratégia de rollback**: Restaurar a chamada síncrona.
- **Dependências para correção**: Nenhuma.

---

## PERF-002 — Re-renderização Completa da Tela por Expansão de Pastas (`expandedFolders`)

- **Tipo**: Performance / Re-render em Cascata
- **Status**: Confirmado no código
- **Prioridade**: P1
- **Domínio afetado**: Pastas / Canvas 2D / CRM
- **Localização exata**: `src/renderer/pages/CanvasPage.tsx` (linha 59)
- **Sintoma observado**: O editor do Canvas pisca ou re-calcula bounds visuais ao clicar na seta de abrir uma pasta na sidebar.
- **Evidência técnica**: `expandedFolders` é mantido no `useState` do container pai `CanvasPage.tsx`. Alterar esse estado força a re-execução da função render de toda a página `CanvasPage` e de seus filhos (`InfiniteCanvas.tsx`, `CRMCanvasView`).
- **Causa raiz**: Ausência de isolamento de estado e falta de memorização (`React.memo`) na subárvore de navegadores.
- **Impacto no usuário**: Lentidão percebida ao navegar na árvore de arquivos lateral enquanto trabalha em um canvas ou documento.
- **Impacto técnico**: Desperdício de ciclo de CPU recalculando componentes pesados que não sofreram alterações de props.
- **Frequência**: Sempre que o usuário expande ou recolhe uma pasta na sidebar.
- **Dados ou estados envolvidos**: `expandedFolders`, `CanvasPage` state.
- **Risco de regressão**: Baixo.
- **Forma de reprodução**: Habilitar a opção "Highlight updates when components render" no React DevTools e clicar para abrir uma pasta na sidebar.
- **Como instrumentar ou medir**: Contar o número de re-renders de `<InfiniteCanvas />` ao alterar `expandedFolders`.
- **Correção recomendada**: Isolar a árvore de pastas em um componente próprio (`<FolderTree />`) com estado local ou memorizar o `<InfiniteCanvas />` com `React.memo`.
- **Ordem de implementação**: Fase 3.1 de Estabilização (Prioridade 2 no plano inicial).
- **Critério de aceite**: Expandir pastas na sidebar gera zero re-renders no `<InfiniteCanvas />`.
- **Estratégia de rollback**: Manter o estado `expandedFolders` no componente pai.
- **Dependências para correção**: Nenhuma.
