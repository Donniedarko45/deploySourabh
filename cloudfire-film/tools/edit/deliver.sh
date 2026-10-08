#!/usr/bin/env bash
# Build every deliverable from rendered frames + stems. Re-runnable; each step is independent.
#   tools/edit/deliver.sh            (expects renders/frames/master and renders/frames/vertical)
set -euo pipefail
cd "$(dirname "$0")/../.."
PY=${PY:-/home/user/film-venv/bin/python}
F=renders/final
mkdir -p "$F"
$PY tools/edit/timeline.py --frames renders/frames/master --out timeline/master.otio
$PY tools/edit/conform.py --otio timeline/master.otio --profile master-mp4 --audio audio/stems/mix.wav --out $F/cloudfire-master-16x9.mp4
$PY tools/edit/conform.py --otio timeline/master.otio --profile master-mov --audio audio/stems/mix.wav --out $F/cloudfire-master-high-quality.mov
# clean version: identical picture, music + effects only
ffmpeg -v error -y -i $F/cloudfire-master-16x9.mp4 -i audio/stems/mix-novoice.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart \
  -metadata title="Beneath the Surface — CloudFire (no narration)" $F/cloudfire-no-voice.mp4
$PY tools/edit/cutdowns.py --frames renders/frames/master
$PY tools/edit/conform.py --otio timeline/teaser.otio --profile master-mp4 --audio audio/stems/mix-teaser.wav --fade-out 18 --out $F/cloudfire-teaser-15s.mp4
$PY tools/edit/conform.py --otio timeline/bumper.otio --profile master-mp4 --audio audio/stems/mix-bumper.wav --fade-in 8 --fade-out 14 --out $F/cloudfire-bumper-6s.mp4
$PY tools/captions/captions.py --audio audio/stems/mix.wav --srt $F/cloudfire-subtitles.srt
node tools/captions/burn.mjs --size 1920x1080 --out renders/captions/16x9
node tools/captions/burn.mjs --size 1080x1920 --out renders/captions/9x16
$PY tools/edit/conform.py --otio timeline/master.otio --profile web-1080 --src-size 3840x2160 --audio audio/stems/mix.wav --captions renders/captions/16x9 --out $F/cloudfire-captioned-1080p.mp4
$PY tools/edit/timeline.py --frames renders/frames/vertical --out timeline/vertical.otio
$PY tools/edit/conform.py --otio timeline/vertical.otio --profile vertical --audio audio/stems/mix.wav --out $F/cloudfire-vertical-9x16.mp4
$PY tools/edit/conform.py --otio timeline/vertical.otio --profile vertical --audio audio/stems/mix.wav --captions renders/captions/9x16 --out $F/cloudfire-vertical-9x16-captioned.mp4
node tools/edit/poster.mjs renders/frames/master/f00200.png $F/cloudfire-poster.png
cp renders/animatic/cloudfire-animatic.mp4 $F/cloudfire-animatic.mp4
$PY tools/edit/storyboard.py --frames renders/frames/master --version v2
