/** Caminho de um arquivo de public/, respeitando o base do Vite (no GitHub Pages o site mora em /rancho-do-barba/). */
export const asset = (caminho: string) => `${import.meta.env.BASE_URL}${caminho.replace(/^\//, '')}`
