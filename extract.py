import json

transcript_path = r'C:\Users\Girija\.gemini\antigravity-ide\brain\9d9705ae-1809-4e97-9603-aa566851f4be\.system_generated\logs\transcript_full.jsonl'

with open(transcript_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

htmls = []
for line in lines:
    try:
        obj = json.loads(line)
        calls = obj.get('tool_calls', [])
        for call in calls:
            args = call.get('arguments', '')
            if isinstance(args, str):
                try:
                    args = json.loads(args)
                except:
                    pass
            if isinstance(args, dict):
                if 'TargetFile' in args and 'index.html' in args['TargetFile']:
                    if 'CodeContent' in args:
                        htmls.append(args['CodeContent'])
    except Exception as e:
        pass

if htmls:
    print(f"Found {len(htmls)} writes to index.html")
    with open('old_index.html', 'w', encoding='utf-8') as out:
        out.write(htmls[0])
    with open('old_index_last.html', 'w', encoding='utf-8') as out:
        out.write(htmls[-2] if len(htmls) > 1 else htmls[0])
    print("Wrote them to old_index.html and old_index_last.html")
else:
    print("No writes to index.html found")
