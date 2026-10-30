"""Check the actual downloadable ZIP offline after packaging.
Reading intervals use the browser clock; level2.py checks them at real speed.
"""
import json
import os
import sys
import re
import hashlib
import zipfile
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright, expect

expect.set_options(timeout=30000)
class CheckLog(list):
    def append(self, check):
        super().append(check)
        print('PASS', check, flush=True)

checks, errors = CheckLog(), []
artifacts = {}
manifest = json.loads(Path('play/LATEST.json').read_text())
assert {entry['html'] for entry in manifest['entries']} == {'Level1.html', 'Level2.html', 'Level3.html', 'Gaming-the-System.html'}
for entry in manifest['entries']:
    archive = Path('play') / entry['archive']
    with zipfile.ZipFile(archive) as bundle:
        assert bundle.testzip() is None
        assert set(bundle.namelist()) == {entry['html'], 'START-HERE.txt'}
        artifacts[entry['html']] = bundle.read(entry['html'])
        assert artifacts[entry['html']] == Path(entry['build']).read_bytes()
        assert entry['html'] in bundle.read('START-HERE.txt').decode()
    assert hashlib.sha256(artifacts[entry['html']]).hexdigest() == entry['htmlSha256']
    assert hashlib.sha256(archive.read_bytes()).hexdigest() == entry['zipSha256']
checks.append('All four latest ZIPs are intact, self-contained and byte-identical to their production builds and manifest')
review = manifest['reviewBundle']
with zipfile.ZipFile(Path('play') / review['archive']) as bundle:
    assert bundle.testzip() is None
    assert set(bundle.namelist()) == {'Level3/Level3.html', 'Full-game/Gaming-the-System.html', 'START-HERE.txt'}
    for name, html in [('Level3/Level3.html', 'Level3.html'), ('Full-game/Gaming-the-System.html', 'Gaming-the-System.html')]:
        target=review.get('sharedGameLaunchers',{}).get(name)
        if target: assert '../'+target in bundle.read(name).decode()
        else: assert bundle.read(name) == artifacts[html]
        assert hashlib.sha256(bundle.read(name)).hexdigest() == review['htmlSha256'][name]
assert hashlib.sha256((Path('play') / review['archive']).read_bytes()).hexdigest() == review['zipSha256']
checks.append('The review ZIP contains separate Level 3 and connected Levels 1–3 HTMLs, identical to their tested latest packages')

complete = manifest['completeBundle']
complete_entries = {
    'Full-game/Gaming-the-System.html': 'Gaming-the-System.html',
    'Level1/Level1.html': 'Level1.html',
    'Level2/Level2.html': 'Level2.html',
    'Level3/Level3.html': 'Level3.html',
}
complete_html = {}
with zipfile.ZipFile(Path('play') / complete['archive']) as bundle:
    assert bundle.testzip() is None
    assert set(bundle.namelist()) == {*complete_entries, 'START-HERE.html', 'START-HERE.txt'}
    for name, html in complete_entries.items():
        complete_html[name] = bundle.read(name)
        target = complete.get('sharedGameLaunchers', {}).get(name)
        if target:
            assert '../' + target in complete_html[name].decode()
        else:
            assert complete_html[name] == artifacts[html]
        assert name in bundle.read('START-HERE.txt').decode()
    complete_html['START-HERE.html'] = bundle.read('START-HERE.html')
    assert complete_html['START-HERE.html'] == Path('scripts/package_start.html').read_bytes()
    assert set(re.findall(r'href="([^"]+)"', complete_html['START-HERE.html'].decode())) == set(complete_entries)
    for name, data in complete_html.items():
        assert hashlib.sha256(data).hexdigest() == complete['htmlSha256'][name]
assert hashlib.sha256((Path('play') / complete['archive']).read_bytes()).hexdigest() == complete['zipSha256']
checks.append('The complete ZIP shares one verified game build across its four offline entry points without duplicating movie assets')


