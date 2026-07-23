# 03 — Catálogo de Dívidas Técnicas e Arquiteturais

## Visão Geral
Mapeamento de violações de fronteira, arquivos monolíticos e código duplicado ou acoplado na Área Tela.

---

## ARCH-001 — Monolito do Renderizador 2D `InfiniteCanvas.tsx` (346 KB)

- **Tipo**: Arquitetura / Arquivo Monolítico
- **Status**: Confirmado no código
- **Prioridade**: P2
- **Domínio afetado**: Canvas 2D
- **Localização exata**: `src/renderer/features/Canvas/InfiniteCanvas.tsx`
- **Sintoma observado**: Dificuldade extrema de manutenção, leitura e evolução de novas funcionalidades visuais no canvas.
- **Evidência técnica**: O arquivo possui +3.800 linhas contendo em um único componente React o gerenciamento da matriz de viewport, ferramentas de desenho SVG, menu contextual, seleção em caixa, edição de nós e atalhos de teclado.
- **Causa raiz**: Crescimento orgânico sem refatoração de extração de sub-componentes.
- **Impacto no usuário**: Indireto (dificulta a correção rápida de bugs).
- **Impacto técnico**: Dificuldade de aplicação de otimizações com `React.memo` em partes específicas da UI do canvas.
- **Frequência**: Constante durante o desenvolvimento.
- **Dados ou estados envolvidos**: Todo o estado interno do canvas.
- **Risco de regressão**: Alto durante a extração (requer execução por etapas pequenas).
- **Forma de reprodução**: Leitura e auditoria do arquivo `InfiniteCanvas.tsx`.
- **Como instrumentar ou medir**: Medir a redução na contagem de linhas e no tamanho do arquivo após as extrações.
- **Correção recomendada**: Fazer a decomposição gradual em sub-componentes (`CanvasViewport`, `CanvasToolbar`, `NodeRenderer`, `StrokeRenderer`).
- **Ordem de implementação**: Fase 4/5 do Roadmap (Após a estabilização de bugs e dados).
- **Critério de aceite**: `InfiniteCanvas.tsx` atuando apenas como container de composição com menos de 500 linhas.
- **Estratégia de rollback**: Manter o arquivo monolítico intacto até a validação completa dos sub-componentes.
- **Dependências para correção**: Conclusão da Fase 3.1 de Estabilização.

---

## ARCH-002 — Modelo Unificado Heterogêneo `CanvasInfo`

- **Tipo**: Arquitetura / Modelagem de Dados Inadequada
- **Status**: Confirmado no código
- **Prioridade**: P2
- **Domínio afetado**: Documentos, Canvas, Pastas, Espaços
- **Localização exata**: `src/renderer/features/Canvas/canvasTypes.ts` (`CanvasInfo`)
- **Sintoma observado**: Documentos simples em texto e pastas vazias são carregados na memória contendo propriedades como `viewport_x`, `viewport_y`, `zoom` e `strokes`.
- **Evidência técnica**: O tipo TypeScript `CanvasInfo` serve simultaneamente a todas as entidades da Área Tela, forçando o mesmo payload de propriedades no LocalStorage e no Supabase.
- **Causa raiz**: Modelagem de dados genérica adotada no início do projeto.
- **Impacto no usuário**: Payloads de rede e de armazenamento desnecessariamente inflados.
- **Impacto técnico**: Dificuldade em estabelecer validações estritas de tipagem por tipo de nó.
- **Frequência**: Em todas as leituras de banco e storage da Tela.
- **Dados ou estados envolvidos**: `CanvasInfo`, `canvasStorage.ts`.
- **Risco de regressão**: Médio.
- **Forma de reprodução**: Inspecionar os objetos retornados por `getCanvasList()`.
- **Como instrumentar ou medir**: Medir o tamanho em bytes do payload JSON serializado antes e depois da segregação de interfaces.
- **Correção recomendada**: Criar discriminação de uniões de tipos (`DocumentNode`, `CanvasNode`, `FolderNode`) compartilhando apenas o cabeçalho base (`BaseNode`).
- **Ordem de implementação**: Fase 4 de Arquitetura Alvo.
- **Critério de aceite**: Cada entidade consome apenas os atributos pertencentes ao seu domínio.
- **Estratégia de rollback**: Reverter para a interface `CanvasInfo` genérica.
- **Dependências para correção**: Fase 3.1 concluída.
