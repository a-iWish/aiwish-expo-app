/** First name for greetings: first token of full name, else email local part. */
export function firstName(
  fullName?: string | null,
  email?: string | null,
): string {
  const name = fullName?.trim();
  if (name) {
    return name.split(/\s+/)[0];
  }
  const local = email?.split('@')[0]?.trim();
  return local || 'there';
}
