export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

let sequence = 0;

export function createId(prefix: string) {
  sequence += 1;
  return `${prefix}_${Date.now().toString(36)}_${sequence.toString(36)}`;
}

const LEADING_FILLERS: RegExp[] = [
  /^can you help me\s+/i,
  /^can you please\s+/i,
  /^can you\s+/i,
  /^could you please\s+/i,
  /^could you\s+/i,
  /^would you mind\s+/i,
  /^would you please\s+/i,
  /^would you\s+/i,
  /^do you know\s+/i,
  /^please\s+/i,
  /^hey\s+/i,
  /^i need you to\s+/i,
  /^i want you to\s+/i,
  /^i would like you to\s+/i,
  /^i'd like you to\s+/i,
  /^i need to\s+/i,
  /^i want to\s+/i,
  /^i would like to\s+/i,
  /^i'd like to\s+/i,
  /^i want\s+/i,
  /^i need\s+/i,
  /^i have\s+/i,
  /^i'd like\s+/i,
  /^i am\s+/i,
  /^i'm\s+/i,
  /^help me\s+/i,
  /^make me a\s+/i,
  /^make a\s+/i,
  /^make\s+/i,
];

const TRAILING_FILLERS = /(\s+(for me|to me|please|thanks|thank you))$/i;

const TITLE_MAX = 40;

export function deriveTitle(raw: string) {
  const firstLine = (raw.trim().split(/\r?\n/)[0] ?? raw.trim()).trim();
  let title = firstLine.replace(/\s+/g, " ").trim();
  if (!title) return "New chat";

  title = title.replace(/[.?!]+$/, "").trim();
  title = title.replace(TRAILING_FILLERS, "").trim();

  for (const pattern of LEADING_FILLERS) {
    if (pattern.test(title)) {
      title = title.replace(pattern, "").trim();
      break;
    }
  }

  if (title.length < 2) return firstLine.slice(0, TITLE_MAX);

  title = title.charAt(0).toUpperCase() + title.slice(1);

  if (title.length > TITLE_MAX) {
    const cut = title.slice(0, TITLE_MAX);
    const lastSpace = cut.lastIndexOf(" ");
    const end = lastSpace > TITLE_MAX * 0.5 ? lastSpace : TITLE_MAX - 1;
    title = `${cut.slice(0, end)}…`;
  }

  return title;
}