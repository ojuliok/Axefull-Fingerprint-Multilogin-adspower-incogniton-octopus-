# Escopo e Restrições Inegociáveis do Projeto

## 🚨 REGRA INEGOCIÁVEL: PROTEÇÃO ABSOLUTA DO MÓDULO FINGERPRINT

> [!CAUTION]
> ### ÁREA FORA DE ESCOPO / PROTEGIDA
> Existe um módulo/projeto crítico denominado **Fingerprint** neste repositório.
> 
> **FINGERPRINT É UMA ÁREA TOTALMENTE PROTEGIDA E EXCLUÍDA DE QUALQUER INTERVENÇÃO.**

### Restrições Específicas para Fingerprint:
1. **NÃO ANALISAR INTERNAMENTE**: Nenhuma lógica de injeção, spoofing, geradores de canvas/audio/webgl/sensors ou scripts em `src/main/features/fingerprint` deve ser alterada ou modificada internamente.
2. **NÃO MODIFICAR, MOVER OU DELETAR**: NENHUM arquivo no caminho `src/main/features/fingerprint/*` ou relacionado ao spoofing de navegadores anti-detect pode ser editado, renomeado, realocado ou removido.
3. **NÃO ALTERAR INJEÇÕES OU BUILDS**: O script de cópia `copy-scripts` (`src/main/fingerprint/inject-scripts`), as dependências diretas de spoofing ou as chamadas do CDP (`cdp-injector.ts`) estão congelados.
4. **IMPORTS E RAGS DE INTEGRAÇÃO**: NENHUM import, rota de IPC ou chamada de API vinculada ao módulo Fingerprint pode ser alterado em outros módulos.
5. **MAPEAMENTO DE DEPENDÊNCIAS COMPARTILHADAS**: Caso sejam encontradas pontes ou dependências compartilhadas entre o Fingerprint e outras áreas do sistema (ex: `ProfileCard.tsx`, `FloatingProfiles.tsx`, `profileIpc.ts`), estas **não serão modificadas**, sendo apenas anotadas neste documento de riscos.

---

## Tabela de Mapeamento de Riscos de Integração com Fingerprint

| Módulo Externo | Ponto de Contato com Fingerprint | Risco Encontrado | Ação Permitida | Status |
|---|---|---|---|---|
| `src/main/index.ts` | Registra `registerProfileIpcHandlers()` e chama `closeAllProfiles()` | Inicialização global no processo Main | Manter intacto sem alterações de assinatura | 🟢 Congelado |
| `src/main/database/db.ts` | Tabela `profiles` com colunas de fingerprint | Estrutura de dados local no SQLite | Manter schema e queries existentes | 🟢 Congelado |
| `src/renderer/features/Profiles/*` | Componentes visuais para listagem e criação de perfis anti-detect | Renderização de perfis na UI | Manter comunicação via IPC existente | 🟢 Congelado |
| `src/renderer/components/Layout/FloatingProfiles.tsx` | Widget flutuante de perfis ativos | Estado global / Eventos IPC | Não alterar a comunicação com o motor de perfis | 🟢 Congelado |

---

## Diretrizes Ativas para Refatoração do Repositório

1. **Foco das Intervenções**: Todas as otimizações, refatorações, desacoplamentos e correções de bugs devem focar **exclusivamente** nas áreas funcionais:
   - **Início** (`HomeW97.tsx`)
   - **Tarefas** (`TasksView.tsx`, `AgendaView.tsx`, Pomodoro)
   - **Notas** (`NotesPage.tsx`, Tiptap)
   - **Tela** (`CanvasPage.tsx`, `CRMPage.tsx`, Documentos, Espaços, Pastas)
   - **Metaclean / Ferramentas de Mídia** (`DadosClean.tsx`, `bulkEditEngine.ts`)

2. **Compatibilidade de Dados**: A camada de persistência local (`sql.js` / SQLite) e remota (`Supabase` / `Firebase`) deve manter total retrocompatibilidade.
