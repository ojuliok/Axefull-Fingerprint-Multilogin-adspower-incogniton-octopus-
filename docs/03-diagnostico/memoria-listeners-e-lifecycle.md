# 03 — Auditoria de Memória, Listeners e Ciclo de Vida

## Visão Geral
Diagnóstico de memory leaks, event listeners desprotegidos e manipulações de ciclo de vida sem cleanup identificados nos componentes da Área Tela.

---

## MEM-001 — Listener Sem Cleanup no CRMList (`crm-reload-leads`)

- **Tipo**: Memory Leak / Listener Desprotegido
- **Status**: Confirmado no código
- **Prioridade**: P0
- **Domínio afetado**: CRM
- **Localização exata**: `src/renderer/features/CRM/CRMList.tsx`
- **Sintoma observado**: Vazamento progressivo de memória e execução duplicada de ações de recarregamento no CRM a cada alternância entre abas.
- **Evidência técnica**: O componente registra `window.addEventListener('crm-reload-leads', ...)` em seu bloco de efeitos sem retornar a função de limpeza (`removeEventListener`) no retorno do `useEffect`.
- **Causa raiz**: Ausência de função de cleanup no retorno do `useEffect`.
- **Impacto no usuário**: Lentidão progressiva da interface após navegar várias vezes para a aba de CRM durante o dia.
- **Impacto técnico**: Acúmulo de instâncias de callbacks em memória mantendo referências a componentes desmontados (Garbage Collection bloqueado).
- **Frequência**: Aumenta exponencialmente a cada montagem do componente `CRMList`.
- **Dados ou estados envolvidos**: Window Global Event Bus, `CRMList` state.
- **Risco de regressão**: Zero.
- **Forma de reprodução**: Alternar entre as abas Canvas e CRM 10 vezes consecutivas, disparar o evento `crm-reload-leads` via console e observar quantos callbacks são executados.
- **Como instrumentar ou medir**: Monitorar a quantidade de listeners ativos na chave `crm-reload-leads` usando `getEventListeners(window)` no DevTools.
- **Correção recomendada**: Adicionar a função de retorno `return () => window.removeEventListener('crm-reload-leads', handler);` no `useEffect` de `CRMList.tsx`.
- **Ordem de implementação**: Fase 3.1 de Estabilização (Prioridade 1 Absoluta).
- **Critério de aceite**: Exatamente 1 listener ativo na janela quando o CRM estiver montado, e 0 quando o CRM estiver desmontado.
- **Estratégia de rollback**: Nenhuma (mudança 100% segura).
- **Dependências para correção**: Nenhuma.

---

## MEM-002 — Listeners de Mouse sem Fechamento em Resize de Colunas no CRMList

- **Tipo**: Memory Leak / Pointer Event Residual
- **Status**: Confirmado no código
- **Prioridade**: P1
- **Domínio afetado**: CRM
- **Localização exata**: `src/renderer/features/CRM/CRMList.tsx` (linhas 1129-1130)
- **Sintoma observado**: O manipulador de redimensionamento de coluna da tabela continua ativo se o usuário soltar o botão do mouse fora dos limites da janela.
- **Evidência técnica**: Os eventos `window.addEventListener('mousemove', handleMouseMove)` e `mouseup` são registrados dentro da função handler `onMouseDown` de redimensionamento e só são removidos dentro do próprio `handleMouseUp`. Se o `mouseup` ocorrer fora do escopo capturado, os listeners permanecem vazando.
- **Causa raiz**: Falta de registro defensivo ou uso de `setPointerCapture`.
- **Impacto no usuário**: Comportamento estranho do cursor do mouse ao reentrar na janela do aplicativo.
- **Impacto técnico**: Acúmulo temporário de listeners no objeto `window`.
- **Frequência**: Ocasional.
- **Dados ou estados envolvidos**: `columnWidths`, `window` events.
- **Risco de regressão**: Baixo.
- **Forma de reprodução**: Arrastar a borda de uma coluna da tabela e soltar o botão do mouse fora da janela do aplicativo.
- **Como instrumentar ou medir**: Verificar se os listeners de `mousemove` continuam ativos no `window` após soltar o mouse fora da tela.
- **Correção recomendada**: Substituir os listeners manuais pelo uso de `setPointerCapture` do HTML5 PointerEvents.
- **Ordem de implementação**: Fase 3.1 de Estabilização.
- **Critério de aceite**: `mousemove` e `mouseup` são removidos independentemente de onde o clique foi liberado.
- **Estratégia de rollback**: Manter o handler manual atual.
- **Dependências para correção**: Nenhuma.
