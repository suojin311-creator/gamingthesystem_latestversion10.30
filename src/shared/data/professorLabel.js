/** Format speech labels only; never change the stored Gameplay identity. */
export function professorLabel(playerName) {
  let name = typeof playerName === 'string' ? playerName.trim().replace(/\s+/g, ' ') : '';
  let previous;
  do {
    previous = name;
    name = name.replace(/^(?:professor|prof\.)(?:\s+|$)|(?:^|\s+)(?:professor|prof\.)$/gi, '').trim();
  } while (name !== previous);
  return name ? `You (Professor ${name})` : 'You (Professor)';
}
