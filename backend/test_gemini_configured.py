import google.generativeai as genai
import sys

sys.stdout.reconfigure(encoding='utf-8')

GEMINI_API_KEY = "AIzaSyCsi2y63IwP6aAZLcKCujAzpvmPL8vBs4o"
genai.configure(api_key=GEMINI_API_KEY)

try:
    model = genai.GenerativeModel('gemini-2.5-flash-lite')
    response = model.generate_content("Hello")
    print(f"Success: {response.text}")
except Exception as e:
    print(f"Error: {e}")
