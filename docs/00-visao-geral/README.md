# 00 — Visão Geral do Projeto e Arquitetura Legada

## Apresentação
Este repositório contém uma aplicação Desktop híbrida (Electron + React 18 + Vite + TypeScript) que combina um ecossistema completo de produtividade, gestão, canvas colaborativo 2D, CRM Kanban, sistema de notas ricas e automação de navegadores.

Devido ao crescimento orgânico do projeto, múltiplos sub-sistemas foram agregados no mesmo repositório, resultando em acoplamento entre a camada UI, motores de persistência locais/remotos e o motor de perfis anti-detect.

---

## Estrutura da Documentação
A documentação técnica deste projeto está dividida em 6 blocos organizados em `docs/`:

1. [`docs/00-visao-geral/`](./README.md)
   - Visão geral, diretrizes de escopo, inventário do repositório, stack de tecnologia e mapa de projetos internos.
2. [`docs/01-inventario-funcional/`](../01-inventario-funcional/mapa-de-rotas.md) *(Fase 1)*
   - Mapeamento detalhado de rotas, páginas, componentes, APIs, stores, banco de dados e código legado.
3. [`docs/02-tela/`](../02-tela/arquitetura-atual-da-tela.md) *(Fase 2)*
   - Auditoria profunda da área "Tela" (Documentos, CRM, Canvas, Espaços, Pastas).
4. [`docs/03-diagnostico/`](../03-diagnostico/bugs-confirmados.md) *(Fase 3)*
   - Relatório de bugs, gargalos de performance, vazamentos de memória e dívidas técnicas.
5. [`docs/04-arquitetura-alvo/`](../04-arquitetura-alvo/arquitetura-proposta.md) *(Fase 4)*
   - Desenho da arquitetura modular por domínios e contratos entre camadas.
6. [`docs/05-plano-de-refatoracao/`](../05-plano-de-refatoracao/roadmap-geral.md) *(Fase 5)*
   - Roadmap de refatoração incremental, checklists e estratégias de validação/rollback.

---

## Conteúdo deste Bloco (00-visao-geral)
- [Escopo e Restrições (Proteção do Fingerprint)](./escopo-e-restricoes.md)
- [Inventário do Repositório](./inventario-do-repositorio.md)
- [Stack de Tecnologias e Dependências](./stack-e-dependencias.md)
- [Mapa de Projetos Internos e Motores](./mapa-de-projetos-internos.md)
