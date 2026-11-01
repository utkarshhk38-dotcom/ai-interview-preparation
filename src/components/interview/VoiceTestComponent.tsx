import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import VoiceRecorder from "./VoiceRecorder";
import VocabularyAnalysis from "./VocabularyAnalysis";
import { useToast } from "@/hooks/use-toast";
import { getApiUrl } from "@/lib/api";

const VoiceTestComponent = () => {
  const [transcription, setTranscription] = useState("");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleTranscriptionComplete = (text: string, blob: Blob) => {
    setTranscription(text);
    setAudioBlob(blob);
    
    toast({
      title: "Transcription Complete",
      description: `Transcribed ${text.split(' ').length} words`,
    });
  };

  const analyzeVocabulary = async () => {
    if (!transcription.trim()) {
      toast({
        title: "No transcription available",
        description: "Please record some speech first.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(getApiUrl('/api/interview/analyze-voice'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: 'test-session',
          transcription,
          questionText: 'Test question for vocabulary analysis',
          questionType: 'communication',
          difficulty: 'intermediate',
          expectedVocabulary: ['professional', 'experience', 'skills', 'achievement', 'challenge']
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setAnalysis(data.analysis);
        toast({
          title: "Analysis Complete",
          description: `Overall score: ${data.overall_score}%`,
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze vocabulary",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetTest = () => {
    setTranscription("");
    setAudioBlob(null);
    setAnalysis(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Voice-to-Text & Vocabulary Analysis Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Voice Recorder */}
          <div>
            <h3 className="text-lg font-medium mb-4">Step 1: Record Your Voice</h3>
            <VoiceRecorder
              onTranscriptionComplete={handleTranscriptionComplete}
              maxDuration={120} // 2 minutes for testing
            />
          </div>

          {/* Transcription Display */}
          {transcription && (
            <div>
              <h3 className="text-lg font-medium mb-4">Step 2: Review Transcription</h3>
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <p className="text-sm font-medium mb-2">Transcribed Text:</p>
                  <p className="italic">{transcription}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Word count: {transcription.split(' ').length}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Analysis Button */}
          {transcription && !analysis && (
            <div>
              <h3 className="text-lg font-medium mb-4">Step 3: Analyze Vocabulary</h3>
              <Button 
                onClick={analyzeVocabulary} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                    Analyzing...
                  </>
                ) : (
                  'Analyze Vocabulary & Communication'
                )}
              </Button>
            </div>
          )}

          {/* Analysis Results */}
          {analysis && (
            <div>
              <h3 className="text-lg font-medium mb-4">Step 4: Review Analysis</h3>
              <VocabularyAnalysis analysis={analysis} />
            </div>
          )}

          {/* Reset Button */}
          {(transcription || analysis) && (
            <div className="pt-4 border-t">
              <Button onClick={resetTest} variant="outline" className="w-full">
                Start New Test
              </Button>
            </div>
          )}

          {/* Instructions */}
          <Card className="border-primary/20">
            <CardContent className="p-4">
              <h4 className="font-medium text-primary mb-2">Test Instructions:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Click "Start Recording" and speak clearly for 30-60 seconds</li>
                <li>• Try using professional vocabulary and complete sentences</li>
                <li>• The AI will analyze your vocabulary, grammar, and communication skills</li>
                <li>• Review the detailed feedback to improve your interview performance</li>
              </ul>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default VoiceTestComponent;