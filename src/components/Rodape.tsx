import { asset } from '../lib/asset'

export default function Rodape() {
  const ano = new Date().getFullYear()

  return (
    <footer className="border-tinta/10 border-t">
      {/*
        O botão flutuante do WhatsApp mora no canto direito de baixo: o conteúdo fica à esquerda
        no desktop e, no celular e no tablet, sobra espaço embaixo para ele não cobrir o texto.
      */}
      <div className="mx-auto flex w-full max-w-[1360px] flex-col items-center gap-3 px-6 pt-10 pb-28 text-center md:flex-row md:justify-start md:gap-10 md:px-10 md:text-left lg:px-14 lg:pb-10">
        <img src={asset('images/wordmark.webp')} alt="Rancho do Barba" className="h-6 w-auto md:h-7" />
        <p className="text-terra text-[0.98rem]">© {ano} Rancho do Barba</p>
        <p className="text-terra text-[0.98rem]">
          Criado por <span className="text-tinta font-[500]">Gabriella Costa</span>
        </p>
      </div>
    </footer>
  )
}
