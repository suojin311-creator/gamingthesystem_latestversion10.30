"""Publish the latest offline previews from one set of production builds.

Run via npm run package:previews so changes to shared components reach every entry.
Versioned ZIPs are historical records and are deliberately left untouched.
"""
import hashlib
import json
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PLAY = ROOT / 'play'
PLAY.mkdir(parents=True, exist_ok=True)
ENTRIES = [
    ('Level1-play.zip', 'Level1.html', 'dist-level1/index.html',
     'Level 1 only, with its approved cinematic and assessment settlement. Try another metric to review another ending.'),
    ('Level2-play.zip', 'Level2.html', 'dist-level2/index.html',
     'Level 2 only. Continue to Level 3 is reserved and disabled in this standalone entry.'),
    ('Level3-play.zip', 'Level3.html', 'dist-level3/index.html',
     'Level 3 only. Choose priorities, set weights and compare Alex’s responses. Design Lab is reserved.'),
    ('Full-game-play.zip', 'Gaming-the-System.html', 'dist/index.html',
     'Start with the opening animation and your name, then play Levels 1, 2 and 3 in one open game.'),
]


def digest(data):
    return hashlib.sha256(data).hexdigest()


# Load all builds before replacing any published entry.
builds = {path: (ROOT / path).read_bytes() for _, _, path, _ in ENTRIES}
source_paths = sorted(path for path in (ROOT / 'src').rglob('*')
                      if path.is_file() and path.suffix in {'.ts', '.tsx', '.js', '.css', '.png', '.ogg', '.json'})
source_paths += [ROOT / name for name in ['index.html', 'vite.config.ts', 'package.json', 'package-lock.json']]
source_paths += [ROOT / 'scripts/level1-film.mjs']
source_paths += [ROOT / 'scripts/level2-film.mjs', ROOT / 'scripts/cinematic-reading.mjs', ROOT / 'scripts/metric100-preview/pacing.mjs']
source_paths += [ROOT / 'scripts/level3-film.mjs', ROOT / 'scripts/ending-film.mjs', ROOT / 'scripts/cinematic-dissolve.mjs']
source_paths += sorted(path for path in (ROOT / 'scripts/ending-animation').glob('*') if path.suffix in {'.mjs', '.jsx', '.css'})
source_paths += sorted(path for path in (ROOT / 'scripts/level1-settlement').glob('*') if path.suffix in {'.mjs', '.jsx'})
source_paths += sorted(path for path in (ROOT / 'scripts/level2-animation').glob('*') if path.suffix in {'.mjs', '.jsx', '.css'})
source_paths += sorted(path for path in (ROOT / 'scripts/level3-animation').glob('*') if path.suffix in {'.mjs', '.jsx', '.css'})
source_paths += [ROOT / 'src/cinematics/level3/mapping.mjs']
cinematic = json.loads((ROOT / 'node_modules/.cache/level1-cinematic/manifest.json').read_text())
level2_cinematic = json.loads((ROOT / 'node_modules/.cache/level2-cinematic/manifest.json').read_text())
level3_cinematic = json.loads((ROOT / 'node_modules/.cache/level3-cinematic/manifest.json').read_text())
ending_cinematic = json.loads((ROOT / 'node_modules/.cache/ending-cinematic/manifest.json').read_text())
source_hash = hashlib.sha256()
for path in source_paths:
    source_hash.update(str(path.relative_to(ROOT)).encode() + b'\0')
    source_hash.update(path.read_bytes() + b'\0')
source_hash.update(b'level1-cinematic-html\0' + cinematic['htmlSha256'].encode() + b'\0')
source_hash.update(b'level2-cinematic-html\0' + level2_cinematic['htmlSha256'].encode() + b'\0')
source_hash.update(b'level3-cinematic-html\0' + level3_cinematic['htmlSha256'].encode() + b'\0')

source_hash.update(b'ending-cinematic-html\0' + ending_cinematic['htmlSha256'].encode() + b'\0')

