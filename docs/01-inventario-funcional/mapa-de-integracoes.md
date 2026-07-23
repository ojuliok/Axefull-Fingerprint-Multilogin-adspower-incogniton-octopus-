# 01 — Mapa de Integrações Externas e Binários

## Visão Geral
Mapeamento de todas as bibliotecas nativas, serviços externos em nuvem, executáveis e pontes de automação com os quais o sistema se integra.

---

## Tabela de Integrações Externas

| Nome da Integração | Tipo / Protocolo | Componente / Serviço Responsável | Finalidade no Sistema | Status | Risco |
|---|---|---|---|---|---|
| **Supabase Cloud (BaaS)** | HTTPS / REST / WebSockets Realtime | `src/main/database/supabase-client.ts`, `src/renderer/lib/supabase.ts` | Autenticação de usuários, banco de dados remoto PostgreSQL e sync em nuvem | Ativo | 🟡 Médio |
| **Firebase Realtime Database** | WebSockets / Realtime SDK | `src/main/services/firebase-listener.ts` | Sincronização instantânea de estado entre instâncias | Ativo | 🟡 Médio |
| **Playwright / Chromium Engine** | CDP (Chrome DevTools Protocol) | `src/main/features/browser/browser-engine.ts` | Lançamento e controle de instâncias isoladas do navegador *(Fingerprint)* | Ativo | 🔴 Alto *(PROTEGIDO)* |
| **FFmpeg / FFprobe** | Binário Nativo (`.exe`) via `child_process` | `src/main/services/bulkEditEngine.ts`, `metaclean.ts` | Processamento de vídeo em lote, extração e remoção de metadados de mídias | Ativo | 🟢 Baixo |
| **Keytar (OS Credential Store)** | Lib C++ Nativa / Node-gyp | `src/main/services/auth-manager.ts` | Armazenamento de senhas e tokens de licença de forma segura no Windows Credential Vault | Ativo | 🟢 Baixo |
| **Servidor HTTP REST Local** | HTTP Server (Porta `54345`) | `src/main/features/local-api/local-api-server.ts` | Endpoints locais REST para automação externa e integração com scripts do usuário | Ativo | 🟡 Médio |
| **Custom Protocol Client (`axeagent://`)** | Deep Linking OS | `src/main/index.ts` (`handleProtocolUrl`) | Recebimento de tokens de autenticação via links externos no navegador padrão | Ativo | 🟢 Baixo |
| **TipTap Editor** | WYSIWYG Editor Core | `src/renderer/features/Notes/NoteTiptapEditor.tsx` | Editor rich text de notas e documentos | Ativo | 🟢 Baixo |

---

## Análise de Segurança e Estabilidade das Integrações
1. **Fallback Offline**: O sistema possui fallback para operação local desconectada em caso de falha de comunicação com o Supabase ou Firebase.
2. **Isolamento de WebViews**: O arquivo `src/main/security/compliance-guard.ts` previne ativamente que webviews realizem logins Google/OAuth desprotegidos.
