# 03 — Diagnóstico Geral de Bugs, Performance e Dívidas Técnicas

## Apresentação
Este bloco da documentação reúne o catálogo detalhado, fundamentado e priorizado de todos os problemas técnicos identificados na Área Tela e seus subdomínios (Canvas, CRM, Documentos, Espaços e Pastas).

---

## Estrutura da Documentação de Diagnóstico (`docs/03-diagnostico/`)

1. [`README.md`](./README.md) — Índice e apresentação da Fase 3.
2. [`bugs-confirmados.md`](./bugs-confirmados.md) — Catálogo de erros funcionais e lógicos (`BUG-xxx`).
3. [`performance-e-peso.md`](./performance-e-peso.md) — Análise de gargalos de renderização e I/O (`PERF-xxx`).
4. [`concorrencia-e-integridade-de-dados.md`](./concorrencia-e-integridade-de-dados.md) — Risco de concorrência e sobrescrita (`DATA-xxx`).
5. [`memoria-listeners-e-lifecycle.md`](./memoria-listeners-e-lifecycle.md) — Memory leaks e handlers desprotegidos (`MEM-xxx`).
6. [`dividas-tecnicas.md`](./dividas-tecnicas.md) — Acoplamento estrutural e arquivos monolíticos (`ARCH-xxx` / `DEBT-xxx`).
7. [`dependencias-para-remover-ou-substituir.md`](./dependencias-para-remover-ou-substituir.md) — Avaliação de bibliotecas e peso (`DEP-xxx`).
8. [`hipoteses-a-validar.md`](./hipoteses-a-validar.md) — Hipóteses pendentes de teste e instrumentação.
9. [`riscos-de-regressao.md`](./riscos-de-regressao.md) — Matriz de prevenção de regresso por refatoração.
10. [`matriz-de-priorizacao.md`](./matriz-de-priorizacao.md) — Classificação de severidade P0 a P3.
11. [`plano-de-instrumentacao.md`](./plano-de-instrumentacao.md) — Metodologia de medição de FPS, RAM e Renders sem alteração de código.
12. [`backlog-tecnico-priorizado.md`](./backlog-tecnico-priorizado.md) — Lista unificada ordenada de implementação futura.

---

## ⛔ PROTOCOLO DE EXECUÇÃO DA FASE 3
- **NENHUM** arquivo de código fonte (`.ts`, `.tsx`, `.js`, `.json`) foi alterado, movido ou refatorado.
- Esta fase é **estritamente investigativa e documental**.
- O módulo **Fingerprint** permaneceu 100% congelado e fora de escopo.
