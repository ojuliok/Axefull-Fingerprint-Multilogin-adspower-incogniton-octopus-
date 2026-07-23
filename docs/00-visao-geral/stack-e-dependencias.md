# Stack de Tecnologias e Mapeamento de Dependências

## 1. Stack Principal de Tecnologia

| Camada | Tecnologia | Versão | Função / Aplicação no Projeto |
|---|---|---|---|
| **Runtime Desktop** | Electron | `^31.7.7` | Execução Desktop nativa com acesso a I/O, Node.js e sistema operacional |
| **UI Framework** | React | `^18.2.0` | Construção de componentes visuais reativos e telas de usuário |
| **Linguagem** | TypeScript | `^5.9.3` | Tipagem estática no Main, Preload e Renderer |
| **Bundler & Build** | Electron-Vite / Vite | `^5.0.0` / `^5.0.12` | Empacotamento ultra-rápido do processo Main, Preload e React Renderer |
| **Roteamento UI** | React Router DOM | `^7.18.0` | Navegação Single Page App (`HashRouter`) |
| **Estilização** | Tailwind CSS + PostCSS | `^3.4.1` | Estilização por classes utilitárias e CSS Modules para telas complexas |
| **Banco Local** | `sql.js` (SQLite WASM/Pure JS) | `^1.14.1` | Armazenamento relacional de perfis, tarefas, notas e cadastros locais |
| **Banco / BaaS Remoto**| Supabase JS | `^2.107.0` | Sincronização em nuvem, tabelas remotas e autenticação |
| **Realtime Cloud** | Firebase Client | `^12.12.1` | Sincronizador de estados e listeners remotos em tempo real |
| **Editor Risco / Docs** | TipTap Core & Extensions | `^3.27.1` | Editor WYSIWYG rich-text para Notas e documentos interativos |
| **Drag & Drop** | `@dnd-kit/core` & `sortable` | `^6.3.1` / `^10.0.0` | Movimentação de cards no CRM Kanban e ordenação de tarefas |
| **Processamento Mídia** | Fluent FFmpeg + FFmpeg Installer | `^2.1.3` / `^1.1.0` | Remoção de metadados de vídeo e pós-processamento de mídias (MetaClean) |
| **Automação Browser** | Playwright | `^1.61.0` | Lançamento e controle automatizado de navegadores Chromium |
| **Segurança Key-Value**| Keytar | `^7.9.0` | Armazenamento seguro de credenciais no Keychain / Credential Manager nativo |
| **Autenticação JWT** | JSONWebToken | `^9.0.3` | Validação de tokens de licença e sessão |
| **Manipulação Data** | date-fns | `^4.4.0` | Formatação e manipulação de datas no CRM, Tarefas e Pomodoro |
| **Ícones UI** | Lucide React | `^0.344.0` | Pacote unificado de ícones SVG reativos |
| **Empacotamento Windows**| Electron-Builder + WiX Toolset | `^24.9.1` | Geração de instaladores executáveis `.exe` (NSIS) e `.msi` (WiX) |

---

## 2. Scripts do `package.json`

| Script | Comando Executado | Propósito |
|---|---|---|
| `npm run dev` | `npm run copy-scripts && electron-vite` | Inicia o servidor Vite HMR e abre o Electron em modo desenvolvimento |
| `npm run build` | `npm run copy-scripts && electron-vite build` | Compila o código TypeScript/React para `dist/` |
| `npm run copy-scripts` | `mkdirp dist/... && copyfiles ...` | Copia scripts de injeção JavaScript do módulo Fingerprint para a pasta de build |
| `npm run package` | `electron-builder` | Empacota a aplicação sem recompilar |
| `npm run dist` | `npm run build && electron-builder` | Executa o build completo e gera os instaladores finais de produção |

---

## 3. Serviços Externos e Conectividade
- **Supabase Cloud**: Conexão via `@supabase/supabase-js` para persistência relacional distribuída.
- **Firebase Realtime Database**: Conexão para sincronização instantânea de estado entre instâncias.
- **API Local de Automação (Express/Node)**: Executa internamente na porta HTTP `54345` permitindo automação via REST.
- **Deep Linking Protocol**: Esquema registrado `axeagent://` para recebimento de tokens de vinculação local via browser.
