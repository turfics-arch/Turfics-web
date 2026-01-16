import google.generativeai as genai
import os
import sys

# Set encoding
sys.stdout.reconfigure(encoding='utf-8')

GEMINI_API_KEY = "AIzaSyCLxC5EUl_ceAWNF3yEPQhVwyGoBZoGdIY"
genai.configure(api_key=GEMINI_API_KEY)

print("--- AVAILABLE MODELS ---")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"Model: {m.name}")
except Exception as e:
    print(f"Error: {e}")
print("--- END ---")
