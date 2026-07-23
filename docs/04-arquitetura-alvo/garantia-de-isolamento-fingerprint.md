# Garantia de Isolamento do Módulo Fingerprint

## Visão Geral
Este documento registra a auditoria e as **travas de segurança arquiteturais** que garantem que o módulo **Fingerprint** permaneça **100% congelado, intocado e isolado** durante toda a reestruturação da área Tela e demais domínios.

---

## 1. Diretórios e Arquivos Protegidos (Congelados)

Os seguintes caminhos são estritamente **proibidos** de sofrer modificações, movimentações, edições de imports, refatorações ou otimizações:

- 🔒 `src/main/features/fingerprint/`
- 🔒 `src/main/features/browser/`
- 🔒 `src/main/fingerprint/`
- 🔒 `src/main/fingerprint/inject-scripts/`
- 🔒 IPCs e handlers de gerenciamento de perfis e proxies (`src/main/ipc/`)

---

## 2. Regras de Fronteira e Contratos de Comunicação

1. **Proibição de Imports Diretos**: Nenhum componente ou serviço da camada `src/renderer/domains/` (Canvas, CRM, Documentos, Espaços e Pastas) pode importar arquivos da pasta de Fingerprint.
2. **Comunicação por IPCs Existentes**: A interação entre o Renderer e o Fingerprint permanece restrita às chamadas IPC pré-existentes expostas pelo `preload.js` (ex: `window.electronAPI.launchProfile()`).
3. **Isolamento de Banco de Dados**: O banco de dados SQLite de perfis (`profiles.db`) e seus backups roláveis permanecem sob gestão exclusiva do processo Main de Fingerprint, sem qualquer acoplamento com o LocalStorage ou Supabase da área Tela.
