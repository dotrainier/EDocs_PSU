export interface NameParts {
  given_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  name_suffix?: string | null;
}

// given_name/middle_name/last_name/name_suffix are the only stored source of
// truth for a user's name — full_name is never persisted, only computed here
// at the point a display string is needed.
export function composeFullName(parts: NameParts): string {
  return [parts.given_name, parts.middle_name, parts.last_name, parts.name_suffix]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}
