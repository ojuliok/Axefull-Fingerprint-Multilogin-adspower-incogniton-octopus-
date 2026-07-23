# 02 — Subdomínio: Pastas (Hierarquia em Árvore)

## Responsabilidade de Negócio
O subdomínio de **Pastas** organiza itens da Tela (canvas, documentos, tabelas, sub-pastas) em uma estrutura de diretórios e arquivos hierárquicos do tipo árvore.

---

## Mapeamento de Arquivos e Recursos

| Recurso | Caminho Exato no Código | Função no Subdomínio | Status |
|---|---|---|---|
| **Árvore na Sidebar** | `src/renderer/pages/CanvasPage.tsx` (método `renderFolderTree`) | Renderiza recursivamente pastas e sub-itens na barra lateral | Ativo (Acoplado) |
| **Criação de Pastas** | `src/renderer/features/Canvas/canvasStorage.ts` (`createFolder`) | Cria registro de pasta na lista offline/online | Ativo |
| **Movimentação** | `src/renderer/features/Canvas/canvasStorage.ts` (`moveCanvasItem`) | Altera o `parent_id` de um nó para movê-lo de pasta | Ativo |

---

## Avaliação Técnica e Diagnóstico de Dependências

1. **Responsabilidade Principal**:
   Estruturação hierárquica e categorização de recursos.
2. **Dependências Estritamente Necessárias**:
   - Algoritmo de busca e ordenação em árvore (`parentId -> id`).
3. **Problemas Arquiteturais Identificados**:
   - *Confirmado no código*: A renderização da árvore de pastas é feita por uma função recursiva inline dentro de `CanvasPage.tsx` (`renderFolderTree`), em vez de ser um componente isolado (`<FolderTree />`).
   - *Confirmado no código*: O estado de pastas expandidas (`expandedFolders`) é mantido como um `Set<string>` no estado do componente principal `CanvasPage.tsx`. Toda vez que uma pasta é expandida ou recolhida, todo o layout da Tela (incluindo o canvas visível) é re-renderizado.
