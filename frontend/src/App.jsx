import React, { useState, useRef, useEffect } from 'react';
import { Music, Mic, Upload, FileText, Sparkles, Download, RefreshCw, Play, Pause } from 'lucide-react';

// Tailwind Colors:
// Dark Background: #1B262C
// Primary Accent: #3282B8
// Secondary/Highlight: #BBE1FA

export default function SongCreatorStudio() {
  const [step, setStep] = useState(1);
  const [lyrics, setLyrics] = useState('');
  const [voiceOption, setVoiceOption] = useState('kore_firm'); // Default to a specific voice now
  const [hasRecording, setHasRecording] = useState(false); // Tracks status for vocal input (upload or recording)
  const [isLyricsFileUploaded, setIsLyricsFileUploaded] = useState(false); // NEW: Tracks text file upload status
  const [instrumentalOption, setInstrumentalOption] = useState('generate');
  const [genre, setGenre] = useState('pop');
  const [mood, setMood] = useState('upbeat');
  const [tempo, setTempo] = useState(120);
  const [generatedSong, setGeneratedSong] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingFeedback, setIsRecordingFeedback] = useState(false);
  const [inputError, setInputError] = useState(false); 
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // NOTE: Placeholder for API Key. In a real application, use a secure backend.
  const API_KEY = ""; 
  const GEMINI_MODEL = "gemini-2.5-flash-preview-tts";
  const TTS_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${API_KEY}`;

  const fileInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const instrumentalInputRef = useRef(null);
  const audioPlayerRef = useRef(null);

  // In a real application, this list would be fetched dynamically from a service like ElevenLabs.
  const voices = [
    { id: 'original', name: 'Original Voice', description: 'Use your recorded voice (requires audio input)' },
    { id: 'zephyr_bright', name: 'Zephyr (Bright)', description: 'Clear, energetic, and bright tone', voiceName: 'Zephyr' },
    { id: 'puck_upbeat', name: 'Puck (Upbeat)', description: 'High-energy and positive delivery', voiceName: 'Puck' },
    { id: 'charon_informative', name: 'Charon (Informative)', description: 'Deep, clear, and authoritative', voiceName: 'Charon' },
    { id: 'kore_firm', name: 'Kore (Firm)', description: 'Strong, steady, and resolute delivery', voiceName: 'Kore' },
    { id: 'leda_youthful', name: 'Leda (Youthful)', description: 'Light, fresh, and easy-going', voiceName: 'Leda' },
    { id: 'orus_formal', name: 'Orus (Formal)', description: 'Polished, firm, and mature', voiceName: 'Orus' },
    { id: 'algieba_smooth', name: 'Algieba (Smooth)', description: 'Velvety, calming, and professional', voiceName: 'Algieba' },
    { id: 'gacrux_mature', name: 'Gacrux (Mature)', description: 'Warm, experienced, and confident', voiceName: 'Gacrux' },
    { id: 'achird_friendly', name: 'Achird (Friendly)', description: 'Casual, conversational, and accessible', voiceName: 'Achird' },
    { id: 'sadachbia_lively', name: 'Sadachbia (Lively)', description: 'Expressive and playful', voiceName: 'Sadachbia' },
  ];

  const genres = ['Pop', 'Rock', 'Hip-Hop', 'Jazz', 'Electronic', 'Country', 'R&B', 'Classical', 'Indie', 'Metal'];
  const moods = ['Upbeat', 'Melancholic', 'Energetic', 'Calm', 'Romantic', 'Dark', 'Playful', 'Epic'];

  // --- TTS Helper Functions ---

  const base64ToArrayBuffer = (base64) => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  const pcmToWav = (pcm16, sampleRate) => {
    const buffer = new ArrayBuffer(44 + pcm16.length * 2);
    const view = new DataView(buffer);
    
    // RIFF identifier
    writeString(view, 0, 'RIFF');
    // file length
    view.setUint32(4, 36 + pcm16.length * 2, true);
    // RIFF type
    writeString(view, 8, 'WAVE');
    // format chunk identifier
    writeString(view, 12, 'fmt ');
    // format chunk length
    view.setUint32(16, 16, true);
    // sample format (1 = PCM)
    view.setUint16(20, 1, true);
    // channel count
    view.setUint16(22, 1, true);
    // sample rate
    view.setUint32(24, sampleRate, true);
    // byte rate (sample rate * block align)
    view.setUint32(28, sampleRate * 2, true);
    // block align (channels * bytes per sample)
    view.setUint16(32, 2, true);
    // bits per sample
    view.setUint16(34, 16, true);
    // data chunk identifier
    writeString(view, 36, 'data');
    // data chunk length
    view.setUint32(40, pcm16.length * 2, true);
    
    // Write PCM data
    for (let i = 0; i < pcm16.length; i++) {
      view.setInt16(44 + i * 2, pcm16[i], true);
    }
    
    return new Blob([view], { type: 'audio/wav' });
  };

  const writeString = (view, offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // --- API Call Implementation (Simulated TTS Voice Generation) ---

  const generateAudioTrack = async (voiceName, text, maxRetries = 5) => {
    const payload = {
      contents: [{
        parts: [{ text: `Sing this lyric: "${text}"` }]
      }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName }
          }
        }
      },
      model: GEMINI_MODEL
    };

    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(TTS_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`API returned status ${response.status}`);
        }

        const result = await response.json();
        const part = result?.candidates?.[0]?.content?.parts?.[0];
        const audioData = part?.inlineData?.data;
        const mimeType = part?.inlineData?.mimeType;

        if (audioData && mimeType && mimeType.startsWith("audio/L16")) {
          const sampleRateMatch = mimeType.match(/rate=(\d+)/);
          const sampleRate = sampleRateMatch ? parseInt(sampleRateMatch[1], 10) : 16000;
          
          const pcmData = base64ToArrayBuffer(audioData);
          const pcm16 = new Int16Array(pcmData);
          
          const wavBlob = pcmToWav(pcm16, sampleRate);
          const url = URL.createObjectURL(wavBlob);
          
          return { audioUrl: url, sampleRate };
        } else {
            throw new Error("Invalid audio response structure from API.");
        }

      } catch (error) {
        console.error(`Attempt ${i + 1} failed:`, error);
        if (i < maxRetries - 1) {
          const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw new Error("Failed to generate audio after multiple retries.");
        }
      }
    }
  };

  // --- Event Handlers ---
  
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLyrics(event.target.result);
      };
      reader.readAsText(file);
      setIsLyricsFileUploaded(true); // <--- Set file uploaded status here
      setInputError(false);
    }
  };

  const handleAudioUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('audio/')) {
      setHasRecording(true); // This variable now tracks any vocal input (upload or record)
      setInputError(false);
      console.log('Audio file uploaded successfully!');
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setTimeout(() => {
        setIsRecording(false);
        setHasRecording(true);
        setInputError(false);
        console.log('Recording saved!');
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
      console.log('Instrumental track uploaded successfully!');
    }
  };

  const handleContinueToStep2 = () => {
    if (!lyrics.trim() && !hasRecording) {
      setInputError(true);
    } else {
      setInputError(false);
      setStep(2);
    }
  }

  const togglePlayPause = () => {
    if (audioPlayerRef.current) {
      if (isPlaying) {
        audioPlayerRef.current.pause();
      } else {
        audioPlayerRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.onended = () => setIsPlaying(false);
      audioPlayerRef.current.onplay = () => setIsPlaying(true);
      audioPlayerRef.current.onpause = () => setIsPlaying(false);
    }
  }, [audioUrl]);


  const generateSong = async () => {
    setIsGenerating(true);
    setAudioUrl(null); // Reset previous audio

    const selectedVoice = voices.find(v => v.id === voiceOption);
    const voiceName = selectedVoice?.voiceName || 'Kore';
    const textToSynthesize = lyrics.trim() || "The melody begins now.";

    let finalAudioUrl = null;

    // 1. Voice Track Generation (using TTS structure)
    // NOTE: If API_KEY is empty, this call will fail, and a mock URL will be used.
    try {
        const audioResult = await generateAudioTrack(voiceName, textToSynthesize);
        if (audioResult) {
            finalAudioUrl = audioResult.audioUrl;
            setAudioUrl(finalAudioUrl);
            console.log("TTS Audio generated and prepared for playback.");
        }
    } catch (e) {
        console.error("Error during live voice generation:", e);
        // Fallback/Mock: Use a simple mock URL if API fails or key is missing
        finalAudioUrl = 'https://placehold.co/100x20/1B262C/BBE1FA?text=NoAudio+Fallback';
        setAudioUrl(finalAudioUrl);
    }

    // 2. Simulate Instrumental/Mastering (existing simulation)
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Finalizing the song structure
    setGeneratedSong({
      title: 'Quantum Lullaby',
      duration: '3:45',
      url: '#', // The actual audio is in audioUrl state
      timestamp: new Date().toISOString()
    });
    
    setIsGenerating(false);
    setStep(5);
  };

  const regenerateSong = async () => {
    setIsGenerating(true);
    
    // Simulate API call with feedback
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Re-run voice generation with feedback
    const selectedVoice = voices.find(v => v.id === voiceOption);
    const voiceName = selectedVoice?.voiceName || 'Kore';
    const textToSynthesize = feedback.trim() ? `${lyrics.trim()} (Rework based on feedback: ${feedback})` : lyrics.trim();
    
    try {
        const audioResult = await generateAudioTrack(voiceName, textToSynthesize);
        if (audioResult) {
            setAudioUrl(audioResult.audioUrl);
        }
    } catch (e) {
        console.error("Error during live voice regeneration:", e);
    }

    setGeneratedSong({
      ...generatedSong,
      timestamp: new Date().toISOString(),
      version: (generatedSong.version || 1) + 1
    });
    
    setIsGenerating(false);
    setFeedback('');
  };

  // Helper functions for button styling and content
  const getTextUploadButtonContent = () => {
    if (isLyricsFileUploaded && lyrics.length > 0) {
      return { 
        text: 'Lyrics File Uploaded', 
        icon: <Sparkles className="w-8 h-8 text-[#BBE1FA]" />,
        classes: 'bg-[#3282B8]/50 border-[#BBE1FA] text-[#BBE1FA] shadow-lg hover:shadow-2xl'
      };
    }
    return { 
      text: 'Upload Text File', 
      icon: <Upload className="w-8 h-8 text-[#3282B8]" />,
      classes: 'bg-[#1B262C]/50 hover:bg-[#1B262C] border-[#3282B8]/50 hover:border-[#3282B8] shadow-lg hover:shadow-2xl'
    };
  };

  const getAudioUploadButtonContent = () => {
    if (hasRecording && !isRecording) {
      return { 
        text: 'Vocal Track Uploaded', 
        icon: <Sparkles className="w-8 h-8 text-[#BBE1FA]" />,
        classes: 'bg-[#3282B8]/50 border-[#BBE1FA] text-[#BBE1FA] shadow-lg hover:shadow-2xl'
      };
    }
    return { 
      text: 'Upload Vocal Track', 
      icon: <Upload className="w-8 h-8 text-[#3282B8]" />,
      classes: 'bg-[#1B262C]/50 hover:bg-[#1B262C] border-[#3282B8]/50 hover:border-[#3282B8] shadow-lg hover:shadow-2xl'
    };
  };

  const getRecordButtonContent = () => {
    if (isRecording) {
      return {
        text: 'Recording...',
        icon: <Mic className="w-8 h-8 text-red-400" />,
        classes: 'bg-red-700/50 border-red-400 animate-pulse shadow-red-500/30'
      };
    }
    if (hasRecording) {
      return { 
        text: 'Recorded Vocal Track', 
        icon: <Mic className="w-8 h-8 text-[#BBE1FA]" />,
        classes: 'bg-[#3282B8]/50 border-[#BBE1FA] text-[#BBE1FA] shadow-lg hover:shadow-2xl'
      };
    }
    return {
      text: 'Record Singing',
      icon: <Mic className="w-8 h-8 text-[#3282B8]" />,
      classes: 'bg-[#1B262C]/50 hover:bg-[#1B262C] border-[#3282B8]/50 hover:border-[#3282B8] shadow-lg hover:shadow-2xl'
    };
  };
  
  const textUploadContent = getTextUploadButtonContent();
  const audioUploadContent = getAudioUploadButtonContent();
  const recordContent = getRecordButtonContent();

  return (
    <div className="min-h-screen bg-[#1B262C] text-[#BBE1FA] p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Music className="w-14 h-14 text-[#3282B8]" />
            <h1 className="text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[#BBE1FA] to-[#3282B8]">
              AI Song Creator Studio
            </h1>
          </div>
          <p className="text-[#BBE1FA]/70 text-xl font-light">Transform your creative input into professional audio tracks</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between mb-16 max-w-4xl mx-auto relative">
          {/* Progress Line */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-[#BBE1FA]/20 -translate-y-1/2 mx-4"></div>
          {['Lyrics', 'Voice', 'Instrumental', 'Generate', 'Refine'].map((label, idx) => {
            const stepNumber = idx + 1;
            const isComplete = step > stepNumber;
            const isActive = step === stepNumber;

            return (
              <div key={idx} className="flex flex-col items-center z-10">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 shadow-xl ${
                  isComplete ? 'bg-[#3282B8] text-[#BBE1FA]' : 
                  isActive ? 'bg-[#BBE1FA] text-[#1B262C] ring-4 ring-[#3282B8]' : 
                  'bg-[#1B262C] border-2 border-[#3282B8] text-[#BBE1FA]/50'
                }`}>
                  {isComplete ? '✓' : stepNumber}
                </div>
                <span className={`text-sm mt-3 font-medium transition-colors ${
                  isActive ? 'text-[#BBE1FA]' : 'text-[#BBE1FA]/70'
                }`}>{label}</span>
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="bg-[#BBE1FA]/5 backdrop-blur-md rounded-3xl p-10 shadow-[0_0_50px_rgba(50,130,184,0.3)] border border-[#3282B8]/30">
          
          {/* Step 1: Input Lyrics */}
          {step === 1 && (
            <div className="space-y-8">
              <h2 className="text-4xl font-extrabold flex items-center gap-3 text-[#BBE1FA]">
                <FileText className="w-10 h-10 text-[#3282B8]" />
                Step 1: Input Your Lyrics
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Upload Text File */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center gap-3 p-8 rounded-2xl transition-all border cursor-pointer ${textUploadContent.classes}`}
                >
                  {textUploadContent.icon}
                  <span className="font-semibold text-[#BBE1FA]">{textUploadContent.text}</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {/* Upload Audio */}
                <button
                  onClick={() => audioInputRef.current?.click()}
                  className={`flex flex-col items-center gap-3 p-8 rounded-2xl transition-all border cursor-pointer ${audioUploadContent.classes}`}
                >
                  {audioUploadContent.icon}
                  <span className="font-semibold text-[#BBE1FA]">{audioUploadContent.text}</span>
                </button>
                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioUpload}
                  className="hidden"
                />

                {/* Record Singing */}
                <button
                  onClick={toggleRecording}
                  className={`flex flex-col items-center gap-3 p-8 rounded-2xl transition-all border cursor-pointer ${recordContent.classes}`}
                >
                  {recordContent.icon}
                  <span className="font-semibold text-[#BBE1FA]">{recordContent.text}</span>
                </button>
              </div>
              
              {/* Lyrics Text Area */}
              <div>
                <label className="block mb-3 text-xl font-semibold text-[#BBE1FA]">Or type/paste your lyrics:</label>
                <textarea
                  value={lyrics}
                  onChange={(e) => {
                    setLyrics(e.target.value);
                    setInputError(false);
                    // Typing clears file upload status
                    if (isLyricsFileUploaded) {
                      setIsLyricsFileUploaded(false);
                    }
                  }}
                  placeholder="Enter your song lyrics here..."
                  className="w-full h-72 bg-[#1B262C]/80 border-2 border-[#3282B8]/50 rounded-xl p-6 text-[#BBE1FA] placeholder-[#3282B8] focus:border-[#3282B8] focus:outline-none resize-none shadow-inner"
                />
              </div>

              {/* Validation Message */}
              {inputError && (
                <div className="bg-red-500/20 text-red-300 p-4 rounded-xl text-center font-medium">
                  Please provide lyrics (by typing, uploading text, or recording/up/uploading audio) to continue.
                </div>
              )}

              {/* Continue Button */}
              <button
                onClick={handleContinueToStep2}
                disabled={!lyrics.trim() && !hasRecording}
                className="w-full py-5 bg-gradient-to-r from-[#3282B8] to-[#14A9FF] hover:from-[#14A9FF] hover:to-[#3282B8] disabled:from-gray-700 disabled:to-gray-800 rounded-xl font-bold text-xl text-white shadow-xl transition-all disabled:cursor-not-allowed cursor-pointer"
              >
                Continue to Voice Selection
              </button>
            </div>
          )}

          {/* Step 2: Voice Selection */}
          {step === 2 && (
            <div className="space-y-8">
              <h2 className="text-4xl font-extrabold flex items-center gap-3 text-[#BBE1FA]">
                <Mic className="w-10 h-10 text-[#3282B8]" />
                Step 2: Choose Your Voice
              </h2>
              
              <p className="text-[#BBE1FA]/70 text-lg">
                Select an AI voice to sing your lyrics. 
                <span className="text-red-400 font-semibold">NOTE: In a live app, this list would be fetched dynamically from the ElevenLabs API.</span>
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {voices.map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => setVoiceOption(voice.id)}
                    disabled={voice.id === 'original' && !hasRecording}
                    className={`p-6 rounded-2xl transition-all border-2 text-left shadow-lg cursor-pointer ${
                      voiceOption === voice.id
                        ? 'bg-[#3282B8]/40 border-[#BBE1FA] text-[#BBE1FA] ring-2 ring-[#BBE1FA]'
                        : 'bg-[#1B262C]/80 border-[#3282B8]/50 hover:bg-[#1B262C]'
                    } ${voice.id === 'original' && !hasRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="font-bold text-xl mb-1">{voice.name}</div>
                    <div className="text-[#BBE1FA]/70 text-sm">{voice.description}</div>
                  </button>
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-5 bg-[#1B262C]/50 hover:bg-[#1B262C] rounded-xl font-bold transition-all border border-[#3282B8]/50 text-[#BBE1FA] cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-5 bg-gradient-to-r from-[#3282B8] to-[#14A9FF] hover:from-[#14A9FF] hover:to-[#3282B8] rounded-xl font-bold text-xl text-white shadow-xl transition-all cursor-pointer"
                >
                  Continue to Instrumental
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Instrumental Options */}
          {step === 3 && (
            <div className="space-y-8">
              <h2 className="text-4xl font-extrabold flex items-center gap-3 text-[#BBE1FA]">
                <Music className="w-10 h-10 text-[#3282B8]" />
                Step 3: Instrumental Settings
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={() => setInstrumentalOption('generate')}
                  className={`p-8 rounded-2xl transition-all border-2 shadow-lg cursor-pointer ${
                    instrumentalOption === 'generate'
                      ? 'bg-[#3282B8]/40 border-[#BBE1FA] text-[#BBE1FA] ring-2 ring-[#BBE1FA]'
                      : 'bg-[#1B262C]/80 border-[#3282B8]/50 hover:bg-[#1B262C]'
                  }`}
                >
                  <Sparkles className="w-8 h-8 mb-3 text-[#3282B8]" />
                  <div className="font-bold text-xl mb-1 text-[#BBE1FA]">Generate Instrumental</div>
                  <div className="text-[#BBE1FA]/70 text-sm">Let AI create a custom backing track</div>
                </button>

                <button
                  onClick={() => {
                    setInstrumentalOption('upload');
                    instrumentalInputRef.current?.click();
                  }}
                  className={`p-8 rounded-2xl transition-all border-2 shadow-lg cursor-pointer ${
                    instrumentalOption === 'upload'
                      ? 'bg-[#3282B8]/40 border-[#BBE1FA] text-[#BBE1FA] ring-2 ring-[#BBE1FA]'
                      : 'bg-[#1B262C]/80 border-[#3282B8]/50 hover:bg-[#1B262C]'
                  }`}
                >
                  <Upload className="w-8 h-8 mb-3 text-[#3282B8]" />
                  <div className="font-bold text-xl mb-1 text-[#BBE1FA]">Upload Instrumental</div>
                  <div className="text-[#BBE1FA]/70 text-sm">Use your own pre-made track</div>
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
                <div className="space-y-6 bg-[#1B262C]/50 rounded-xl p-6 border border-[#3282B8]/50 shadow-inner">
                  <div>
                    <label className="block mb-3 text-xl font-semibold text-[#BBE1FA]">Genre</label>
                    <select
                      value={genre}
                      onChange={(e) => setGenre(e.target.value)}
                      className="w-full bg-[#1B262C] border-2 border-[#3282B8]/50 rounded-lg p-3 text-[#BBE1FA] focus:border-[#3282B8] focus:outline-none shadow-md"
                    >
                      {genres.map(g => (
                        <option key={g} value={g.toLowerCase()} className="bg-[#1B262C]">{g}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-3 text-xl font-semibold text-[#BBE1FA]">Mood</label>
                    <select
                      value={mood}
                      onChange={(e) => setMood(e.target.value)}
                      className="w-full bg-[#1B262C] border-2 border-[#3282B8]/50 rounded-lg p-3 text-[#BBE1FA] focus:border-[#3282B8] focus:outline-none shadow-md"
                    >
                      {moods.map(m => (
                        <option key={m} value={m.toLowerCase()} className="bg-[#1B262C]">{m}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-3 text-xl font-semibold text-[#BBE1FA]">Tempo: {tempo} BPM</label>
                    <input
                      type="range"
                      min="60"
                      max="180"
                      value={tempo}
                      onChange={(e) => setTempo(e.target.value)}
                      className="w-full h-3 bg-[#3282B8]/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#BBE1FA] [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(187,225,250,0.7)]"
                    />
                    <div className="flex justify-between text-sm text-[#BBE1FA]/70 mt-2">
                      <span>Slow (60)</span>
                      <span>Fast (180)</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-5 bg-[#1B262C]/50 hover:bg-[#1B262C] rounded-xl font-bold transition-all border border-[#3282B8]/50 text-[#BBE1FA] cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="flex-1 py-5 bg-gradient-to-r from-[#3282B8] to-[#14A9FF] hover:from-[#14A9FF] hover:to-[#3282B8] rounded-xl font-bold text-xl text-white shadow-xl transition-all cursor-pointer"
                >
                  Continue to Generate
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Generate */}
          {step === 4 && (
            <div className="space-y-8">
              <h2 className="text-4xl font-extrabold flex items-center gap-3 text-[#BBE1FA]">
                <Sparkles className="w-10 h-10 text-[#3282B8]" />
                Step 4: Review & Generate
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#1B262C]/50 rounded-xl p-6 space-y-4 border border-[#3282B8]/50 shadow-lg">
                  <h3 className="text-2xl font-bold text-[#3282B8]">Configuration</h3>
                  <div className="space-y-2 text-[#BBE1FA]/90 text-lg">
                    <div className="flex justify-between items-center border-b border-[#3282B8]/30 pb-2">
                      <strong>Voice:</strong> <span>{voices.find(v => v.id === voiceOption)?.name}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-[#3282B8]/30 pb-2">
                      <strong>Instrumental:</strong> <span>{instrumentalOption === 'generate' ? 'AI Generated' : 'Custom Upload'}</span>
                    </div>
                    {instrumentalOption === 'generate' && (
                      <>
                        <div className="flex justify-between items-center border-b border-[#3282B8]/30 pb-2">
                          <strong>Genre:</strong> <span>{genre}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-[#3282B8]/30 pb-2">
                          <strong>Mood:</strong> <span>{mood}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <strong>Tempo:</strong> <span>{tempo} BPM</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-[#1B262C]/50 rounded-xl p-6 border border-[#3282B8]/50 shadow-lg">
                  <h3 className="text-2xl font-bold text-[#3282B8] mb-4">Lyrics Preview</h3>
                  <div className="text-[#BBE1FA]/70 text-base overflow-y-auto max-h-52 bg-[#1B262C]/50 p-3 rounded-lg border border-[#3282B8]/30">
                    {lyrics || (hasRecording ? 'Vocal recording will be transcribed and processed.' : 'No lyrics or audio provided.')}
                  </div>
                </div>
              </div>

              {isGenerating ? (
                <div className="text-center py-16 bg-[#1B262C]/50 rounded-xl border border-[#3282B8]/50">
                  <div className="inline-block animate-spin rounded-full h-20 w-20 border-6 border-[#3282B8] border-t-[#BBE1FA] mb-6"></div>
                  <p className="text-2xl font-semibold text-[#BBE1FA]">Composing your masterpiece...</p>
                  <p className="text-[#BBE1FA]/70 mt-2">Synthesizing vocals and generating instrumental track. Please wait.</p>
                </div>
              ) : (
                <div className="flex gap-4">
                  <button
                    onClick={() => setStep(3)}
                    className="flex-1 py-5 bg-[#1B262C]/50 hover:bg-[#1B262C] rounded-xl font-bold transition-all border border-[#3282B8]/50 text-[#BBE1FA] cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={generateSong}
                    className="flex-1 py-5 bg-gradient-to-r from-[#3282B8] to-[#14A9FF] hover:from-[#14A9FF] hover:to-[#3282B8] rounded-xl font-bold text-xl text-white shadow-xl transition-all flex items-center justify-center gap-3 cursor-pointer"
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
            <div className="space-y-8">
              <h2 className="text-4xl font-extrabold flex items-center gap-3 text-[#BBE1FA]">
                <Download className="w-10 h-10 text-[#3282B8]" />
                Step 5: Your Generated Song
              </h2>

              <div className="bg-gradient-to-r from-[#3282B8]/20 to-[#14A9FF]/20 rounded-xl p-8 border-2 border-[#3282B8] shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-3xl font-bold text-[#BBE1FA]">{generatedSong.title}</h3>
                    <p className="text-[#BBE1FA]/70">Duration: {generatedSong.duration}</p>
                    {generatedSong.version && <p className="text-sm text-[#3282B8]">Version {generatedSong.version}</p>}
                  </div>

                  {/* Audio Player and Controls */}
                  <div className="flex items-center gap-4">
                    <button 
                        onClick={togglePlayPause} 
                        disabled={!audioUrl || audioUrl === 'error'}
                        className="w-16 h-16 bg-[#3282B8] hover:bg-[#14A9FF] rounded-full flex items-center justify-center transition-all shadow-xl disabled:bg-gray-600 cursor-pointer">
                      {isPlaying ? <Pause className="w-8 h-8 fill-white text-white" /> : <Play className="w-8 h-8 fill-white text-white" />}
                    </button>
                    <audio ref={audioPlayerRef} src={audioUrl} className="hidden" />
                  </div>
                </div>

                {audioUrl === 'error' && (
                    <p className="text-red-400 text-center mb-4 font-semibold">
                        Error: Failed to generate audio track. Please check the API key and ensure the prompt is valid.
                    </p>
                )}
                
                {/* Visual Progress Bar (decorative/simulated) */}
                <div className="bg-[#1B262C] rounded-full h-3 mb-8 shadow-inner">
                  <div className="bg-gradient-to-r from-[#BBE1FA] to-[#3282B8] h-3 rounded-full w-2/3 transition-all duration-1000"></div>
                </div>

                <button className="w-full py-5 bg-gradient-to-r from-[#3282B8] to-[#14A9FF] hover:from-[#14A9FF] hover:to-[#3282B8] rounded-xl font-bold text-xl text-white shadow-xl transition-all flex items-center justify-center gap-3 cursor-pointer">
                  <Download className="w-6 h-6" />
                  Download Song (WAV/MP3)
                </button>
              </div>

              <div className="bg-[#1B262C]/50 rounded-xl p-6 space-y-4 border border-[#3282B8]/50 shadow-lg">
                <h3 className="text-2xl font-bold text-[#3282B8]">Improve Your Song</h3>
                <p className="text-[#BBE1FA]/70">Not satisfied? Provide textual or voice feedback to regenerate with improvements.</p>

                <div className="flex gap-4 items-end">
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Describe what you'd like to change (e.g., 'Make the beat heavier', 'Change the singing style to soft', 'Increase tempo slightly')..."
                    className="flex-1 bg-[#1B262C]/80 border-2 border-[#3282B8]/50 rounded-xl p-4 text-[#BBE1FA] placeholder-[#3282B8]/70 focus:border-[#3282B8] focus:outline-none resize-none h-36 shadow-inner"
                  />
                  <button
                    onClick={toggleFeedbackRecording}
                    className={`h-36 px-6 rounded-xl transition-all border-2 flex items-center justify-center cursor-pointer ${
                      isRecordingFeedback 
                        ? 'bg-red-700/50 border-red-400 animate-pulse text-red-300' 
                        : 'bg-[#1B262C]/80 hover:bg-[#1B262C] border-[#3282B8]/50 text-[#3282B8] hover:border-[#3282B8]'
                    }`}
                  >
                    <Mic className="w-8 h-8" />
                  </button>
                </div>

                <button
                  onClick={regenerateSong}
                  disabled={!feedback.trim() || isGenerating}
                  className="w-full py-5 bg-gradient-to-r from-[#3282B8] to-[#BBE1FA] hover:from-[#BBE1FA] hover:to-[#3282B8] disabled:from-gray-700 disabled:to-gray-800 rounded-xl font-bold text-xl text-[#1B262C] shadow-xl transition-all flex items-center justify-center gap-3 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#1B262C] border-t-transparent"></div>
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-6 h-6" />
                      Regenerate with Feedback
                    </>
                  )}
                </button>
              </div>

              <button
                onClick={() => {
                  // Reset all states for a new creation
                  setStep(1);
                  setLyrics('');
                  setGeneratedSong(null);
                  setFeedback('');
                  setHasRecording(false);
                  setIsLyricsFileUploaded(false); // Reset new state
                  setInputError(false);
                  setAudioUrl(null);
                  setIsPlaying(false);
                }}
                className="w-full py-5 bg-[#1B262C]/50 hover:bg-[#1B262C] rounded-xl font-bold transition-all border border-[#3282B8]/50 text-[#BBE1FA] text-lg cursor-pointer"
              >
                Start Over / Create New Song
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-[#BBE1FA]/50 text-sm">
          <p>Powered by Advanced Generative AI Models • Studio Concept v2.2</p>
        </div>
      </div>
    </div>
  );
}
