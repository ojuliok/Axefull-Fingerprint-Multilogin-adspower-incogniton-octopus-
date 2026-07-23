# 02 — Conflitos e Sobrecargas Identificados na Área Tela

## Visão Geral
Matriz consolidada de conflitos de estado, sobrecargas de renderização e acoplamentos indevidos descobertos durante a auditoria da Área Tela.

---

## Matriz de Conflitos e Sobrecargas

| Código do Problema | Descrição Evidenciada | Subdomínios Afetados | Nível de Evidência | Impacto Técnico |
|---|---|---|---|---|
| **CONF-TELA-001** | `CanvasPage.tsx` gerencia estados de 5 domínios em um único `useState` monolítico (+2.300 linhas) | Documentos, CRM, Canvas, Espaços, Pastas | **Confirmado no código** | Qualquer clique na sidebar ou expandir de pasta força o re-render do editor ativo. |
| **CONF-TELA-002** | `InfiniteCanvas.tsx` possui 346KB em arquivo único sem sub-componentes memorizados | Canvas 2D | **Confirmado no código** | Queda de quadros (FPS) durante interações de pan/zoom em telas com múltiplos nós. |
| **CONF-TELA-003** | O CRM (`CRMCanvasView`) é montado dinamicamente dentro de abas da Tela sem rota isolada | CRM | **Confirmado no código** | Impossibilita carregar o CRM de forma independente sem instanciar a estrutura do Canvas. |
| **CONF-TELA-004** | A função `getCanvasList()` mistura todos os tipos de itens (`canvas`, `page`, `folder`, `space`) em um único array | Documentos, Canvas, Pastas, Espaços | **Confirmado no código** | Operações de busca filtram um array heterogêneo gigante sem paginação. |
| **CONF-TELA-005** | Operações de salvamento síncrono no `localStorage` em cada movimento de arrastar no canvas | Canvas 2D, Documentos | **Confirmado no código** | Travamentos de I/O em discos lentos durante sessões longas de desenho. |
| **CONF-TELA-006** | Invalidação de cache ausente para abas em segundo plano mantidas no `openTabs` | Documentos, Canvas | **Provável — requer reprodução** | Inconsistência de versão do documento se modificado concorrentemente em outro lugar. |
| **CONF-TELA-007** | Consumo excessivo de memória em sessões com múltiplos canvas ricos abertos simultaneamente | Canvas 2D, Documentos | **Hipótese — requer instrumentação** | Risco de estouro de heap no Electron ao acumular canvas com dezenas de imagens em base64. |
