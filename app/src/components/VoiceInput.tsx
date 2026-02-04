/**
 * VoiceInput.tsx -- Voice Input Component for Prompt & Smell
 *
 * This component should be added to the /create page next to or as an
 * alternative to the text PromptInput component. It provides in-browser
 * voice recognition using the Web Speech API, allowing users to describe
 * scents by speaking instead of typing.
 *
 * Usage:
 *   <VoiceInput onSubmit={(text) => handleGenerate(text)} isLoading={isGenerating} />
 *
 * Place it alongside PromptInput on the create page, for example:
 *   <div className="flex gap-4 items-start">
 *     <PromptInput onSubmit={handleSubmit} isLoading={isLoading} />
 *     <VoiceInput onSubmit={handleSubmit} isLoading={isLoading} />
 *   </div>
 *
 * Or as a toggle between text and voice input modes.
 */

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Loader2, X } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VoiceInputProps {
  onSubmit: (text: string) => void;
  isLoading: boolean;
  className?: string;
}

type VoiceState = "idle" | "listening" | "processing" | "unsupported";

// Extend the Window interface for the Web Speech API, which does not have
// complete TypeScript definitions in all environments.
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  onspeechstart: (() => void) | null;
  onspeechend: (() => void) | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === "undefined") return null;

  const win = window as unknown as Record<string, unknown>;

  const SpeechRecognition =
    (win.SpeechRecognition as new () => SpeechRecognitionInstance) ||
    (win.webkitSpeechRecognition as new () => SpeechRecognitionInstance) ||
    null;

  return SpeechRecognition;
}

// ---------------------------------------------------------------------------
// Waveform Visualization
// ---------------------------------------------------------------------------

function Waveform({ isActive }: { isActive: boolean }) {
  const bars = 12;
  return (
    <div className="flex items-center justify-center gap-[2px] h-6">
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-red-400"
          animate={
            isActive
              ? {
                  height: [4, 12 + Math.random() * 12, 4],
                }
              : { height: 4 }
          }
          transition={
            isActive
              ? {
                  duration: 0.4 + Math.random() * 0.3,
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: i * 0.05,
                }
              : { duration: 0.2 }
          }
          style={{ minHeight: 4 }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// VoiceInput Component
// ---------------------------------------------------------------------------

export default function VoiceInput({
  onSubmit,
  isLoading,
  className = "",
}: VoiceInputProps) {
  const [state, setState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const finalTranscriptRef = useRef("");

  // Check browser support on mount
  useEffect(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      setState("unsupported");
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      setState("unsupported");
      return;
    }

    setErrorMessage("");
    setTranscript("");
    setInterimTranscript("");
    finalTranscriptRef.current = "";

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setState("listening");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) {
        finalTranscriptRef.current += final;
        setTranscript(finalTranscriptRef.current);
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "no-speech") {
        setErrorMessage("No speech detected. Please try again.");
      } else if (event.error === "audio-capture") {
        setErrorMessage("No microphone found. Please check your audio settings.");
      } else if (event.error === "not-allowed") {
        setErrorMessage(
          "Microphone access denied. Please allow microphone access in your browser settings."
        );
      } else {
        setErrorMessage(`Speech recognition error: ${event.error}`);
      }
      setState("idle");
    };

    recognition.onend = () => {
      // If we have a transcript, submit it
      const fullTranscript = finalTranscriptRef.current.trim();
      if (fullTranscript && state === "listening") {
        setState("processing");
        setTranscript(fullTranscript);
        setInterimTranscript("");
        onSubmit(fullTranscript);
        setState("idle");
      } else if (!fullTranscript) {
        setState("idle");
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (err) {
      setErrorMessage("Could not start speech recognition. Please try again.");
      setState("idle");
    }
  }, [onSubmit, state]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const cancelListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setState("idle");
    setTranscript("");
    setInterimTranscript("");
    finalTranscriptRef.current = "";
  }, []);

  const handleClick = () => {
    if (isLoading) return;

    if (state === "listening") {
      stopListening();
    } else if (state === "idle") {
      startListening();
    }
  };

  // -----------------------------------------------------------------------
  // Render: Unsupported Browser
  // -----------------------------------------------------------------------
  if (state === "unsupported") {
    return (
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl
          bg-surface-800/30 border border-surface-500/20 text-gray-500 text-sm
          ${className}`}
      >
        <MicOff className="w-5 h-5 flex-shrink-0" />
        <span>
          Voice input is not supported in this browser. Try Chrome, Edge, or Safari.
        </span>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Render: Main Component
  // -----------------------------------------------------------------------
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Microphone Button */}
      <div className="flex items-center gap-4">
        <div className="relative">
          {/* Pulsing ring when listening */}
          <AnimatePresence>
            {state === "listening" && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-red-400"
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.8, 0, 0.8],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            )}
          </AnimatePresence>

          {/* Second pulse ring (offset) */}
          <AnimatePresence>
            {state === "listening" && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-red-400/50"
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{
                  scale: [1, 1.8, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.3,
                }}
              />
            )}
          </AnimatePresence>

          {/* Button */}
          <motion.button
            type="button"
            onClick={handleClick}
            disabled={isLoading}
            className={`
              relative z-10 w-14 h-14 rounded-full flex items-center justify-center
              transition-all duration-300 focus:outline-none focus:ring-2
              focus:ring-primary-400/30
              ${
                state === "listening"
                  ? "bg-red-500/20 border-2 border-red-400 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                  : isLoading
                  ? "bg-surface-700/50 border border-surface-500/30 text-gray-500 cursor-not-allowed"
                  : "bg-surface-800/50 border border-surface-500/30 text-gray-300 hover:border-primary-400/50 hover:text-primary-300 hover:bg-surface-700/50"
              }
            `}
            whileHover={state !== "listening" && !isLoading ? { scale: 1.05 } : {}}
            whileTap={!isLoading ? { scale: 0.95 } : {}}
          >
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : state === "listening" ? (
              <Mic className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </motion.button>
        </div>

        {/* Status text and waveform */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {state === "idle" && !transcript && (
              <motion.p
                key="idle"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-sm text-gray-500"
              >
                Click the microphone and describe your scent
              </motion.p>
            )}

            {state === "listening" && (
              <motion.div
                key="listening"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-400 font-medium">Listening...</span>
                  <Waveform isActive={true} />
                </div>
              </motion.div>
            )}

            {isLoading && (
              <motion.p
                key="processing"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-sm text-primary-300"
              >
                Composing your scent...
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Cancel button when listening */}
        <AnimatePresence>
          {state === "listening" && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              type="button"
              onClick={cancelListening}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-300
                hover:bg-surface-700/50 transition-colors"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Live Transcription */}
      <AnimatePresence>
        {(transcript || interimTranscript) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className="px-4 py-3 rounded-xl bg-surface-800/30 border border-surface-500/20
                text-sm text-gray-300"
            >
              {transcript && <span>{transcript}</span>}
              {interimTranscript && (
                <span className="text-gray-500 italic">{interimTranscript}</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20
              text-sm text-red-400"
          >
            {errorMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
