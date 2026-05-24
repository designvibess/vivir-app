import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import type {
  PronunciationScores,
  STTOptions,
  STTProvider,
  STTResult,
  WordScore,
} from "./types";

export class AzureSpeechProvider implements STTProvider {
  private subscriptionKey: string;
  private region: string;

  constructor() {
    this.subscriptionKey = process.env.AZURE_SPEECH_KEY!;
    this.region = process.env.AZURE_SPEECH_REGION!;
  }

  async transcribe(audioBuffer: Buffer, options: STTOptions = {}): Promise<STTResult> {
    const locale = options.locale ?? "es-ES";
    const enablePronunciation = options.enablePronunciation ?? true;

    const start = Date.now();

    const speechConfig = sdk.SpeechConfig.fromSubscription(
      this.subscriptionKey,
      this.region
    );
    speechConfig.speechRecognitionLanguage = locale;

    // AudioConfig from in-memory buffer (WAV format expected)
    const audioConfig = sdk.AudioConfig.fromWavFileInput(
      { buffer: audioBuffer, name: "audio.wav" } as unknown as File
    );

    let pronunciationConfig: sdk.PronunciationAssessmentConfig | null = null;
    if (enablePronunciation) {
      pronunciationConfig = new sdk.PronunciationAssessmentConfig(
        options.referenceText ?? "",
        sdk.PronunciationAssessmentGradingSystem.HundredMark,
        sdk.PronunciationAssessmentGranularity.Word,
        true
      );
    }

    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
    if (pronunciationConfig) {
      pronunciationConfig.applyTo(recognizer);
    }

    return new Promise<STTResult>((resolve, reject) => {
      recognizer.recognizeOnceAsync(
        (result) => {
          recognizer.close();

          if (result.reason === sdk.ResultReason.RecognizedSpeech) {
            let pronunciationScores: PronunciationScores | null = null;

            if (enablePronunciation && result.properties) {
              const raw = result.properties.getProperty(
                sdk.PropertyId.SpeechServiceResponse_JsonResult
              );
              try {
                pronunciationScores = parsePronunciationJson(raw);
              } catch {
                // Non-blocking — assessment data missing
              }
            }

            resolve({
              transcript: result.text,
              confidence: 1.0, // Azure doesn't expose per-result confidence, pronunciation score proxies it
              pronunciationScores,
              durationMs: Date.now() - start,
              provider: "azure",
            });
          } else if (result.reason === sdk.ResultReason.NoMatch) {
            resolve({
              transcript: "",
              confidence: 0,
              pronunciationScores: null,
              durationMs: Date.now() - start,
              provider: "azure",
            });
          } else {
            reject(new Error(`Azure STT failed: ${sdk.ResultReason[result.reason]}`));
          }
        },
        (err) => {
          recognizer.close();
          reject(new Error(`Azure STT error: ${err}`));
        }
      );
    });
  }

  async healthCheck(): Promise<{ ok: boolean; latencyMs: number }> {
    const start = Date.now();
    // Ping the Azure token endpoint to verify credentials
    const url = `https://${this.region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Ocp-Apim-Subscription-Key": this.subscriptionKey },
    });
    if (!res.ok) {
      throw new Error(`Azure Speech health check failed: ${res.status}`);
    }
    return { ok: true, latencyMs: Date.now() - start };
  }
}

function parsePronunciationJson(raw: string): PronunciationScores | null {
  if (!raw) return null;
  const json = JSON.parse(raw);
  const nBest = json?.NBest?.[0];
  if (!nBest) return null;

  const pa = nBest.PronunciationAssessment;
  const words: WordScore[] = (nBest.Words ?? []).map((w: Record<string, unknown>) => ({
    word: w.Word as string,
    accuracyScore: (w.PronunciationAssessment as Record<string, number>)?.AccuracyScore ?? 0,
    errorType: ((w.PronunciationAssessment as Record<string, string>)?.ErrorType ?? "None") as WordScore["errorType"],
  }));

  return {
    accuracyScore: pa?.AccuracyScore ?? 0,
    fluencyScore: pa?.FluencyScore ?? 0,
    completenessScore: pa?.CompletenessScore ?? 0,
    pronunciationScore: pa?.PronScore ?? 0,
    words,
  };
}
