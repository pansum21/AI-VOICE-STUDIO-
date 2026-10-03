import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { EdgeTTS } from 'node-edge-tts';
import { VOICES, FEATURED_VOICES, getAllVoices } from './voices.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, 'generated_audio');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function printUsage() {
  console.log(`
======================================================================
                 FREE AI VOICE STUDIO - CLI TOOL
======================================================================
Usage:
  node cli.js "Your text to speak here" [options]

Options:
  --voice, -v    Voice name, alias, or full voice ID:
                 - daniel     -> Guy (Steady Broadcaster)
                 - aravinda   -> Prabhat (Deep Fiction Narrator)
                 - christopher-> Christopher (Deep American Baritone)
                 - brian      -> Brian (Natural Conversational)
                 - ryan       -> Ryan (British Baritone)
                 - aria       -> Aria (Expressive Storyteller)
                 - jenny      -> Jenny (Friendly Assistant)
                 - neerja     -> Neerja (Natural Indian English)
                 - madhur     -> Madhur (Hindi Deep Narrator)
                 - Any of the 322+ voice IDs (e.g. en-AU-NatashaNeural, en-GB-SoniaNeural, etc.)
                 (Default: daniel)

  --output, -o   Output file path (default: generated_audio/output_<timestamp>.mp3)
  --rate, -r     Speed adjustment (e.g., "+10%", "-20%", default: "default")
  --pitch, -p    Pitch adjustment (e.g., "+5Hz", "-10Hz", default: "default")

Examples:
  node cli.js "Welcome to the show, everyone." --voice daniel
  node cli.js "The dark secrets of the ancient castle." --voice aravinda -o castle.mp3
  node cli.js "G'day mate, how are you doing?" --voice en-AU-WilliamMultilingualNeural
======================================================================
`);
}

const VOICE_ALIASES = {
  andrew: 'en-US-AndrewMultilingualNeural',
  ava: 'en-US-AvaMultilingualNeural',
  brian: 'en-US-BrianMultilingualNeural',
  emma: 'en-US-EmmaMultilingualNeural',
  daniel: 'en-US-GuyNeural',
  guy: 'en-US-GuyNeural',
  aravinda: 'en-IN-PrabhatNeural',
  prabhat: 'en-IN-PrabhatNeural',
  christopher: 'en-US-ChristopherNeural',
  adam: 'en-US-ChristopherNeural',
  madhur: 'hi-IN-MadhurNeural',
  swara: 'hi-IN-SwaraNeural',
  neerja: 'en-IN-NeerjaNeural',
  ryan: 'en-GB-RyanNeural',
  george: 'en-GB-RyanNeural',
  aria: 'en-US-AriaNeural',
  rachel: 'en-US-AriaNeural',
  jenny: 'en-US-JennyNeural'
};

async function run() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  let text = '';
  let voiceParam = 'daniel';
  let outputFile = '';
  let rate = 'default';
  let pitch = 'default';

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--voice' || arg === '-v') {
      voiceParam = args[++i];
    } else if (arg === '--output' || arg === '-o') {
      outputFile = args[++i];
    } else if (arg === '--rate' || arg === '-r') {
      rate = args[++i];
    } else if (arg === '--pitch' || arg === '-p') {
      pitch = args[++i];
    } else if (!arg.startsWith('-') && !text) {
      text = arg;
    }
  }

  if (!text) {
    console.error('Error: Please provide text to synthesize.');
    printUsage();
    process.exit(1);
  }

  const allVoices = getAllVoices();
  const voiceId = VOICE_ALIASES[voiceParam.toLowerCase()] || voiceParam;
  const voiceObj = allVoices.find(v => v.id.toLowerCase() === voiceId.toLowerCase() || v.name.toLowerCase() === voiceParam.toLowerCase()) || {
    id: voiceId,
    underlyingVoice: voiceId,
    name: voiceId,
    counterpart: 'Custom Voice',
    locale: 'en-US'
  };

  if (!outputFile) {
    const filename = `cli_${Date.now()}_${path.basename(voiceObj.id)}.mp3`;
    outputFile = path.join(OUTPUT_DIR, filename);
  } else {
    outputFile = path.resolve(process.cwd(), outputFile);
  }

  console.log(`\nSynthesizing speech...`);
  console.log(`> Voice: ${voiceObj.name} (${voiceObj.counterpart || voiceObj.id})`);
  console.log(`> Text: "${text.length > 60 ? text.slice(0, 57) + '...' : text}"`);
  console.log(`> Rate: ${rate}, Pitch: ${pitch}`);

  if (text.length <= 850) {
    const tts = new EdgeTTS({
      voice: voiceObj.underlyingVoice || voiceObj.id,
      lang: voiceObj.locale || 'en-US',
      outputFormat: 'audio-24khz-96kbitrate-mono-mp3',
      rate,
      pitch,
    });
    await tts.ttsPromise(text, outputFile);
  } else {
    // Multi-chunk synthesis for long CLI scripts
    const chunks = [];
    const sentences = text.match(/[^.!?।\n]+[.!?।\n]*/g) || [text];
    let cur = '';
    for (const s of sentences) {
      if ((cur + ' ' + s).length <= 850) {
        cur = cur ? cur + ' ' + s : s;
      } else {
        if (cur) chunks.push(cur.trim());
        cur = s;
      }
    }
    if (cur.trim()) chunks.push(cur.trim());

    console.log(`> Synthesizing ${chunks.length} seamless chunks...`);
    const chunkBuffers = [];
    for (let i = 0; i < chunks.length; i++) {
      const tempPath = path.join(OUTPUT_DIR, `temp_cli_${Date.now()}_${i}.mp3`);
      const tts = new EdgeTTS({
        voice: voiceObj.underlyingVoice || voiceObj.id,
        lang: voiceObj.locale || 'en-US',
        outputFormat: 'audio-24khz-96kbitrate-mono-mp3',
        rate,
        pitch,
      });
      await tts.ttsPromise(chunks[i], tempPath);
      if (fs.existsSync(tempPath)) {
        chunkBuffers.push(fs.readFileSync(tempPath));
        fs.unlinkSync(tempPath);
      }
    }
    fs.writeFileSync(outputFile, Buffer.concat(chunkBuffers));
  }

  const stats = fs.statSync(outputFile);
  console.log(`\nSuccess! Audio generated:`);
  console.log(`> Output File: ${outputFile}`);
  console.log(`> File Size: ${(stats.size / 1024).toFixed(1)} KB\n`);
}

run().catch(err => {
  console.error('\nSynthesis failed:', err.message);
  process.exit(1);
});
