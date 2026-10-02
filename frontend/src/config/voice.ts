/**
 * Voice provider configuration
 * Loads ElevenLabs API key from Vite environment or fallback.
 */

export const ELEVENLABS_API_KEY = (import.meta.env.VITE_ELEVENLABS_API_KEY as string) ||
  (import.meta.env.ELEVENLABS_API_KEY as string) ||
  '';

// ElevenLabs premade voice IDs for free tier accounts:
// India (en-IN): Sarah — fluent multilingual Hindi & Indian English
// Philippines (fil-PH): Bella — natural Filipino/Taglish
// Indonesia (id-ID): Alice/Sarah — clear pronunciation
export const ELEVENLABS_VOICES: Record<string, string> = {
  in_en: 'EXAVITQu4vr4xnSDxMaL', // Sarah (premade, supports multilingual v2 / flash)
  ph_tl: 'hpp4J3VqNfWAUOO0d1Us', // Bella (premade, natural for Taglish)
  id_id: 'Xb7hH8MSUJpSbSDYk0k2', // Alice (premade, clear multilingual)
};

// ElevenLabs model: eleven_flash_v2_5 is ultra-low latency (<200ms) with multilingual support
export const ELEVENLABS_MODEL = 'eleven_flash_v2_5';

export const ELEVENLABS_SETTINGS: Record<string, { stability: number; similarity_boost: number; style: number; speaking_rate: number }> = {
  in_en: { stability: 0.50, similarity_boost: 0.75, style: 0.20, speaking_rate: 1.0 },
  ph_tl: { stability: 0.50, similarity_boost: 0.75, style: 0.20, speaking_rate: 1.0 },
  id_id: { stability: 0.50, similarity_boost: 0.75, style: 0.20, speaking_rate: 1.0 },
};
