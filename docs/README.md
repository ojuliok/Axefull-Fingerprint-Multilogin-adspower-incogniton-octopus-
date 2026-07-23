# Índice Mestre da Documentação Técnica do Projeto

## Visão Geral
Este documento fornece o mapa completo e atualizado de toda a documentação de arquitetura, inventário, diagnóstico, modelos de dados, estabilização, arquitetura alvo e refatoração modular do repositório **Axefull - Fingerprint**.

> [!CAUTION]
> ### REGRAS DE ESCOPO E ÁREA PROTEGIDA
> - O módulo **Fingerprint** (`src/main/features/fingerprint/`, `src/main/features/browser/`, geradores, scripts de injeção) é uma **ÁREA TOTALMENTE PROTEGIDA E EXCLUÍDA DE QUALQUER MODIFICAÇÃO OU ANÁLISE INTERNA**.

---

## Estrutura da Documentação (`docs/`)

### 📁 [`docs/00-visao-geral/`](./00-visao-geral/README.md)
- [`README.md`](./00-visao-geral/README.md) — Apresentação e guia da documentação inicial.
- [`escopo-e-restricoes.md`](./00-visao-geral/escopo-e-restricoes.md) — Congelamento e restrições inegociáveis do módulo Fingerprint.
- [`inventario-do-repositorio.md`](./00-visao-geral/inventario-do-repositorio.md) — Mapeamento físico de pastas, configs e assets.
- [`stack-e-dependencias.md`](./00-visao-geral/stack-e-dependencias.md) — Tecnologias, dependências e scripts npm.
- [`mapa-de-projetos-internos.md`](./00-visao-geral/mapa-de-projetos-internos.md) — Mapeamento dos 6 motores mesclados no repositório.

### 📁 [`docs/01-inventario-funcional/`](./01-inventario-funcional/mapa-de-rotas.md)
- [`mapa-de-rotas.md`](./01-inventario-funcional/mapa-de-rotas.md) — Mapeamento de rotas e navegação HashRouter.
- [`mapa-de-paginas.md`](./01-inventario-funcional/mapa-de-paginas.md) — Inventário completo de páginas e telas.
- [`mapa-de-componentes.md`](./01-inventario-funcional/mapa-de-componentes.md) — Lista de componentes visuais e de UI.
- [`mapa-de-servicos-e-apis.md`](./01-inventario-funcional/mapa-de-servicos-e-apis.md) — Handlers IPC, serviços Node e APIs.
- [`mapa-de-estados-e-stores.md`](./01-inventario-funcional/mapa-de-estados-e-stores.md) — React Contexts e persistência LocalStorage.
- [`mapa-de-banco-e-modelos.md`](./01-inventario-funcional/mapa-de-banco-e-modelos.md) — Schemas SQLite local e tabelas Supabase.
- [`mapa-de-integracoes.md`](./01-inventario-funcional/mapa-de-integracoes.md) — Conectores externos, binários (FFmpeg) e protocolos.
- [`codigo-duplicado-ou-legado.md`](./01-inventario-funcional/codigo-duplicado-ou-legado.md) — Duplicações e código legado identificado.
- [`funcionalidades-sem-uso-ou-incompletas.md`](./01-inventario-funcional/funcionalidades-sem-uso-ou-incompletas.md) — Trechos inativos ou incompletos.

### 📁 [`docs/02-tela/`](./02-tela/arquitetura-atual-da-tela.md) *(12 Documentos de Auditoria da Área Tela)*
1. [`arquitetura-atual-da-tela.md`](./02-tela/arquitetura-atual-da-tela.md)
2. [`mapa-de-dependencias-da-tela.md`](./02-tela/mapa-de-dependencias-da-tela.md)
3. [`fluxo-de-dados-da-tela.md`](./02-tela/fluxo-de-dados-da-tela.md)
4. [`documentos.md`](./02-tela/documentos.md)
5. [`crm.md`](./02-tela/crm.md)
6. [`canvas.md`](./02-tela/canvas.md)
7. [`espacos.md`](./02-tela/espacos.md)
8. [`pastas.md`](./02-tela/pastas.md)
9. [`conflitos-e-sobrecargas-identificados.md`](./02-tela/conflitos-e-sobrecargas-identificados.md)
10. [`matriz-de-fontes-de-verdade.md`](./02-tela/matriz-de-fontes-de-verdade.md)
11. [`auditoria-de-renders-e-listeners.md`](./02-tela/auditoria-de-renders-e-listeners.md)
12. [`proposta-de-isolamento.md`](./02-tela/proposta-de-isolamento.md)

