/** Frame completion tokens also have to work on classroom HTTP/LAN addresses.
 * getRandomValues is available there; randomUUID requires a secure context.
 * The receiver additionally checks the sending iframe's window.
 */
export function cinematicRunId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}
