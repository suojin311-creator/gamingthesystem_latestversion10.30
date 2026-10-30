"""Package only the independent Level 1 experiment; preserve every existing release ZIP."""
import hashlib
import json
import sys
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root=Path(__file__).resolve().parents[2]
build=Path(sys.argv[1]).resolve()
sha=lambda data:hashlib.sha256(data).hexdigest()
with ZipFile(root/'play/Level1-play.zip') as z:
    previous=z.read('Level1.html')
current=build.read_bytes()
launcher='''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Level 1 · 结果页试验预览</title><style>*{box-sizing:border-box}body{margin:0;background:#eee8db;color:#34392e;font:16px/1.6 Arial,sans-serif}main{max-width:850px;margin:9vh auto;padding:24px}small{color:#a4533b;letter-spacing:.14em}h1{font:normal clamp(30px,5vw,46px)/1.15 Georgia,serif}p{color:#716f60}nav{display:grid;gap:16px;margin:30px 0}a{padding:25px 28px;border:1px solid #cfc7b5;border-radius:5px;color:inherit;background:#fffaf0;text-decoration:none;display:flex;justify-content:space-between;gap:22px}a:first-child{background:#ad5840;border-color:#ad5840;color:#fffaf0}a:hover,a:focus-visible{outline:2px solid #8b6242;outline-offset:3px}a b{display:block;font-size:19px}a span{font-size:14px;opacity:.9}a em{font:normal 26px Georgia,serif;align-self:center}</style><main><small>GAMING THE SYSTEM · LEVEL 1</small><h1>结果核算页 · 独立试验预览</h1><p>新版：选择指标 → 写下预测 → 查看班级达标比例 → 观察对应动画 → 结果核算。六种指标都可试玩，动画自动播放，无播放器控制条。结果以第一次／第二次考核的达标百分比展示，已去掉 Target 和管理方底部文字。核算页只强调 Students 的负面结局。</p><nav><a href="Level1-settlement.html"><div><b>打开新版预览</b><span>对应结局直接接祝贺邮件，结尾用两张结果卡核算。</span></div><em>→</em></a><a href="Current-Level1.html"><div><b>查看原版 Level 1</b><span>保持原样，方便对照。旧版文件未被覆盖。</span></div><em>→</em></a></nav><p>先解压整个 ZIP，再用 Chrome 或 Edge 打开本页。无需安装或联网。此包只演示 Level 1，尚未替换完整游戏版本。</p></main></html>'''
files={'START-HERE.html':launcher.encode(),'Level1-settlement.html':current,'Current-Level1.html':previous,
 'START-HERE.txt':('先解压整个 ZIP，用 Chrome 或 Edge 打开 START-HERE.html。\n新版预览包含完整的指标选择、考核标准、预测、达标比例变化页、对应动画和结果核算。\n结果页可选择另一个指标。原版 Level 1 单独保留用于对照。\n\nExtract the entire ZIP and open START-HERE.html.\nThe independent preview stops at the Level 1 results; the approved game is unchanged.\n').encode()}
archive=root/'play/Level1-settlement-preview.zip'
with ZipFile(archive,'w',compression=ZIP_DEFLATED,compresslevel=9) as z:
    for name,data in files.items():z.writestr(name,data)
paths=sorted(p for p in (root/'src').rglob('*') if p.is_file() and p.suffix in {'.ts','.tsx','.js','.css','.png'})
paths+=sorted(p for p in (root/'scripts/level1-settlement').rglob('*') if p.is_file())
paths+=[root/'package.json',root/'package-lock.json']
fingerprint=hashlib.sha256()
for path in paths:fingerprint.update(str(path.relative_to(root)).encode()+b'\0'+path.read_bytes()+b'\0')
manifest={
 'branch':'preview/level1-settlement','baselineCommit':'32a91fe4bfb1cb193040410c846ebc165f8b9d5d',
 'partnerSourceCommit':'1bdd0c442c4b345b3bd37d6f541742d4e55c732f',
 'sourceSha256':fingerprint.hexdigest(),'archive':archive.name,'zipSha256':sha(archive.read_bytes()),
 'entries':{name:sha(data) for name,data in files.items()},
 'scope':'Independent Level 1 experiment only; previous releases and upstream repository are unchanged',
 'flow':'Choose → Predict → Evaluate (first/second assessment class attainment percentages, no target) → Observe (selected branch → complete email and teacher thoughts → dialogue-free settlement)',
 'pacing':'Readable retained dialogue, fixed shots and a 640ms covered branch-to-email transition; common ending and green email result removed; distinct speaker colours; first teacher thought two seconds after email uncover, singular I bridge; static management without footer text and a student-only warning outline',
}
(root/'play/LEVEL1_SETTLEMENT_PREVIEW.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('Packaged',archive.name,archive.stat().st_size,'bytes; the original Level1 HTML is byte-identical')
