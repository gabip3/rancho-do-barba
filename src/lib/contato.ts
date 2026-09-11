export const WHATSAPP_NUMERO = '5511996100258'
export const WHATSAPP_EXIBICAO = '(11) 99610-0258'

const MENSAGEM_PADRAO = 'Oi, Rancho do Barba! Quero fazer um pedido.'

export function whatsappLink(mensagem = MENSAGEM_PADRAO) {
  return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensagem)}`
}
