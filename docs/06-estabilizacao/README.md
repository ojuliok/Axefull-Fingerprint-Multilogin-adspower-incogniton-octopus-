# 06 — Estabilização Controlada (Fase 3.1)

## Apresentação
Este diretório registra a documentação técnica, testes e changelog da **Fase 3.1 — Estabilização de Bugs Críticos, Listeners, Persistência e Renderizações**.

Nesta fase, foram aplicadas estritamente correções cirúrgicas, reversíveis e de baixo risco, sem mover arquivos, sem refatoração física de arquitetura e sem alterar visualmente a interface do usuário.

---

## ⛔ REGRA INEGOCIÁVEL DE ESCOPO
- O módulo **Fingerprint** permaneceu **100% INTOCADO, CONGELADO E FORA DE ESCOPO**.

---

## Estrutura de Documentos em `docs/06-estabilizacao/`

1. [`README.md`](./README.md) — Apresentação da Fase 3.1.
2. [`MEM-001-listener-crm-reload-leads.md`](./MEM-001-listener-crm-reload-leads.md) — Correção de cleanup do listener `crm-reload-leads`.
3. [`MEM-002-resize-crm.md`](./MEM-002-resize-crm.md) — Cleanup defensivo de listeners de resize no `CRMList.tsx`.
4. [`PERF-001-persistencia-canvas.md`](./PERF-001-persistencia-canvas.md) — Remoção da escrita síncrona no LocalStorage no evento wheel/drag.
5. [`DATA-001-concorrencia-canvas.md`](./DATA-001-concorrencia-canvas.md) — Controle de revisão, `updatedAt`, `updatedBy` e detecção de conflitos.
6. [`PERF-002-e-BUG-001-arvore-de-pastas.md`](./PERF-002-e-BUG-001-arvore-de-pastas.md) — Isolamento e reset de `expandedFolders` na troca de workspace.
7. [`DATA-002-persistencia-leads.md`](./DATA-002-persistencia-leads.md) — Debounce e flush de atualizações contínuas de leads.
8. [`BUG-002-formulario-lead.md`](./BUG-002-formulario-lead.md) — Reconciliação limpa e flush do formulário no `LeadDetailModal`.
9. [`testes-executados.md`](./testes-executados.md) — Relatório de testes manuais e de compilação estática.
10. [`riscos-e-rollbacks.md`](./riscos-e-rollbacks.md) — Estratégia de rollback individual por item.
11. [`changelog-tecnico.md`](./changelog-tecnico.md) — Registro unificado de alterações técnicas aplicadas.
