import type { StarterPrompt } from "./types";

export const DEMO_RESPONSE =
  "I'm not connected to an AI backend yet. The free Gemini API will power responses in an upcoming update.";

export const STARTER_PROMPTS: StarterPrompt[] = [
  {
    id: "explain",
    title: "Explain a complex topic",
    description: "Break down a difficult concept into clear terms.",
    message:
      "Explain the concept of quantum entanglement in simple terms.",
  },
  {
    id: "code",
    title: "Help me write code",
    description: "Draft a function or script for a specific task.",
    message:
      "Help me write a TypeScript function that debounces an async task.",
  },
  {
    id: "analyze",
    title: "Analyze an idea",
    description: "Surface strengths, risks, and blind spots in an idea.",
    message:
      "Analyze this idea: a note-taking app that links ideas visually and finds hidden connections.",
  },
  {
    id: "study",
    title: "Create a study plan",
    description: "Build a structured plan for learning a new subject.",
    message: "Create a study plan for Docker and Kubernetes from scratch.",
  },
];