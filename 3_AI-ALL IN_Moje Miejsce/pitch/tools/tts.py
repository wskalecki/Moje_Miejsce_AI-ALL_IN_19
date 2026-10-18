"""Render the voiceover per scene with ElevenLabs v4 through OpenRouter's speech endpoint.

Usage: OPENROUTER_API_KEY=... python3 tts.py [scene-id ...]   (text and voice live in script.json)
"""
import json, os, sys, urllib.request

KEY = os.environ["OPENROUTER_API_KEY"]
here = os.path.dirname(os.path.abspath(__file__))
cfg = json.load(open(os.path.join(here, "script.json")))
only = set(sys.argv[1:])
for sc in cfg["scenes"]:
    if only and sc["id"] not in only:
        continue
    body = {"model": cfg["model"], "voice": cfg["voice"], "input": sc["text"], "response_format": "mp3"}
    req = urllib.request.Request("https://openrouter.ai/api/v1/audio/speech", data=json.dumps(body).encode(),
                                 headers={"Content-Type": "application/json", "Authorization": f"Bearer {KEY}"})
    out = os.path.join(here, "..", "assets", "vo", f'{sc["id"]}.mp3')
    with urllib.request.urlopen(req, timeout=300) as r, open(out, "wb") as f:
        f.write(r.read())
    print("saved", os.path.normpath(out))
