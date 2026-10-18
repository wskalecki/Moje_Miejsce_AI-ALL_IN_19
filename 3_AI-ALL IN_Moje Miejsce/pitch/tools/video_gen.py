"""Generate a b-roll clip via OpenRouter's video API (default: google/veo-3.1, no audio).

Usage: OPENROUTER_API_KEY=... python3 video_gen.py <out.mp4> "<prompt>" [model]
"""
import json, os, sys, time, urllib.request

KEY = os.environ["OPENROUTER_API_KEY"]
API = "https://openrouter.ai/api/v1/videos"


def call(url, body=None, raw=False):
    req = urllib.request.Request(url, data=json.dumps(body).encode() if body else None,
                                 headers={"Content-Type": "application/json", "Authorization": f"Bearer {KEY}"})
    with urllib.request.urlopen(req) as r:
        return r.read() if raw else json.load(r)


out, prompt = sys.argv[1], sys.argv[2]
model = sys.argv[3] if len(sys.argv) > 3 else "google/veo-3.1"
job = call(API, {"model": model, "prompt": prompt, "duration": 8, "resolution": "1080p",
                 "aspect_ratio": "16:9", "generate_audio": False})
print("job", job.get("id"), job.get("status"), flush=True)
while True:
    time.sleep(20)
    st = call(job["polling_url"])
    print("status", st["status"], flush=True)
    if st["status"] == "completed":
        open(out, "wb").write(call(st["unsigned_urls"][0], raw=True))
        print("saved", out)
        break
    if st["status"] == "failed":
        sys.exit(f"failed: {st.get('error')}")
