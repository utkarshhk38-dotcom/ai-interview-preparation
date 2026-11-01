import { useState } from "react";
import { Button } from "@/components/ui/button";
import VoiceTestComponent from "@/components/interview/VoiceTestComponent";
import SimpleVoiceTest from "@/components/interview/SimpleVoiceTest";

const VoiceTest = () => {
  const [testMode, setTestMode] = useState<'simple' | 'full'>('simple');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Voice-to-Text Testing
          </h1>
          <p className="text-muted-foreground mb-6">
            Test voice recognition and speech-to-text functionality
          </p>
          
          {/* Test Mode Toggle */}
          <div className="flex gap-3 justify-center mb-8">
            <Button
              onClick={() => setTestMode('simple')}
              variant={testMode === 'simple' ? 'default' : 'outline'}
            >
              Simple Voice Test
            </Button>
            <Button
              onClick={() => setTestMode('full')}
              variant={testMode === 'full' ? 'default' : 'outline'}
            >
              Full Recording + Analysis
            </Button>
          </div>
        </div>
        
        {testMode === 'simple' ? (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold mb-2">Real-time Speech Recognition</h2>
              <p className="text-muted-foreground">
                Uses Web Speech API for immediate voice-to-text conversion
              </p>
            </div>
            <SimpleVoiceTest />
          </div>
        ) : (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold mb-2">Recording + AI Analysis</h2>
              <p className="text-muted-foreground">
                Records audio, transcribes with Whisper API, and analyzes vocabulary
              </p>
            </div>
            <VoiceTestComponent />
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceTest;