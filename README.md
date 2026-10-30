# Gaming the System — private source review

Snapshot of Mg614/gaming-the-system-final, main, commit 0f3bacc10427fd0c62ffa0fff3bae74f5c1e432a (2026-10-30).

This independent repository contains the game source, required cinematic source/artwork, locked dependencies, local build configuration and selected checks. It does not copy upstream history, accounts, hosting configuration, deployment workflows, build outputs, review ZIPs, caches or historical development instructions. Original gameplay source is unchanged.

## Important asset limitation

The original soundtrack `src/audio/assets/gymnopedie-no1.mp3` is intentionally absent. Obtain it independently with appropriate rights before running the full build. Do not commit or redistribute the raw recording. Without that file the complete build will fail at its audio import; this is expected and does not indicate a complete runnable delivery.

Project artwork is retained as necessary for source review. The source contains no complete per-image rights or consent records. This copy does not certify ownership or authorize further distribution. Keep access limited to authorized reviewers. See ASSET_REVIEW.md.

## Local checks

Node.js 22.12+ and npm are required. npm is the tool that installs the project libraries and runs its named tasks. No account credentials or environment variables (settings supplied outside code) are required for the game itself. The existing Padlet board address is retained; it requires Internet and its existing access permissions.

- `npm ci --ignore-scripts`: installs exact locked library versions without install hooks; success ends with an installation summary. On failure, copy the lines beginning with `npm error`, without any credentials.
- `npm run check`: checks source types without running the game; success ends without errors. On failure, copy the file names and error messages.
- After independently restoring the soundtrack, `npm run build`: prepares the cinematics and builds the game; success ends with built-file sizes. On failure, copy the first error and its nearby lines.

Historical Lab commands in the unchanged package manifest are outside this review copy; the retired standalone Lab is intentionally excluded. This repository has no publishing workflow.

See COPY_AUDIT.json for copied file hashes and exclusions. The scan is a pattern-based credential review, not a guarantee that every possible secret can be detected.
