import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Clean curated list matching top ElevenLabs and Ultra-Realistic Human Studio models
export const FEATURED_VOICES = [
  {
    id: 'en-US-AndrewMultilingualNeural',
    underlyingVoice: 'en-US-AndrewMultilingualNeural',
    name: 'Andrew (Ultra-Realistic Human Voice)',
    counterpart: 'ElevenLabs "Daniel / Charlie"',
    gender: 'Male',
    lang: 'English / Multilingual',
    locale: 'en-US',
    tag: 'Ultra-Realistic / Conversational / Studio',
    description: 'Exceptionally lifelike, warm, natural human male voice with authentic breathing and micro-inflections. Multilingual support across English, Hindi, and more.',
    customPreview: 'Hi! I am Andrew, an ultra-realistic human voice with natural expression and studio quality.'
  },
  {
    id: 'en-US-AvaMultilingualNeural',
    underlyingVoice: 'en-US-AvaMultilingualNeural',
    name: 'Ava (Expressive Human Studio)',
    counterpart: 'ElevenLabs "Charlotte / Sarah"',
    gender: 'Female',
    lang: 'English / Multilingual',
    locale: 'en-US',
    tag: 'Expressive / Warm / Natural Female',
    description: 'Warm, expressive, highly natural female voice perfect for storytelling, podcasts, and rich narrations. Multilingual support.',
    customPreview: 'Hello! I am Ava, an expressive and natural studio voice with human warmth.'
  },
  {
    id: 'en-US-BrianMultilingualNeural',
    underlyingVoice: 'en-US-BrianMultilingualNeural',
    name: 'Brian (Natural Documentary & Stories)',
    counterpart: 'ElevenLabs "Brian / Marcus"',
    gender: 'Male',
    lang: 'English / Multilingual',
    locale: 'en-US',
    tag: 'Engaging / Documentary / Smooth',
    description: 'Smooth, natural conversational male voice, highly engaging for documentaries, YouTube, and podcasts. Multilingual support.',
    customPreview: 'Hi there! I am Brian, a natural and engaging human conversational voice.'
  },
  {
    id: 'en-US-EmmaMultilingualNeural',
    underlyingVoice: 'en-US-EmmaMultilingualNeural',
    name: 'Emma (Warm & Emotional Storyteller)',
    counterpart: 'ElevenLabs "Lily / Alice"',
    gender: 'Female',
    lang: 'English / Multilingual',
    locale: 'en-US',
    tag: 'Emotional / Storyteller / Rich',
    description: 'Emotionally versatile and engaging female voice, great for fiction, drama, and audiobooks. Multilingual support.',
    customPreview: 'Hello! I am Emma, a warm and expressive voice for stories and narrations.'
  },
  {
    id: 'en-US-ChristopherNeural',
    underlyingVoice: 'en-US-ChristopherNeural',
    name: 'Christopher (Deep American Narrator)',
    counterpart: 'ElevenLabs "Adam / Antony"',
    gender: 'Male',
    lang: 'English (US)',
    locale: 'en-US',
    tag: 'Deep / Storyteller / Cinematic',
    description: 'Rich, cinematic baritone voice for audiobooks, documentary, and deep storytelling.',
    customPreview: 'Hello. I am Christopher, your deep cinematic narrator voice.'
  },
  {
    id: 'hi-IN-MadhurNeural',
    underlyingVoice: 'hi-IN-MadhurNeural',
    name: 'Madhur (Hindi Deep Suspense & Story Narrator)',
    counterpart: 'ElevenLabs Hindi Deep Narrator',
    gender: 'Male',
    lang: 'Hindi (India)',
    locale: 'hi-IN',
    tag: 'Hindi / Suspense / Thriller / Crime Stories',
    description: 'Deep, resonant, dramatic Hindi baritone for mystery stories, suspense podcasts, crime narrations, and audiobooks.',
    customPreview: 'नमस्ते! मैं मधुर हूँ, हिंदी कहानियों और सस्पेंस कथाओं के लिए गहरी और प्रभावशाली आवाज़।'
  },
  {
    id: 'hi-IN-SwaraNeural',
    underlyingVoice: 'hi-IN-SwaraNeural',
    name: 'Swara (Hindi Dramatic & Clear Narrator)',
    counterpart: 'ElevenLabs Hindi Female Narrator',
    gender: 'Female',
    lang: 'Hindi (India)',
    locale: 'hi-IN',
    tag: 'Hindi / Drama / Clear Storyteller',
    description: 'Clear, engaging, and expressive female Hindi narrator for drama, audiobooks, and emotional narration.',
    customPreview: 'नमस्ते! मैं स्वरा हूँ, हिंदी में स्पष्ट, भावुक और मधुर आवाज़।'
  },
  {
    id: 'en-IN-PrabhatNeural',
    underlyingVoice: 'en-IN-PrabhatNeural',
    name: 'Prabhat (Deep Fiction Narrator)',
    counterpart: 'ElevenLabs "Aravinda"',
    gender: 'Male',
    lang: 'English (India)',
    locale: 'en-IN',
    tag: 'Deep / Dark Fiction / Thriller',
    description: 'Deep, resonant, dramatic narrator with Indian English accent, ideal for horror and fiction.',
    customPreview: 'Hello! I am Prabhat, your deep dark fiction narrator matching ElevenLabs Aravinda.'
  },
  {
    id: 'en-IN-NeerjaNeural',
    underlyingVoice: 'en-IN-NeerjaNeural',
    name: 'Neerja (Natural Indian English)',
    counterpart: 'ElevenLabs "Preeti / Aditi"',
    gender: 'Female',
    lang: 'English (India)',
    locale: 'en-IN',
    tag: 'Natural / Professional / Smooth',
    description: 'Smooth, natural Indian English female voice for corporate and instructional content.',
    customPreview: 'Namaste! I am Neerja, a smooth and professional Indian English voice.'
  },
  {
    id: 'en-US-GuyNeural',
    underlyingVoice: 'en-US-GuyNeural',
    name: 'Guy (Steady Broadcaster)',
    counterpart: 'ElevenLabs "Daniel"',
    gender: 'Male',
    lang: 'English (US)',
    locale: 'en-US',
    tag: 'Broadcaster / News / Steady',
    description: 'Confident, clear, authoritative voice perfect for tutorials, broadcasts, and narrations.',
    customPreview: 'Hi! I am Guy, the steady broadcaster voice matching ElevenLabs Daniel.'
  },
  {
    id: 'en-GB-RyanNeural',
    underlyingVoice: 'en-GB-RyanNeural',
    name: 'Ryan (British Dramatic Baritone)',
    counterpart: 'ElevenLabs "George / Callum"',
    gender: 'Male',
    lang: 'English (UK)',
    locale: 'en-GB',
    tag: 'British / Dramatic / Prestige',
    description: 'Sophisticated, deep British RP accent with dramatic weight.',
    customPreview: 'Good day. I am Ryan, a sophisticated British dramatic baritone.'
  },
  {
    id: 'en-US-AriaNeural',
    underlyingVoice: 'en-US-AriaNeural',
    name: 'Aria (Expressive Storyteller)',
    counterpart: 'ElevenLabs "Rachel / Sarah"',
    gender: 'Female',
    lang: 'English (US)',
    locale: 'en-US',
    tag: 'Expressive / Dynamic / Novels',
    description: 'Emotionally versatile and engaging female voice, great for fiction and audiobooks.',
    customPreview: 'Hello! I am Aria, an expressive voice for novels and storytelling.'
  },
  {
    id: 'en-US-JennyNeural',
    underlyingVoice: 'en-US-JennyNeural',
    name: 'Jenny (Clear & Friendly)',
    counterpart: 'ElevenLabs "Bella / Nicole"',
    gender: 'Female',
    lang: 'English (US)',
    locale: 'en-US',
    tag: 'Friendly / Assistant / Professional',
    description: 'Bright, warm, and highly intelligible female narrator for guides, apps, and explainers.',
    customPreview: 'Hi! I am Jenny, a clear, friendly voice for explainers and tutorials.'
  }
];

