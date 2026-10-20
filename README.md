# Cellera — Semana da Qualidade 2026

Aplicação React com Vite, dedicada ao mobile. Todo o frontend está em `frontend/`. O `package.json` da raiz usa npm workspaces e encaminha os comandos para essa pasta.

## Executar

Requer Node.js 22 ou superior. Na raiz:

```powershell
npm.cmd install
npm.cmd run dev
```

Abra o endereço informado pelo Vite, normalmente http://localhost:5173. `npm.cmd start` também inicia o servidor. É possível executar os mesmos comandos dentro de `frontend/`.

Para gerar e conferir a versão de produção:

```powershell
npm.cmd run build
npm.cmd run preview
```

O resultado está em `frontend/dist/`. Hospede essa pasta em HTTPS. No Windows, `npm.cmd` evita o bloqueio de execução do `npm.ps1`; em outros sistemas, use `npm`.

## Estrutura

- `frontend/src/App.jsx`: interface, câmera, upload, zoom, arraste e download.
- `frontend/src/poster.js`: preparação da máscara e composição no canvas.
- `frontend/src/styles.css`: layout mobile em tela cheia.
- `frontend/public/mascara-cellera.png`: arte original, sem modificações.
- `congresso-pediatria-foto.md`: documento original de referência.

A máscara aparece inteira, centralizada e sem deformação, no espaço disponível acima dos controles. O tamanho se ajusta à largura e à altura da tela, incluindo quando o zoom aparece. Telas com proporção diferente da arte podem ter faixas azuis ao redor. Os controles ficam fora da imagem e respeitam a área segura do aparelho. O PNG baixado permanece completo em 1080 × 1920.

As fotos são processadas apenas no navegador. O upload aceita imagens de até 12 MB. A câmera frontal gera uma selfie espelhada e aparece ao vivo dentro da moldura e é desligada ao capturar, cancelar ou sair da página. A região branca conectada do centro da máscara é removida apenas em memória para preservar os blocos decorativos sobre a foto.

## Conferência no celular

O Vite expõe o servidor na rede local. Acesse o endereço de rede exibido no terminal para conferir layout, upload e download. A câmera exige HTTPS ou localhost; o endereço HTTP de rede local não habilita a câmera na maioria dos navegadores.

Confira fotos verticais e horizontais, zoom, arraste, captura e cancelamento da câmera, além da correspondência entre a prévia e o PNG baixado.
