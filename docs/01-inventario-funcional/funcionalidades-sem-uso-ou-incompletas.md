# 01 — Funcionalidades Sem Uso, Incompletas ou Experimentais

## Visão Geral
Identificação de trechos de código desativados, comentados, protótipos experimentais ou sem consumidores ativos na aplicação.

---

## Tabela de Funcionalidades Incompletas ou Mortas

| Funcionalidade / Código | Localização no Código | Evidência Encontrada | Status Atual | Ação Recomendada |
|---|---|---|---|---|
| **Supabase Realtime Listener** | `src/main/index.ts` (linhas 74-75, 226) | `// startSupabaseListener();` comentados na inicialização do app | Experimental / Desativado | Manter desativado em modo local |
| **Página Vitrine** | `src/renderer/pages/VitrinePage.tsx` | Contém dados mockados estáticos sem integração dinâmica com backend | Protótipo / Incompleto | Isolar em módulo secundário |
| **Timeline de IA** | `src/renderer/pages/AITimelinePage.tsx` | UI simplificada com suporte apenas a prompts estáticos | Experimental | Mover para `features/AI` |
| **CanvasMinimap** | `src/renderer/features/Canvas/CanvasMinimap.tsx` | Arquivo contendo apenas 105 bytes sem implementação real | Esqueleto / Incompleto | Implementar no isolamento do Canvas ou remover |
| **Pasta Hooks Vazia** | `src/renderer/hooks/` | Diretório totalmente vazio no Renderer | Não utilizado | Reservar para custom hooks refatorados |
| **Arquivo states.txt** | Raiz do repositório (`states.txt`) | Arquivo texto contendo rascunho de logs manuais | Lixo / Não código | Mover para documentação ou remover |
| **Terminalbug.md** | Raiz do repositório (`terminalbug.md`) | Relatório de depuração antigo mantido na raiz | Documentação legada | Mover para `docs/03-diagnostico/` |

---

## Orientações de Remoção Segura
Conforme as diretrizes técnicas do projeto:
- **NENHUM** arquivo marcado nesta lista será removido antes de comprovação rigorosa através de busca global por referências (`grep_search`).
- Caso um módulo contenha código comentado (ex: `startSupabaseListener`), este permanecerá inalterado para preservar a compatibilidade de execução offline.
