# 03 — Análise de Dependências e Oportunidades de Redução de Peso

## Visão Geral
Avaliação técnica dos pacotes e dependências de terceiros importados no projeto, identificando bibliotecas pesadas, sobrepostas ou desnecessárias na Área Tela.

---

## DEP-001 — Otimização de Bundling do Package `@dnd-kit/core` e `@dnd-kit/sortable`

- **Tipo**: Dependência / Análise de Peso
- **Status**: Confirmado no código
- **Prioridade**: P3
- **Domínio afetado**: CRM
- **Localização exata**: `package.json`, `CRMList.tsx`, `KanbanBoard.tsx`
- **Sintoma observado**: O pacote `@dnd-kit` é carregado no bundle inicial do React Renderer mesmo que o usuário navegue apenas para a `/home` ou para `/notes`.
- **Evidência técnica**: O `App.tsx` utiliza React `lazy()` para a página `CRMPage`, mas o wrapper de tipos e estilos da dnd-kit possui referências importadas diretamente em contextos compartilhados.
- **Causa raiz**: Falta de isolamento de imports dentro do bundle secundário da feature CRM.
- **Impacto no usuário**: Tamanho inicial do JS ligeiramente maior no carregamento da aplicação.
- **Impacto técnico**: Aumento do tempo de avaliação de script (parse/compile) do Chromium na inicialização.
- **Frequência**: Na inicialização do app.
- **Dados ou estados envolvidos**: Bundle final `dist/renderer/index.js`.
- **Risco de regressão**: Zero.
- **Forma de reprodução**: Executar o build de produção `npm run build` e analisar a árvore de dependências com `vite-plugin-visualizer`.
- **Como instrumentar ou medir**: Medir o tamanho do chunk principal em KB antes e depois de isolar os imports do `@dnd-kit`.
- **Correção recomendada**: Garantir que todos os imports de `@dnd-kit` ocorram estritamente dentro da pasta `src/renderer/features/CRM/` sem vazamento para componentes globais de layout.
- **Ordem de implementação**: Fase 7 de Otimização e Limpeza.
- **Critério de aceite**: O chunk inicial do `index.js` não contém código do `@dnd-kit`.
- **Estratégia de rollback**: Manter os imports como estão.
- **Dependências para correção**: Conclusão da isolação do CRM.
