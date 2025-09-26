import sys
from gtts import gTTS

text = sys.argv[1]
lang = sys.argv[2]
filename = sys.argv[3]

tts = gTTS(text=text, lang=lang)
tts.save(filename)
