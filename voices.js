import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Authentic ElevenLabs Official Voices (Actual Voice IDs and Official Audio Previews)
export const ELEVENLABS_VOICES = [
  {
    id: 'pNInz6obpgDQGcFmaJgB',
    voiceId: 'pNInz6obpgDQGcFmaJgB',
    name: 'Adam',
    gender: 'Male',
    lang: 'English / Multilingual (29 Languages)',
    locale: 'en-US',
    localeName: 'Multilingual (English, Hindi, etc.)',
    engine: 'elevenlabs',
    category: 'premade',
    tag: 'Dominant, Firm / Deep American Narration',
    description: 'The iconic deep American baritone. ElevenLabs flagship voice for audiobooks, documentaries, and cinematic narration.',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/pNInz6obpgDQGcFmaJgB/d6905d7a-dd26-4187-bfff-1bd3a5ea7cac.mp3',
    isFeatured: true
  },
  {
    id: 'onwK4e9ZLuTAKqWW03F9',
    voiceId: 'onwK4e9ZLuTAKqWW03F9',
    name: 'Daniel',
    gender: 'Male',
    lang: 'English / Multilingual',
    locale: 'en-GB',
    localeName: 'British / Multilingual',
    engine: 'elevenlabs',
    category: 'premade',
    tag: 'Authoritative Broadcaster / News & Narration',
    description: 'Deep, steady, authoritative British broadcaster voice with formal cadence and prestige.',
    previewUrl: 'https://api.us.elevenlabs.io/v1/voices/onwK4e9ZLuTAKqWW03F9/previews/audio?payload=eyJ2b2ljZV9zb3VyY2UiOiJwcmVtYWRlIiwiZmlsZW5hbWUiOiI3ZWVlMDIzNi0xYTcyLTRiODYtYjMwMy01ZGNhZGMwMDdiYTkubXAzIiwidGltZXN0YW1wIjoxNzkyMDkwODAwMDAwMDAwfQ%3D%3D',
    isFeatured: true
  },
  {
    id: 'nPczCjzI2devNBz1zQrb',
    voiceId: 'nPczCjzI2devNBz1zQrb',
    name: 'Brian',
    gender: 'Male',
    lang: 'English / Multilingual',
    locale: 'en-US',
    localeName: 'American / Multilingual',
    engine: 'elevenlabs',
    category: 'premade',
    tag: 'Deep, Resonant & Comforting Storyteller',
    description: 'Rich, comforting narrative baritone with natural breath and authentic pacing. Masterful for dramatic fiction.',
    previewUrl: 'https://api.us.elevenlabs.io/v1/voices/nPczCjzI2devNBz1zQrb/previews/audio?payload=eyJ2b2ljZV9zb3VyY2UiOiJwcmVtYWRlIiwiZmlsZW5hbWUiOiIyZGQzZTcyYy00ZmQzLTQyZjEtOTNlYS1hYmM1ZDRlNWFhMWQubXAzIiwidGltZXN0YW1wIjoxNzkyMDkwODAwMDAwMDAwfQ%3D%3D',
    isFeatured: true
  },
  {
    id: 'JBFqnCBsd6RMkjVDRZzb',
    voiceId: 'JBFqnCBsd6RMkjVDRZzb',
    name: 'George',
    gender: 'Male',
    lang: 'English / Multilingual',
    locale: 'en-GB',
    localeName: 'British RP / Multilingual',
    engine: 'elevenlabs',
    category: 'premade',
    tag: 'Warm, Captivating British Storyteller',
    description: 'Warm, magnetic British RP storytelling voice. Richly nuanced for period drama and prestige documentaries.',
    previewUrl: 'https://api.us.elevenlabs.io/v1/voices/JBFqnCBsd6RMkjVDRZzb/previews/audio?payload=eyJ2b2ljZV9zb3VyY2UiOiJwcmVtYWRlIiwiZmlsZW5hbWUiOiJlNjIwNmQxYS0wNzIxLTQ3ODctYWFmYi0wNmE2ZTcwNWNhYzUubXAzIiwidGltZXN0YW1wIjoxNzkyMDkwODAwMDAwMDAwfQ%3D%3D',
    isFeatured: true
  },
  {
    id: 'N2lVS1w4EtoT3dr4eOWO',
    voiceId: 'N2lVS1w4EtoT3dr4eOWO',
    name: 'Callum',
    gender: 'Male',
    lang: 'English / Multilingual',
    locale: 'en-US',
    localeName: 'American / Multilingual',
    engine: 'elevenlabs',
    category: 'premade',
    tag: 'Husky, Intense & Edgy Character Narration',
    description: 'Gritty, intense, husky voice with dramatic edge. Exceptional for video game characters and action trailers.',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/N2lVS1w4EtoT3dr4eOWO/ac833bd8-ffda-4938-9ebc-b0f99ca25481.mp3',
    isFeatured: true
  },
  {
    id: 'IKne3meq5aSn9XLyUdCD',
    voiceId: 'IKne3meq5aSn9XLyUdCD',
    name: 'Charlie',
    gender: 'Male',
    lang: 'English / Multilingual',
    locale: 'en-AU',
    localeName: 'Australian / Multilingual',
    engine: 'elevenlabs',
    category: 'premade',
    tag: 'Deep, Confident & Energetic Narrator',
    description: 'Confident, dynamic, natural male narrator with subtle Australian lilt and captivating cadence.',
    previewUrl: 'https://api.us.elevenlabs.io/v1/voices/IKne3meq5aSn9XLyUdCD/previews/audio?payload=eyJ2b2ljZV9zb3VyY2UiOiJwcmVtYWRlIiwiZmlsZW5hbWUiOiIxMDJkZTZmMi0yMmVkLTQzZTAtYTFmMS0xMTFmYTc1YzU0ODEubXAzIiwidGltZXN0YW1wIjoxNzkyMDkwODAwMDAwMDAwfQ%3D%3D',
    isFeatured: true
  },
  {
    id: 'pFZP5JQG7iQjIQuC4Bku',
    voiceId: 'pFZP5JQG7iQjIQuC4Bku',
    name: 'Lily',
    gender: 'Female',
    lang: 'English / Multilingual',
    locale: 'en-GB',
    localeName: 'British / Multilingual',
    engine: 'elevenlabs',
    category: 'premade',
    tag: 'Velvety, Emotional & Dramatic Actress',
    description: 'Velvety, intimate, emotionally charged British female voice with deep expressive range for novels and poetry.',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/pFZP5JQG7iQjIQuC4Bku/89b68b35-b3dd-4348-a84a-a3c13a3c2b30.mp3',
    isFeatured: true
  },
  {
    id: '21m00Tcm4TlvDq8ikWAM',
    voiceId: '21m00Tcm4TlvDq8ikWAM',
    name: 'Rachel',
    gender: 'Female',
    lang: 'English / Multilingual',
    locale: 'en-US',
    localeName: 'American / Multilingual',
    engine: 'elevenlabs',
    category: 'premade',
    tag: 'Calm, Articulate & Professional Female',
    description: 'ElevenLabs hallmark calm, clear female voice. Ideal for audiobooks, commercial explainer videos, and tutorials.',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/21m00Tcm4TlvDq8ikWAM/65d4e577-ec9f-4315-998d-a4194c7b2a9f.mp3',
    isFeatured: true
  },
  {
    id: 'XB0fDUnXU5ikFXrFcAZo',
    voiceId: 'XB0fDUnXU5ikFXrFcAZo',
    name: 'Charlotte',
    gender: 'Female',
    lang: 'English / Multilingual',
    locale: 'en-SE',
    localeName: 'Swedish-English / Multilingual',
    engine: 'elevenlabs',
    category: 'premade',
    tag: 'Seductive, Expressive & Cinematic Female',
    description: 'Expressive, alluring, cinematic female narrator with gentle European accent and emotional depth.',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/XB0fDUnXU5ikFXrFcAZo/94235650-252a-4467-a003-7e82843da268.mp3',
    isFeatured: true
  },
  {
    id: 'Xb7hH8MSUJpSbSDYk0k2',
    voiceId: 'Xb7hH8MSUJpSbSDYk0k2',
    name: 'Alice',
    gender: 'Female',
    lang: 'English / Multilingual',
    locale: 'en-GB',
    localeName: 'British / Multilingual',
    engine: 'elevenlabs',
    category: 'premade',
    tag: 'Clear, Engaging British Educator',
    description: 'Polished, confident, engaging British female voice. Perfect for e-learning, news, and informative narrations.',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/Xb7hH8MSUJpSbSDYk0k2/d10f7534-11f6-41fe-a012-2de1e482d336.mp3',
    isFeatured: true
  },
  {
    id: 'TX3LPaxmHKxFdv7VOQHJ',
    voiceId: 'TX3LPaxmHKxFdv7VOQHJ',
    name: 'Liam',
    gender: 'Male',
    lang: 'English / Multilingual',
    locale: 'en-US',
    localeName: 'American / Multilingual',
    engine: 'elevenlabs',
    category: 'premade',
    tag: 'Energetic, Social Media Creator',
    description: 'Youthful, vibrant, and enthusiastic American male voice designed for YouTube, TikTok, and modern podcasts.',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/TX3LPaxmHKxFdv7VOQHJ/63148076-6363-42db-aea8-31424308b92c.mp3',
    isFeatured: true
  },
  {
    id: 'ErXwobaYiN019PkySvjV',
    voiceId: 'ErXwobaYiN019PkySvjV',
    name: 'Antoni',
    gender: 'Male',
    lang: 'English / Multilingual',
    locale: 'en-US',
    localeName: 'American / Multilingual',
    engine: 'elevenlabs',
    category: 'premade',
    tag: 'Warm, Versatile Commercial & Story Narrator',
    description: 'Warm, balanced, versatile male voice suitable for commercials, corporate presentations, and conversational scripts.',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/ErXwobaYiN019PkySvjV/23a07304-4c6e-4734-9e32-fc2d83e29f10.mp3',
    isFeatured: true
  },
  {
    id: 'EXAVITQu4vr4xnSDxMaL',
    voiceId: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Sarah',
    gender: 'Female',
    lang: 'English / Multilingual',
    locale: 'en-US',
    localeName: 'American / Multilingual',
    engine: 'elevenlabs',
    category: 'premade',
    tag: 'Mature, Reassuring & Confident',
    description: 'Mature, reassuring, confident female voice for corporate audio, documentaries, and calm storytelling.',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/EXAVITQu4vr4xnSDxMaL/01a3e33c-6e99-4ee7-8543-ff2216a32186.mp3',
    isFeatured: true
  },
  {
    id: 'pqHfZKP75CvOlQylNhV4',
    voiceId: 'pqHfZKP75CvOlQylNhV4',
    name: 'Bill',
    gender: 'Male',
    lang: 'English / Multilingual',
    locale: 'en-US',
    localeName: 'American / Multilingual',
    engine: 'elevenlabs',
    category: 'premade',
    tag: 'Wise, Mature & Balanced Documentary Narrator',
    description: 'Classic wise American documentary narrator. Gravitas and trustworthiness for history and nature features.',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/pqHfZKP75CvOlQylNhV4/d782b3ff-84ba-4029-848c-acf01285524d.mp3',
    isFeatured: true
  },
  {
    id: 'CwhRBWXzGAHq8TQ4Fs17',
    voiceId: 'CwhRBWXzGAHq8TQ4Fs17',
    name: 'Roger',
    gender: 'Male',
    lang: 'English / Multilingual',
    locale: 'en-US',
    localeName: 'American / Multilingual',
    engine: 'elevenlabs',
    category: 'premade',
    tag: 'Laid-Back, Casual & Resonant',
    description: 'Casual, conversational baritone for informal podcasts, vlogs, and storytelling.',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/CwhRBWXzGAHq8TQ4Fs17/58ee3ff5-f6f2-4628-93b8-e38eb31806b0.mp3',
    isFeatured: false
  },
  {
    id: 'FGY2WhTYpPnrIDTdsKH5',
    voiceId: 'FGY2WhTYpPnrIDTdsKH5',
    name: 'Laura',
    gender: 'Female',
    lang: 'English / Multilingual',
    locale: 'en-US',
    localeName: 'American / Multilingual',
    engine: 'elevenlabs',
    category: 'premade',
    tag: 'Enthusiastic, Quirky & Lively',
    description: 'Quirky, energetic attitude female for animation, upbeat commercials, and games.',
    previewUrl: 'https://api.us.elevenlabs.io/v1/voices/FGY2WhTYpPnrIDTdsKH5/previews/audio?payload=eyJ2b2ljZV9zb3VyY2UiOiJwcmVtYWRlIiwiZmlsZW5hbWUiOiI2NzM0MTc1OS1hZDA4LTQxYTUtYmU2ZS1kZTEyZmU0NDg2MTgubXAzIiwidGltZXN0YW1wIjoxNzkyMDkwODAwMDAwMDAwfQ%3D%3D',
    isFeatured: false
  },
  {
    id: 'SAz9YHcvj6GT2YYXdXww',
    voiceId: 'SAz9YHcvj6GT2YYXdXww',
    name: 'River',
    gender: 'Non-binary / Neutral',
    lang: 'English / Multilingual',
    locale: 'en-US',
    localeName: 'American / Multilingual',
    engine: 'elevenlabs',
    category: 'premade',
    tag: 'Relaxed, Neutral & Informative',
    description: 'Modern, relaxed, neutral narrator for tech explainers and contemporary audio.',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/SAz9YHcvj6GT2YYXdXww/e6c95f0b-2227-491a-b3d7-2249240decb7.mp3',
    isFeatured: false
  },
  {
    id: 'SOYHLrjzK2X1ezoPC6cr',
    voiceId: 'SOYHLrjzK2X1ezoPC6cr',
    name: 'Harry',
    gender: 'Male',
    lang: 'English / Multilingual',
    locale: 'en-US',
    localeName: 'American / Multilingual',
    engine: 'elevenlabs',
    category: 'premade',
    tag: 'Fierce Warrior & Dark Character',
    description: 'Deep, gruff, intense combatant voice for gaming and dark fantasy.',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/SOYHLrjzK2X1ezoPC6cr/86d178f6-f4b6-4e0e-85be-3de19f490794.mp3',
    isFeatured: false
  },
  {
    id: 'XrExE9yKIg1WjnnlVkGX',
    voiceId: 'XrExE9yKIg1WjnnlVkGX',
    name: 'Matilda',
    gender: 'Female',
    lang: 'English / Multilingual',
    locale: 'en-US',
    localeName: 'American / Multilingual',
    engine: 'elevenlabs',
    category: 'premade',
    tag: 'Knowledgeable & Professional Narrator',
    description: 'Knowledgeable, articulate, friendly audiobook voice for non-fiction and science.',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/XrExE9yKIg1WjnnlVkGX/b930e18d-6b4d-466e-bab2-0ae97c6d8535.mp3',
    isFeatured: false
  },
  {
    id: 'bIHbv24MWmeRgasZH58o',
    voiceId: 'bIHbv24MWmeRgasZH58o',
    name: 'Will',
    gender: 'Male',
    lang: 'English / Multilingual',
    locale: 'en-US',
    localeName: 'American / Multilingual',
    engine: 'elevenlabs',
    category: 'premade',
    tag: 'Relaxed Optimist & Warm Narrator',
    description: 'Friendly, upbeat, everyday conversational male voice.',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/bIHbv24MWmeRgasZH58o/8caf8f3d-ad29-4980-af41-53f20c72d7a4.mp3',
    isFeatured: false
  },
  {
    id: 'cgSgspJ2msm6clMCkdW9',
    voiceId: 'cgSgspJ2msm6clMCkdW9',
    name: 'Jessica',
    gender: 'Female',
    lang: 'English / Multilingual',
    locale: 'en-US',
    localeName: 'American / Multilingual',
    engine: 'elevenlabs',
    category: 'premade',
    tag: 'Playful, Bright & Warm Female',
    description: 'Bright, lively, expressive female voice with youthful personality.',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/cgSgspJ2msm6clMCkdW9/56a97bf8-b69b-448f-846c-c3a11683d45a.mp3',
    isFeatured: false
  },
  {
    id: 'cjVigY5qzO86Huf0OWal',
    voiceId: 'cjVigY5qzO86Huf0OWal',
    name: 'Eric',
    gender: 'Male',
    lang: 'English / Multilingual',
    locale: 'en-US',
    localeName: 'American / Multilingual',
    engine: 'elevenlabs',
    category: 'premade',
    tag: 'Smooth & Trustworthy Baritone',
    description: 'Smooth, comforting baritone for professional corporate videos and warm narrations.',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/cjVigY5qzO86Huf0OWal/d098fda0-6456-4030-b3d8-63aa048c9070.mp3',
    isFeatured: false
  },
  {
    id: 'hpp4J3VqNfWAUOO0d1Us',
    voiceId: 'hpp4J3VqNfWAUOO0d1Us',
    name: 'Bella',
    gender: 'Female',
    lang: 'English / Multilingual',
    locale: 'en-US',
    localeName: 'American / Multilingual',
    engine: 'elevenlabs',
    category: 'premade',
    tag: 'Professional, Bright & Warm',
    description: 'Warm, professional female voice with crystal clarity.',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/hpp4J3VqNfWAUOO0d1Us/dab0f5ba-3aa4-48a8-9fad-f138fea1126d.mp3',
    isFeatured: false
  },
  {
    id: 'iP95p4xoKVk53GoZ742B',
    voiceId: 'iP95p4xoKVk53GoZ742B',
    name: 'Chris',
    gender: 'Male',
    lang: 'English / Multilingual',
    locale: 'en-US',
    localeName: 'American / Multilingual',
    engine: 'elevenlabs',
    category: 'premade',
    tag: 'Charming & Down-to-Earth Narrator',
    description: 'Charming, friendly, conversational narrator with a natural down-to-earth delivery.',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/iP95p4xoKVk53GoZ742B/3f4bde72-cc48-40dd-829f-57fbf906f4d7.mp3',
    isFeatured: false
  }
];

