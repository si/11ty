
from playwright.sync_api import sync_playwright, expect

def test_duolingo_dashboard():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
        page.on("pageerror", lambda err: print(f"PAGE ERROR: {err}"))

        # Mock the API response
        page.route("**/api/duolingo", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body="""[
                {"id": 1, "date": "2024-01-20", "streak_count": 100, "accuracy_percentage": 95, "words_learned": "Bonjour, Merci", "leaderboard_position": 1},
                {"id": 2, "date": "2024-01-19", "streak_count": 99, "accuracy_percentage": 90, "words_learned": "Au revoir", "leaderboard_position": 2}
            ]"""
        ))

        try:
            print("Navigating...")
            # Navigate to the page
            response = page.goto("http://localhost:8080/duolingo/")
            print(f"Navigation status: {response.status if response else 'None'}")

            # Wait for title
            print("Waiting for title...")
            expect(page.get_by_role("heading", name="Duolingo")).to_be_visible()

            # Wait for chart canvas
            print("Waiting for chart...")
            expect(page.locator("#progressChart")).to_be_visible()

            # Wait for table to be populated
            print("Waiting for table data...")
            # Using partial text match or checking specific cell
            expect(page.locator("#dataTable")).to_contain_text("Bonjour, Merci")

            # Screenshot
            print("Taking screenshot...")
            page.screenshot(path="verification/duolingo_dashboard.png", full_page=True)
            print("Screenshot taken")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png", full_page=True)
        finally:
            browser.close()

if __name__ == "__main__":
    test_duolingo_dashboard()
