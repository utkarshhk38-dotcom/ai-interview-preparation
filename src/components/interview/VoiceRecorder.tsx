import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  Mic, 
  MicOff, 
  Square, 
  Play, 
  Pause,
  RotateCcw,
  Volume2,
  AlertCircle
} from "lucide-react";
import { getApiUrl } from "@/lib/api";

interface VoiceRecorderProps {
  onTranscriptionComplete: (transcription: string, audioBlob: Blob) => void;
  disabled?: boolean;
  maxDuration?: number; // in seconds
}

const VoiceRecorder = ({ 
  onTranscriptionComplete, 
  disabled = false, 
  maxDuration = 300 // 5 minutes default
}: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcription, setTranscription] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const { toast } = useToast();

  // Check microphone permission on mount
  useEffect(() => {
    checkMicrophonePermission();
    return () => {
      cleanup();
    };
  }, []);

  // Timer effect
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= maxDuration) {
            stopRecording();
            toast({
              title: "Recording stopped",
              description: `Maximum duration of ${maxDuration / 60} minutes reached.`,
            });
          }
          return newTime;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, maxDuration]);

  const checkMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      setHasPermission(false);
      console.error('Microphone permission denied:', error);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });
      
      streamRef.current = stream;
      chunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        console.log('Recording stopped. Audio blob size:', blob.size, 'bytes');
        setAudioBlob(blob);
        
        // Only transcribe if we have actual audio data
        if (blob.size > 1000) { // At least 1KB of audio data
          transcribeAudio(blob);
        } else {
          toast({
            title: "No audio detected",
            description: "Please try recording again and speak louder.",
            variant: "destructive",
          });
          setIsTranscribing(false);
        }
        cleanup();
      };
      
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setRecordingTime(0);
      setTranscription("");
      setAudioBlob(null);
      
      toast({
        title: "Recording started",
        description: "Speak clearly into your microphone",
      });
    } catch (error: any) {
      console.error('Error starting recording:', error);
      
      let errorMessage = "Could not access microphone. Please check permissions.";
      if (error.name === 'NotAllowedError') {
        errorMessage = "Microphone permission denied. Please allow microphone access and try again.";
      } else if (error.name === 'NotFoundError') {
        errorMessage = "No microphone found. Please connect a microphone and try again.";
      } else if (error.name === 'NotReadableError') {
        errorMessage = "Microphone is being used by another application. Please close other apps and try again.";
      }
      
      toast({
        title: "Recording failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const transcribeAudio = async (blob: Blob) => {
    setIsTranscribing(true);
    
    try {
      const text = await performSpeechRecognition(blob);
      
      if (text && text.trim().length > 0) {
        setTranscription(text);
        onTranscriptionComplete(text, blob);
        
        toast({
          title: "Transcription complete",
          description: "Your speech has been converted to text successfully.",
        });
      } else {
        toast({
          title: "No speech detected",
          description: "Please try recording again and speak clearly.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        title: "Transcription failed",
        description: "Please try recording again. Make sure you're speaking clearly and your microphone is working.",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  // Use Web Speech API for real-time transcription during recording
  const performSpeechRecognition = async (blob: Blob): Promise<string> => {
    // First try to use the recorded audio with Whisper API
    try {
      const whisperResult = await transcribeWithWhisper(blob);
      if (whisperResult && whisperResult.trim().length > 0) {
        return whisperResult;
      }
    } catch (error) {
      console.log('Whisper API failed, trying Web Speech API:', error);
    }

    // Fallback to Web Speech API
    return await useWebSpeechAPI();
  };

  // Transcribe using OpenAI Whisper API
  const transcribeWithWhisper = async (blob: Blob): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');

      const response = await fetch(getApiUrl('/api/transcribe'), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.text || '';
    } catch (error) {
      console.error('Whisper transcription error:', error);
      throw error;
    }
  };

  // Use Web Speech API for real-time recognition
  const useWebSpeechAPI = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        reject(new Error('Speech recognition not supported in this browser'));
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      let finalTranscript = '';
      let isListening = false;

      recognition.onstart = () => {
        isListening = true;
        console.log('Speech recognition started');
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        console.log('Interim:', interimTranscript);
        console.log('Final so far:', finalTranscript);
      };

      recognition.onend = () => {
        isListening = false;
        console.log('Speech recognition ended. Final transcript:', finalTranscript);
        const result = finalTranscript.trim();
        if (result.length > 0) {
          resolve(result);
        } else {
          resolve('Please speak more clearly. Try recording again.');
        }
      };

      recognition.onerror = (event) => {
        isListening = false;
        console.error('Speech recognition error:', event.error);
        
        if (event.error === 'no-speech') {
          resolve('No speech was detected. Please try speaking louder and more clearly.');
        } else if (event.error === 'audio-capture') {
          reject(new Error('Microphone not accessible. Please check your microphone permissions.'));
        } else if (event.error === 'not-allowed') {
          reject(new Error('Microphone permission denied. Please allow microphone access.'));
        } else {
          reject(new Error(`Speech recognition error: ${event.error}`));
        }
      };

      // Start recognition
      try {
        recognition.start();
        
        // Auto-stop after 10 seconds to prevent hanging
        setTimeout(() => {
          if (isListening) {
            recognition.stop();
          }
        }, 10000);
      } catch (error) {
        reject(new Error('Failed to start speech recognition'));
      }
    });
  };

  const playRecording = () => {
    if (audioBlob && !isPlaying) {
      const audioUrl = URL.createObjectURL(audioBlob);
      audioRef.current = new Audio(audioUrl);
      
      audioRef.current.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pausePlayback = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const resetRecording = () => {
    setAudioBlob(null);
    setTranscription("");
    setRecordingTime(0);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (hasPermission === false) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-destructive">
            <AlertCircle className="w-5 h-5" />
            <div>
              <h4 className="font-medium">Microphone Access Required</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Please allow microphone access to use voice recording for vocabulary assessment.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={checkMicrophonePermission}
              >
                Check Permission
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground">Voice Recording</h4>
            <div className="text-sm text-muted-foreground">
              {formatTime(recordingTime)} / {formatTime(maxDuration)}
            </div>
          </div>

          {/* Recording Controls */}
          <div className="flex items-center gap-3">
            {!isRecording && !audioBlob && (
              <Button
                onClick={startRecording}
                disabled={disabled || !hasPermission}
                variant="hero"
                size="lg"
                className="flex-1"
              >
                <Mic className="w-5 h-5 mr-2" />
                Start Recording
              </Button>
            )}

            {isRecording && (
              <Button
                onClick={stopRecording}
                variant="destructive"
                size="lg"
                className="flex-1"
              >
                <Square className="w-5 h-5 mr-2" />
                Stop Recording
              </Button>
            )}

            {audioBlob && !isRecording && (
              <div className="flex gap-2 flex-1">
                <Button
                  onClick={isPlaying ? pausePlayback : playRecording}
                  variant="outline"
                  size="lg"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 mr-2" />
                  ) : (
                    <Play className="w-5 h-5 mr-2" />
                  )}
                  {isPlaying ? 'Pause' : 'Play'}
                </Button>
                
                <Button
                  onClick={resetRecording}
                  variant="outline"
                  size="lg"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Re-record
                </Button>
              </div>
            )}
          </div>

          {/* Recording Indicator */}
          {isRecording && (
            <div className="flex items-center gap-2 text-destructive">
              <div className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
              <span className="text-sm font-medium">Recording in progress...</span>
              <Volume2 className="w-4 h-4 ml-auto" />
            </div>
          )}

          {/* Transcription */}
          {isTranscribing && (
            <div className="flex items-center gap-2 text-primary">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Transcribing audio...</span>
            </div>
          )}

          {transcription && (
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-foreground">Transcription:</h5>
              <div className="p-3 bg-muted rounded-lg text-sm">
                {transcription}
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Speak clearly and at a normal pace</p>
            <p>• Ensure you're in a quiet environment</p>
            <p>• The AI will analyze your vocabulary, pronunciation, and fluency</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceRecorder;