# Visão Geral da Arquitetura Alvo

## 1. Princípios de Design
A Arquitetura Alvo foi projetada sob os princípios de **Domain-Driven Design (DDD)** e **Clean Architecture**, visando transformar a atual estrutura monolítica acoplada em uma estrutura altamente modular, coesa e testável.

### Diretrizes Fundamentais:
1. **Separação por Domínios**: Cada responsabilidade de negócio (Canvas, CRM, Documentos, Espaços e Pastas) possui seu próprio diretório isolado com estados, serviços, componentes e tipos específicos.
2. **Desacoplamento de UI e Lógica de Negócio**: A lógica pesada de persistência, cálculo de layout e gerenciamento de estado é extraída de componentes React visuais para *custom hooks* e *domínio de serviços puramente testáveis*.
3. **Comunicação por Eventos (Event Bus)**: Os domínios não importam diretamente componentes de outros domínios para comunicação lateral; interações entre CRM e Canvas ou Documentos ocorrem via barramento de eventos pub/sub desacoplado.
4. **Retrocompatibilidade Gradual**: Durante a transição, são mantidas fachadas (*façades*) compatíveis com as exportações legadas, garantindo que o sistema continue funcionando em produção em cada commit.

---

## 2. Estrutura de Camadas Proposta

```text
src/renderer/
├── shared/                       # Kernel Compartilhado (Neutro)
│   ├── components/               # Primitivas de UI (Botões, Modais, Inputs)
│   ├── events/                   # Event Bus e Tipos Globais de Eventos
│   ├── storage/                  # Adaptadores de LocalStorage/Supabase
│   └── theme/                    # Design System e Contexto de Tema
│
├── domains/                      # Bounded Contexts Desacoplados
│   ├── canvas/                   # Domínio Motor de Canvas 2D
│   │   ├── components/           # CanvasNodes, SVGGrid, Toolbar
│   │   ├── hooks/                # useCanvasNodes, useViewport, useCanvasHistory
│   │   ├── services/             # canvasStorage, nodeMath, canvasSerializer
│   │   └── types/                # CanvasNode, Stroke, Connection, Viewport
│   │
│   ├── crm/                      # Domínio CRM & Leads
│   │   ├── components/           # CRMBoard, CRMList, LeadDetailModal
│   │   ├── context/              # CRMContext, CRMProvider
│   │   ├── services/             # crmStorage, crmSyncManager
│   │   └── types/                # MarketingCardData, MarketingGroup, MarketingBoard
│   │
│   ├── documents/                # Domínio Editor de Documentos / RichText
│   ├── folders/                  # Domínio Árvore de Pastas e Hierarquia
│   └── spaces/                   # Domínio Espaços e Workspaces
│
└── pages/                        # Orquestradores de Páginas (Views Leves)
    ├── CanvasPage.tsx            # View orquestradora leve da área Tela
    └── CRMPage.tsx               # View orquestradora do CRM isolado
```

---

## 3. Benefícios da Arquitetura Alvo

- **Redução Dramática de Complexidade**: Os arquivos `InfiniteCanvas.tsx` (346 KB) e `CanvasPage.tsx` (118 KB) são divididos em submódulos de no máximo 300 linhas cada.
- **Isolamento de Performance**: Re-renderizações na sidebar de pastas ou no CRM deixam de propagar para o motor do Canvas.
- **Facilidade de Manutenção**: Manutenções no CRM não correm risco de quebrar a rendering engine do Canvas 2D.
- **Zero Risco ao Fingerprint**: O módulo Fingerprint permanece intocado em `src/main/features/fingerprint/`, comunicando-se exclusivamente pelos IPCs já existentes.
