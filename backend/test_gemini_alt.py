import google.generativeai as genai
import sys

sys.stdout.reconfigure(encoding='utf-8')

GEMINI_API_KEY = "AIzaSyCLxC5EUl_ceAWNF3yEPQhVwyGoBZoGdIY"
genai.configure(api_key=GEMINI_API_KEY)

try:
    print("Testing gemini-2.0-flash-lite-preview-02-05...")
    model = genai.GenerativeModel('gemini-2.0-flash-lite-preview-02-05')
    response = model.generate_content("Hello")
    print(f"Success: {response.text}")
except Exception as e:
    print(f"Error: {e}")
