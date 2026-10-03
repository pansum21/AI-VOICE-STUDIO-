"""
Zero-Shot Voice Cloning Script (XTTS-v2 / F5-TTS)
Clones any voice using 5-10 seconds of reference audio (like the synced Daniel & Aravinda files).

Prerequisites:
  pip install TTS torch torchaudio
  (Optional GPU: CUDA-enabled PyTorch)

Usage:
  python clone_voice.py --ref "reference_voices/daniel_steady_broadcaster.mp3" --text "Hello world from the cloned voice." --out "output.wav"
"""

import argparse
import os
import sys

def main():
    parser = argparse.ArgumentParser(description="Zero-Shot AI Voice Cloning")
    parser.add_argument("--ref", type=str, default="reference_voices/daniel_steady_broadcaster.mp3", help="Path to reference audio clip")
    parser.add_argument("--text", type=str, required=True, help="Text for the cloned voice to speak")
    parser.add_argument("--out", type=str, default="cloned_speech.wav", help="Output file path (.wav)")
    parser.add_argument("--lang", type=str, default="en", help="Language code (en, hi, es, fr, de, etc.)")
    parser.add_argument("--gpu", action="store_true", help="Enable CUDA GPU acceleration")

    args = parser.parse_args()

    if not os.path.exists(args.ref):
        print(f"Error: Reference audio file '{args.ref}' not found.")
        sys.exit(1)

    print("\n" + "="*60)
    print("           ZERO-SHOT AI VOICE CLONING (XTTS-v2)")
    print("="*60)
    print(f" Reference Audio: {args.ref}")
    print(f" Target Text:     {args.text}")
    print(f" Language:        {args.lang}")
    print(f" Output File:     {args.out}")
    print(f" GPU Enabled:     {args.gpu}")
    print("="*60 + "\n")

    try:
        from TTS.api import TTS
    except ImportError:
        print("Coqui TTS library is not installed.")
        print("To install, run: pip install TTS torch torchaudio")
        print("\nNote: For zero local setup and free GPU, open the Colab notebook: Voice_Cloning_Colab.ipynb")
        sys.exit(1)

    print("Loading XTTS-v2 voice cloning model (this may take a moment on first run)...")
    tts = TTS(model_name="tts_models/multilingual/multi-dataset/xtts_v2", gpu=args.gpu)

    print("Synthesizing speech with cloned voice characteristics...")
    tts.tts_to_file(
        text=args.text,
        speaker_wav=args.ref,
        language=args.lang,
        file_path=args.out
    )

    print(f"\nVoice cloning complete! Saved to: {args.out}\n")

if __name__ == "__main__":
    main()
