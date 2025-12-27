import { useEffect, useState } from 'react'

export default function InstrumentalOptions({ onChange }) {
  const [mode, setMode] = useState('generate')
  const [instrumentalFile, setInstrumentalFile] = useState(null)
  const [genre, setGenre] = useState('')
  const [mood, setMood] = useState('')
  const [tempo, setTempo] = useState('')

  useEffect(() => {
    onChange({
      instrumentalMode: mode,
      instrumentalFile,
      instrumentalGenre: genre,
      instrumentalMood: mood,
      instrumentalTempo: tempo,
    })
  }, [mode, instrumentalFile, genre, mood, tempo, onChange])

  function handleInstrumentalFileChange(e) {
    const file = e.target.files?.[0] || null
    setInstrumentalFile(file)
  }

  return (
    <section>
      <h2>3. Instrumental Options</h2>

      <div>
        <label>
          <input
            type="radio"
            name="instrumentalMode"
            value="generate"
            checked={mode === 'generate'}
            onChange={() => setMode('generate')}
          />{' '}
          Let the app generate an instrumental
        </label>
        <br />
        <label>
          <input
            type="radio"
            name="instrumentalMode"
            value="upload"
            checked={mode === 'upload'}
            onChange={() => setMode('upload')}
          />{' '}
          I will upload my own instrumental
        </label>
      </div>

      {mode === 'upload' && (
        <div style={{ marginTop: '0.5rem' }}>
          <strong>Upload instrumental track</strong>
          <br />
          <input type="file" accept="audio/*" onChange={handleInstrumentalFileChange} />
          {instrumentalFile && (
            <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
              Selected: {instrumentalFile.name}
            </div>
          )}
        </div>
      )}

      {mode === 'generate' && (
        <div style={{ marginTop: '0.5rem' }}>
          <p>Set preferences for generated instrumentals:</p>
          <div>
            <label>
              Genre:{' '}
              <input
                type="text"
                placeholder="e.g. pop, rock, lo-fi"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
              />
            </label>
          </div>
          <div>
            <label>
              Mood:{' '}
              <input
                type="text"
                placeholder="e.g. happy, melancholic, epic"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
              />
            </label>
          </div>
          <div>
            <label>
              Tempo:{' '}
              <input
                type="text"
                placeholder="e.g. 90, 120, fast, slow"
                value={tempo}
                onChange={(e) => setTempo(e.target.value)}
              />
            </label>
          </div>
        </div>
      )}
    </section>
  )
}
