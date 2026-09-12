import type { Conversation, Message, StarterPrompt } from "./types";
import { createId } from "./utils";

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

function createdAt(daysAgo: number, hoursAgo = 0) {
  return Date.now() - daysAgo * 86_400_000 - hoursAgo * 3_600_000;
}

function demoMessage(content: string, ts: number, role: "user"): Message;
function demoMessage(content: string, ts: number, role: "assistant"): Message;
function demoMessage(
  content: string,
  ts: number,
  role: "user" | "assistant",
): Message {
  return {
    id: createId(role),
    role,
    content,
    createdAt: ts,
    status: "completed",
  };
}

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: createId("conv"),
    title: "Explain quantum computing",
    messages: [
      demoMessage(
        "Explain quantum computing as if I have a computer science background.",
        createdAt(0, 2),
        "user",
      ),
      demoMessage(DEMO_RESPONSE, createdAt(0, 2) + 1200, "assistant"),
    ],
    createdAt: createdAt(0, 2),
    updatedAt: createdAt(0, 2) + 1200,
  },
  {
    id: createId("conv"),
    title: "Build a REST API",
    messages: [
      demoMessage(
        "What's the best way to structure a REST API in FastAPI?",
        createdAt(1),
        "user",
      ),
      demoMessage(DEMO_RESPONSE, createdAt(1) + 900, "assistant"),
    ],
    createdAt: createdAt(1),
    updatedAt: createdAt(1) + 900,
  },
  {
    id: createId("conv"),
    title: "Study plan for networking",
    messages: [
      demoMessage(
        "Create a study plan for CCNA networking.",
        createdAt(3),
        "user",
      ),
      demoMessage(DEMO_RESPONSE, createdAt(3) + 1_100, "assistant"),
    ],
    createdAt: createdAt(3),
    updatedAt: createdAt(3) + 1_100,
  },
  {
    id: createId("conv"),
    title: "Python debugging",
    messages: [
      demoMessage(
        "My Python script keeps failing with a KeyError. How do I debug it?",
        createdAt(4),
        "user",
      ),
      demoMessage(DEMO_RESPONSE, createdAt(4) + 800, "assistant"),
    ],
    createdAt: createdAt(4),
    updatedAt: createdAt(4) + 800,
  },
  {
    id: createId("conv"),
    title: "Database normalization",
    messages: [
      demoMessage(
        "Explain database normalization with practical examples.",
        createdAt(6),
        "user",
      ),
      demoMessage(DEMO_RESPONSE, createdAt(6) + 1_000, "assistant"),
    ],
    createdAt: createdAt(6),
    updatedAt: createdAt(6) + 1_000,
  },
];