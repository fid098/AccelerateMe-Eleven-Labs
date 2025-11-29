import React, { useState, useRef } from 'react';
import { Music, Mic, Upload, FileText, Sparkles, Download, RefreshCw, Play, Pause } from 'lucide-react';

export default function SongCreatorStudio() {
  const [step, setStep] = useState(1);
  const [lyrics, setLyrics] = useState('');
  const [voiceOption, setVoiceOption] = useState('original');
  const [hasRecording, setHasRecording] = useState(false);
  const [instrumentalOption, setInstrumentalOption] = useState('generate');
  const [genre, setGenre] = useState('pop');
  const [mood, setMood] = useState('upbeat');
  const [tempo, setTempo] = useState(120);
  const [generatedSong, setGeneratedSong] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingFeedback, setIsRecordingFeedback] = useState(false);
  const fileInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const instrumentalInputRef = useRef(null);

  const voices = [
    { id: 'original', name: 'Original Voice', description: 'Use your recorded voice' },
    { id: 'male_warm', name: 'Warm Male', description: 'Rich, deep male voice' },
    { id: 'female_bright', name: 'Bright Female', description: 'Clear, energetic female voice' },
    { id: 'male_rock', name: 'Rock Male', description: 'Powerful, gritty male voice' },
    { id: 'female_soul', name: 'Soulful Female', description: 'Smooth, emotional female voice' },
    { id: 'neutral_soft', name: 'Soft Neutral', description: 'Gentle, calming voice' }
  ];

  const genres = ['Pop', 'Rock', 'Hip-Hop', 'Jazz', 'Electronic', 'Country', 'R&B', 'Classical', 'Indie', 'Metal'];
  const moods = ['Upbeat', 'Melancholic', 'Energetic', 'Calm', 'Romantic', 'Dark', 'Playful', 'Epic'];

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLyrics(event.target.result);
      };
      reader.readAsText(file);
    }
  };

  const handleAudioUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('audio/')) {
      setHasRecording(true);
      alert('Audio file uploaded successfully!');
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setTimeout(() => {
        setIsRecording(false);
        setHasRecording(true);
        alert('Recording saved!');
      }, 3000);
    }
  };

  const toggleFeedbackRecording = () => {
    setIsRecordingFeedback(!isRecordingFeedback);
    if (!isRecordingFeedback) {
      setTimeout(() => {
        setIsRecordingFeedback(false);
        setFeedback('Voice feedback recorded');
      }, 3000);
    }
  };

  const handleInstrumentalUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('audio/')) {
      alert('Instrumental track uploaded successfully!');
    }
  };

  const generateSong = async () => {
    setIsGenerating(true);
    
    // Simulate API call to generate song
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setGeneratedSong({
      title: 'Generated Song',
      duration: '3:45',
      url: '#',
      timestamp: new Date().toISOString()
    });
    
    setIsGenerating(false);
    setStep(5);
  };

  const regenerateSong = async () => {
    setIsGenerating(true);
    
    // Simulate API call with feedback
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    setGeneratedSong({
      ...generatedSong,
      timestamp: new Date().toISOString(),
      version: (generatedSong.version || 1) + 1
    });
    
    setIsGenerating(false);
    setFeedback('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Music className="w-12 h-12 text-purple-300" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
              AI Song Creator Studio
            </h1>
          </div>
          <p className="text-purple-200 text-lg">Transform your lyrics into professional songs with AI</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between mb-12 max-w-4xl mx-auto">
          {['Lyrics', 'Voice', 'Instrumental', 'Generate', 'Refine'].map((label, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all ${
                step > idx + 1 ? 'bg-green-500' : step === idx + 1 ? 'bg-purple-500 ring-4 ring-purple-300' : 'bg-gray-600'
              }`}>
                {step > idx + 1 ? '✓' : idx + 1}
              </div>
              <span className="text-sm mt-2 text-purple-200">{label}</span>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
          {/* Step 1: Input Lyrics */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <FileText className="w-8 h-8" />
                Step 1: Input Your Lyrics
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-3 p-6 bg-white/5 hover:bg-white/10 rounded-xl transition-all border-2 border-purple-400/50 hover:border-purple-400"
                >
                  <Upload className="w-8 h-8" />
                  <span className="font-semibold">Upload Text File</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  onClick={() => audioInputRef.current?.click()}
                  className="flex flex-col items-center gap-3 p-6 bg-white/5 hover:bg-white/10 rounded-xl transition-all border-2 border-purple-400/50 hover:border-purple-400"
                >
                  <Upload className="w-8 h-8" />
                  <span className="font-semibold">Upload Audio</span>
                </button>
                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioUpload}
                  className="hidden"
                />

                <button
                  onClick={toggleRecording}
                  className={`flex flex-col items-center gap-3 p-6 rounded-xl transition-all border-2 ${
                    isRecording 
                      ? 'bg-red-500/20 border-red-400 animate-pulse' 
                      : 'bg-white/5 hover:bg-white/10 border-purple-400/50 hover:border-purple-400'
                  }`}
                >
                  <Mic className="w-8 h-8" />
                  <span className="font-semibold">{isRecording ? 'Recording...' : 'Record Singing'}</span>
                </button>
              </div>

              <div>
                <label className="block mb-2 text-lg font-semibold">Or type/paste your lyrics:</label>
                <textarea
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  placeholder="Enter your song lyrics here..."
                  className="w-full h-64 bg-white/5 border-2 border-purple-400/50 rounded-xl p-4 text-white placeholder-purple-300/50 focus:border-purple-400 focus:outline-none resize-none"
                />
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!lyrics && !hasRecording}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-600 rounded-xl font-bold text-lg transition-all disabled:cursor-not-allowed"
              >
                Continue to Voice Selection
              </button>
            </div>
          )}

          {/* Step 2: Voice Selection */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <Mic className="w-8 h-8" />
                Step 2: Choose Your Voice
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {voices.map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => setVoiceOption(voice.id)}
                    disabled={voice.id === 'original' && !hasRecording}
                    className={`p-6 rounded-xl transition-all border-2 text-left ${
                      voiceOption === voice.id
                        ? 'bg-purple-500/30 border-purple-400'
                        : 'bg-white/5 border-purple-400/50 hover:bg-white/10'
                    } ${voice.id === 'original' && !hasRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="font-bold text-lg mb-2">{voice.name}</div>
                    <div className="text-purple-200 text-sm">{voice.description}</div>
                  </button>
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-4 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-all"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl font-bold text-lg transition-all"
                >
                  Continue to Instrumental
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Instrumental Options */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <Music className="w-8 h-8" />
                Step 3: Instrumental Settings
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setInstrumentalOption('generate')}
                  className={`p-6 rounded-xl transition-all border-2 ${
                    instrumentalOption === 'generate'
                      ? 'bg-purple-500/30 border-purple-400'
                      : 'bg-white/5 border-purple-400/50 hover:bg-white/10'
                  }`}
                >
                  <Sparkles className="w-8 h-8 mb-3" />
                  <div className="font-bold text-lg mb-2">Generate Instrumental</div>
                  <div className="text-purple-200 text-sm">Let AI create a custom instrumental</div>
                </button>

                <button
                  onClick={() => {
                    setInstrumentalOption('upload');
                    instrumentalInputRef.current?.click();
                  }}
                  className={`p-6 rounded-xl transition-all border-2 ${
                    instrumentalOption === 'upload'
                      ? 'bg-purple-500/30 border-purple-400'
                      : 'bg-white/5 border-purple-400/50 hover:bg-white/10'
                  }`}
                >
                  <Upload className="w-8 h-8 mb-3" />
                  <div className="font-bold text-lg mb-2">Upload Instrumental</div>
                  <div className="text-purple-200 text-sm">Use your own backing track</div>
                </button>
                <input
                  ref={instrumentalInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleInstrumentalUpload}
                  className="hidden"
                />
              </div>

              {instrumentalOption === 'generate' && (
                <div className="space-y-6 bg-white/5 rounded-xl p-6">
                  <div>
                    <label className="block mb-3 text-lg font-semibold">Genre</label>
                    <select
                      value={genre}
                      onChange={(e) => setGenre(e.target.value)}
                      className="w-full bg-white/10 border-2 border-purple-400/50 rounded-lg p-3 text-white focus:border-purple-400 focus:outline-none"
                    >
                      {genres.map(g => (
                        <option key={g} value={g.toLowerCase()} className="bg-gray-800">{g}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-3 text-lg font-semibold">Mood</label>
                    <select
                      value={mood}
                      onChange={(e) => setMood(e.target.value)}
                      className="w-full bg-white/10 border-2 border-purple-400/50 rounded-lg p-3 text-white focus:border-purple-400 focus:outline-none"
                    >
                      {moods.map(m => (
                        <option key={m} value={m.toLowerCase()} className="bg-gray-800">{m}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-3 text-lg font-semibold">Tempo: {tempo} BPM</label>
                    <input
                      type="range"
                      min="60"
                      max="180"
                      value={tempo}
                      onChange={(e) => setTempo(e.target.value)}
                      className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-sm text-purple-200 mt-1">
                      <span>Slow (60)</span>
                      <span>Fast (180)</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-4 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-all"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="flex-1 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl font-bold text-lg transition-all"
                >
                  Continue to Generate
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Generate */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <Sparkles className="w-8 h-8" />
                Step 4: Review & Generate
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 rounded-xl p-6 space-y-3">
                  <h3 className="text-xl font-bold text-purple-300">Configuration</h3>
                  <div className="space-y-2 text-purple-100">
                    <div><strong>Voice:</strong> {voices.find(v => v.id === voiceOption)?.name}</div>
                    <div><strong>Instrumental:</strong> {instrumentalOption === 'generate' ? 'AI Generated' : 'Custom Upload'}</div>
                    {instrumentalOption === 'generate' && (
                      <>
                        <div><strong>Genre:</strong> {genre}</div>
                        <div><strong>Mood:</strong> {mood}</div>
                        <div><strong>Tempo:</strong> {tempo} BPM</div>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-purple-300 mb-3">Lyrics Preview</h3>
                  <div className="text-purple-100 text-sm overflow-y-auto max-h-40">
                    {lyrics || 'Audio recording will be processed'}
                  </div>
                </div>
              </div>

              {isGenerating ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-400 border-t-transparent mb-4"></div>
                  <p className="text-xl font-semibold">Generating your song...</p>
                  <p className="text-purple-200 mt-2">This may take a moment</p>
                </div>
              ) : (
                <div className="flex gap-4">
                  <button
                    onClick={() => setStep(3)}
                    className="flex-1 py-4 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={generateSong}
                    className="flex-1 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-6 h-6" />
                    Generate Song
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Refine & Download */}
          {step === 5 && generatedSong && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <Download className="w-8 h-8" />
                Step 5: Your Generated Song
              </h2>

              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-8 border-2 border-purple-400/50">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold">{generatedSong.title}</h3>
                    <p className="text-purple-200">Duration: {generatedSong.duration}</p>
                    {generatedSong.version && <p className="text-sm text-purple-300">Version {generatedSong.version}</p>}
                  </div>
                  <button className="w-16 h-16 bg-purple-500 hover:bg-purple-600 rounded-full flex items-center justify-center transition-all">
                    <Play className="w-8 h-8" />
                  </button>
                </div>

                <div className="bg-white/10 rounded-lg h-2 mb-6">
                  <div className="bg-gradient-to-r from-purple-400 to-pink-400 h-2 rounded-lg w-0"></div>
                </div>

                <button className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2">
                  <Download className="w-6 h-6" />
                  Download Song
                </button>
              </div>

              <div className="bg-white/5 rounded-xl p-6 space-y-4">
                <h3 className="text-xl font-bold text-purple-300">Improve Your Song</h3>
                <p className="text-purple-200">Not satisfied? Provide feedback to regenerate with improvements.</p>

                <div className="flex gap-4">
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Describe what you'd like to change (e.g., 'Make it more energetic', 'Add more guitar', 'Slower tempo')..."
                    className="flex-1 bg-white/5 border-2 border-purple-400/50 rounded-xl p-4 text-white placeholder-purple-300/50 focus:border-purple-400 focus:outline-none resize-none h-32"
                  />
                  <button
                    onClick={toggleFeedbackRecording}
                    className={`px-6 rounded-xl transition-all border-2 ${
                      isRecordingFeedback 
                        ? 'bg-red-500/20 border-red-400 animate-pulse' 
                        : 'bg-white/5 hover:bg-white/10 border-purple-400/50'
                    }`}
                  >
                    <Mic className="w-6 h-6" />
                  </button>
                </div>

                <button
                  onClick={regenerateSong}
                  disabled={!feedback || isGenerating}
                  className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-600 disabled:to-gray-600 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5" />
                      Regenerate with Feedback
                    </>
                  )}
                </button>
              </div>

              <button
                onClick={() => {
                  setStep(1);
                  setLyrics('');
                  setGeneratedSong(null);
                  setFeedback('');
                  setHasRecording(false);
                }}
                className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-all"
              >
                Create New Song
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-purple-200 text-sm">
          <p>Powered by AI • ElevenLabs Voice • Suno/MusicGen Instrumentals</p>
        </div>
      </div>
    </div>
  );
}