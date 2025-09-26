require('dotenv').config()
const express = require('express');
const multer = require('multer');//file upload
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const cors = require('cors');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const path = require('path');
const axios = require('axios');
require('dotenv').config();


const ELEVEN_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; 
if (!process.env.ELEVEN_API_KEY) {
  console.warn('⚠️ ELEVEN_API_KEY is not set. Add it to .env and restart the server.');
}
const ELEVEN_API_KEY = process.env.ELEVEN_API_KEY;


// Check if Rhubarb is installed
exec('rhubarb --version', (err) => { 
  if (err) console.warn("⚠️ Rhubarb not installed. Lip-sync won't work.");
  else console.log("✅ Rhubarb detected!");
});

//Import GPT categorizer
const { categorizeWithGPT } = require('./smartCategorizer');

const app = express();
app.use(express.json());
app.use(cors());
// app.use(bodyParser.json());

/////// app.use('/audio', express.static(__dirname));
 const AUDIO_DIR = path.join(__dirname, 'audio');
 if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });
// Allow CORS for audio files
app.use('/audio', express.static(AUDIO_DIR, {
  setHeaders: (res, path, stat) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
}));

app.use('/audio', express.static(AUDIO_DIR));


// Root check
app.get('/', (req, res) => {
  res.json({ message: '🎙️ Radio backend is working!' });
});

app.listen(3000, () => {
  console.log('✅ Backend running on http://localhost:3000');
});

// Clean text function
function cleanText(text) {
  return text
    .replace(/[\u{1F600}-\u{1F6FF}]/gu, '') // remove emojis
    .replace(/[^\p{L}\p{N}\s.,!?'"-]/gu, '') // keep Arabic + letters
    .replace(/([.!?]){2,}/g, '$1')          // fix repeated punctuation
    .replace(/\s{2,}/g, ' ')                // fix extra spaces
    .trim();
}

// Sentence splitter
function splitIntoSentences(text) {
  return text
    .split(/(?<=[\.!\?])\s+|\n+/)
    .map(s => s.trim())
    .filter(Boolean);
}

// Traditional categorization
app.post('/api/news/process', (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'No text provided' });

  const cleaned = cleanText(text);

    const categories = {
    رياضة: [],
    تكنولوجيا: [],
    سياسة: [],
    ثقافة: [],
    تعليم: [],
    أخرى: [],
    };


const keywordMap = {
  رياضة: ['football', 'fifa', 'goal', 'match', 'player', 'coach', 'league', 'كرة', 'قدم', 'مباراة', 'فريق', 'لاعب', 'رياضة', 'مدرب'],
  تكنولوجيا: ['ai', 'machine learning', 'robot', 'chip', 'iphone', 'software', 'tech', 'startup', 'تكنولوجيا', 'ذكاء', 'اصطناعي', 'روبوت', 'حاسوب', 'هاتف', 'برمجيات', 'تطبيق'],
  سياسة: ['president', 'election', 'parliament', 'minister', 'government', 'regulation', 'law', 'رئيس', 'انتخابات', 'حكومة', 'برلمان', 'وزير', 'قانون', 'سياسة'],
  ثقافة: ['festival', 'museum', 'cinema', 'art', 'theatre', 'book', 'culture', 'مهرجان', 'ثقافة', 'متحف', 'سينما', 'فن', 'مسرح', 'كتاب'],
  تعليم: ['مدرسة', 'تعليم', 'مناهج', 'طلاب', 'دراسة', 'جامعة', 'امتحان', 'اختبار', 'تربية', 'معلم', 'أستاذ', 'درس'],
};


  const sentences = splitIntoSentences(cleaned);

  sentences.forEach((sentence) => {
    const lc = sentence.toLowerCase();
    let bestCategory = 'other';
    let bestScore = 0;

    Object.entries(keywordMap).forEach(([cat, words]) => {
      const score = words.reduce((acc, w) => acc + (lc.includes(w.toLowerCase()) ? 1 : 0), 0);
      if (score > bestScore) {
        bestScore = score;
        bestCategory = cat;
      }
    });

    categories[bestCategory].push(sentence);
  });

  res.json({
    cleanedText: cleaned,
    categories
  });
});

// Smart categorization using GPT
app.post('/api/news/smart-process', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'No text provided' });

  const cleaned = cleanText(text);
  const sentences = splitIntoSentences(cleaned);

  const categories = {
    sport: [],
    technology: [],
    politics: [],
    culture: [],
    other: [],
  };

  for (const sentence of sentences) {
    const category = await categorizeWithGPT(sentence);
    categories[category].push(sentence);
  }

  res.json({
    cleanedText: cleaned,
    categories
  });
});


app.post('/api/news/tts', (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text is required' });

  const ts = Date.now();
  const mp3File = path.join(AUDIO_DIR, `tts_${ts}.mp3`);
  const wavFile = mp3File.replace(/\.mp3$/, '.wav');
  const visemeFile = mp3File.replace(/\.mp3$/, '.rhubarb.json');

  const cmdTTS = `node elevenTTS.js "${text}" "${mp3File}"`;

exec(cmdTTS, (err) => {
  if (err) {
    console.error("❌ TTS failed", err);
    return res.status(500).json({ error: 'TTS failed' });
  }

  // Always respond with audioUrl, visemes optional
  const sendResponse = () => {
    let visData = [];
    if (fs.existsSync(visemeFile)) {
      try {
        visData = JSON.parse(fs.readFileSync(visemeFile, 'utf8'));
      } catch (e) {
        console.warn("⚠️ Viseme parse failed:", e);
      }
    }

    res.json({
      audioUrl: `http://localhost:3000/audio/tts_${ts}.mp3`,
      visemes: visData
    });
  };

  // If MP3 exists immediately → send right away
  if (fs.existsSync(mp3File)) {
    sendResponse();
  } else {
    // Wait a little for MP3 creation
    setTimeout(sendResponse, 1000);
  }
});

});

// app.post('/api/news/tts', (req, res) => {
//   const { text, lang = 'ar' } = req.body;
//   if (!text) return res.status(400).json({ error: 'Text is required' });

//   const filename = `tts_${Date.now()}.mp3`;
//   const filepath = path.join(__dirname, filename);
//   const cmd = `node elevenTTS.js "${text}" "${filepath}"`;

//   exec(cmd, (error) => {
//     if (error) {
//       console.error(`❌ ElevenLabs TTS Error: ${error.message}`);
//       return res.status(500).json({ error: 'TTS failed' });
//     }

//     res.json({ audioUrl: `http://localhost:3000/audio/${filename}` });
//   });
// });

// Upload and extract text from PDF, DOCX, or TXT
const upload = multer({ dest: 'uploads/' });

app.post('/api/news/upload', upload.single('file'), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).send('No file uploaded.');

  try {
    let extractedText = '';

    if (file.mimetype === 'application/pdf') {
      const dataBuffer = fs.readFileSync(file.path);
      const data = await pdfParse(dataBuffer);
      extractedText = data.text;
    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ path: file.path });
      extractedText = result.value;
    } else if (file.mimetype === 'text/plain') {
      extractedText = fs.readFileSync(file.path, 'utf8');
    } else {
      return res.status(400).send('Unsupported file type.');
    }

    // Clean the extracted text
    const cleaned = cleanText(extractedText);

    // Remove uploaded file after reading
    fs.unlinkSync(file.path);

    // Return cleaned text
    res.json({ cleanedText: cleaned });

  } catch (err) {
    console.error('❌ Error extracting text:', err);
    res.status(500).send('Failed to extract text.');
  }
});
