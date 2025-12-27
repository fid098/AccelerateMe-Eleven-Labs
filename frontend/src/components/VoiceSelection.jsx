import { useEffect, useState } from 'react'

export default function VoiceSelection({ onChange }) {
  const [audioFile, setAudioFile] = useState(null)
  const [voiceId, setVoiceId] = useState('')

  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState(null)

  useEffect(() => {
    onChange({ audioFile, voiceId: voiceId || null })
  }, [audioFile, voiceId, onChange])

  function handleAudioFileChange(e) {
    const file = e.target.files?.[0] || null
    setAudioFile(file)
  }

  async function handleStartRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        const file = new File([blob], 'recording.webm', { type: 'audio/webm' })
        setAudioFile(file)
      }

      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
    } catch (err) {
      console.error(err)
      alert('Could not access microphone. Check permissions.')
    }
  }

  function handleStopRecording() {
    if (!mediaRecorder) return
    mediaRecorder.stop()
    setIsRecording(false)
  }

  return (
    <section>
      <h2>2. Voice Selection</h2>
      <p>
        Upload or record your vocal performance, then choose an artist voice
        powered by ElevenLabs.
      </p>

      <div style={{ marginBottom: '0.75rem' }}>
        <strong>Upload vocal recording</strong>
        <br />
        <input type="file" accept="audio/*" onChange={handleAudioFileChange} />
        {audioFile && (
          <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Selected: {audioFile.name}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <strong>Or record with your microphone</strong>
        <br />
        {!isRecording ? (
          <button type="button" onClick={handleStartRecording}>
            Start Recording
          </button>
        ) : (
          <button type="button" onClick={handleStopRecording}>
            Stop Recording
          </button>
        )}
      </div>

      <div>
        <strong>Select artist voice (ElevenLabs)</strong>
        <br />
        <select
          value={voiceId}
          onChange={(e) => setVoiceId(e.target.value)}
          style={{ marginTop: '0.25rem' }}
        >
          <option value="">Choose a voice</option>
          <option value="eleven-voice-pop-female">Pop Diva (Female)</option>
          <option value="eleven-voice-rnb-male">Smooth R&B (Male)</option>
          <option value="eleven-voice-rock-gritty">Rock Star (Gritty)</option>
        </select>
        <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
          Replace these IDs with real voices from your ElevenLabs account.
        </p>
      </div>
    </section>
  )
}
