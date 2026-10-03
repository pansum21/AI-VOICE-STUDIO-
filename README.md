# Free AI Voice Studio & Voice Cloning System

A complete, 100% free, unlimited AI voice solution with **zero subscription fees**, **no API keys required**, and **no character limits**.

---

## 🚀 Part 1: Local Free Neural Voice Studio (Ready Now!)

The local studio web app is **live and running**:
- **Studio URL**: [http://localhost:3000](http://localhost:3000)
- **Directory**: `C:\Users\supri\.gemini\antigravity\scratch\free_voice_studio`

### Features
- **ElevenLabs Counterpart Voices**:
  - **Guy (Steady Broadcaster)** ➔ Matches ElevenLabs *Daniel*
  - **Prabhat (Deep Fiction Narrator)** ➔ Matches ElevenLabs *Aravinda*
  - **Christopher (Cinematic Storyteller)** ➔ Matches ElevenLabs *Adam / Antony*
  - **Brian (Natural & Engaging)** ➔ Matches ElevenLabs *Brian / Marcus*
  - **Ryan (British Baritone)** ➔ Matches ElevenLabs *George / Callum*
  - **Aria (Expressive Storyteller)** ➔ Matches ElevenLabs *Rachel / Sarah*
  - **Jenny (Friendly Assistant)** ➔ Matches ElevenLabs *Bella / Nicole*
  - **Neerja (Natural Indian English)** ➔ Natural corporate narrator
  - **Madhur & Swara** ➔ Deep Hindi male & female voices
- **Unlimited Characters**: Type full articles, scripts, and stories.
- **Controls**: Adjust rate (speed) and pitch in real time.
- **One-Click Download**: Saves directly as 96kbps high-quality MP3s.
- **Generation History**: Browse, replay, and download previous outputs.

### CLI Usage (Command Line)
Generate audio directly from PowerShell or Command Prompt:
```bash
# Generate with Daniel voice
node cli.js "Welcome back to the broadcast." --voice daniel -o daniel_news.mp3

# Generate with Aravinda voice
node cli.js "The dark secrets hidden in the woods." --voice aravinda -o aravinda_story.mp3
```

---

## 🎙️ Part 2: Zero-Shot Voice Cloning System

Clone the exact timbre, accent, and cadence from your synced ElevenLabs audio files using open-source AI models:

- **Reference Voices Ready**:
  - `daniel_steady_broadcaster.mp3` in [reference_voices/](file:///C:/Users/supri/.gemini/antigravity/scratch/free_voice_studio/voice_cloning/reference_voices/daniel_steady_broadcaster.mp3)
  - `aravinda_dark_fiction_narrator.mp3` in [reference_voices/](file:///C:/Users/supri/.gemini/antigravity/scratch/free_voice_studio/voice_cloning/reference_voices/aravinda_dark_fiction_narrator.mp3)
- **Google Colab Notebook**: [Voice_Cloning_Colab.ipynb](file:///C:/Users/supri/.gemini/antigravity/scratch/free_voice_studio/voice_cloning/Voice_Cloning_Colab.ipynb) (Runs on free T4 GPU in 1 click)
- **Detailed Step-by-Step Guide**: [CLONING_GUIDE.md](file:///C:/Users/supri/.gemini/antigravity/scratch/free_voice_studio/voice_cloning/CLONING_GUIDE.md)
