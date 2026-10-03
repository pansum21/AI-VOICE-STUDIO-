# Zero-Shot Voice Cloning Guide

Use this guide to clone the exact voice, pitch, and timbre from your downloaded ElevenLabs audio files (**Daniel - Steady Broadcaster** or **Aravinda - Dark Fiction Narrator**) without paying any subscription fees.

---

## Your Reference Voice Files
We extracted high-quality reference audio clips directly into:
- [daniel_steady_broadcaster.mp3](file:///C:/Users/supri/.gemini/antigravity/scratch/free_voice_studio/voice_cloning/reference_voices/daniel_steady_broadcaster.mp3)
- [aravinda_dark_fiction_narrator.mp3](file:///C:/Users/supri/.gemini/antigravity/scratch/free_voice_studio/voice_cloning/reference_voices/aravinda_dark_fiction_narrator.mp3)

---

## Method 1: Google Colab (100% Free T4 GPU - Recommended)

No heavy installation or GPU needed on your local computer.

1. Go to [Google Colab](https://colab.research.google.com).
2. Click **Upload** and upload the file [Voice_Cloning_Colab.ipynb](file:///C:/Users/supri/.gemini/antigravity/scratch/free_voice_studio/voice_cloning/Voice_Cloning_Colab.ipynb).
3. In the top menu, go to **Runtime > Change runtime type**, select **T4 GPU**, and click Save.
4. Run each cell:
   - Cell 1 installs F5-TTS.
   - Cell 2 prompts you to upload your reference audio file (upload `daniel_steady_broadcaster.mp3` or `aravinda_dark_fiction_narrator.mp3`).
   - Cell 3 takes your script text and clones the voice onto the audio.
   - Cell 4 downloads the finished `.wav` file to your PC.

---

## Method 2: Hugging Face Spaces (Instant Web UI in Browser)

You can clone the voice directly in your web browser using free public Hugging Face AI spaces running F5-TTS or XTTS:

1. Open the [F5-TTS Space on Hugging Face](https://huggingface.co/spaces/mrfakename/E2-F5-TTS).
2. In the **Reference Audio** field, drag and drop `daniel_steady_broadcaster.mp3` or `aravinda_dark_fiction_narrator.mp3`.
3. In the **Reference Text** field, type the matching snippet:
   - For Daniel: `"In a quiet village where the shadows whispered secrets"`
   - For Aravinda: `"If you love diving into stories"`
4. In the **Generate Text** box, type whatever new text you want the voice to speak!
5. Click **Generate** and download the resulting audio.

---

## Method 3: Local Python Setup (If you have an NVIDIA GPU)

If your local computer has an NVIDIA GPU and Python installed:

1. Install PyTorch with CUDA:
   ```bash
   pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu121
   pip install TTS
   ```
2. Run the voice clone script:
   ```bash
   python clone_voice.py --ref "reference_voices/daniel_steady_broadcaster.mp3" --text "Hello world from the cloned voice." --gpu --out "daniel_cloned.wav"
   ```
