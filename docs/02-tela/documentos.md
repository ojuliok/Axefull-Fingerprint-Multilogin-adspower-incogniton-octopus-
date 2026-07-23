# 02 — Subdomínio: Documentos (Sistema de Documentos Ricos)

## Responsabilidade de Negócio
O subdomínio de **Documentos** é responsável pela criação, visualização e edição de notas de texto linear, documentos estruturados com blocos TipTap e exportação de relatórios dentro da Área Tela.

---

## Mapeamento de Arquivos e Recursos

| Recurso | Caminho Exato no Código | Função no Subdomínio | Status |
|---|---|---|---|
| **Editor Linear** | `src/renderer/features/Canvas/CanvasRichText.tsx` | Editor WYSIWYG de documento com cabeçalhos, imagens e marcações | Ativo |
| **Renderer Linear**| `src/renderer/features/Canvas/LinearPageRenderer.tsx` | Visualização em modo leitura de documentos e relatórios sem barra de ferramentas | Ativo |
| **Estilos CSS** | `src/renderer/features/Canvas/CanvasRichText.module.css` | Folha de estilos para formatação de blocos de texto e tipografia | Ativo |
| **Página Externa** | `src/renderer/pages/NotesPage.tsx` | Editor monolítico de notas fora da Tela | Duplicado / Legado |

---

## Avaliação Técnica e Diagnóstico de Dependências

1. **Responsabilidade Principal**:
   Prover uma experiência de escrita limpa e focada, isolada da física 2D do Canvas.
2. **Dependências Estritamente Necessárias**:
   - `@tiptap/react` e extensões de código/imagem (`starter-kit`).
   - `WorkspaceContext` (para associar o documento ao projeto correto).
3. **Dependências Inadequadas Identificadas**:
   - *Confirmado no código*: O `CanvasRichText.tsx` é forçado a utilizar o tipo genérico `CanvasInfo` do `canvasStorage.ts`, herdando atributos irrelevantes como `viewport_x`, `viewport_y`, `zoom`, `strokes` e `connections`.
4. **Compartilhamento de Dados e Risco**:
   - *Confirmado no código*: Os documentos são gravados na tabela `nodes` do Supabase com o campo `type: 'page'`, compartilhando o mesmo endpoint de sincronização do Canvas 2D.
