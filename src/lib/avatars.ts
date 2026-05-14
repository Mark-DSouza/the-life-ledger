// Selectable avatar set — emoji-based for zero-asset weight, themed glyphs on color circles.
export const AVATARS = [
  { id: "fox", emoji: "🦊", bg: "from-orange-400 to-rose-500" },
  { id: "panda", emoji: "🐼", bg: "from-slate-300 to-slate-500" },
  { id: "owl", emoji: "🦉", bg: "from-amber-500 to-yellow-700" },
  { id: "cat", emoji: "🐱", bg: "from-pink-400 to-fuchsia-600" },
  { id: "dog", emoji: "🐶", bg: "from-amber-400 to-orange-600" },
  { id: "bear", emoji: "🐻", bg: "from-yellow-700 to-amber-900" },
  { id: "wolf", emoji: "🐺", bg: "from-zinc-400 to-zinc-700" },
  { id: "rabbit", emoji: "🐰", bg: "from-rose-200 to-rose-500" },
  { id: "tiger", emoji: "🐯", bg: "from-orange-500 to-red-700" },
  { id: "frog", emoji: "🐸", bg: "from-lime-400 to-emerald-700" },
  { id: "unicorn", emoji: "🦄", bg: "from-violet-400 to-fuchsia-600" },
  { id: "dragon", emoji: "🐲", bg: "from-emerald-400 to-teal-700" },
] as const;

export type AvatarId = (typeof AVATARS)[number]["id"];

export function avatarById(id?: string | null) {
  return AVATARS.find((a) => a.id === id) ?? AVATARS[0];
}
