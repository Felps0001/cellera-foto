# Página de Foto do Congresso de Pediatria

Este documento explica como a página de selfie funciona e onde alterar cada parte.

## Acesso

- Rota: `/congresso-pediatria-foto`
- Componente: `frontend/src/pages/CongressPhotoPage.jsx`
- Máscara: `frontend/src/components/mascara-foto.png`
- Estilos: `frontend/src/styles.css`
- Registro da rota: `frontend/src/App.jsx`

## Fluxo da Página

1. A página mostra a arte do Congresso com o círculo reservado para a foto.
2. A pessoa escolhe **Tirar selfie** ou **Escolher imagem**.
3. Ao tirar selfie, o navegador pede acesso à câmera frontal. A câmera exige HTTPS ou `localhost`.
4. Ao escolher imagem, o arquivo precisa ser uma imagem e ter até 12 MB.
5. A foto é exibida no círculo da máscara. A pessoa ajusta o enquadramento pelo controle de zoom.
6. Ao escolher **Baixar pôster PNG**, a página compõe a imagem final e faz o download.

## Como a Foto é Composta

A máscara mede 900 × 1600 pixels e é importada como imagem no componente React. A composição é feita no navegador com `<canvas>`:

1. O canvas recebe as dimensões originais da máscara.
2. A máscara é desenhada como fundo.
3. A foto é dimensionada para preencher o círculo sem deixar espaços vazios.
4. Um caminho circular recorta a foto e a posiciona no centro da área reservada.
5. O resultado é exportado em PNG com o nome `congresso-pediatria-selfie.png`.

O círculo é calculado com base nas proporções da máscara: centro em 50% da largura e 50,6% da altura; diâmetro de 59,6% da largura ou 33,75% da altura, usando o menor dos dois valores.

A prévia usa as mesmas proporções em CSS. A imagem da máscara fica por cima da foto, formando o pôster que a pessoa vê antes de baixar.

## Câmera e Upload

- O upload usa um input `type="file"` com `accept="image/*"`. O botão visível aciona esse input para abrir o seletor nativo do dispositivo.
- A câmera é aberta com `navigator.mediaDevices.getUserMedia`, sem solicitar áudio.
- A selfie capturada é espelhada para corresponder à prévia da câmera frontal.
- Ao fechar a câmera ou sair da página, as faixas do vídeo são interrompidas.
- Arquivos inválidos ou maiores que 12 MB geram uma mensagem de erro.

## Privacidade

A imagem permanece no navegador. A página não chama a API, não envia a selfie ao servidor e não grava os dados em banco. O download é criado localmente e a URL temporária usada para baixar é liberada em seguida.

## Usabilidade Mobile

- A máscara e a prévia são o foco visual da página.
- Os botões de selfie e upload ficam em uma barra fixa próxima ao rodapé.
- Depois de adicionar uma foto, os botões passam a oferecer o download e a troca da imagem.
- O controle de zoom aparece junto da prévia somente enquanto há foto ou câmera ativa.

## Alterações Comuns

- **Mudar a imagem de fundo:** substitua `mascara-foto.png`, preservando o caminho ou atualizando o import no componente.
- **Reposicionar ou redimensionar o círculo:** ajuste `diameter`, `centerX` e `centerY` em `downloadPoster()` e os valores `left`, `top`, `width` e `height` de `.photo-poster__selfie` em `styles.css`. Mantenha as proporções equivalentes para a prévia e o PNG final coincidirem.
- **Limitar ou permitir outros arquivos:** altere o `accept` e a verificação de tamanho em `selectPhoto()`.
- **Mudar o nome do arquivo baixado:** altere `link.download` em `downloadPoster()`.
- **Mudar o zoom:** altere `min`, `max` e `step` do input range e confira o enquadramento exportado.
- **Mudar a rota:** atualize a rota em `App.jsx`.

## Validação

Na raiz do repositório, rode:

```powershell
Set-Location .\frontend
npm run build
```

Depois, abra `/congresso-pediatria-foto` e confira no celular e desktop o upload, a câmera, o ajuste de zoom e o PNG baixado. O acesso à câmera precisa ser validado em HTTPS ou `localhost`.
