# Bounded Contexts e Mapeamento de Domínios

## Visão Geral
A área Tela atualmente centraliza 5 responsabilidades de negócio misturadas em poucos arquivos gigantes. Este documento estabelece os **5 Bounded Contexts (Fronteiras de Contexto)** bem definidos e isolados.

---

## 1. Domínio 1: Canvas 2D (`domains/canvas`)

### Escopo e Responsabilidades:
- Renderização visual e vetorial (SVG/HTML5) da superfície 2D infinita.
- Gerenciamento do `Viewport` (X, Y, Zoom, Pan e Zoom com foco na posição do cursor).
- Manipulação de Nós (`CanvasNode`), Traços de Desenho à Mão (`Stroke`) e Conexões (`CanvasConnection`).
- Operações de Seleção Múltipla, Alinhamento, Z-Index, Agrupamento e Snap em Grade (Grid 24px).
- Histórico local de Undo/Redo específico da viewport ativa.

### Entidades Chave:
- `CanvasNode`, `Stroke`, `CanvasConnection`, `Viewport`, `CanvasData`.

---

## 2. Domínio 2: CRM & Leads (`domains/crm`)

### Escopo e Responsabilidades:
- Gerenciamento do ciclo de vida de Leads/Cards de Marketing.
- Estruturação de Grupos/Colunas, Estágios de Funil e Quadros (`MarketingBoard`).
- Edição detalhada de Leads via Modal (`LeadDetailModal`) com tags, time tracking, prioridades e checklists.
- Tabela Kanban e Tabela Lista de Leads com ordenação e arrasto.
- Sincronização assíncrona com Supabase / LocalStorage e controle de debounce.

### Entidades Chave:
- `MarketingCardData`, `MarketingGroup`, `MarketingBoard`, `LeadUpdate`.

---

## 3. Domínio 3: Documentos & RichText (`domains/documents`)

### Escopo e Responsabilidades:
- Edição de Notas e Documentos de Texto Enriquecido (integração Tiptap / RichText).
- Armazenamento e versão de conteúdos textuais vinculados aos nós de canvas ou páginas independentes.
- Exportação e importação de documentos (Markdown, HTML, TXT).

### Entidades Chave:
- `CanvasDocument`, `RichTextContent`, `NoteItem`.

---

## 4. Domínio 4: Árvore de Pastas e Hierarquia (`domains/folders`)

### Escopo e Responsabilidades:
- Hierarquia de Pastas (`folder`), Subpastas e Nós de nível superior.
- Expansão e recolhimento de pastas (`expandedFolders`) isolados no contexto da sidebar.
- Operações de movimentação de itens entre pastas (*drag & drop* na árvore de navegação).

### Entidades Chave:
- `FolderNode`, `FolderTreeState`, `CanvasInfo`.

---

## 5. Domínio 5: Espaços e Workspaces (`domains/spaces`)

### Escopo e Responsabilidades:
- Escopo de Workspaces e Espaços do Usuário (`currentWorkspace`).
- Filtros de visibilidade, permissões de proprietário (`ownerId`) e listas de workspaces disponíveis.
- Limpeza de contextos locais e chaveamento seguro entre workspaces.

### Entidades Chave:
- `Workspace`, `SpaceConfig`, `UserSpace`.
