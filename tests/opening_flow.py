"""Drive the real opening; keep release checks independent of excluded old tests."""
from playwright.sync_api import expect


def start_game(page, player_name):
    # Match the release scenario: begin muted, then verify the header can unmute.
    page.locator('.opening-scene .sound-toggle').click()
    page.get_by_role('button', name='START GAME', exact=True).click()
    page.get_by_label('What name should we put on it?').fill(player_name)
    page.get_by_role('button', name='TAKE YOUR SEAT').click()
    page.get_by_role('button', name='Open urgent email from University Management').click()
    page.get_by_role('button', name='VISIT CLASSROOM', exact=True).click()
    world = page.locator('.classroom-world')
    for student in ['sleeping', 'phone', 'unprepared']:
        hotspot = world.locator('.hotspot-' + student)
        expect(hotspot).to_be_enabled()
        hotspot.click()
        expect(hotspot).to_have_attribute('data-inspected', 'true')
        if student == 'phone':
            encounter = page.locator('.alex-encounter')
            for line in ['intro', '0', '1', '2', '3']:
                expect(encounter).to_have_attribute('data-line', line)
                action = encounter.locator('button.opening-action')
                expect(action).to_be_enabled()
                action.click()
            expect(encounter).to_have_count(0)
    page.get_by_role('button', name='RETURN TO OFFICE').click()
    expect(page.locator('.first-handoff')).to_be_visible(timeout=30000)
    expect(page.locator('.first-handoff-outgoing')).to_have_count(0, timeout=30000)
    page.get_by_role('button', name='Skip guide', exact=True).click()
    expect(page.locator('.level-one')).to_be_visible()
