# Estratégia de Migração Gradual (Roteiro da Fase 5)

## Visão Geral
Para garantir que o repositório continue 100% funcional e sem regressões durante a refatoração física, a extração de código na **Fase 5** será realizada em **passos incrementais, atômicos e estritamente testados**.

---

## 1. Matriz de Passos de Migração (Fase 5)

| Passo | Etapa de Refatoração | Arquivos Impactados | Mecanismo de Validação |
|---|---|---|---|
| **Passo 1** | Criar Kernel Compartilhado (`EventBus` e Tipos Globais) | `src/renderer/shared/events/` | `npx tsc --noEmit` + `npm run build:renderer` |
| **Passo 2** | Extrair Contratos e Interfaces TypeScript por Domínio | `src/renderer/domains/*/types/` | `npx tsc --noEmit` |
| **Passo 3** | Extrair Lógica do CRM para `domains/crm/` | `src/renderer/features/CRM/` -> `domains/crm/` | Execução do app + teste manual do Kanban |
| **Passo 4** | Extrair Custom Hooks do Canvas (`useCanvasState`, `useCanvasDragResize`) | `src/renderer/features/Canvas/hooks/` | Teste visual de drag/drop e criação de nós |
| **Passo 5** | Decompor `InfiniteCanvas.tsx` em Subcomponentes Visuais | `src/renderer/domains/canvas/components/` | Teste de pan, zoom e renderização de nós |
| **Passo 6** | Decompor `CanvasPage.tsx` (`CanvasSidebar`, `CanvasTabBar`) | `src/renderer/pages/components/` | Teste de alternância de workspace e abas |

---

## 2. Protocolo de Segurança e Rollback por Passo

Antes de avançar entre passos na Fase 5, cada alteração deve obedecer à seguinte rotina de validação:

1. **Compilação Estática**: `npx tsc --noEmit` deve retornar **exit code 0** (zero erros de tipagem).
2. **Build de Produção**: `npm run build:renderer` deve ser concluído sem avisos de importações quebradas.
3. **Preservação de Fachada**: Se um arquivo antigo for movido (ex: `src/renderer/features/CRM/CRMContext.tsx`), deve ser mantido um arquivo de re-exportação (re-export façade) no caminho original até que todos os consumidores tenham sido migrados:
   ```typescript
   // src/renderer/features/CRM/CRMContext.tsx (Re-export Façade para Retrocompatibilidade)
   export * from '../../domains/crm/context/CRMContext';
   ```
4. **Rollback Imediato**: Se um passo apresentar falha de runtime ou regressão visual, a alteração daquele passo é revertida individualmente antes de prosseguir.