### 📁 [`docs/03-diagnostico/`](./03-diagnostico/README.md) *(12 Documentos de Diagnóstico Técnico)*
- [`README.md`](./03-diagnostico/README.md) — Visão geral da Fase 3 de diagnóstico.
- [`bugs-confirmados.md`](./03-diagnostico/bugs-confirmados.md) — Catálogo de bugs confirmados (`BUG-xxx`).
- [`performance-e-peso.md`](./03-diagnostico/performance-e-peso.md) — Análise de gargalos e peso (`PERF-xxx`).
- [`concorrencia-e-integridade-de-dados.md`](./03-diagnostico/concorrencia-e-integridade-de-dados.md) — Inconsistências de dados (`DATA-xxx`).
- [`memoria-listeners-e-lifecycle.md`](./03-diagnostico/memoria-listeners-e-lifecycle.md) — Memory leaks e listeners (`MEM-xxx`).
- [`dividas-tecnicas.md`](./03-diagnostico/dividas-tecnicas.md) — Dívidas técnicas e arquiteturais (`ARCH-xxx`/`DEBT-xxx`).
- [`dependencias-para-remover-ou-substituir.md`](./03-diagnostico/dependencias-para-remover-ou-substituir.md) — Análise de dependências (`DEP-xxx`).
- [`hipoteses-a-validar.md`](./03-diagnostico/hipoteses-a-validar.md) — Hipóteses a testar.
- [`riscos-de-regressao.md`](./03-diagnostico/riscos-de-regressao.md) — Riscos e prevenções.
- [`matriz-de-priorizacao.md`](./03-diagnostico/matriz-de-priorizacao.md) — Matriz de severidade P0 a P3.
- [`plano-de-instrumentacao.md`](./03-diagnostico/plano-de-instrumentacao.md) — Metodologia de medição de FPS, RAM e Renders.
- [`backlog-tecnico-priorizado.md`](./03-diagnostico/backlog-tecnico-priorizado.md) — Backlog unificado ordenado.

### 📁 [`docs/04-arquitetura-alvo/`](./04-arquitetura-alvo/README.md) *(Fase 4 — Arquitetura Alvo e Desenho de Contratos)*
- [`README.md`](./04-arquitetura-alvo/README.md) — Apresentação da Fase 4.
- [`visao-geral-da-arquitetura-alvo.md`](./04-arquitetura-alvo/visao-geral-da-arquitetura-alvo.md) — Arquitetura desacoplada por domínios e camadas.
- [`bounded-contexts-e-dominios.md`](./04-arquitetura-alvo/bounded-contexts-e-dominios.md) — Definição dos 5 domínios (Canvas, CRM, Documentos, Espaços e Pastas).
- [`contratos-e-interfaces-typescript.md`](./04-arquitetura-alvo/contratos-e-interfaces-typescript.md) — Interfaces e abstrações de serviços TypeScript.
- [`event-bus-e-comunicacao-inter-dominios.md`](./04-arquitetura-alvo/event-bus-e-comunicacao-inter-dominios.md) — Barramento de eventos pub/sub desacoplado.
- [`desacoplamento-de-infinite-canvas-e-canvas-page.md`](./04-arquitetura-alvo/desacoplamento-de-infinite-canvas-e-canvas-page.md) — Plano de divisão dos monólitos `InfiniteCanvas.tsx` e `CanvasPage.tsx`.
- [`estrategia-de-migracao-gradual.md`](./04-arquitetura-alvo/estrategia-de-migracao-gradual.md) — Matriz passo a passo para a Fase 5 de extração segura.
- [`garantia-de-isolamento-fingerprint.md`](./04-arquitetura-alvo/garantia-de-isolamento-fingerprint.md) — Registro de proteção inegociável do módulo Fingerprint.

### 📁 [`docs/05-refatoracao-modular/`](./05-refatoracao-modular/README.md) *(Fase 5 — Refatoração e Extração Gradual por Domínios)*
- [`README.md`](./05-refatoracao-modular/README.md) — Relatório e registro das etapas de refatoração executadas.

### 📁 [`docs/06-estabilizacao/`](./06-estabilizacao/README.md) *(Fases 3.1 e 3.2 — Estabilização e Evidências)*
- [`README.md`](./06-estabilizacao/README.md) — Visão geral da estabilização.
- [`validacao-fase-3-1.md`](./06-estabilizacao/validacao-fase-3-1.md) — Relatório consolidado de auditoria e status.
- [`PERF-001-validacao-drag-drop.md`](./06-estabilizacao/PERF-001-validacao-drag-drop.md) — Validação e evidências do arrasto de nós.
- [`PERF-002-validacao-renders-pastas.md`](./06-estabilizacao/PERF-002-validacao-renders-pastas.md) — Validação de isolamento do InfiniteCanvas com React.memo.
- [`DATA-001-validacao-concorrencia.md`](./06-estabilizacao/DATA-001-validacao-concorrencia.md) — Validação de concorrência e leitura atômica de revisão.
- [`DATA-002-e-BUG-002-validacao-crm.md`](./06-estabilizacao/DATA-002-e-BUG-002-validacao-crm.md) — Validação de debounce e reconciliação de formulário do CRM.
- [`evidencias-de-compilacao-e-testes.md`](./06-estabilizacao/evidencias-de-compilacao-e-testes.md) — Relatório de tsc exit code 0 e build electron-vite.
- [`changelog-tecnico.md`](./06-estabilizacao/changelog-tecnico.md) — Registro unificado de modificações aplicadas.