def advance(page, seconds=24):
    for _ in range(seconds):
        page.clock.run_for(1000)
        page.wait_for_timeout(12)


def opening(page):
    # Reuse the current approved Opening, including the Alex introduction.
    from opening_flow import start_game
    start_game(page, 'Riley Chen & 李')
    page.get_by_role('button', name='Sound off', exact=True).click()
    page.get_by_role('button', name='Guide', exact=True).click()


def scene(page, lines=3):
    page.get_by_role('button', name='Observe the class', exact=True).click()
    frame = page.frame_locator('iframe[title="Level 2 classroom animation"]')
    expect(frame.locator('.l2-film')).to_be_visible(timeout=30000)
    # Keep the real film and CSS-cover callbacks running; no synthetic completion.
    for _ in range(50):
        if page.locator('.level2-cinematic').count() == 0: break
        page.clock.run_for(1000)
        page.wait_for_timeout(60)
    expect(page.locator('.level2-cinematic')).to_have_count(0, timeout=30000)
    expected_prompt=1 if page.locator('.level-two').get_attribute('data-round')=='6' else 0
    expect(page.locator('.level-two .conversation')).to_have_count(expected_prompt)
    if expected_prompt: expect(page.locator('.l2-teacher-prompt')).to_contain_text('Would more metrics help?')
    expect(page.locator('.l2-results .l2-perspective')).to_have_count(2)
    advance(page, 8)


def level_one(page):
    expect(page.get_by_role('dialog', name='Workbench guide')).to_be_visible()
    page.get_by_role('button', name='Skip guide').click()
    page.get_by_test_id('metric-prep').click()
    page.get_by_role('button', name='Make a prediction', exact=True).click()
    page.get_by_label('How will students respond when this counts towards their marks?').fill('Students will explain the reading.')
    page.get_by_role('button', name='View assessment results', exact=True).click()
    observe = page.get_by_role('button', name='Observe the class', exact=True)
    expect(observe).to_be_enabled(timeout=10000)
    expect(page.locator('.selected-metric-card h3')).to_have_text('Preparation')
    expect(page.locator('.metric-option')).to_have_count(6)
    expect(page.locator('.score-numbers,.score-track,.metric-result .dialogue-strip')).to_have_count(0)
    expect(page.get_by_role('progressbar')).to_have_count(1)
    expect(page.locator('.target-label, .management-satisfaction-evidence')).to_have_count(0)
    observe.click()
    frame = page.frame_locator('iframe')
    expect(frame.locator('.l1-film')).to_have_attribute('data-metric', 'pre-class-preparation', timeout=15000)
    frame.locator('.l1-film').evaluate('''root => {
      window.identityAudit = {teachers: [], students: [], emails: [], errors: []};
      const sample = () => {
        const speaker = root.querySelector('.l1-spoken');
        const label = speaker?.querySelector('.l1-speaker');
        const text = speaker?.querySelector('[role="status"]');
        if (label) {
          const teacher = speaker.dataset.speaker === 'player';
          const target = teacher ? window.identityAudit.teachers : window.identityAudit.students;
          if (!target.includes(label.textContent)) target.push(label.textContent);
          if (getComputedStyle(label).color !== (teacher ? 'rgb(255, 226, 163)' : 'rgb(204, 238, 255)')) window.identityAudit.errors.push('Incorrect speaker label colour');
          if (text && getComputedStyle(text).color !== getComputedStyle(label).color) window.identityAudit.errors.push('Caption and label colours differ');
        }
        const greeting = root.querySelector('.email h2');
        if (greeting && !window.identityAudit.emails.includes(greeting.textContent)) window.identityAudit.emails.push(greeting.textContent);
        parent.postMessage({channel: 'release-identity-audit', audit: window.identityAudit}, '*');
      };
      new MutationObserver(sample).observe(root, {subtree:true,childList:true,attributes:true}); sample();
    }''')
    expect(page.locator('.l1-settlement .student-behaviour')).to_have_text('Alex focused on only one metric.', timeout=35000)
    expect(page.locator('.student .student-behaviour')).to_have_text('Alex focused on only one metric.')
    expect(page.locator('.l1-settlement .dialogue-strip')).to_have_count(1)
    expect(page.locator('.l1-settlement .alex-bubble')).to_have_count(0)
    expect(page.locator('.l1-settlement-teacher p')).to_have_text('What if I measured more than one metric?')
    expect(page.locator('.l1-settlement-prediction summary')).to_have_text('Your prediction')
    page.locator('.l1-settlement-prediction summary').click()
    expect(page.locator('.l1-settlement-prediction blockquote')).to_have_text('Students will explain the reading.')
    page.locator('.l1-settlement-prediction summary').click()
    bubble=page.locator('.l1-settlement-teacher').bounding_box()
    button=page.locator('.l1-settlement-actions button').bounding_box()
    assert bubble['y'] >= button['y']+button['height']
    assert page.locator('.l1-settlement-teacher').evaluate('e=>getComputedStyle(e).backgroundColor')=='rgb(240, 235, 223)'
    expected_name = 'Riley Chen & 李' if page.locator('.l1-settlement button').inner_text().startswith('Continue') else 'Maya'
    expect(page.locator('.l1-settlement-teacher .speaker-name')).to_have_text(expected_name)
    audit = page.evaluate('window.releaseIdentityAudit')
    assert audit['teachers'] == [f'You (Professor {expected_name})'] and audit['students'] == ['Alex'], audit
    assert audit['emails'] == [] and not audit['errors'], audit


