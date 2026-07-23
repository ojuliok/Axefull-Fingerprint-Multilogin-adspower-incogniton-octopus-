# 02 — Subdomínio: CRM (Pipeline e Gestão de Leads)

## Responsabilidade de Negócio
O subdomínio de **CRM** gerencia a esteira de vendas, pipelines, estágios Kanban, cadastro e edição avançada de leads, importação de planilhas CSV/Excel e métricas de conversão.

---

## Mapeamento de Arquivos e Recursos

| Recurso | Caminho Exato no Código | Função no Subdomínio | Status |
|---|---|---|---|
| **Painel Principal** | `src/renderer/pages/CRMPage.tsx` | Container do CRM (Visão Kanban e Tabela de Leads) | Ativo (64KB) |
| **Visão em Canvas** | `src/renderer/pages/CRMPage.tsx` (`CRMCanvasView`) | Adapter para incorporar o CRM como uma aba dentro de `CanvasPage` | Ativo (Acoplado) |
| **Lista & Tabela** | `src/renderer/features/CRM/CRMList.tsx` | Renderizador de tabela de leads com filtros e ordenação | Ativo (78KB) |
| **Modal de Detalhes**| `src/renderer/features/CRM/LeadDetailModal.tsx` | Formulário completo de edição de lead, histórico e anotações | Ativo (85KB) |
| **Quadro Kanban** | `src/renderer/features/CRM/KanbanBoard.tsx` | Quadro de drag & drop com colunas configuráveis | Ativo |
| **Armazenamento** | `src/renderer/features/CRM/crmStorage.ts` | Camada de persistência local (`axe_crm_leads`) e Supabase | Ativo |
| **Contexto de Estado**| `src/renderer/features/CRM/CRMContext.tsx` | Store de estado em memória para a lista de leads | Ativo |

---

## Avaliação Técnica e Diagnóstico de Dependências

1. **Responsabilidade Principal**:
   Gestão comercial de leads e controle de pipelines de vendas.
2. **Dependências Estritamente Necessárias**:
   - `@dnd-kit/core` e `@dnd-kit/sortable` para movimentação de cards.
   - `papaparse` para importação de arquivos CSV.
3. **Dependências Inadequadas Identificadas**:
   - *Confirmado no código*: O `CRMContext` importa diretamente utilitários de notificação (`ToastContext`) e faz chamadas diretas ao `localStorage` em cada mutação de estado.
4. **Acoplamento com a Área Tela**:
   - *Confirmado no código*: Em `CanvasPage.tsx`, o CRM é aberto instanciando `<CRMCanvasView />`. Isso faz com que toda a árvore de componentes do CRM seja montada dentro do layout da Tela, herdando variáveis de estilo e wrappers de canvas.
5. **Gargalo de Renderização**:
   - *Hipótese — requer instrumentação*: O filtro de busca por nome de lead no `CRMList.tsx` atualiza a propriedade `leads` no `CRMContext`, provocando a re-renderização de todas as colunas Kanban visíveis na tela.
