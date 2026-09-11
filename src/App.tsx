import { useCallback, useState } from 'react'
import Hero from './components/Hero'
import RanchoFotos from './components/RanchoFotos'
import WhatsAppButton from './components/WhatsAppButton'

export default function App() {
  const [ready, setReady] = useState(false)
  const markReady = useCallback(() => setReady(true), [])

  return (
    <>
      <div className="papel-grao" aria-hidden />
      <main>
        <Hero onSettled={markReady} />
        <RanchoFotos />
      </main>
      <WhatsAppButton show={ready} />
    </>
  )
}