def cover_gaps(page):
    page.get_by_role('button', name='Cover the gaps', exact=True).click()
    expect(page.locator('.level-two')).to_have_attribute('data-phase','evaluate')
    expect(page.locator('.level-two')).to_have_attribute('data-round','6')
    boxes=page.get_by_role('checkbox')
    expect(boxes).to_have_count(6)
    expect(page.locator('.l2-gap-metric[aria-checked=true]:disabled')).to_have_count(3)
    observe=page.get_by_role('button', name='Observe the class', exact=True)
    expect(observe).to_be_disabled()
    pending=[box.get_attribute('data-testid') for box in page.locator('.l2-gap-metric[aria-checked=false]').all()]
    for test_id in pending:
        expect(observe).to_be_disabled()
        page.get_by_test_id(test_id).click()
    expect(observe).to_be_enabled()
    expect(page.locator('body')).not_to_contain_text('Illustrative outcomes')


def finish_two(page):
    scene(page)
    cover_gaps(page)
    scene(page)
    expect(page.get_by_role('heading', name='Would more metrics help learning?', exact=True)).to_be_visible()
    page.get_by_role('button', name='Test more metrics', exact=True).click()
    advance(page, 30)
    expect(page.locator('.l2-reported-count')).to_have_text('100')
    scene(page, lines=2)
    expect(page.get_by_role('heading', name='More metrics. Still chasing marks.', exact=True)).to_be_visible()


def choose_three(page):
    advance(page,8)
    expect(page.locator('.level-three')).to_have_attribute('data-phase','choose',timeout=8000)
    for id in ['prep','part','focus']:
        card=page.get_by_test_id('level3-metric-'+id)
        if card.get_attribute('aria-pressed')!='true':card.click()
    page.get_by_role('button',name='Set the weights',exact=True).click()
    page.get_by_role('button',name='Skip guide',exact=True).click()
    expect(page.locator('.l3-weight-value')).to_have_text(['—','—','—'])
    expect(page.get_by_role('button',name='Run evaluation',exact=True)).to_be_disabled()


