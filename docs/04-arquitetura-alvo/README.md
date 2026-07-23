# 04 — Arquitetura Alvo e Desenho de Contratos

## Visão Geral
Este diretório documenta o desenho técnico da **Arquitetura Alvo Modular** para a área Tela e domínios integrados do projeto **Axefull - Fingerprint**.

O objetivo desta fase é definir formalmente as fronteiras de contexto (*Bounded Contexts*), os contratos de dados e serviços (interfaces TypeScript), o barramento de eventos desacoplado (*Event Bus*) e a estratégia de extração física para a próxima fase (Fase 5), **sem alterar a experiência do usuário e mantendo 100% congelada a área protegida do módulo Fingerprint**.

---

## ⛔ REGRA INEGOCIÁVEL DE ESCOPO
- O módulo **Fingerprint** (`src/main/features/fingerprint/`, `src/main/features/browser/`, geradores, scripts e IPCs) é uma **ÁREA PROTEGIDA E INTOCÁVEL**.
- Não mover, não alterar, não refatorar e não criar dependências diretas com arquivos ou contratos internos do Fingerprint.

---

## Estrutura de Documentos em `docs/04-arquitetura-alvo/`

1. [`README.md`](./README.md) — Apresentação e guia da Fase 4.
2. [`visao-geral-da-arquitetura-alvo.md`](./visao-geral-da-arquitetura-alvo.md) — Visão geral da arquitetura modular baseada em DDD e Clean Architecture.
3. [`bounded-contexts-e-dominios.md`](./bounded-contexts-e-dominios.md) — Definição dos 5 domínios principais (Canvas, CRM, Documentos, Espaços e Pastas).
4. [`contratos-e-interfaces-typescript.md`](./contratos-e-interfaces-typescript.md) — Especificação completa dos contratos e interfaces de serviços.
5. [`event-bus-e-comunicacao-inter-dominios.md`](./event-bus-e-comunicacao-inter-dominios.md) — Modelo de Pub/Sub e barramento de eventos desacoplado.
6. [`desacoplamento-de-infinite-canvas-e-canvas-page.md`](./desacoplamento-de-infinite-canvas-e-canvas-page.md) — Estratégia de divisão dos monólitos `InfiniteCanvas.tsx` e `CanvasPage.tsx`.
7. [`estrategia-de-migracao-gradual.md`](./estrategia-de-migracao-gradual.md) — Roteiro de extração segura da Fase 5 com plano de rollback.
8. [`garantia-de-isolamento-fingerprint.md`](./garantia-de-isolamento-fingerprint.md) — Registro de proteção inegociável do módulo Fingerprint.
