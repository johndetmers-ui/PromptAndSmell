"use client";

import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Camera,
  X,
  Loader2,
  ImageIcon,
  AlertCircle,
  RotateCcw,
  Eye,
  Wind,
} from "lucide-react";
import { OSCFormula } from "@/lib/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ImageUploadProps {
  onFormulaGenerated: (
    formula: OSCFormula,
    metadata: { scene_description: string; scent_narrative: string }
  ) => void;
  isLoading?: boolean;
  className?: string;
}

type UploadState = "idle" | "preview" | "analyzing" | "complete" | "error";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// ---------------------------------------------------------------------------
// ImageUpload Component
// ---------------------------------------------------------------------------

export default function ImageUpload({
  onFormulaGenerated,
  isLoading: externalLoading = false,
  className = "",
}: ImageUploadProps) {
  const [state, setState] = useState<UploadState>("idle");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [textPrompt, setTextPrompt] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [sceneDescription, setSceneDescription] = useState("");
  const [scentNarrative, setScentNarrative] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // -----------------------------------------------------------------------
  // File handling
  // -----------------------------------------------------------------------

  const validateAndSetFile = useCallback((file: File) => {
    setErrorMessage("");

    if (!ALLOWED_TYPES.has(file.type)) {
      setErrorMessage(
        `Invalid file type: ${file.type || "unknown"}. Please use JPEG, PNG, or WebP.`
      );
      setState("error");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage(
        `File too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum size is 10 MB.`
      );
      setState("error");
      return;
    }

    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreviewUrl(url);
    setState("preview");
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        validateAndSetFile(file);
      }
      // Reset the input so the same file can be selected again
      e.target.value = "";
    },
    [validateAndSetFile]
  );

  const removeImage = useCallback(() => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImageFile(null);
    setImagePreviewUrl(null);
    setTextPrompt("");
    setSceneDescription("");
    setScentNarrative("");
    setErrorMessage("");
    setState("idle");
  }, [imagePreviewUrl]);

  // -----------------------------------------------------------------------
  // Drag and drop
  // -----------------------------------------------------------------------

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        validateAndSetFile(file);
      }
    },
    [validateAndSetFile]
  );

  // -----------------------------------------------------------------------
  // API call
  // -----------------------------------------------------------------------

  const handleAnalyze = useCallback(async () => {
    if (!imageFile) return;

    setState("analyzing");
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      if (textPrompt.trim()) {
        formData.append("prompt", textPrompt.trim());
      }

      const res = await fetch("/api/image-to-scent", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if ((res.ok && data.success) || data.demo) {
        setSceneDescription(data.scene_description || "");
        setScentNarrative(data.scent_narrative || "");
        setState("complete");

        if (data.formula) {
          onFormulaGenerated(data.formula as OSCFormula, {
            scene_description: data.scene_description || "",
            scent_narrative: data.scent_narrative || "",
          });
        }
      } else {
        throw new Error(data.error || "Failed to analyze image.");
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
      setState("error");
    }
  }, [imageFile, textPrompt, onFormulaGenerated]);

  const isProcessing = state === "analyzing" || externalLoading;

  // -----------------------------------------------------------------------
  // Render: Idle state -- drop zone
  // -----------------------------------------------------------------------

  if (state === "idle") {
    return (
      <div className={`space-y-3 ${className}`}>
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative cursor-pointer rounded-2xl border-2 border-dashed
            transition-all duration-300 p-8 text-center
            ${
              isDragging
                ? "border-primary-400 bg-primary-400/5 scale-[1.01]"
                : "border-surface-500/30 bg-surface-800/20 hover:border-surface-400/50 hover:bg-surface-800/30"
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-4">
            <div
              className={`
              w-16 h-16 rounded-2xl flex items-center justify-center
              transition-colors duration-300
              ${
                isDragging
                  ? "bg-primary-400/15 border border-primary-400/30"
                  : "bg-surface-700/50 border border-surface-500/30"
              }
            `}
            >
              {isDragging ? (
                <ImageIcon className="w-7 h-7 text-primary-400" />
              ) : (
                <Upload className="w-7 h-7 text-gray-400" />
              )}
            </div>

            <div>
              <p
                className={`text-sm font-medium mb-1 ${
                  isDragging ? "text-primary-300" : "text-gray-300"
                }`}
              >
                {isDragging
                  ? "Drop image here"
                  : "Drag and drop an image, or click to browse"}
              </p>
              <p className="text-xs text-gray-500">
                JPEG, PNG, or WebP -- up to 10 MB
              </p>
            </div>
          </div>
        </div>

        {/* Camera capture button */}
        <div className="flex justify-center">
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl
              bg-surface-800/30 border border-surface-500/20 text-sm text-gray-400
              hover:text-gray-300 hover:border-surface-400/40 transition-colors"
          >
            <Camera className="w-4 h-4" />
            Take a photo
          </button>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Render: Preview, Analyzing, Complete, Error
  // -----------------------------------------------------------------------

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Image preview */}
      <AnimatePresence mode="wait">
        {imagePreviewUrl && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative"
          >
            <div className="relative rounded-xl overflow-hidden border border-surface-500/20 bg-surface-800/30">
              <img
                src={imagePreviewUrl}
                alt="Selected image for scent generation"
                className="w-full max-h-64 object-cover"
              />

              {/* Remove button */}
              {(state === "preview" || state === "error") && (
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-surface-900/80
                    text-gray-300 hover:text-white hover:bg-surface-900 transition-colors"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Analyzing overlay */}
              {state === "analyzing" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-surface-900/60 backdrop-blur-sm
                    flex items-center justify-center"
                >
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
                    <p className="text-sm text-primary-300 font-medium">
                      Analyzing image...
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scene description & scent narrative (complete state) */}
      <AnimatePresence>
        {state === "complete" && sceneDescription && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-3"
          >
            {/* Scene description card */}
            <div className="rounded-xl bg-surface-800/30 border border-surface-500/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-4 h-4 text-primary-400" />
                <span className="text-xs font-semibold text-primary-400 uppercase tracking-wide">
                  Scene
                </span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                {sceneDescription}
              </p>
            </div>

            {/* Scent narrative */}
            {scentNarrative && (
              <div className="rounded-xl bg-surface-800/30 border border-surface-500/20 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wind className="w-4 h-4 text-primary-400" />
                  <span className="text-xs font-semibold text-primary-400 uppercase tracking-wide">
                    Olfactory Interpretation
                  </span>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed italic">
                  {scentNarrative}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Optional text prompt (preview state) */}
      {(state === "preview" || state === "error") && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <input
            type="text"
            value={textPrompt}
            onChange={(e) => setTextPrompt(e.target.value)}
            placeholder="Optional: focus on the flowers, what would the sunset smell like..."
            className="w-full px-4 py-2.5 rounded-xl bg-surface-800/30
              border border-surface-500/20 text-sm text-gray-300
              placeholder-gray-600 focus:outline-none focus:border-primary-400/40
              transition-colors"
          />
        </motion.div>
      )}

      {/* Error message */}
      <AnimatePresence>
        {state === "error" && errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex items-start gap-3 px-4 py-3 rounded-xl
              bg-red-500/10 border border-red-500/20"
          >
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{errorMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      {(state === "preview" || state === "error") && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3"
        >
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={isProcessing}
            className="btn-primary flex-1 inline-flex items-center justify-center gap-2 py-3"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <ImageIcon className="w-4 h-4" />
                Generate Scent from Image
              </>
            )}
          </button>

          {state === "error" && (
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={isProcessing}
              className="btn-secondary inline-flex items-center gap-2 px-4 py-3"
            >
              <RotateCcw className="w-4 h-4" />
              Retry
            </button>
          )}
        </motion.div>
      )}

      {/* Complete state: option to start over */}
      {state === "complete" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center"
        >
          <button
            type="button"
            onClick={removeImage}
            className="inline-flex items-center gap-2 text-sm text-gray-500
              hover:text-gray-300 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Analyze a different image
          </button>
        </motion.div>
      )}
    </div>
  );
}
