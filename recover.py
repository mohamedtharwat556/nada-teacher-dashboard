import json
import os

transcript_path = r"C:\Users\yas\.gemini\antigravity-ide\brain\28e0b540-c7b8-41e6-9a54-7cd8b4ea4982\.system_generated\logs\transcript_full.jsonl"
index_html = ""
script_js = ""

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get('type') == 'TOOL_RESPONSE':
                content = data.get('content', '')
                if 'File Path: `file:///c:/Users/yas/Downloads/nada%20th/index.html`' in content:
                    index_html = content
                if 'File Path: `file:///c:/Users/yas/Downloads/nada%20th/script.js`' in content:
                    script_js = content
        except Exception:
            pass

with open('recover_info.txt', 'w', encoding='utf-8') as f:
    f.write(f"index_html found: {len(index_html) > 0}\n")
    f.write(f"script_js found: {len(script_js) > 0}\n")
    
if index_html:
    with open('index_recovered.html', 'w', encoding='utf-8') as f:
        f.write(index_html)
if script_js:
    with open('script_recovered.js', 'w', encoding='utf-8') as f:
        f.write(script_js)