// Curated Free Neural Voices
export const FEATURED_VOICES = [
  {
    id: 'en-US-AndrewMultilingualNeural',
    underlyingVoice: 'en-US-AndrewMultilingualNeural',
    name: 'Andrew (Ultra-Realistic Human Voice)',
    engine: 'free',
    gender: 'Male',
    lang: 'English / Multilingual',
    locale: 'en-US',
    localeName: 'English (Multilingual)',
    tag: 'Ultra-Realistic / Conversational / Studio',
    description: 'Exceptionally lifelike, warm, natural human male voice with authentic breathing and micro-inflections. Multilingual support across English, Hindi, and more.',
    customPreview: 'Hi! I am Andrew, an ultra-realistic human voice with natural expression and studio quality.',
    isFeatured: true
  },
  {
    id: 'en-US-AvaMultilingualNeural',
    underlyingVoice: 'en-US-AvaMultilingualNeural',
    name: 'Ava (Expressive Human Studio)',
    engine: 'free',
    gender: 'Female',
    lang: 'English / Multilingual',
    locale: 'en-US',
    localeName: 'English (Multilingual)',
    tag: 'Expressive / Warm / Natural Female',
    description: 'Warm, expressive, highly natural female voice perfect for storytelling, podcasts, and rich narrations. Multilingual support.',
    customPreview: 'Hello! I am Ava, an expressive and natural studio voice with human warmth.',
    isFeatured: true
  },
  {
    id: 'en-US-BrianMultilingualNeural',
    underlyingVoice: 'en-US-BrianMultilingualNeural',
    name: 'Brian (Natural Documentary & Stories)',
    engine: 'free',
    gender: 'Male',
    lang: 'English / Multilingual',
    locale: 'en-US',
    localeName: 'English (Multilingual)',
    tag: 'Engaging / Documentary / Smooth',
    description: 'Smooth, natural conversational male voice, highly engaging for documentaries, YouTube, and podcasts. Multilingual support.',
    customPreview: 'Hi there! I am Brian, a natural and engaging human conversational voice.',
    isFeatured: true
  },
  {
    id: 'en-US-EmmaMultilingualNeural',
    underlyingVoice: 'en-US-EmmaMultilingualNeural',
    name: 'Emma (Warm & Emotional Storyteller)',
    engine: 'free',
    gender: 'Female',
    lang: 'English / Multilingual',
    locale: 'en-US',
    localeName: 'English (Multilingual)',
    tag: 'Emotional / Storyteller / Rich',
    description: 'Emotionally versatile and engaging female voice, great for fiction, drama, and audiobooks. Multilingual support.',
    customPreview: 'Hello! I am Emma, a warm and expressive voice for stories and narrations.',
    isFeatured: true
  },
  {
    id: 'en-US-ChristopherNeural',
    underlyingVoice: 'en-US-ChristopherNeural',
    name: 'Christopher (Deep American Narrator)',
    engine: 'free',
    gender: 'Male',
    lang: 'English (US)',
    locale: 'en-US',
    localeName: 'English (US)',
    tag: 'Deep / Storyteller / Cinematic',
    description: 'Rich, cinematic baritone voice for audiobooks, documentary, and deep storytelling.',
    customPreview: 'Hello. I am Christopher, your deep cinematic narrator voice.',
    isFeatured: true
  },
  {
    id: 'hi-IN-MadhurNeural',
    underlyingVoice: 'hi-IN-MadhurNeural',
    name: 'Madhur (Hindi Deep Suspense & Story Narrator)',
    engine: 'free',
    gender: 'Male',
    lang: 'Hindi (India)',
    locale: 'hi-IN',
    localeName: 'Hindi (India)',
    tag: 'Hindi / Suspense / Thriller / Crime Stories',
    description: 'Deep, resonant, dramatic Hindi baritone for mystery stories, suspense podcasts, crime narrations, and audiobooks.',
    customPreview: 'नमस्ते! मैं मधुर हूँ, हिंदी कहानियों और सस्पेंस कथाओं के लिए गहरी और प्रभावशाली आवाज़।',
    isFeatured: true
  },
  {
    id: 'hi-IN-SwaraNeural',
    underlyingVoice: 'hi-IN-SwaraNeural',
    name: 'Swara (Hindi Dramatic & Clear Narrator)',
    engine: 'free',
    gender: 'Female',
    lang: 'Hindi (India)',
    locale: 'hi-IN',
    localeName: 'Hindi (India)',
    tag: 'Hindi / Drama / Clear Storyteller',
    description: 'Clear, engaging, and expressive female Hindi narrator for drama, audiobooks, and emotional narration.',
    customPreview: 'नमस्ते! मैं स्वरा हूँ, हिंदी में स्पष्ट, भावुक और मधुर आवाज़।',
    isFeatured: true
  },
  {
    id: 'en-IN-PrabhatNeural',
    underlyingVoice: 'en-IN-PrabhatNeural',
    name: 'Prabhat (Deep Fiction Narrator)',
    engine: 'free',
    gender: 'Male',
    lang: 'English (India)',
    locale: 'en-IN',
    localeName: 'English (India)',
    tag: 'Deep / Dark Fiction / Thriller',
    description: 'Deep, resonant, dramatic narrator with Indian English accent, ideal for horror and fiction.',
    customPreview: 'Hello! I am Prabhat, your deep dark fiction narrator.',
    isFeatured: true
  },
  {
    id: 'en-IN-NeerjaNeural',
    underlyingVoice: 'en-IN-NeerjaNeural',
    name: 'Neerja (Natural Indian English)',
    engine: 'free',
    gender: 'Female',
    lang: 'English (India)',
    locale: 'en-IN',
    localeName: 'English (India)',
    tag: 'Natural / Professional / Smooth',
    description: 'Smooth, natural Indian English female voice for corporate and instructional content.',
    customPreview: 'Namaste! I am Neerja, a smooth and professional Indian English voice.',
    isFeatured: true
  },
  {
    id: 'en-US-GuyNeural',
    underlyingVoice: 'en-US-GuyNeural',
    name: 'Guy (Steady Broadcaster)',
    engine: 'free',
    gender: 'Male',
    lang: 'English (US)',
    locale: 'en-US',
    localeName: 'English (US)',
    tag: 'Broadcaster / News / Steady',
    description: 'Confident, clear, authoritative voice perfect for tutorials, broadcasts, and narrations.',
    customPreview: 'Hi! I am Guy, the steady broadcaster voice.',
    isFeatured: true
  },
  {
    id: 'en-GB-RyanNeural',
    underlyingVoice: 'en-GB-RyanNeural',
    name: 'Ryan (British Dramatic Baritone)',
    engine: 'free',
    gender: 'Male',
    lang: 'English (UK)',
    locale: 'en-GB',
    localeName: 'English (UK)',
    tag: 'British / Dramatic / Prestige',
    description: 'Sophisticated, deep British RP accent with dramatic weight.',
    customPreview: 'Good day. I am Ryan, a sophisticated British dramatic baritone.',
    isFeatured: true
  },
  {
    id: 'en-US-AriaNeural',
    underlyingVoice: 'en-US-AriaNeural',
    name: 'Aria (Expressive Storyteller)',
    engine: 'free',
    gender: 'Female',
    lang: 'English (US)',
    locale: 'en-US',
    localeName: 'English (US)',
    tag: 'Expressive / Dynamic / Novels',
    description: 'Emotionally versatile and engaging female voice, great for fiction and audiobooks.',
    customPreview: 'Hello! I am Aria, an expressive voice for novels and storytelling.',
    isFeatured: true
  },
  {
    id: 'en-US-JennyNeural',
    underlyingVoice: 'en-US-JennyNeural',
    name: 'Jenny (Clear & Friendly)',
    engine: 'free',
    gender: 'Female',
    lang: 'English (US)',
    locale: 'en-US',
    localeName: 'English (US)',
    tag: 'Friendly / Assistant / Professional',
    description: 'Bright, warm, and highly intelligible female narrator for guides, apps, and explainers.',
    customPreview: 'Hi! I am Jenny, a clear, friendly voice for explainers and tutorials.',
    isFeatured: true
  }
];

export const VOICES = FEATURED_VOICES;

let cachedAllVoices = null;

export function getAllVoices() {
  if (cachedAllVoices) return cachedAllVoices;

  const candidateFiles = [
    path.join(__dirname, 'all_voices.json'),
    path.join(process.cwd(), 'all_voices.json'),
    path.join(__dirname, '..', 'all_voices.json')
  ];
  const catalogFile = candidateFiles.find(p => fs.existsSync(p));
  let raw = [];
  if (catalogFile) {
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
    fullName: fv.name,
    gender: fv.gender,
    locale: fv.locale,
    localeName: fv.lang,
    counterpart: null,
    engine: 'free',
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
        engine: 'free',
        tag: x.VoiceTag?.VoicePersonalities?.join(' / ') || 'Natural Speech',
        description: `${x.Gender} voice in ${x.LocaleName}.`,
        isFeatured: false
      };
    });

  // Prepend ElevenLabs voices at top, followed by featured free voices, then standard free voices
  cachedAllVoices = [...ELEVENLABS_VOICES, ...featuredList, ...standardList];
  return cachedAllVoices;
}
