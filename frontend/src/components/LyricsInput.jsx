import { useState } from 'react'

export default function LyricsInput({ value, onChange }) {
  const [localLyrics, setLocalLyrics] = useState(value || '')
  const [lyricsFile, setLyricsFile] = useState(null)
  const [title, setTitle] = useState('')

  function handleLyricsChange(e) {
    const text = e.target.value
    setLocalLyrics(text)
    onChange({ lyricsText: text, lyricsFile, title })
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0] || null
    setLyricsFile(file)
    onChange({ lyricsText: localLyrics, lyricsFile: file, title })
  }

  function handleTitleChange(e) {
    const nextTitle = e.target.value
    setTitle(nextTitle)
    onChange({ lyricsText: localLyrics, lyricsFile, title: nextTitle })
  }

  return (
    <section>
      <h2>1. Input Song Lyrics</h2>
      <p>Give your song a title and paste or upload your lyrics.</p>

      <div style={{ marginBottom: '0.5rem' }}>
        <label>
          Title:{' '}
          <input
            type="text"
            placeholder="My Next Hit Single"
            value={title}
            onChange={handleTitleChange}
          />
        </label>
      </div>

      <textarea
        rows={8}
        style={{ width: '100%', boxSizing: 'border-box' }}
        placeholder="Type or paste your lyrics here..."
        value={localLyrics}
        onChange={handleLyricsChange}
      />

      <div style={{ marginTop: '0.5rem' }}>
        <label>
          Or upload lyrics file:
          <input type="file" accept=".txt" onChange={handleFileChange} />
        </label>
      </div>
    </section>
  )
}
