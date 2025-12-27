import { useState } from 'react'
import { generateSong, improveSong } from '../apiClient'

export default function GenerationReview({ lyricsState, voiceState, instrumentalState }) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isImproving, setIsImproving] = useState(false)
  const [songId, setSongId] = useState(null)
  const [songUrl, setSongUrl] = useState(null)
  const [feedback, setFeedback] = useState('')

  async function handleGenerateClick() {
    if (!voiceState.audioFile) {
      alert('Please upload or record your vocal performance first.')
      return
    }

    setIsGenerating(true)
    try {
      const result = await generateSong({
        audioFile: voiceState.audioFile,
        lyricsText: lyricsState.lyricsText,
        lyricsFile: lyricsState.lyricsFile,
        title: lyricsState.title,
        voiceId: voiceState.voiceId,
        instrumentalMode: instrumentalState.instrumentalMode,
        instrumentalFile:
          instrumentalState.instrumentalMode === 'upload'
            ? instrumentalState.instrumentalFile
            : null,
        instrumentalGenre: instrumentalState.instrumentalGenre,
        instrumentalMood: instrumentalState.instrumentalMood,
        instrumentalTempo: instrumentalState.instrumentalTempo,
      })

      setSongId(result.songId)
      setSongUrl(`http://localhost:5000${result.songUrl}`)
    } catch (err) {
      console.error(err)
      alert(err.message || 'Failed to generate song. See console for details.')
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleImproveClick() {
    if (!songId) {
      alert('Generate a song first before requesting improvements.')
      return
    }
    if (!feedback.trim()) {
      alert('Please provide some feedback first.')
      return
    }

    setIsImproving(true)
    try {
      const result = await improveSong(songId, feedback)
      setSongUrl(`http://localhost:5000${result.songUrl}`)
    } catch (err) {
      console.error(err)
      alert(err.message || 'Failed to improve song. See console for details.')
    } finally {
      setIsImproving(false)
    }
  }

  return (
    <section>
      <h2>4. Generate & Refine Your Song</h2>

      <button type="button" onClick={handleGenerateClick} disabled={isGenerating}>
        {isGenerating ? 'Generating...' : 'Generate Song'}
      </button>

      {songUrl && (
        <div style={{ marginTop: '1rem' }}>
          <h3>Generated Song</h3>
          <audio controls src={songUrl} style={{ width: '100%' }}>
            Your browser does not support the audio element.
          </audio>
          <p style={{ fontSize: '0.85rem', color: '#bbb' }}>
            When the backend returns real audio instead of text placeholders, this
            player will play the full song.
          </p>
        </div>
      )}

      <div style={{ marginTop: '1rem' }}>
        <h3>5. Request Improvements</h3>
        <p>Describe how you want the song to change.</p>
        <textarea
          rows={4}
          style={{ width: '100%', boxSizing: 'border-box' }}
          placeholder="e.g. Make the chorus more energetic and increase the tempo."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
        />
        <br />
        <button
          type="button"
          onClick={handleImproveClick}
          disabled={isImproving}
          style={{ marginTop: '0.5rem' }}
        >
          {isImproving ? 'Applying Feedback...' : 'Improve Song'}
        </button>
      </div>
    </section>
  )
}