manifest = {'endingCinematic': ending_cinematic, 'sourceSha256': source_hash.hexdigest(), 'cinematic': cinematic, 'level2Cinematic': level2_cinematic, 'level3Cinematic': level3_cinematic, 'entries': []}
for archive, html, build, description in ENTRIES:
    instruction = (
        f'Gaming the System\n\n{description}\n\n'
        f'Extract this ZIP, then open {html} in Chrome or Edge.\n'
        'The game runs locally after download; Design Lab opens the online Padlet board and needs Internet.\n'
        'Closing or reloading starts a fresh game.\n'
        'The full-game entry includes the opening; standalone levels start directly. Levels 1, 2 and Level 3A weighted-task scenes have integrated cinematics; the approved full-screen ending follows the comparison. Design Lab opens the configured online Padlet board.\n'
    )
    with zipfile.ZipFile(PLAY / archive, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as bundle:
        for name, data in [(html, builds[build]), ('START-HERE.txt', instruction.encode())]:
            info = zipfile.ZipInfo(name)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            bundle.writestr(info, data, compresslevel=9)
    manifest['entries'].append({
        'archive': archive, 'html': html, 'build': build,
        'htmlSha256': digest(builds[build]),
        'zipSha256': digest((PLAY / archive).read_bytes()),
    })
    print(f'Packaged {archive}: {html}')

# One review download contains both requested entry points from the same builds.
review_archive = 'Level3-and-Full-game-play.zip'
review_target = '../Full-game/Gaming-the-System.html?level=3'
review_launcher = (f'<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url={review_target}"><title>Level 3</title><a href="{review_target}">Open Level 3</a></html>').encode()
review_files = {
    'Level3/Level3.html': review_launcher,
    'Full-game/Gaming-the-System.html': builds['dist/index.html'],
}
review_instruction = (
    'Gaming the System — latest review package\n\n'
    '1. Level 3 only: open Level3/Level3.html\n'
    '2. Opening -> Levels 1 -> 2 -> 3: open Full-game/Gaming-the-System.html\n\n'
    'Extract the entire ZIP first, then open either HTML in Chrome or Edge.\n'
    'Both entries use the same latest gameplay. The game runs locally; Padlet needs Internet.\n'
    'The combined game carries your Level 2 choices into Level 3; you can change them.\n'
    'The approved full-screen ending is integrated. Design Lab opens the configured online Padlet board.\n'
    'Keep the extracted folders together; the Level 3 launcher shares the full-game HTML.\n'
)
with zipfile.ZipFile(PLAY / review_archive, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as bundle:
    for name, data in [*review_files.items(), ('START-HERE.txt', review_instruction.encode())]:
        info = zipfile.ZipInfo(name)
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o644 << 16
        bundle.writestr(info, data, compresslevel=9)
manifest['reviewBundle'] = {
    'sharedGameLaunchers': {'Level3/Level3.html': 'Full-game/Gaming-the-System.html?level=3'},
    'archive': review_archive,
    'zipSha256': digest((PLAY / review_archive).read_bytes()),
    'htmlSha256': {name: digest(data) for name, data in review_files.items()},
}
print(f'Packaged {review_archive}: standalone Level 3 and connected Levels 1–3')

# A single delivery includes the complete game and every standalone level.
complete_archive = 'Gaming-the-System-complete.zip'
complete_files = {
    'START-HERE.html': (ROOT / 'scripts/package_start.html').read_bytes(),
    'Full-game/Gaming-the-System.html': builds['dist/index.html'],
}
complete_launchers = {}
# Share the full build's artwork/films once, keeping the familiar entry filenames.
# Four duplicate embedded films would exceed GitHub's single-file ZIP limit.
for level in (1, 2, 3):
    target = f'../Full-game/Gaming-the-System.html?level={level}'
    name = f'Level{level}/Level{level}.html'
    complete_files[name] = (f'<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url={target}"><title>Level {level}</title><a href="{target}">Open Level {level}</a></html>').encode()
    complete_launchers[name] = f'Full-game/Gaming-the-System.html?level={level}'
complete_instruction = (
    'Gaming the System — complete playable package / 完整试玩包\n\n'
    '先解压整个 ZIP，再用 Chrome 或 Edge 打开 START-HERE.html 选择版本。\n'
    'Extract the entire ZIP, then open START-HERE.html in Chrome or Edge.\n\n'
    '开场及完整三关 / Opening and full game: Full-game/Gaming-the-System.html\n'
    '单独第一关 / Level 1: Level1/Level1.html\n'
    '单独第二关 / Level 2: Level2/Level2.html\n'
    '单独第三关 / Level 3: Level3/Level3.html\n\n'
    '游戏本身可离线运行；Design Lab 使用 Padlet，需要网络。各版本使用同一套玩法。\n'
    'All four game entries run offline; the Padlet Design Lab requires Internet.\n'
    'The full game carries your choices from Level 2 into editable Level 3 priorities.\n'
    'Closing or reloading starts fresh; standalone levels stop at their own endings.\n'
    'The latest Level 2 framing and unassigned first Level 3 weights are included.\n'
    'The opening, Level 1/2 and Level 3A classroom cinematics are integrated; the approved ending follows Level 3. Design Lab opens the configured online Padlet board.\n'
    'The standalone launchers share the Full-game HTML to avoid duplicating artwork. Keep the extracted folders together.\n'
)
with zipfile.ZipFile(PLAY / complete_archive, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as bundle:
    for name, data in [*complete_files.items(), ('START-HERE.txt', complete_instruction.encode())]:
        info = zipfile.ZipInfo(name)
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o644 << 16
        bundle.writestr(info, data, compresslevel=9)
manifest['completeBundle'] = {
    'archive': complete_archive,
    'zipSha256': digest((PLAY / complete_archive).read_bytes()),
    'htmlSha256': {name: digest(data) for name, data in complete_files.items()},
    'sharedGameLaunchers': complete_launchers,
}
print(f'Packaged {complete_archive}: full game, standalone Levels 1–3 and offline launcher')
(PLAY / 'LATEST.json').write_text(json.dumps(manifest, indent=2) + '\n')
