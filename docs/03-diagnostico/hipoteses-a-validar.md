# 03 — Catálogo de Hipóteses a Validar por Instrumentação

## Visão Geral
Mapeamento de comportamentos suspeitos que exigem medição ou reprodução controlada antes de qualquer alteração de código.

---

## HIPO-001 — Degradação de FPS no Canvas 2D em Escala (10 a 500 Nós)

- **Tipo**: Performance Gráfica / Renderizador 2D
- **Status**: Hipótese — requer instrumentação
- **Prioridade**: P2
- **Domínio afetado**: Canvas 2D
- **Localização exata**: `src/renderer/features/Canvas/InfiniteCanvas.tsx`
- **Sintoma presumido**: Queda acentuada da taxa de quadros (FPS) durante o pan/zoom quando o canvas ultrapassa 100 nós visuais ativos.
- **Hipótese técnica**: A falta de virtualização de viewport (renderizar apenas nós visíveis na área do monitor) faz com que a árvore DOM SVG processe centenas de elementos fora da tela a cada evento de scroll/mousewheel.
- **Como validar**: Utilizar o script de instrumentação gerando massivamente 10, 50, 100 e 500 nós e medir o FPS médio durante um pan continuo de 10 segundos.

---

## HIPO-002 — Vazamento de Memória Heap por Imagens Base64 no LocalStorage

- **Tipo**: Consumo de Memória RAM / Heap
- **Status**: Hipótese — requer instrumentação
- **Prioridade**: P2
- **Domínio afetado**: Documentos / Canvas 2D
- **Localização exata**: `src/renderer/features/Canvas/canvasStorage.ts`
- **Sintoma presumido**: Crescimento contínuo da memória privada consumida pelo processo do Renderer no Electron ao colar imagens grandes no editor TipTap.
- **Hipótese técnica**: Imagens coladas são convertidas diretamente em strings Data URL (Base64) e mantidas no estado global do canvas sem descarte de URLs de blob ou garbage collection.
- **Como validar**: Inserir 20 imagens de 5MB no editor, abrir o Memory Profiler do Chrome DevTools e tirar heap snapshots consecutivos para observar a retenção de Buffers.
