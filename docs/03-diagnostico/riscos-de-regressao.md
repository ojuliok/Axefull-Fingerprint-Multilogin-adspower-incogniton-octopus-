# 03 — Matriz de Riscos de Regressão e Prevenção

## Visão Geral
Identificação dos pontos de maior risco de quebra funcional durante as futuras fases de refatoração e estabilização, acompanhados das respectivas estratégias de mitigação e planos de rollback.

---

## Matriz de Riscos de Regressão

| Código do Risco | Ação Planejada | Funcionalidades em Risco | Severidade do Risco | Estratégia de Mitigação / Prevenção | Plano de Rollback |
|---|---|---|---|---|---|
| **REG-001** | Limpeza do listener `crm-reload-leads` | Atualização do Kanban do CRM ao criar lead em modal | Baixa | Adicionar teste de integração manual disparando `window.dispatchEvent` após abrir o modal | Reverter o retorno da função cleanup |
| **REG-002** | Isolar gravação do LocalStorage do evento de Drag/Drop | Movimentação de nós no Canvas | Média | Assegurar que `flushPendingSave` é invocado obrigatoriamente no evento `onPointerUp` | Restaurar chamada síncrona dentro de `updateLocalCachedNodes` |
| **REG-003** | Extração do estado `expandedFolders` do `CanvasPage` | Navegação da árvore de arquivos e abertura de canvas | Média | Manter retrocompatibilidade com a chave `axe_canvas_open_tabs` no LocalStorage | Reverter o estado para o container pai |
| **REG-004** | Separação das rotas do CRM e da Tela | Abertura do CRM pelo menu lateral | Alta | Manter um componente de transição / adapter (`<CRMCanvasView />`) durante a migração gradual | Re-instanciar o CRM como aba secundária da Tela |
