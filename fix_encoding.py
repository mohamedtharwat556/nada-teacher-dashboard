import sys
import os

file_path = r'c:\Users\yas\Downloads\nada th\index.html'

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        text = f.read()
        
    # Attempt to reverse the mojibake
    # The bytes were interpreted as Windows-1252 / latin-1, and saved as UTF-8.
    # So we encode to latin-1 to get the original bytes back, then decode as UTF-8.
    fixed_text = text.encode('latin-1').decode('utf-8')
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(fixed_text)
    print("Successfully restored the Arabic text in index.html")
except Exception as e:
    print(f"Error: {e}")
