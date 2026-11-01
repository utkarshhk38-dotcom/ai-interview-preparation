import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mic, Square, Volume2 } from "lucide-react";

const SimpleVoiceTest = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast({
        title: "Not supported",
        description: "Speech recognition is not supported in this browser. Try Chrome or Edge.",
        variant: "destructive",
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    let finalTranscript = '';

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript("");
      setInterimTranscript("");
      toast({
        title: "Listening...",
        description: "Speak now! I'm listening to your voice.",
      });
    };

    recognition.onresult = (event) => {
      let interim = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPart + ' ';
          setTranscript(finalTranscript);
        } else {
          interim += transcriptPart;
        }
      }
      
      setInterimTranscript(interim);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
      
      if (finalTranscript.trim()) {
        toast({
          title: "Speech captured!",
          description: `Transcribed ${finalTranscript.trim().split(' ').length} words`,
        });
      } else {
        toast({
          title: "No speech detected",
          description: "Please try again and speak more clearly.",
          variant: "destructive",
        });
      }
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      setInterimTranscript("");
      
      let errorMessage = "Speech recognition error occurred.";
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = "No speech was detected. Please try speaking louder.";
          break;
        case 'audio-capture':
          errorMessage = "No microphone was found. Please check your microphone.";
          break;
        case 'not-allowed':
          errorMessage = "Microphone permission was denied. Please allow microphone access.";
          break;
        case 'network':
          errorMessage = "Network error occurred. Please check your internet connection.";
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }
      
      toast({
        title: "Recognition failed",
        description: errorMessage,
        variant: "destructive",
      });
    };

    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const clearTranscript = () => {
    setTranscript("");
    setInterimTranscript("");
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-primary" />
            Simple Voice Recognition Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Controls */}
          <div className="flex gap-3">
            {!isListening ? (
              <Button
                onClick={startListening}
                variant="hero"
                size="lg"
                className="flex-1"
              >
                <Mic className="w-5 h-5 mr-2" />
                Start Listening
              </Button>
            ) : (
              <Button
                onClick={stopListening}
                variant="destructive"
                size="lg"
                className="flex-1"
              >
                <Square className="w-5 h-5 mr-2" />
                Stop Listening
              </Button>
            )}
            
            <Button
              onClick={clearTranscript}
              variant="outline"
              size="lg"
              disabled={isListening}
            >
              Clear
            </Button>
          </div>

          {/* Status */}
          {isListening && (
            <div className="flex items-center gap-2 text-primary">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium">Listening... Speak now!</span>
            </div>
          )}

          {/* Interim Results */}
          {interimTranscript && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <p className="text-sm text-blue-600 font-medium mb-1">Currently hearing:</p>
                <p className="text-blue-800 italic">{interimTranscript}</p>
              </CardContent>
            </Card>
          )}

          {/* Final Transcript */}
          {transcript && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <p className="text-sm text-green-600 font-medium mb-2">Final Transcript:</p>
                <p className="text-green-800">{transcript}</p>
                <p className="text-xs text-green-600 mt-2">
                  Word count: {transcript.trim().split(' ').length}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card className="border-primary/20">
            <CardContent className="p-4">
              <h4 className="font-medium text-primary mb-2">Instructions:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Click "Start Listening" and speak clearly</li>
                <li>• You'll see interim results in blue as you speak</li>
                <li>• Final results appear in green when you pause</li>
                <li>• Click "Stop Listening" when done</li>
                <li>• Make sure your microphone is working and permissions are granted</li>
              </ul>
            </CardContent>
          </Card>

          {/* Browser Support Info */}
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">Browser Support:</h4>
              <div className="text-sm text-muted-foreground">
                <p>✅ Chrome: Full support</p>
                <p>✅ Edge: Full support</p>
                <p>⚠️ Firefox: Limited support</p>
                <p>❌ Safari: Not supported</p>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleVoiceTest;