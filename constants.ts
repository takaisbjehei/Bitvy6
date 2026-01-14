// Cast import.meta to any to avoid "Property 'env' does not exist on type 'ImportMeta'" TS error
export const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "";
export const WS_URL = (import.meta as any).env?.VITE_WS_URL || "ws://localhost:8080";

export const PLAYER_COLORS = [
  "#FF5733", "#33FF57", "#3357FF", "#F333FF", "#33FFF5", "#FFFF33"
];

export const WORLD_SIZE = 50;