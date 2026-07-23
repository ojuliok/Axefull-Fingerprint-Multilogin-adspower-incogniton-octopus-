# 02 — Subdomínio: Canvas 2D (Editor Infinito Gráfico)

## Responsabilidade de Negócio
O subdomínio **Canvas 2D** provê uma superfície gráfica infinita bidimensional para modelagem visual, criação de mapas mentais, desenho à mão livre, nós de cards, conexões vetoriais e organização espacial.

---

## Mapeamento de Arquivos e Recursos

| Recurso | Caminho Exato no Código | Função no Subdomínio | Status |
|---|---|---|---|
| **Motor Gráfico 2D** | `src/renderer/features/Canvas/InfiniteCanvas.tsx` | Renderização do canvas 2D, pan, zoom, vetores e nós | Ativo (346KB!) |
| **Estilos do Canvas** | `src/renderer/features/Canvas/InfiniteCanvas.module.css` | Estilização das ferramentas visuais e grelha do canvas | Ativo (76KB) |
| **Fundo Neuronal** | `src/renderer/features/Canvas/NeuralBackground.tsx` | Efeito visual de fundo dinâmico usando Canvas HTML5 | Ativo |
| **Gerenciador Home** | `src/renderer/features/Canvas/CanvasHome.tsx` | Galeria de exibição de múltiplos quadros canvas | Ativo (46KB) |
| **Modais de Nó** | `src/renderer/features/Canvas/ItemPinModal.tsx` | Modal de bloqueio/PIN de nós do canvas | Ativo |
| **Armazenamento** | `src/renderer/features/Canvas/canvasStorage.ts` | Salva e carrega estruturas de nós, strokes e conexões | Ativo (23KB) |

---

## Avaliação Técnica e Diagnóstico de Dependências

1. **Responsabilidade Principal**:
   Renderização 2D de alta performance e interação vetorial bidimensional.
2. **Dependências Estritamente Necessárias**:
   - `react`, `lucide-react`, eventos do DOM PointerEvent/WheelEvent.
3. **Análise do Monolito `InfiniteCanvas.tsx` (346KB)**:
   - *Confirmado no código*: O arquivo contém em um único escopo de componente React (+3.800 linhas):
     - Lógica de captura de mouse/touch e cálculo de transformação matricial (`panX`, `panY`, `zoom`).
     - Renderização de linhas/traços à mão livre via `<path>` SVG.
     - Sistema de conexões entre nós (`CanvasConnection`).
     - Menu contextual flutuante e barra de ferramentas de adição de nós.
     - Editor Inline de texto para nós do canvas.
     - Diálogo de seleção de cor e ícone.
4. **Gargalo e Sobrecarga Confirmados**:
   - *Confirmado no código*: O componente não utiliza `React.memo` nos nós individuais (`CanvasNode`). Qualquer alteração na coordenada `panX`/`panY` durante um arrasto causa a re-renderização de TODOS os nós e conexões presentes na tela.
   - *Provável — requer reprodução*: Quadros com mais de 100 nós apresentam queda acentuada na taxa de quadros (FPS) durante o pan/zoom.