def weights_three(page, values):
    for index,id in enumerate(['prep','part','focus']):
        slider=page.get_by_test_id('weight-card-'+id).locator('input')
        if not slider.is_disabled():slider.evaluate('''(input,value)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,value);input.dispatchEvent(new Event('input',{bubbles:true}));}''', values[index])
        if page.get_by_test_id('confirm-'+id).is_enabled(): page.get_by_test_id('confirm-'+id).click()
    page.get_by_role('button',name='Run evaluation',exact=True).click()
    page.locator('.l3-publish').scroll_into_view_if_needed();advance(page,5)
    page.get_by_role('button',name='Observe the class',exact=True).click()
    expect(page.locator('.level3-cinematic iframe')).to_be_visible(timeout=30000)
    for _ in range(45):
        if not page.locator('.level3-cinematic').count(): break
        page.clock.run_for(1000);page.wait_for_timeout(60)
    expect(page.locator('.level3-cinematic')).to_have_count(0,timeout=30000)
    page.locator('.l3-results').scroll_into_view_if_needed();advance(page,12)
    if page.locator('.l3-criteria-stop').count():
        page.locator('.l3-criteria-stop').scroll_into_view_if_needed();advance(page,4)
    page.locator('.l3-bottom-dialogue').scroll_into_view_if_needed();advance(page,8)


