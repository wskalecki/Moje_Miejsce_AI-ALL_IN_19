"""Transcribe a WAV with Gemini to verify TTS output. Usage: python3 transcribe.py file.wav"""
import base64, json, os, sys, urllib.request
KEY = os.environ["GOOGLE_AI_API_KEY"]
data = base64.b64encode(open(sys.argv[1], "rb").read()).decode()
body = {"contents": [{"parts": [{"inlineData": {"mimeType": ("audio/mpeg" if sys.argv[1].endswith(".mp3") else "audio/wav"), "data": data}},
        {"text": "Transkrybuj CAŁE nagranie słowo w słowo z sygnaturami czasu [mm:ss] co zdanie, łącznie z powtórzeniami, szeptami, dźwiękami niemowymi i ciszą. Nic nie pomijaj."}]}]}
req = urllib.request.Request("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent",
                             data=json.dumps(body).encode(), headers={"Content-Type": "application/json", "x-goog-api-key": KEY})
print(json.load(urllib.request.urlopen(req))["candidates"][0]["content"]["parts"][0]["text"])
