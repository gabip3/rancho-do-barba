import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { WHATSAPP_EXIBICAO, whatsappLink } from '../lib/contato'
import { ease } from '../lib/motion'

/** Botão flutuante de pedido. Só entra depois da abertura, para não disputar com o ovo. */
/**
 * No celular o hero já tem o "Quero meus ovos" logo acima dos links: o flutuante só entra
 * depois de rolar um pouco, para não cobrir o "Joguinho ↓". No desktop fica sempre.
 */
function useLiberado() {
  const [liberado, setLiberado] = useState(false)
  useEffect(() => {
    const checar = () => setLiberado(window.innerWidth >= 768 || window.scrollY > window.innerHeight * 0.35)
    checar()
    window.addEventListener('scroll', checar, { passive: true })
    window.addEventListener('resize', checar)
    return () => {
      window.removeEventListener('scroll', checar)
      window.removeEventListener('resize', checar)
    }
  }, [])
  return liberado
}

export default function WhatsAppButton({ show }: { show: boolean }) {
  // o hook roda sempre (nunca depois de um "show &&"), para a ordem dos hooks não mudar
  const liberado = useLiberado()
  const visivel = show && liberado
  return (
    <motion.div
      className="fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 md:right-8 md:bottom-8"
      initial={false}
      animate={visivel ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
      transition={{ duration: 0.6, ease: ease.pouso, delay: visivel ? 0.3 : 0 }}
      inert={!visivel}
    >
      <a
        href={whatsappLink()}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Pedir pelo WhatsApp: ${WHATSAPP_EXIBICAO}`}
        className="cta-artesanal bg-whatsapp hover:bg-whatsapp-escuro inline-flex items-center gap-2.5 p-4 text-white shadow-[0_8px_22px_-10px_rgba(10,60,30,0.5)] sm:py-3.5 sm:pr-5 sm:pl-4"
      >
        <WhatsAppGlyph className="h-6 w-6 shrink-0" />
        <span className="hidden text-[0.95rem] font-[600] tracking-[0.01em] sm:inline">Pedir no WhatsApp</span>
      </a>
    </motion.div>
  )
}

function WhatsAppGlyph({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  )
}