if '--integrity-only' in sys.argv:
    Path('test-results').mkdir(exist_ok=True)
    Path('test-results/release-integrity.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'sourceSha256':manifest['sourceSha256']},indent=2)+'\n')
    for check in checks:print('PASS',check)
    raise SystemExit(0)

with sync_playwright() as playwright:
    # Serve the exact ZIP bytes over localhost: large inline films exceed CDP's
    # practical route.fulfill body size. All non-local requests remain blocked.
    from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
    import threading
    active_artifact={'name':'Level2.html'}
    class ArchiveHandler(BaseHTTPRequestHandler):
        def do_GET(self):
            path=urlsplit(self.path).path
            data=complete_html.get(path.removeprefix('/complete/')) if path.startswith('/complete/') else artifacts[active_artifact['name']]
            if data is None:self.send_error(404);return
            self.send_response(200);self.send_header('Content-Type','text/html');self.send_header('Content-Length',str(len(data)));self.end_headers();self.wfile.write(data)
        def log_message(self,*args):pass
    archive_server=ThreadingHTTPServer(('127.0.0.1',0),ArchiveHandler)
    threading.Thread(target=archive_server.serve_forever,daemon=True).start()
    LOCAL_BASE=f'http://127.0.0.1:{archive_server.server_port}/'
    COMPLETE_BASE=LOCAL_BASE+'complete/'
    RELEASE_BASE=LOCAL_BASE+'release/'
    browser = playwright.chromium.launch(executable_path=os.environ.get('GTS_BROWSER', '/usr/bin/chromium'), args=['--no-sandbox'])
    context = browser.new_context(viewport={'width':1366,'height':900})
    context.set_default_navigation_timeout(90000)
    context.route('**/*',lambda route:route.continue_() if route.request.url.startswith(LOCAL_BASE) or route.request.url.startswith('data:') else route.abort())
    page = context.new_page()
    page.on('pageerror', lambda error: errors.append(str(error)))
    for name in complete_entries:
        page.goto(COMPLETE_BASE+'START-HERE.html', wait_until='networkidle')
        expect(page.get_by_role('navigation',name='Game versions').get_by_role('link')).to_have_count(4)
        for width in [1366,320]:
            page.set_viewport_size({'width':width,'height':900})
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
            if name.startswith('Full-game/'):
                page.screenshot(path=f'test-results/complete-launcher-{width}.png',full_page=True)
        page.locator(f'a[href="{name}"]').click(timeout=90000)
        expect(page).to_have_url(COMPLETE_BASE+complete.get('sharedGameLaunchers',{}).get(name,name))
        if name.startswith('Level2/'):
            expect(page.locator('.level-two')).to_be_visible()
        elif name.startswith('Level3/'):
            expect(page.locator('.level-three')).to_be_visible()
        elif name.startswith('Full-game/'):
            expect(page.locator('.opening-scene .stage')).to_have_attribute('data-beat','title')
        else:
            expect(page.get_by_role('heading',name='One metric.',exact=True)).to_be_visible()
    context.close()
    checks.append('The actual complete-ZIP launcher fits desktop/phone, starts the full game at the opening and opens each standalone level directly offline')
    context = browser.new_context(viewport={'width': 1366, 'height': 768})
    context.set_default_navigation_timeout(90000)
    context.route('**/*',lambda route:route.continue_() if route.request.url.startswith(LOCAL_BASE) or route.request.url.startswith('data:') else route.abort())
    active_artifact['name']='Level2.html'
    page = context.new_page()
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.clock.install()
    page.goto(RELEASE_BASE, wait_until='networkidle')
    expect(page.get_by_role('button',name='Restart',exact=True)).to_have_count(0)
    expect(page).to_have_title('Gaming the System')
    expect(page.locator('.level-two')).to_have_attribute('data-phase', 'intro')
    advance(page, 8)
    expect(page.locator('.level-two')).to_have_attribute('data-phase','choose',timeout=8000)
    expect(page.locator('.level-two')).to_have_attribute('data-phase', 'choose')
    expect(page.get_by_role('button', name='Guide', exact=True)).to_have_count(0)
    for id in ['prep', 'part', 'focus']: page.get_by_test_id('level2-metric-' + id).click()
    page.get_by_role('button', name='Run evaluation', exact=True).click()
    advance(page, 6)
    scene(page)
    cover_gaps(page)
    scene(page)
    expect(page.get_by_role('heading', name='Would more metrics help learning?', exact=True)).to_be_visible()
    page.get_by_role('button', name='Test more metrics', exact=True).click()
    advance(page, 30)
    expect(page.locator('.l2-reported-count')).to_have_text('100')
    expect(page.locator('.l2-matrix [data-active=true]')).to_have_count(100)
    scene(page, lines=2)
    expect(page.get_by_role('heading', name='More metrics. Still chasing marks.', exact=True)).to_be_visible()
    expect(page.get_by_role('button', name='Continue to Level 3', exact=True)).to_be_disabled()
    expect(page.get_by_role('button', name='Guide', exact=True)).to_have_count(0)
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    checks.append('Packaged Level2.html completes 3 → 6 → 10 → 25 → 100 offline with normal motion')
    context.close()
    context = browser.new_context()
    context.set_default_navigation_timeout(90000)
    context.route('**/*',lambda route:route.continue_() if route.request.url.startswith(LOCAL_BASE) or route.request.url.startswith('data:') else route.abort())
    active_artifact['name']='Level3.html'
    page = context.new_page()
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.clock.install()
    page.goto(RELEASE_BASE, wait_until='networkidle')
    choose_three(page);weights_three(page,[34,33,33])
    page.get_by_role('button',name='Try another split',exact=True).click()
    weights_three(page,[70,20,10])
    page.get_by_role('button',name='Compare the results',exact=True).click()
    expect(page.locator('.l3-compare-table thead th[data-kind="player"]')).to_have_count(2)
    page.get_by_role('button',name='Test another idea',exact=True).click()
    page.get_by_role('button',name='Back to comparison',exact=True).click()
    expect(page.locator('.l3-compare-table thead th[data-kind="player"]')).to_have_count(2)
    page.get_by_role('button',name='Test another idea',exact=True).click()
    weights_three(page,[10,70,20])
    page.get_by_role('button',name='Compare the results',exact=True).click()
    expect(page.locator('.near-even .l3-row-weight')).to_have_text(['34%','33%','33%'])
    expect(page.locator('.l3-compare-table td[data-run="2"] .l3-row-weight')).to_have_text(['70%','20%','10%'])
    expect(page.locator('.l3-compare-table thead th[data-kind="player"]')).to_have_count(3)
    checks.append('Packaged standalone Level3.html compares after two tests and can add an optional third, keeping all actual results offline')
    context.close()
    context = browser.new_context()
    context.set_default_navigation_timeout(90000)
    context.route('**/*',lambda route:route.continue_() if route.request.url.startswith(LOCAL_BASE) or route.request.url.startswith('data:') else route.abort())
    active_artifact['name']='Level1.html'
    page = context.new_page()
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(RELEASE_BASE, wait_until='networkidle')
    page.add_init_script("addEventListener('message',event=>{if(event.source===document.querySelector('iframe')?.contentWindow&&event.data?.channel==='release-identity-audit')window.releaseIdentityAudit=event.data.audit})")
    page.reload(wait_until='networkidle')
    level_one(page)
    expect(page.get_by_role('button', name='Continue to Level 2', exact=True)).to_have_count(0)
    expect(page.locator('.level-two')).to_have_count(0)
    page.get_by_role('button', name='Try another metric', exact=True).click()
    expect(page.get_by_role('heading', name='What will count in the next assessment?', exact=True)).to_be_visible()
    checks.append('Packaged Level1.html uses the approved report, normal-speed cinematic, matching name/colours and settlement; Try another resets it without entering Level 2')
    page.reload(wait_until='networkidle')
    expect(page.get_by_role('dialog', name='Workbench guide')).to_be_visible()
    expect(page.locator('.level-one')).to_be_visible()
    checks.append('Standalone Level 1 reload starts a fresh Level 1 run')
    context.close()
    context = browser.new_context()
    context.set_default_navigation_timeout(90000)
    context.route('**/*',lambda route:route.continue_() if route.request.url.startswith(LOCAL_BASE) or route.request.url.startswith('data:') else route.abort())
    active_artifact['name']='Gaming-the-System.html'
    page = context.new_page()
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.add_init_script("addEventListener('message',event=>{if(event.source===document.querySelector('iframe')?.contentWindow&&event.data?.channel==='release-identity-audit')window.releaseIdentityAudit=event.data.audit})")
    page.goto(RELEASE_BASE, wait_until='networkidle')
    opening(page)
    expect(page.locator('.maya-bubble .speaker-name')).to_have_text('Riley Chen & 李')
    level_one(page)
    page.get_by_role('button', name='Sound on', exact=True).click()
    page.get_by_role('button', name='Continue to Level 2', exact=True).click()
    expect(page.locator('.level-two')).to_have_attribute('data-phase', 'intro')
    page.clock.install()
    expect(page.get_by_role('button', name='Sound off', exact=True)).to_be_visible()
    advance(page, 8)
    expect(page.locator('.level-two')).to_have_attribute('data-phase','choose',timeout=8000)
    for id in ['prep', 'part', 'focus']: page.get_by_test_id('level2-metric-' + id).click()
    page.get_by_role('button', name='Run evaluation', exact=True).click()
    advance(page, 6)
    expect(page.locator('.l2-reported-count')).to_have_text('3')
    checks.append('Packaged combined game continues from the current Level 1 into playable Level 2 and keeps sound preference')
    finish_two(page)
    page.get_by_role('button',name='Continue to Level 3',exact=True).click()
    expect(page.locator('.level-three')).to_be_visible()
    expect(page.get_by_role('button',name='Sound off',exact=True)).to_be_visible()
    choose_three(page);weights_three(page,[70,20,10])
    expect(page.get_by_role('button',name='Try another split',exact=True)).to_be_visible()
    expect(page.locator('.level-three .maya-bubble .speaker-name').first).to_have_text('Riley Chen & 李')
    checks.append('Packaged combined game carries the opening name, including ampersand and Chinese, through Level 1 UI, teacher/Alex captions, email and playable Levels 2–3')
    page.reload(wait_until='networkidle')
    expect(page.locator('.opening-scene .stage')).to_have_attribute('data-beat','title')
    expect(page.locator('.level-one')).to_have_count(0)
    checks.append('Combined preview reload starts at the opening rather than restoring a level or player identity')
    context.close()
    browser.close()
    archive_server.shutdown()
assert not errors, errors
checks.append('Packaged entries have no browser runtime errors')
Path('test-results').mkdir(exist_ok=True)
Path('test-results/release-results.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'runtimeErrors':errors},indent=2)+'\n')
for check in checks: print('PASS',check)
