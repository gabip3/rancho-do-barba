import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ command, isPreview }) => ({
  // No GitHub Pages o site é publicado em https://gabip3.github.io/rancho-do-barba/
  // (o `vite preview` também usa esse caminho, para testar o build do jeito que vai ao ar)
  base: command === 'build' || isPreview ? '/rancho-do-barba/' : '/',
  plugins: [react(), tailwindcss()],
}))
