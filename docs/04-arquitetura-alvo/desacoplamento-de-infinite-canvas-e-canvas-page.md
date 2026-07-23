# Desacoplamento de Monólitos (`InfiniteCanvas` e `CanvasPage`)

## Visão Geral
Os componentes `InfiniteCanvas.tsx` (346 KB, ~5.800 linhas) e `CanvasPage.tsx` (118 KB, ~2.300 linhas) acumulam múltiplos papéis que devem ser segregados em componentes especializados e *custom hooks* na Fase 5.

---

## 1. Plano de Decomposição do `InfiniteCanvas.tsx`

```text
src/renderer/domains/canvas/
├── InfiniteCanvas.tsx             # Componente container fino (Orquestrador)
├── components/
│   ├── CanvasViewport.tsx         # Superfície de pan, zoom e tratamento de mouse/wheel
│   ├── CanvasNodeRenderer.tsx     # Delegador de renderização por tipo de nó (memoizado)
│   ├── CanvasConnectionsLayer.tsx # Camada SVG de linhas e setas de conexão
│   ├── CanvasStrokesLayer.tsx     # Camada SVG de traços de desenho livre (strokes)
│   ├── CanvasToolbar.tsx          # Barra de ferramentas flutuante
│   └── CanvasFormattingBar.tsx    # Formatador de texto e propriedades visuais
└── hooks/
    ├── useCanvasState.ts          # Gerenciamento local de nodes, strokes e connections
    ├── useCanvasHistory.ts        # Histórico de Undo / Redo
    ├── useCanvasDragResize.ts     # Manipulação de movimentação e redimensionamento
    └── useCanvasKeyboard.ts       # Atalhos de teclado (Ctrl+Z, Delete, Espaço)
```

### Regras de Extração:
- Cada submódulo terá no máximo 300 a 400 linhas.
- `CanvasNodeRenderer` utilizará `React.memo` por nó, evitando re-renderizar nós estáticos durante movimentação de outros elementos.
- Toda a matemática de conversão de coordenadas tela-canvas (`screenToCanvas`) será isolada em `services/nodeMath.ts`.

---

## 2. Plano de Decomposição do `CanvasPage.tsx`

```text
src/renderer/pages/
├── CanvasPage.tsx                 # View orquestradora leve da rota
└── components/CanvasLayout/
    ├── CanvasSidebar.tsx          # Navegação lateral, árvore de pastas e espaços
    ├── CanvasTabBar.tsx           # Gerenciamento de abas abertas (`openTabs`)
    ├── CanvasHeader.tsx           # Cabeçalho da página e busca rápida
    └── CanvasPaneLayout.tsx       # Gerenciador de layout em tela dividida (Split-View)
```

### Regras de Extração:
- O estado de `expandedFolders` residirá exclusivamente dentro de `CanvasSidebar.tsx`, isolado do container principal.
- A orquestração de abas (`openTabs`) será encapsulada no *hook* `useCanvasTabs.ts`.
