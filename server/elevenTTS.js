// const axios = require('axios');
// const fs = require('fs');
// const { exec } = require('child_process');
// const path = require('path');
// const dotenv = require("dotenv");
// dotenv.config();

// const apiKey = process.env.ELEVEN_API_KEY;
// const voiceId = 'EXAVITQu4vr4xnSDxMaL';

// // Args: node elevenTTS.js "Hello world" "tts_123.mp3"
// const text = process.argv[2];
// const mp3File = process.argv[3] || "output.mp3";
// const wavFile = mp3File.replace(/\.mp3$/, ".wav");
// const visemeFile = mp3File.replace(/\.mp3$/, ".rhubarb.json");

// if (!text) {
//   console.error("❌ No text provided.");
//   process.exit(1);
// }

// const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

// axios({
//   method: "post",
//   url,
//   data: {
//     text,
//     model_id: "eleven_multilingual_v2",
//     voice_settings: { stability: 0.5, similarity_boost: 0.7 },
//   },
//   responseType: "stream",
//   headers: {
//     "xi-api-key": apiKey,
//     "Content-Type": "application/json",
//   },
// })
//   .then((response) => {
//     const writer = fs.createWriteStream(mp3File);
//     response.data.pipe(writer);

//     writer.on("finish", () => {
//       console.log("✅ MP3 saved:", mp3File);

//       // Convert MP3 → WAV
//       const cmdFfmpeg = `ffmpeg -y -i "${mp3File}" -ar 22050 -ac 1 "${wavFile}"`;
//       exec(cmdFfmpeg, (err1, stdout1, stderr1) => {
//         if (err1) {
//           console.error("❌ ffmpeg Error:", stderr1);
//           process.exit(1);
//         }

//         // Run Rhubarb on WAV
//         const cmdRhubarb = `rhubarb "${wavFile}" -o "${visemeFile}" -f json`;
//         exec(cmdRhubarb, (err2, stdout2, stderr2) => {
//           if (err2) {
//             console.error("❌ Rhubarb Error:", stderr2);
//             process.exit(1);
//           }

//           console.log("✅ Viseme JSON saved:", visemeFile);
//           process.exit(0);
//         });
//       });
//     });
//   })
//   .catch((error) => {
//     console.error("❌ Error generating TTS:", error.response?.data || error.message);
//     process.exit(1);
//   });
const fs = require("fs");
const axios = require("axios");
require("dotenv").config();

const ELEVEN_API_KEY = process.env.ELEVEN_API_KEY;
if (!ELEVEN_API_KEY) {
  console.error("❌ Missing ELEVEN_API_KEY in .env");
  process.exit(1);
}

const VOICE_ID = process.env.ELEVEN_VOICE_ID || "21m00Tcm4TlvDq8ikWAM"; // multilingual voice

async function generateTTS(text, outputFile) {
  try {
    console.log(`🎤 Sending text to ElevenLabs: "${text}"`);

    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        text: text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.3,
          similarity_boost: 0.7,
        },
      },
      {
        headers: {
          "xi-api-key": ELEVEN_API_KEY,
          "Content-Type": "application/json",
          "Accept": "audio/mpeg",
        },
        responseType: "arraybuffer", // 👈 handle audio binary safely
        validateStatus: () => true, // 👈 let us capture errors instead of throwing
      }
    );

    // 🔍 Detect if ElevenLabs returned JSON error instead of audio
    const contentType = response.headers["content-type"];
    if (contentType && contentType.includes("application/json")) {
      const errorJson = JSON.parse(Buffer.from(response.data).toString("utf-8"));
      console.error("❌ ElevenLabs API Error:", errorJson);
      process.exit(1);
    }

    if (response.status !== 200) {
      console.error("❌ ElevenLabs request failed:", response.status, response.statusText);
      process.exit(1);
    }

    fs.writeFileSync(outputFile, response.data);
    console.log(`✅ TTS saved to: ${outputFile}`);
  } catch (err) {
    console.error("❌ Error generating TTS:", err.message);
    process.exit(1);
  }
}

// Run as CLI: node elevenTTS.js "Hello world" "output.mp3"
const [,, text, outFile] = process.argv;
if (!text || !outFile) {
  console.error("Usage: node elevenTTS.js \"Text to speak\" output.mp3");
  process.exit(1);
}

generateTTS(text, outFile);
