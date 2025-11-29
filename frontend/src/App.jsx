import { useCallback, useState } from 'react'
import LyricsInput from './components/LyricsInput'
import VoiceSelection from './components/VoiceSelection'
import InstrumentalOptions from './components/InstrumentalOptions'
import GenerationReview from './components/GenerationReview'
import './App.css'

function App() {
  const [lyricsState, setLyricsState] = useState({
    lyricsText: '',
    lyricsFile: null,
    title: '',
  })

  const [voiceState, setVoiceState] = useState({
    audioFile: null,
    voiceId: null,
  })

  const [instrumentalState, setInstrumentalState] = useState({
    instrumentalMode: 'generate',
    instrumentalFile: null,
    instrumentalGenre: '',
    instrumentalMood: '',
    instrumentalTempo: '',
  })

  const handleLyricsChange = useCallback((next) => {
    setLyricsState((prev) => ({ ...prev, ...next }))
  }, [])

  const handleVoiceChange = useCallback((next) => {
    setVoiceState((prev) => ({ ...prev, ...next }))
  }, [])

  const handleInstrumentalChange = useCallback((next) => {
    setInstrumentalState((prev) => ({ ...prev, ...next }))
  }, [])

  return (
    <div className="app-container">
      <h1>AI Vocal Replacement Studio</h1>
      <p>
        Write your song, sing it once, then swap in a professional artist voice and
        tailored instrumental.
      </p>

      <hr />

      <LyricsInput value={lyricsState.lyricsText} onChange={handleLyricsChange} />

      <hr />

      <VoiceSelection onChange={handleVoiceChange} />

      <hr />

      <InstrumentalOptions onChange={handleInstrumentalChange} />

      <hr />

      <GenerationReview
        lyricsState={lyricsState}
        voiceState={voiceState}
        instrumentalState={instrumentalState}
      />
    </div>
  )
}

export default App