export const VOICES = FEATURED_VOICES;

let cachedAllVoices = null;

export function getAllVoices() {
  if (cachedAllVoices) return cachedAllVoices;

  const catalogFile = path.join(__dirname, 'all_voices.json');
  let raw = [];
  if (fs.existsSync(catalogFile)) {
    try {
      raw = JSON.parse(fs.readFileSync(catalogFile, 'utf-8'));
    } catch (err) {
      console.error('Error reading all_voices.json:', err.message);
    }
  }

  const featuredMap = new Map(FEATURED_VOICES.map(v => [v.id, v]));

  const featuredList = FEATURED_VOICES.map(fv => ({
    id: fv.id,
    underlyingVoice: fv.underlyingVoice,
    name: fv.name,
    fullName: `${fv.name} - ${fv.counterpart}`,
    gender: fv.gender,
    locale: fv.locale,
    localeName: fv.lang,
    counterpart: fv.counterpart,
    tag: fv.tag,
    description: fv.description,
    customPreview: fv.customPreview,
    isFeatured: true
  }));

  const standardList = raw
    .filter(x => !featuredMap.has(x.ShortName))
    .map(x => {
      const parts = x.ShortName.split('-');
      const speaker = parts.length > 2 ? parts[2].replace('Neural', '') : x.ShortName;

      return {
        id: x.ShortName,
        underlyingVoice: x.ShortName,
        name: speaker,
        fullName: x.FriendlyName.replace('Microsoft ', '').replace(' Online (Natural)', ''),
        gender: x.Gender,
        locale: x.Locale,
        localeName: x.LocaleName,
        counterpart: null,
        tag: x.VoiceTag?.VoicePersonalities?.join(' / ') || 'Natural Speech',
        description: `${x.Gender} voice in ${x.LocaleName}.`,
        isFeatured: false
      };
    });

  cachedAllVoices = [...featuredList, ...standardList];
  return cachedAllVoices;
}
