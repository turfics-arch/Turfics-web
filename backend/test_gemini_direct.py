import google.generativeai as genai
import os
import sys

# Set encoding to utf-8 just in case
sys.stdout.reconfigure(encoding='utf-8')

GEMINI_API_KEY = "AIzaSyCLxC5EUl_ceAWNF3yEPQhVwyGoBZoGdIY"
genai.configure(api_key=GEMINI_API_KEY)

try:
    print("Listing models:")
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"- {m.name}")
except Exception as e:
    print(f"Error listing models: {e}")
