"""Package only the independent ending screening, leaving game ZIPs intact."""
import hashlib,json,sys,zipfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
build=Path(sys.argv[1])
launcher='''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ending 动画预览</title><style>body{max-width:840px;margin:60px auto;padding:0 24px;background:#0c1017;color:#fff5e3;font:17px/1.7 system-ui}h1{font:40px Georgia}nav{display:grid;gap:14px}a{padding:22px;background:#ad5840;color:#fff9ef;border:1px solid #f1d9b5;text-decoration:none;border-radius:5px;font-weight:600}a:focus-visible{outline:3px solid white;outline-offset:4px}</style><h1>Ending 动画预览</h1><p>解压整个 ZIP 后打开。动画进入即铺满页面；左下角可展开预览控制，暂停、拖动进度或直接查看结尾。</p><nav><a href="Ending-animation.html?case=changed">播放预览 · 未尝试平均权重</a><a href="Ending-animation.html?case=unchanged">播放预览 · 多次尝试的 effort 相同</a><a href="Ending-animation.html?case=three">播放预览 · 三次实际试验</a></nav><p>三条入口使用当前游戏规则生成的示例历史。从办公室的反思开始，再接三关短回忆；Level 3 只使用该历史里实际出现的表现。Ending 中不显示左上角 metric 名称。反思问题分两行居中呈现，learning 与 numbers 放大并分别用浅金色和珊瑚橙色强调；最后一页保留 Design Lab 标题与入口；Design Lab 按钮只展示，暂不跳转。当前素材没有音频。</p></html>'''
files={'START-HERE.html':launcher.encode(),'Ending-animation.html':(build/'index.html').read_bytes(),'START-HERE.txt':'解压整个 ZIP，打开 START-HERE.html。可离线播放，无需安装。\nThis is an independent ending preview. Design Lab is not connected.\n'.encode()}
archive=ROOT/'play/Ending-animation-preview.zip'
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for name,data in files.items():
  info=zipfile.ZipInfo(name);info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o644<<16;z.writestr(info,data,compresslevel=9)
sha=lambda data:hashlib.sha256(data).hexdigest()
manifest=json.loads((build/'source-manifest.json').read_text())
(ROOT/'play/ENDING_ANIMATION_PREVIEW.json').write_text(json.dumps({**manifest,'archive':archive.name,'zipSha256':sha(archive.read_bytes()),'fileSha256':{n:sha(b) for n,b in files.items()},'scope':'Independent ending preview only; current game ZIPs are unchanged. No Level 3B, no mandatory near-even result, no early Goodhart reveal or Design Lab handoff.','audio':'No audio supplied; silent'},indent=2,ensure_ascii=False)+'\n')
print(f'Packaged {archive.name}: {archive.stat().st_size/1024/1024:.1f} MiB')
