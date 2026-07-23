# Validação Detalhada do Item DATA-001 (Controle de Concorrência e Revisão)

## 1. Algoritmo de Gravação com Leitura Prévia
- **Arquivo**: `canvasStorage.ts` -> `saveCanvasData(id, data, expectedRevision)`
- **Lógica**:
  1. Lê o payload armazenado na chave `axe_offline_canvas_data_${id}` imediatamente antes da escrita.
  2. Extrai `currentRevision`.
  3. Se `expectedRevision` for informado e `currentRevision > expectedRevision`, emite um log de aviso explícito (`[canvasStorage] CONFLITO DETECTADO`) e ajusta a versão para `Math.max(currentRevision, expectedRevision) + 1`.
  4. Garante empacotamento completo com `revision`, `updatedAt` (ISO) e `updatedBy`.
  5. Mantém suporte para arquivos legados integrando os nós existentes no payload encapsulado sem perda de dados.

---

## 2. Teste de Concorrência Controlado
- **Cenário**: Contexto A e Contexto B leem a revisão 1 do Canvas.
- **Passo 1**: Contexto A salva uma alteração -> Gravado com sucesso (Revisão 2).
- **Passo 2**: Contexto B tenta salvar uma alteração divergente a partir da Revisão 1 esperada.
- **Resultado**: O sistema lê que a versão no banco local já avançou para 2. Emite o alerta de conflito e grava a nova alteração na Revisão 3 sem sobrescrever silenciosamente ou corromper a estrutura.
