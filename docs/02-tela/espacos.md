# 02 — Subdomínio: Espaços (Workspaces Organizacionais)

## Responsabilidade de Negócio
O subdomínio de **Espaços** provê o agrupamento de nível superior de projetos, definindo contextos de acesso, permissões de membros e isolamento de ambientes dentro da aplicação.

---

## Mapeamento de Arquivos e Recursos

| Recurso | Caminho Exato no Código | Função no Subdomínio | Status |
|---|---|---|---|
| **Contexto de Espaço** | `src/renderer/context/WorkspaceContext.tsx` | Armazena o espaço ativo (`currentWorkspace`) e lista de espaços | Ativo |
| **Visão do Espaço** | `src/renderer/features/Canvas/SpaceOverview.tsx` | Dashboard com resumo de itens e métricas do espaço ativo | Ativo |
| **Visão Geral Global** | `src/renderer/features/Canvas/GlobalOverview.tsx` | Visão consolidada de todos os espaços do usuário | Ativo |
| **Gestão de Membros** | `src/renderer/features/Canvas/MembersManager.tsx` | Modal de convite e controle de acessos do espaço | Ativo |

---

## Avaliação Técnica e Diagnóstico de Dependências

1. **Responsabilidade Principal**:
   Isolamento multitenant local/remoto de recursos e definição do escopo de dados.
2. **Dependências Estritamente Necessárias**:
   - `AuthContext` (para validar quem é o dono do espaço).
   - `@supabase/supabase-js` (para sincronização das permissões).
3. **Acoplamento com a Tela**:
   - *Confirmado no código*: Em `CanvasPage.tsx`, a troca de espaço no dropdown lateral recarrega toda a lista `canvasList` chamando `getCanvasList(workspaceId)`, forçando o fechamento imediato de todas as abas abertas da Tela.
4. **Comportamento Inconsistente de Estado**:
   - *Provável — requer reprodução*: Se o usuário alterar o espaço no `WorkspaceContext` enquanto edita um rascunho não salvo no Canvas, o rascunho pode ser persistido com o `workspace_id` do novo espaço selecionado.
