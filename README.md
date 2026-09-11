# Rancho do Barba

Site do Rancho do Barba: ovos caipiras, ovos de codorna em conserva e frango caipira, em Guarulhos/SP.

**Site no ar:** https://gabip3.github.io/rancho-do-barba/

## O que tem até agora

- Abertura animada com o ovo de barba
- Hero com os produtos e o botão de pedido pelo WhatsApp
- Seção "O Rancho" com fotos, vídeos curtos e desenhos de galinha
- Botão flutuante do WhatsApp

O site está sendo construído seção por seção.

## Rodar no computador

Precisa do [Node.js](https://nodejs.org) 20 ou mais novo.

```bash
npm install
npm run dev
```

Abre em http://localhost:5173.

## Tecnologia

React, TypeScript, Tailwind CSS e Framer Motion, com Vite.

## Imagens e vídeos

Os arquivos originais ficam na raiz do projeto. As versões otimizadas usadas no site ficam em `public/`:

- `npm run assets` gera o símbolo, o wordmark e o favicon a partir dos logos
- `node scripts/prepare-photos.mjs` recorta e comprime as fotos

## Publicação

Cada push na branch `main` publica o site no GitHub Pages automaticamente (`.github/workflows/deploy.yml`).
