# 📻 Radio News Reader

## 🔹 Features

- Upload or paste news text and categorize it automatically.
- Read news aloud using TTS.
- 3D animated avatar with lip-sync and morph targets (mouth movements, smile).
- Upload and display images/videos for each news item.
- Play all news sequentially or individually.
- Media preview in Angular template.
- Multiple avatars to choose from.

---

## 🛠 Tech Stack

- **Frontend:** Angular, TypeScript, Three.js
- **Backend:** Node.js, Express
- **TTS:** ElevenLabs API
- **File Parsing:** PDF, DOCX, TXT (via `pdf-parse` and `mammoth`)
- **Lip-sync:** Rhubarb lip-sync
- **Styling:** SCSS

---

## ⚡ Installation

1. **Clone the repo**

git clone https://github.com/eyachamekh/Radio.git
cd Radio

---

## ⚡ Install dependencies
# Frontend
cd client
npm install

# Backend
cd ../server
npm install

---

## Setup Environment Variables

Setup Environment Variables

# OPENAI_API_KEY=your_open_api_key
# ELEVEN_API_KEY=your_eleven_api_key

---

## Run the backend
cd server
node index.js

---

##Run the frontend
cd client
ng serve

---

##⚠️ Notes
Make sure Rhubarb is installed for lip-sync functionality:
rhubarb --version


