// Standalone gameplay previews have no opening/name-entry screen.
// Real games pass the opening's confirmed name instead of this preview fallback.
export const PREVIEW_PLAYER_NAME = 'Maya';

export function resolvePlayerName(name?: string): string {
  return name?.trim() || PREVIEW_PLAYER_NAME;
}
