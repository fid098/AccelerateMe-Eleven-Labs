// api.js - Helper functions for backend API calls
// Place this in: frontend/src/api.js

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Make an API request with error handling
 */
async function apiRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.detail || error.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

/**
 * Check if the backend is healthy
 */
export async function checkHealth() {
  return apiRequest('/api/health');
}

/**
 * Fetch available voices from ElevenLabs
 */
export async function fetchVoices() {
  return apiRequest('/api/voices');
}

/**
 * Generate a new song
 */
export async function generateSong(songData) {
  const { lyrics, title, voiceId, genre, mood, tempo } = songData;
  
  return apiRequest('/api/generate-song', {
    method: 'POST',
    body: JSON.stringify({
      lyrics,
      title: title || 'Untitled Song',
      voiceId,
      genre,
      mood,
      tempo,
    }),
  });
}

/**
 * Get all songs
 */
export async function fetchSongs() {
  return apiRequest('/api/songs');
}

/**
 * Get a specific song by ID
 */
export async function fetchSong(songId) {
  return apiRequest(`/api/songs/${songId}`);
}

/**
 * Get the audio URL for a song
 */
export function getSongAudioUrl(songId) {
  return `${API_BASE_URL}/api/songs/${songId}/audio`;
}

/**
 * Get the download URL for a song
 */
export function getSongDownloadUrl(songId) {
  return `${API_BASE_URL}/api/songs/${songId}/download`;
}

/**
 * Improve/regenerate a song with feedback
 */
export async function improveSong(songId, feedback, newLyrics = null) {
  return apiRequest(`/api/songs/${songId}/improve`, {
    method: 'POST',
    body: JSON.stringify({
      feedback,
      lyrics: newLyrics,
    }),
  });
}

/**
 * Example usage in a React component:
 * 
 * import { generateSong, fetchVoices } from './api';
 * 
 * function MyComponent() {
 *   const handleGenerate = async () => {
 *     try {
 *       const result = await generateSong({
 *         lyrics: "Your lyrics here",
 *         title: "My Song",
 *         voiceId: "JBFqnCBsd6RMkjVDRZzb"
 *       });
 *       
 *       console.log('Song generated:', result);
 *       // Play audio: getSongAudioUrl(result.id)
 *     } catch (error) {
 *       console.error('Generation failed:', error.message);
 *     }
 *   };
 * }
 */