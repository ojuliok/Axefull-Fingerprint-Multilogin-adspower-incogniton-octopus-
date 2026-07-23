# Evidências de Compiladores e Builds (Fase 3.2)

## 1. Verificação de Tipagem TypeScript

- **Comando Executado**: `npx tsc --noEmit`
- **Duração da Execução**: ~11.2s
- **Exit Code**: `0`
- **Resultado do Saída**:
  ```text
  (Nenhum erro de compilação encontrado)
  Exit code: 0
  ```

---

## 2. Verificação de Build de Produção

- **Comando Executado**: `npm run build:renderer` (`electron-vite build`)
- **Duração da Execução**: 15.62s
- **Exit Code**: `0`
- **Artefatos Gerados com Sucesso**:
  - `dist/main/index.js` (252.85 kB)
  - `dist/preload/preload.js` (11.95 kB)
  - `dist/renderer/assets/CanvasPage-DQp91u7U.js` (1,024.50 kB)
  - `dist/renderer/assets/index-B9opFnfq.js` (1,417.32 kB)

---

## 3. Scripts Não Disponíveis no `package.json`
- `npm run lint`: Não disponível no `package.json`.
- `npm run test`: Não disponível no `package.json`.
