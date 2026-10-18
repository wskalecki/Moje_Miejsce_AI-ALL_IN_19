"""Generate background music with Lyria 3 Pro through OpenRouter. Usage: python3 music_or.py <out-stem> "<prompt>" """
import base64, json, os, sys, urllib.request
KEY = os.environ["OPENROUTER_API_KEY"]
out, prompt = sys.argv[1], sys.argv[2]
body = {"model": os.environ.get("MUSIC_MODEL", "google/lyria-3-pro-preview"), "modalities": ["text", "audio"],
        "messages": [{"role": "user", "content": prompt}], "stream": True}
req = urllib.request.Request("https://openrouter.ai/api/v1/chat/completions", data=json.dumps(body).encode(),
                             headers={"Content-Type": "application/json", "Authorization": f"Bearer {KEY}"})
chunks, text = [], []
try:
    resp = urllib.request.urlopen(req, timeout=900)
except urllib.error.HTTPError as e:
    sys.exit(e.read().decode()[:800])
for line in resp:
    line = line.decode().strip()
    if not line.startswith("data: ") or line == "data: [DONE]":
        continue
    ev = json.loads(line[6:])
    if "error" in ev:
        sys.exit(json.dumps(ev["error"]))
    delta = (ev.get("choices") or [{}])[0].get("delta", {})
    if delta.get("content"):
        text.append(delta["content"])
    if (delta.get("audio") or {}).get("data"):
        chunks.append(delta["audio"]["data"])
print("text:", "".join(text)[:500])
if chunks:
    raw = b"".join(base64.b64decode(c) for c in chunks)
    ext = "mp3" if raw[:3] == b"ID3" or raw[:2] == b"\xff\xfb" else ("wav" if raw[:4] == b"RIFF" else "bin")
    open(f"{out}.{ext}", "wb").write(raw)
    print("\nsaved", f"{out}.{ext}", len(raw))
