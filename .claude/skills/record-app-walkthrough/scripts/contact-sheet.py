#!/usr/bin/env python3
"""Contact sheets for reviewing a video by eye: one labelled frame every N seconds, 12 per sheet.

    python3 contact-sheet.py VIDEO OUT_DIR [--every 5] [--at 2,9,14.5]

Needs ffmpeg and Pillow. Open the sheets with the Read tool (they are images) and check every beat.
"""
import argparse
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw

ap = argparse.ArgumentParser()
ap.add_argument('video')
ap.add_argument('out')
ap.add_argument('--every', type=float, default=5.0, help='seconds between frames')
ap.add_argument('--at', help='comma-separated timestamps instead of --every')
a = ap.parse_args()

out = Path(a.out)
out.mkdir(parents=True, exist_ok=True)
dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', a.video]))
times = [float(t) for t in a.at.split(',')] if a.at else [round(i * a.every, 2) for i in range(int(dur // a.every) + 1)]

frames = []
for t in times:
    f = out / f'f_{t:08.2f}.jpg'
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-ss', str(t), '-i', a.video, '-frames:v', '1', '-vf', 'scale=640:-1', str(f)], check=True)
    if f.exists():
        frames.append((t, f))

for k in range(0, len(frames), 12):
    sheet = Image.new('RGB', (640 * 3, 360 * 4), 'white')
    for i, (t, f) in enumerate(frames[k:k + 12]):
        im = Image.open(f).resize((640, 360))
        d = ImageDraw.Draw(im)
        d.rectangle([0, 0, 76, 24], fill='black')
        d.text((5, 5), f'{t:.1f}s', fill='white')
        sheet.paste(im, ((i % 3) * 640, (i // 3) * 360))
    path = out / f'sheet{k // 12}.jpg'
    sheet.save(path, quality=82)
    print(path)
