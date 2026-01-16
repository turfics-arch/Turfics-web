import google.generativeai as genai
import sys

sys.stdout.reconfigure(encoding='utf-8')

GEMINI_API_KEY = "AIzaSyCLxC5EUl_ceAWNF3yEPQhVwyGoBZoGdIY"
genai.configure(api_key=GEMINI_API_KEY)

models_to_test = ["gemini-1.5-flash", "gemini-pro", "gemini-1.5-pro", "gemini-1.0-pro"]

for m_name in models_to_test:
    try:
        model = genai.GenerativeModel(m_name)
        response = model.generate_content("Hi")
        print(f"{m_name}: WORKS")
        break # Found one that works
    except Exception as e:
        print(f"{m_name}: FAILED - {str(e)[:50]}")
