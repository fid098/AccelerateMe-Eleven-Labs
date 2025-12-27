const API_BASE_URL = 'http://localhost:5000/api'

export async function generateSong(options) {
  const formData = new FormData()

  if (!options.audioFile) {
    throw new Error('audioFile is required to generate a song.')
  }

  formData.append('audio', options.audioFile)

  if (options.lyricsText) {
    formData.append('lyricsText', options.lyricsText)
  }
  if (options.lyricsFile) {
    formData.append('lyricsFile', options.lyricsFile)
  }

  if (options.title) {
    formData.append('title', options.title)
  }

  if (options.voiceId) {
    formData.append('voiceId', options.voiceId)
  }

  const instrumentalMode = options.instrumentalMode || 'generate'
  formData.append('instrumentalMode', instrumentalMode)

  if (instrumentalMode === 'upload' && options.instrumentalFile) {
    formData.append('instrumental', options.instrumentalFile)
  } else if (instrumentalMode === 'generate') {
    if (options.instrumentalGenre) formData.append('instrumentalGenre', options.instrumentalGenre)
    if (options.instrumentalMood) formData.append('instrumentalMood', options.instrumentalMood)
    if (options.instrumentalTempo) formData.append('instrumentalTempo', options.instrumentalTempo)
  }

  const res = await fetch(`${API_BASE_URL}/generate-song`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Failed to generate song: ${res.status} ${text}`)
  }

  return res.json()
}

export async function improveSong(songId, feedbackText) {
  if (!songId) throw new Error('songId is required')
  if (!feedbackText.trim()) throw new Error('feedbackText is required')

  const res = await fetch(`${API_BASE_URL}/songs/${songId}/improve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ feedbackText }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Failed to improve song: ${res.status} ${text}`)
  }

  return res.json()
}
