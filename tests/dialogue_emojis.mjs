import assert from 'node:assert/strict';
import { readdirSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const inventory = [];
function scan(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) scan(path);
    else if (/\.tsx?$/.test(path)) {
      for (const match of readFileSync(path, 'utf8').matchAll(/\p{Extended_Pictographic}/gu)) {
        inventory.push({ emoji: match[0], file: path });
      }
    }
  }
}
scan('src');
assert.ok(inventory.length > 0, 'Expected emoji in the approved dialogue');
assert.equal(new Set(inventory.map(item => item.emoji)).size, inventory.length, 'Each emoji must occur at only one source location');
mkdirSync('test-results', { recursive: true });
const report = { passed: 1, checks: ['All gameplay emoji are distinct across all levels'], emojiCount: inventory.length, inventory };
writeFileSync('test-results/dialogue-emoji-results.json', JSON.stringify(report, null, 2) + '\n');
console.log(`PASS ${inventory.length} distinct emoji across all levels`);
