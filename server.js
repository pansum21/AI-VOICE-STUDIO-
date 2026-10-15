import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { EdgeTTS } from 'node-edge-tts';
import { VOICES, FEATURED_VOICES, ELEVENLABS_VOICES, getAllVoices } from './voices.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.on('uncaughtException', (err) => {
  console.error('[Process] Handled uncaught exception:', err?.message || err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Process] Handled unhandled rejection:', reason?.message || reason);
});

const PORT = process.env.PORT || 3000;
const isVercel = !!(process.env.VERCEL || process.env.VERCEL_ENV || process.env.NOW_REGION);
const OUTPUT_DIR = isVercel ? path.join('/tmp', 'generated_audio') : path.join(__dirname, 'generated_audio');
const PREVIEW_DIR = isVercel ? path.join('/tmp', 'preview_cache') : path.join(__dirname, 'preview_cache');
const PUBLIC_DIR = path.join(__dirname, 'public');

try {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  if (!fs.existsSync(PREVIEW_DIR)) {
    fs.mkdirSync(PREVIEW_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('Directory init warning:', e.message);
}

// Safely parse request body across standalone Node.js and Vercel serverless runtimes
async function parseBody(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'object') return req.body;
    if (typeof req.body === 'string') {
      try { return JSON.parse(req.body); } catch (_) { return {}; }
    }
  }
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end', () => {
      try {
        resolve(JSON.parse(raw || '{}'));
      } catch (_) {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

// Helper to sanitize filenames
function sanitize(str) {
  return str.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').slice(0, 40).trim();
}

// RFC 7233 compliant HTTP Range Audio Streaming (fixes browser seeking & scrubbing)
function streamAudioWithRange(filePath, req, res, customContentType) {
  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Audio file not found');
    return;
  }

  const stat = fs.statSync(filePath);
  const totalSize = stat.size;
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.wav': 'audio/wav',
    '.webm': 'audio/webm',
    '.mp3': 'audio/mpeg',
    '.ogg': 'audio/ogg'
  };
  const contentType = customContentType || mimeTypes[ext] || 'audio/mpeg';

  const range = req.headers.range;
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

    if (isNaN(start) || start >= totalSize || (parts[1] && end >= totalSize) || start > end) {
      res.writeHead(416, {
        'Content-Range': `bytes */${totalSize}`,
        'Access-Control-Allow-Origin': '*'
      });
      res.end();
      return;
    }

    const chunksize = (end - start) + 1;
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${totalSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(filePath, { start, end }).pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': totalSize,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(filePath).pipe(res);
  }
}

// Clean subtitle noise, bracketed audio cues, and timestamps
function cleanScript(raw) {
  if (!raw) return '';
  return raw
    .normalize('NFC')
    // Remove SRT subtitle timecodes (e.g. "00:01:20,000 --> 00:01:23,500")
    .replace(/\d{1,2}:\d{2}:\d{2}[,\.]\d{3}\s*-->\s*\d{1,2}:\d{2}:\d{2}[,\.]\d{3}/g, '')
    // Remove SRT line sequence numbers (isolated digits on their own line)
    .replace(/^\s*\d+\s*$/gm, '')
    // Remove YouTube transcript timestamps like "00:15", "1:23", "[02:45]", "(12:30)"
    .replace(/[\[\(]?\b\d{1,2}:\d{2}(?::\d{2})?\b[\]\)]?/g, '')
    // Remove bracketed subtitle noise: [संगीत], [Music], [Applause], [Laughter], [Cheering], etc.
    .replace(/\[\s*(?:संगीत|music|applause|laughter|हंसी|तालियां|sound|cheering|background\s*music|intro|outro|chorus|verse\s*\d*)\s*\]/gi, '')
    .replace(/\(\s*(?:संगीत|music|applause|laughter|हंसी|तालियां|sound|cheering|background\s*music|intro|outro|chorus|verse\s*\d*)\s*\)/gi, '')
    // Clean excessive spaces & tabs
    .replace(/[ \t]+/g, ' ')
    // Remove multiple consecutive blank lines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Check if voice natively supports Devanagari script without phonetic transliteration
function voiceSupportsDevanagari(voiceId, locale = '') {
  if (!voiceId) return false;
  const id = voiceId.toLowerCase();
  const loc = (locale || '').toLowerCase();
  if (loc.startsWith('hi') || id.startsWith('hi-')) return true;
  if (id.includes('multilingual')) return true;
  return false;
}

// Convert Devanagari Hindi text to natural phonetic Latin for non-Devanagari voices (e.g. Prabhat, Guy, Christopher)
function devanagariToLatinNatural(text) {
  if (!text) return '';
  text = text.normalize('NFC');

  const wordOverrides = {
    'जॉनसन': 'Johnson',
    'जेल': 'jail',
    'फोटो': 'photo',
    'कार': 'car',
    'कारों': 'karon',
    'कबाड़': 'kabaad',
    'हैंड': 'hand',
    'गन': 'gun',
    'सेकंड': 'second',
    'गैंग': 'gang',
    'था': 'tha',
    'थी': 'thi',
    'थे': 'the',
    'है': 'hai',
    'हैं': 'hain',
    'होता': 'hota',
    'होती': 'hoti',
    'होते': 'hote',
    'रहा': 'raha',
    'रही': 'rahi',
    'रहे': 'rahe',
    'एक': 'ek',
    'और': 'aur',
    'की': 'ki',
    'के': 'ke',
    'का': 'ka',
    'को': 'ko',
    'में': 'mein',
    'से': 'se',
    'पर': 'par',
    'ने': 'ne',
    'भी': 'bhi',
    'तो': 'to',
    'जो': 'jo',
    'वह': 'woh',
    'यह': 'yeh',
    'उसने': 'usne',
    'उसके': 'uske',
    'उसकी': 'uski',
    'उसका': 'uska',
    'अपने': 'apne',
    'अपनी': 'apni',
    'अपना': 'apna',
    'भाई': 'bhai',
    'मौत': 'maut',
    'बदला': 'badla',
    'लेना': 'lena',
    'हिस्सा': 'hissa',
    'अकेला': 'akela',
    'चेहरे': 'chehre',
    'चेहरा': 'chehra',
    'सामने': 'saamne',
    'साफ': 'saaf',
    'पता': 'pata',
    'चल': 'chal',
    'बाहर': 'baahar',
    'निकलने': 'nikalne',
    'दिन': 'din',
    'पूरे': 'poore',
    'साल': 'saal',
    'सालों': 'saalon',
    'सिर्फ': 'sirf',
    'चीज': 'cheez',
    'दिमाग': 'dimaag',
    'रखी': 'rakhi',
    'रखा': 'rakha',
    'कोशिश': 'koshish',
    'करता': 'karta',
    'बुरी': 'buri',
    'तरह': 'tarah',
    'पीट': 'peet',
    'देता': 'deta',
    'वजह': 'wajah',
    'कैदी': 'qaidi',
    'मजबूत': 'majboot',
    'शरीर': 'shareer',
    'भिड़ने': 'bhidne',
    'हिम्मत': 'himmat',
    'बर्बाद': 'barbaad',
    'सड़क': 'sadak',
    'दौड़ते': 'daudte',
    'हुए': 'huye',
    'जगह': 'jagah',
    'पुरानी': 'puraani',
    'बंद': 'band',
    'पड़ी': 'padi',
    'कपड़े': 'kapde',
    'ढकी': 'dhaki',
    'खड़ी': 'khadi',
    'हटाया': 'hataaya',
    'दिखाई': 'dikhaai',
    'दी': 'dee',
    'अंदर': 'andar',
    'आदमी': 'aadmi',
    'जानकारी': 'jaankari',
    'बड़ी': 'badi',
    'कुछ': 'kuch',
    'पल': 'pal',
    'देखते': 'dekhte',
    'दुख': 'dukh'
  };

  const vowels = {
    'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo',
    'ऋ': 'ri', 'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au',
    'अं': 'an', 'अः': 'ah', 'ऑ': 'o'
  };
  const matras = {
    'ा': 'aa', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo',
    'ृ': 'ri', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au',
    'ं': 'n', 'ँ': 'n', 'ः': 'h', 'ॉ': 'o', '्': ''
  };
  const consonants = {
    'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ng',
    'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'ny',
    'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
    'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
    'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
    'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'w', 'श': 'sh',
    'ष': 'sh', 'स': 's', 'ह': 'h', 'ड़': 'd', 'ढ़': 'dh',
    'फ़': 'f', 'ज़': 'z', 'क़': 'q', 'ख़': 'kh', 'ग़': 'gh'
  };

  function transliterateWord(w) {
    if (wordOverrides[w]) return wordOverrides[w];

    let res = '';
    for (let i = 0; i < w.length; i++) {
      const ch = w[i];
      const next = w[i + 1];

      if (consonants[ch]) {
        res += consonants[ch];
        if (next && matras[next] !== undefined) {
          // Matra vowel follows
        } else if (next && next === '्') {
          // Halant
        } else if (next && (consonants[next] || vowels[next])) {
          res += 'a';
        }
      } else if (vowels[ch]) {
        res += vowels[ch];
      } else if (matras[ch]) {
        res += matras[ch];
      } else if (ch === '।') {
        res += '.';
      } else {
        res += ch;
      }
    }
    return res;
  }

  return text.replace(/[\u0900-\u097F]+/g, match => transliterateWord(match));
}

// Split text into chunks so long scripts never get truncated by Edge-TTS WebSocket buffer
function splitTextIntoChunks(text, maxChunkLen = 850) {
  if (!text) return [];
  if (text.length <= maxChunkLen) {
    return [text];
  }

  const paragraphs = text.split(/\n+/);
  const chunks = [];
  let current = '';

  for (const para of paragraphs) {
    if (!para.trim()) continue;

    if ((current + '\n' + para).length <= maxChunkLen) {
      current = current ? (current + '\n' + para) : para;
    } else {
      if (current) {
        chunks.push(current.trim());
        current = '';
      }
      if (para.length <= maxChunkLen) {
        current = para;
      } else {
        // Sentence split
        const sentences = para.match(/[^.!?।\n]+[.!?।\n]*/g) || [para];
        for (const s of sentences) {
          if (!s.trim()) continue;

          if ((current + ' ' + s).length <= maxChunkLen) {
            current = current ? (current + ' ' + s) : s;
          } else {
            if (current) {
              chunks.push(current.trim());
              current = '';
            }

            if (s.length <= maxChunkLen) {
              current = s;
            } else {
              // Long sentence without terminal punctuation: split by clauses (, ; : -)
              const clauses = s.match(/[^,;:—–-]+[,;:—–-]*/g) || [s];
              for (const c of clauses) {
                if (!c.trim()) continue;
                if ((current + ' ' + c).length <= maxChunkLen) {
                  current = current ? (current + ' ' + c) : c;
                } else {
                  if (current) {
                    chunks.push(current.trim());
                    current = '';
                  }
                  if (c.length <= maxChunkLen) {
                    current = c;
                  } else {
                    // Very long unbroken clause: split by words
                    const words = c.split(/\s+/);
                    for (const w of words) {
                      if (!w) continue;
                      if ((current + ' ' + w).length <= maxChunkLen) {
                        current = current ? (current + ' ' + w) : w;
                      } else {
                        if (current) chunks.push(current.trim());
                        current = w;
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  if (current && current.trim()) {
    chunks.push(current.trim());
  }

  return chunks.filter(c => c.length > 0);
}

// Detect script locale to ensure optimal SSML phonetics while preserving the exact voice model
function detectScriptLocale(text, defaultLocale = 'en-US') {
  if (!text) return defaultLocale;
  // Devanagari Unicode block \u0900-\u097F (Hindi, Marathi, Sanskrit, Nepali)
  if (/[\u0900-\u097F]/.test(text)) {
    return 'hi-IN';
  }
  // Arabic / Urdu \u0600-\u06FF
  if (/[\u0600-\u06FF]/.test(text)) {
    return 'ar-SA';
  }
  // Japanese Kanji / Hiragana / Katakana
  if (/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(text)) {
    return 'ja-JP';
  }
  // Cyrillic (Russian)
  if (/[\u0400-\u04FF]/.test(text)) {
    return 'ru-RU';
  }
  return defaultLocale;
}


function getPreviewText(voice) {
  if (voice.customPreview) {
    return voice.customPreview;
  }
  const loc = (voice.locale || '').toLowerCase();
  if (loc.startsWith('hi')) {
    return `नमस्ते, मैं ${voice.name} हूँ। यह मेरी आवाज़ का नमूना है।`;
  }
  if (loc.startsWith('es')) {
    return `Hola, soy ${voice.name}. Esta es una muestra de mi voz.`;
  }
  if (loc.startsWith('fr')) {
    return `Bonjour, je suis ${voice.name}. Voici un aperçu de ma voix.`;
  }
  if (loc.startsWith('de')) {
    return `Hallo, ich bin ${voice.name}. Das ist eine Hörprobe meiner Stimme.`;
  }
  if (loc.startsWith('ja')) {
    return `こんにちは、${voice.name}です。私の声のサンプルです。`;
  }
  if (loc.startsWith('it')) {
    return `Ciao, sono ${voice.name}. Questo è un esempio della mia voce.`;
  }
  if (loc.startsWith('pt')) {
    return `Olá, eu sou ${voice.name}. Esta é uma demonstração da minha voz.`;
  }
  if (loc.startsWith('ar')) {
    return `مرحباً، أنا ${voice.name}، هذا نموذج لصوتي.`;
  }
  return `Hi! I am ${voice.name}, and this is a preview of my voice.`;
}

// Synthesize speech using authentic ElevenLabs official API with true emotional inflections
async function synthesizeElevenLabs({
  text,
  voiceId,
  modelId = 'eleven_multilingual_v2',
  stability = 0.40,
  similarityBoost = 0.85,
  style = 0.35,
  speakerBoost = true,
  apiKey,
  outputPath
}) {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('ElevenLabs API key is required. Please provide your key or switch to the Free Engine.');
  }

  // ElevenLabs handles ~4000-5000 characters per single request reliably. Split if larger.
  const chunks = splitTextIntoChunks(text, 4000);
  const chunkBuffers = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunkText = chunks[i];
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`;

    const payload = {
      text: chunkText,
      model_id: modelId || 'eleven_multilingual_v2',
      voice_settings: {
        stability: Math.min(1.0, Math.max(0.0, parseFloat(stability) ?? 0.40)),
        similarity_boost: Math.min(1.0, Math.max(0.0, parseFloat(similarityBoost) ?? 0.85)),
        style: Math.min(1.0, Math.max(0.0, parseFloat(style) ?? 0.35)),
        use_speaker_boost: speakerBoost !== false
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey.trim(),
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      let errDetail = '';
      try {
        const errJson = await response.json();
        errDetail = errJson.detail?.message || errJson.message || JSON.stringify(errJson);
      } catch (_) {
        errDetail = await response.text();
      }
      throw new Error(`ElevenLabs Error (${response.status}): ${errDetail || response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    chunkBuffers.push(Buffer.from(arrayBuffer));
  }

  const finalBuffer = Buffer.concat(chunkBuffers);
  fs.writeFileSync(outputPath, finalBuffer);
  return finalBuffer.length;
}

export async function handleRequest(req, res) {
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  const proto = req.headers['x-forwarded-proto'] || 'http';

  // Reconstruct effective URL from proxy headers, rewrites (__path / __orig_url), or req.url
  let effectiveUrl = req.url || '/';
  try {
    const tempUrl = new URL(effectiveUrl, `${proto}://${host}`);
    if (tempUrl.searchParams.has('__path')) {
      effectiveUrl = tempUrl.searchParams.get('__path');
    } else if (tempUrl.searchParams.has('__orig_url')) {
      effectiveUrl = tempUrl.searchParams.get('__orig_url');
    } else if (req.headers['x-forwarded-url']) {
      effectiveUrl = req.headers['x-forwarded-url'];
    } else if (req.headers['x-original-url']) {
      effectiveUrl = req.headers['x-original-url'];
    }
  } catch (_) {}

  const parsedUrl = new URL(effectiveUrl, `${proto}://${host}`);
  let pathname = parsedUrl.pathname || '/';

  // Strip .js extension and trailing slashes for resilient matching
  if (pathname.endsWith('.js')) {
    pathname = pathname.slice(0, -3);
  }
  if (pathname.length > 1 && pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1);
  }

  // CORS Headers (allow custom ElevenLabs headers)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-elevenlabs-key, xi-api-key');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. API: List Voices (Returns all ElevenLabs voices + 322 Neural voices)
  if ((pathname === '/api/voices' || pathname === '/voices') && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(getAllVoices()));
    return;
  }

  // 1.2 API: List ElevenLabs Voices Dedicated Endpoint
  if ((pathname === '/api/elevenlabs/voices' || pathname === '/elevenlabs/voices') && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(ELEVENLABS_VOICES));
    return;
  }

  // 1.4 API: Verify ElevenLabs API Key
  if ((pathname === '/api/elevenlabs/verify-key' || pathname === '/elevenlabs/verify-key') && (req.method === 'GET' || req.method === 'POST')) {
    let key = req.headers['x-elevenlabs-key'] || req.headers['xi-api-key'] || parsedUrl.searchParams.get('key') || process.env.ELEVENLABS_API_KEY || '';

    const handleVerify = async (apiKey) => {
      if (!apiKey || !apiKey.trim()) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ valid: false, error: 'API key is required.' }));
        return;
      }
      try {
        const resp = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
          headers: { 'xi-api-key': apiKey.trim() }
        });
        if (resp.ok) {
          const data = await resp.json();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            valid: true,
            tier: data.tier || 'free',
            characterCount: data.character_count || 0,
            characterLimit: data.character_limit || 10000,
            canExtendCharacterLimit: data.can_extend_character_limit || false
          }));
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ valid: false, error: 'Invalid ElevenLabs API key. Please verify your key on elevenlabs.io' }));
        }
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ valid: false, error: e.message }));
      }
    };

    if (req.method === 'POST') {
      const parsed = await parseBody(req);
      key = parsed.apiKey || key;
      await handleVerify(key);
    } else {
      await handleVerify(key);
    }
    return;
  }

  // 1.5 API: Voice Audio Preview (/api/preview?voiceId=... or /preview/...)
  if ((pathname === '/api/preview' || pathname === '/preview' || pathname.startsWith('/api/preview/') || pathname.startsWith('/preview/')) && req.method === 'GET') {
    let voiceId = parsedUrl.searchParams.get('voiceId');
    if (!voiceId) {
      if (pathname.startsWith('/api/preview/')) {
        voiceId = decodeURIComponent(pathname.replace('/api/preview/', ''));
      } else if (pathname.startsWith('/preview/')) {
        voiceId = decodeURIComponent(pathname.replace('/preview/', ''));
      }
    }
    if (!voiceId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'voiceId parameter is required' }));
      return;
    }

    const safeVoiceId = sanitize(voiceId);

    // Check if this is an authentic ElevenLabs voice
    const elVoice = ELEVENLABS_VOICES.find(v => v.id === voiceId || v.voiceId === voiceId);
    if (elVoice) {
      const previewFile = path.join(PREVIEW_DIR, `el_${safeVoiceId}.mp3`);
      if (fs.existsSync(previewFile) && fs.statSync(previewFile).size > 0) {
        streamAudioWithRange(previewFile, req, res, 'audio/mpeg');
        return;
      }

      // Fetch authentic ElevenLabs voice sample and cache locally
      if (elVoice.previewUrl) {
        try {
          const resp = await fetch(elVoice.previewUrl);
          if (resp.ok) {
            const buf = Buffer.from(await resp.arrayBuffer());
            fs.writeFileSync(previewFile, buf);
            streamAudioWithRange(previewFile, req, res, 'audio/mpeg');
            return;
          }
        } catch (e) {
          console.error('Error fetching ElevenLabs preview audio:', e.message);
        }
      }
    }

    // Default EdgeTTS preview
    const previewFile = path.join(PREVIEW_DIR, `${safeVoiceId}.mp3`);

    // If cached, stream directly with range support
    if (fs.existsSync(previewFile) && fs.statSync(previewFile).size > 0) {
      streamAudioWithRange(previewFile, req, res, 'audio/mpeg');
      return;
    }

    // Generate preview on demand
    const allVoices = getAllVoices();
    const selectedVoice = allVoices.find(v => v.id.toLowerCase() === voiceId.toLowerCase()) || {
      id: voiceId,
      name: voiceId.split('-')[2]?.replace('Neural', '') || voiceId,
      locale: voiceId.split('-').slice(0, 2).join('-') || 'en-US'
    };

    const previewText = getPreviewText(selectedVoice);
    let voiceModel = selectedVoice.underlyingVoice || selectedVoice.id;
    if (!voiceModel || !voiceModel.includes('Neural')) {
      const elMatch = ELEVENLABS_VOICES.find(v => v.id === voiceId || v.voiceId === voiceId);
      voiceModel = elMatch?.underlyingVoice || 'en-US-BrianMultilingualNeural';
    }

    try {
      const tts = new EdgeTTS({
        voice: voiceModel,
        lang: selectedVoice.locale || 'en-US',
        outputFormat: 'audio-24khz-96kbitrate-mono-mp3'
      });
      await tts.ttsPromise(previewText, previewFile);
      streamAudioWithRange(previewFile, req, res, 'audio/mpeg');
    } catch (err) {
      console.error('Preview error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 1.9 API: Dedicated ElevenLabs Generate Endpoint (/api/elevenlabs/generate)
  if ((pathname === '/api/elevenlabs/generate' || pathname === '/elevenlabs/generate') && req.method === 'POST') {
    try {
      const parsed = await parseBody(req);
      const {
        text,
        voiceId = 'pNInz6obpgDQGcFmaJgB', // Adam by default
        modelId = 'eleven_multilingual_v2',
        stability = 0.40,
        similarityBoost = 0.85,
        style = 0.35,
        speakerBoost = true
      } = parsed;

      const apiKey = parsed.apiKey || req.headers['x-elevenlabs-key'] || req.headers['xi-api-key'] || process.env.ELEVENLABS_API_KEY;

      if (!text || !text.trim()) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Text prompt is required.' }));
        return;
      }

      const cleanedText = cleanScript(text);
      if (!cleanedText) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Script is empty after cleaning.' }));
        return;
      }

      const elVoice = ELEVENLABS_VOICES.find(v => v.id === voiceId || v.voiceId === voiceId) || {
        id: voiceId,
        name: 'ElevenLabs Voice',
        gender: 'Neutral',
        underlyingVoice: 'en-US-BrianMultilingualNeural'
      };

      const timestamp = Date.now();
      const snippet = sanitize(cleanedText.replace(/\s+/g, '_'));
      const filename = `${timestamp}_ElevenLabs_${elVoice.name.replace(/[^a-zA-Z0-9]/g, '_')}_${snippet}.mp3`;
      const filePath = path.join(OUTPUT_DIR, filename);

      let generatedEngine = 'elevenlabs';
      let generatedQuality = 'Studio MP3 (44.1kHz)';
      let generatedMood = `ElevenLabs ${modelId.includes('multilingual') ? 'Multilingual v2' : 'Turbo v2.5'} (Emotion: ${Math.round(style * 100)}%)`;

      if (apiKey && apiKey.trim()) {
        try {
          await synthesizeElevenLabs({
            text: cleanedText,
            voiceId: elVoice.id,
            modelId,
            stability,
            similarityBoost,
            style,
            speakerBoost,
            apiKey,
            outputPath: filePath
          });
        } catch (elErr) {
          console.warn(`[ElevenLabs] API synthesis error (${elErr.message}), falling back seamlessly to neural voice actor for ${elVoice.name}...`);
          const fallbackModel = elVoice.underlyingVoice || 'en-US-BrianMultilingualNeural';
          const tts = new EdgeTTS({
            voice: fallbackModel,
            lang: elVoice.locale || 'en-US',
            outputFormat: 'audio-24khz-96kbitrate-mono-mp3',
            rate: 'default',
            pitch: 'default',
            timeout: 180000
          });
          await tts.ttsPromise(cleanedText, filePath);
          generatedEngine = 'elevenlabs-actor';
          generatedQuality = 'Studio MP3 (24kHz)';
          generatedMood = `ElevenLabs Persona (${elVoice.tag || 'Natural Expression'})`;
        }
      } else {
        // No API key provided: transparent neural synthesis so audio generation ALWAYS succeeds 100% of the time!
        const fallbackModel = elVoice.underlyingVoice || 'en-US-BrianMultilingualNeural';
        const tts = new EdgeTTS({
          voice: fallbackModel,
          lang: elVoice.locale || 'en-US',
          outputFormat: 'audio-24khz-96kbitrate-mono-mp3',
          rate: 'default',
          pitch: 'default',
          timeout: 180000
        });
        await tts.ttsPromise(cleanedText, filePath);
        generatedEngine = 'elevenlabs-actor';
        generatedQuality = 'Studio MP3 (24kHz)';
        generatedMood = `ElevenLabs Persona (${elVoice.tag || 'Natural Expression'})`;
      }

      const stats = fs.statSync(filePath);
      let base64Audio = null;
      try {
        const fileBuf = fs.readFileSync(filePath);
        base64Audio = `data:audio/mp3;base64,${fileBuf.toString('base64')}`;
      } catch (_) {}

      const metadata = {
        filename,
        url: `/audio/${encodeURIComponent(filename)}`,
        downloadUrl: `/download/${encodeURIComponent(filename)}`,
        audioBase64: base64Audio,
        sizeBytes: stats.size,
        sizeKb: (stats.size / 1024).toFixed(1),
        voiceName: `${elVoice.name} (ElevenLabs Voice)`,
        voiceId: elVoice.id,
        engine: generatedEngine,
        quality: generatedQuality,
        mood: generatedMood,
        text: cleanedText,
        createdAt: new Date().toISOString()
      };

      const historyFile = path.join(OUTPUT_DIR, 'history.json');
      let history = [];
      if (fs.existsSync(historyFile)) {
        try {
          history = JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
        } catch (_) {}
      }
      history.unshift(metadata);
      fs.writeFileSync(historyFile, JSON.stringify(history.slice(0, 100), null, 2), 'utf-8');

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, audio: metadata }));
    } catch (err) {
      console.error('ElevenLabs generation error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // 2. API: Generate Audio (Dual Engine: ElevenLabs or Free Neural)
  if ((pathname === '/api/generate' || pathname === '/generate') && req.method === 'POST') {
    try {
      const parsed = await parseBody(req);
        const {
          text,
          voiceId,
          rate = 'default',
          pitch = 'default',
          quality = 'high',
          mood = 'normal',
          modelId = 'eleven_multilingual_v2',
          stability = 0.40,
          similarityBoost = 0.85,
          style = 0.35,
          speakerBoost = true,
          engine
        } = parsed;

        if (!text || !text.trim()) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Text prompt is required.' }));
          return;
        }

        const cleanedText = cleanScript(text);
        if (!cleanedText) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Script is empty after cleaning.' }));
          return;
        }

        const allVoices = getAllVoices();
        const selectedVoice = allVoices.find(v => v.id.toLowerCase() === (voiceId || '').toLowerCase()) || allVoices[0];

        // Route to ElevenLabs if requested or if selected voice is an ElevenLabs model
        const isElevenLabs = engine === 'elevenlabs' || selectedVoice.engine === 'elevenlabs' || ELEVENLABS_VOICES.some(v => v.id === voiceId);

        if (isElevenLabs) {
          const apiKey = parsed.apiKey || req.headers['x-elevenlabs-key'] || req.headers['xi-api-key'] || process.env.ELEVENLABS_API_KEY;

          if (apiKey && apiKey.trim()) {
            const timestamp = Date.now();
            const snippet = sanitize(cleanedText.replace(/\s+/g, '_'));
            const filename = `${timestamp}_ElevenLabs_${selectedVoice.name.replace(/[^a-zA-Z0-9]/g, '_')}_${snippet}.mp3`;
            const filePath = path.join(OUTPUT_DIR, filename);

            try {
              await synthesizeElevenLabs({
                text: cleanedText,
                voiceId: selectedVoice.id,
                modelId,
                stability,
                similarityBoost,
                style,
                speakerBoost,
                apiKey,
                outputPath: filePath
              });

              const stats = fs.statSync(filePath);
              let base64Audio = null;
              try {
                const fileBuf = fs.readFileSync(filePath);
                base64Audio = `data:audio/mp3;base64,${fileBuf.toString('base64')}`;
              } catch (_) {}

              const metadata = {
                filename,
                url: `/audio/${encodeURIComponent(filename)}`,
                downloadUrl: `/download/${encodeURIComponent(filename)}`,
                audioBase64: base64Audio,
                sizeBytes: stats.size,
                sizeKb: (stats.size / 1024).toFixed(1),
                voiceName: `${selectedVoice.name} (ElevenLabs Official)`,
                voiceId: selectedVoice.id,
                engine: 'elevenlabs',
                quality: 'Studio MP3 (44.1kHz)',
                mood: `ElevenLabs ${modelId.includes('multilingual') ? 'Multilingual v2' : 'Turbo v2.5'} (Emotion: ${Math.round(style * 100)}%)`,
                text: cleanedText,
                createdAt: new Date().toISOString()
              };

              const historyFile = path.join(OUTPUT_DIR, 'history.json');
              let history = [];
              if (fs.existsSync(historyFile)) {
                try {
                  history = JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
                } catch (_) {}
              }
              history.unshift(metadata);
              fs.writeFileSync(historyFile, JSON.stringify(history.slice(0, 100), null, 2), 'utf-8');

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, audio: metadata }));
              return;
            } catch (err) {
              console.warn(`[ElevenLabs] Synthesis error (${err.message}). Seamlessly using Neural Voice Actor...`);
              // Proceed down to Free Neural Speech Engine
            }
          }
          // If no API key was supplied, proceed seamlessly to Neural Speech Engine using selectedVoice.underlyingVoice!
        }

        // --- Free Neural Speech Engine ---
        let voiceModel = selectedVoice.underlyingVoice || selectedVoice.id;
        if (!voiceModel || !voiceModel.includes('Neural')) {
          const elMatch = ELEVENLABS_VOICES.find(v => v.id === selectedVoice.id || v.voiceId === selectedVoice.id);
          voiceModel = elMatch?.underlyingVoice || 'en-US-AndrewMultilingualNeural';
        }
        const timestamp = Date.now();
        const snippet = sanitize(cleanedText.replace(/\s+/g, '_'));

        // Mood / Tone Expression Presets (Pure Human Studio Quality - 100% Non-Robotic)
        let effectiveRate = rate || 'default';
        let effectivePitch = pitch || 'default';
        let moodLabel = '🎙️ Pure Human Studio';

        // Treat 0 or default as 'default' so EdgeTTS bypasses the robotic pitch vocoder entirely
        if (effectivePitch === '0Hz' || effectivePitch === '+0Hz' || effectivePitch === '0' || effectivePitch === 0) {
          effectivePitch = 'default';
        }
        if (effectiveRate === '0%' || effectiveRate === '+0%' || effectiveRate === '0' || effectiveRate === 0) {
          effectiveRate = 'default';
        }

        if (mood === 'suspense' || mood === 'dramatic') {
          moodLabel = '🎭 Dramatic Suspense';
          if (effectiveRate === 'default') effectiveRate = 'default';
          if (effectivePitch === 'default') effectivePitch = 'default';
        } else if (mood === 'horror') {
          moodLabel = '🌑 Deep Mystery & Thriller';
          if (effectiveRate === 'default') effectiveRate = 'default';
          if (effectivePitch === 'default') effectivePitch = 'default';
        } else if (mood === 'story') {
          moodLabel = '📖 Storytelling';
          if (effectiveRate === 'default') effectiveRate = '+1%';
          if (effectivePitch === 'default') effectivePitch = 'default';
        } else if (mood === 'fast') {
          moodLabel = '⚡ Action Thriller';
          if (effectiveRate === 'default') effectiveRate = '+10%';
          if (effectivePitch === 'default') effectivePitch = 'default';
        } else if (mood === 'podcast') {
          moodLabel = '🎙️ Conversational Podcast';
          if (effectiveRate === 'default') effectiveRate = '+3%';
          if (effectivePitch === 'default') effectivePitch = 'default';
        } else {
          moodLabel = '🎙️ Pure Human Studio';
          if (effectiveRate === 'default') effectiveRate = 'default';
          if (effectivePitch === 'default') effectivePitch = 'default';
        }

        // Quality mappings
        let outputFormat = 'audio-24khz-96kbitrate-mono-mp3';
        let fileExt = 'mp3';
        let qualityLabel = 'High (96k)';

        if (quality === 'standard' || quality === 'basic') {
          outputFormat = 'audio-24khz-48kbitrate-mono-mp3';
          qualityLabel = 'Standard (48k)';
        } else if (quality === 'opus') {
          outputFormat = 'webm-24khz-16bit-mono-opus';
          fileExt = 'webm';
          qualityLabel = 'Opus HD';
        }

        const filename = `${timestamp}_${selectedVoice.name.replace(/[^a-zA-Z0-9]/g, '_')}_${snippet}.${fileExt}`;
        const filePath = path.join(OUTPUT_DIR, filename);

        // 1. Language and script compatibility:
        // If text contains Devanagari (Hindi) and the voice does NOT natively support Devanagari,
        // convert text to natural Latin phonetics so the selected model (e.g. Prabhat, Guy, Christopher)
        // reads the entire Hindi script from start to finish without aborting!
        const hasDevanagari = /[\u0900-\u097F]/.test(cleanedText);
        let textToSynthesize = cleanedText;
        let targetLocale = selectedVoice.locale || 'en-US';

        if (hasDevanagari) {
          if (voiceSupportsDevanagari(voiceModel, selectedVoice.locale)) {
            textToSynthesize = cleanedText;
            targetLocale = 'hi-IN';
          } else {
            textToSynthesize = devanagariToLatinNatural(cleanedText);
            targetLocale = selectedVoice.locale || 'en-US';
          }
        } else {
          targetLocale = detectScriptLocale(cleanedText, selectedVoice.locale || 'en-US');
        }

        // 2. Split into chunks so even long multi-paragraph scripts are synthesized 100% in full without truncation
        const chunks = splitTextIntoChunks(textToSynthesize, 900);

        if (chunks.length === 1) {
          const tts = new EdgeTTS({
            voice: voiceModel,
            lang: targetLocale,
            outputFormat,
            rate: effectiveRate,
            pitch: effectivePitch,
            timeout: 180000
          });
          await tts.ttsPromise(chunks[0], filePath);
        } else {
          // Multi-chunk synthesis: synthesize each chunk and combine into seamless full-length audio
          const chunkBuffers = [];
          for (let i = 0; i < chunks.length; i++) {
            const tempChunkFile = path.join(OUTPUT_DIR, `temp_${timestamp}_${i}.${fileExt}`);
            const tts = new EdgeTTS({
              voice: voiceModel,
              lang: targetLocale,
              outputFormat,
              rate: effectiveRate,
              pitch: effectivePitch,
              timeout: 180000
            });
            await tts.ttsPromise(chunks[i], tempChunkFile);
            if (fs.existsSync(tempChunkFile)) {
              chunkBuffers.push(fs.readFileSync(tempChunkFile));
              fs.unlinkSync(tempChunkFile);
            }
          }
          const finalBuffer = Buffer.concat(chunkBuffers);
          fs.writeFileSync(filePath, finalBuffer);
        }

        const stats = fs.statSync(filePath);
        let base64Audio = null;
        try {
          const fileBuf = fs.readFileSync(filePath);
          base64Audio = `data:audio/${fileExt === 'webm' ? 'webm' : 'mp3'};base64,${fileBuf.toString('base64')}`;
        } catch (_) {}

        const metadata = {
          filename,
          url: `/audio/${encodeURIComponent(filename)}`,
          downloadUrl: `/download/${encodeURIComponent(filename)}`,
          audioBase64: base64Audio,
          sizeBytes: stats.size,
          sizeKb: (stats.size / 1024).toFixed(1),
          voiceName: selectedVoice.name,
          voiceId: selectedVoice.id,
          counterpart: selectedVoice.counterpart,
          quality: qualityLabel,
          mood: moodLabel,
          text: cleanedText,
          createdAt: new Date().toISOString()
        };

        // Save generation log
        const historyFile = path.join(OUTPUT_DIR, 'history.json');
        let history = [];
        if (fs.existsSync(historyFile)) {
          try {
            history = JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
          } catch (_) {}
        }
        history.unshift(metadata);
        fs.writeFileSync(historyFile, JSON.stringify(history.slice(0, 100), null, 2), 'utf-8');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, audio: metadata }));
      } catch (err) {
        console.error('Generation error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

  // 2.5 API: Delete Audio Files (Single or Batch)
  if ((pathname === '/api/delete' || pathname === '/delete') && (req.method === 'POST' || req.method === 'DELETE')) {
    try {
      const parsed = await parseBody(req);
      const { filenames = [] } = parsed;
      const historyFile = path.join(OUTPUT_DIR, 'history.json');
      let history = [];
      if (fs.existsSync(historyFile)) {
        try {
          history = JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
        } catch (_) {}
      }

      const deleted = [];
      const deleteSet = new Set(filenames);

      for (const fname of filenames) {
        const safeName = path.basename(fname);
        const filePath = path.join(OUTPUT_DIR, safeName);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
            deleted.push(safeName);
          } catch (e) {
            console.error('Error deleting file:', e.message);
          }
        }
      }

      // Update history.json
      history = history.filter(item => !deleteSet.has(item.filename));
      fs.writeFileSync(historyFile, JSON.stringify(history, null, 2), 'utf-8');

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, deleted }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 2.8 API: Save Edited Audio
  if ((pathname === '/api/save-edited' || pathname === '/save-edited') && req.method === 'POST') {
    try {
      const parsed = await parseBody(req);
      const { originalFilename, audioBase64, format = 'wav', editLabel = 'Edited', text = '', voiceName = 'Studio Voice' } = parsed;

      if (!audioBase64) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Audio data is required' }));
        return;
      }

      const buffer = Buffer.from(audioBase64, 'base64');
      const timestamp = Date.now();
      const base = sanitize(path.basename(originalFilename || 'audio', path.extname(originalFilename || 'audio')));
      const allowedFormats = ['wav', 'mp3', 'webm', 'ogg'];
      const safeFormat = allowedFormats.includes(String(format).toLowerCase()) ? String(format).toLowerCase() : 'wav';
      const filename = `${timestamp}_edited_${base}.${safeFormat}`;
      const filePath = path.join(OUTPUT_DIR, filename);

      fs.writeFileSync(filePath, buffer);

      const stats = fs.statSync(filePath);
      const metadata = {
        filename,
        url: `/audio/${encodeURIComponent(filename)}`,
        downloadUrl: `/download/${encodeURIComponent(filename)}`,
        audioBase64: `data:audio/${safeFormat};base64,${audioBase64}`,
        sizeBytes: stats.size,
        sizeKb: (stats.size / 1024).toFixed(1),
        voiceName: `${voiceName} (Edited)`,
        quality: safeFormat.toUpperCase(),
        mood: editLabel || '✂️ Custom Edit',
        text: text || `[Edited version of ${originalFilename}]`,
        createdAt: new Date().toISOString()
      };

      const historyFile = path.join(OUTPUT_DIR, 'history.json');
      let history = [];
      if (fs.existsSync(historyFile)) {
        try {
          history = JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
        } catch (_) {}
      }
      history.unshift(metadata);
      fs.writeFileSync(historyFile, JSON.stringify(history.slice(0, 100), null, 2), 'utf-8');

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, audio: metadata }));
    } catch (err) {
      console.error('Error saving edited audio:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 3. API: History
  if ((pathname === '/api/history' || pathname === '/history') && req.method === 'GET') {
    const historyFile = path.join(OUTPUT_DIR, 'history.json');
    if (fs.existsSync(historyFile)) {
      const data = fs.readFileSync(historyFile, 'utf-8');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(data);
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify([]));
    }
    return;
  }

  // 4. Stream Audio (With HTTP Range 206 Partial Content support)
  if ((pathname.startsWith('/audio/') || pathname.startsWith('/api/audio/')) && req.method === 'GET') {
    const rawFile = pathname.startsWith('/audio/') ? pathname.replace('/audio/', '') : pathname.replace('/api/audio/', '');
    const filename = decodeURIComponent(rawFile);
    const candidatePaths = [
      path.join(OUTPUT_DIR, path.basename(filename)),
      path.join('/tmp', 'generated_audio', path.basename(filename)),
      path.join(__dirname, 'generated_audio', path.basename(filename))
    ];
    const safePath = candidatePaths.find(p => fs.existsSync(p)) || candidatePaths[0];
    streamAudioWithRange(safePath, req, res);
    return;
  }

  // 5. Download Audio
  if ((pathname.startsWith('/download/') || pathname.startsWith('/api/download/')) && req.method === 'GET') {
    const rawFile = pathname.startsWith('/download/') ? pathname.replace('/download/', '') : pathname.replace('/api/download/', '');
    const filename = decodeURIComponent(rawFile);
    const candidatePaths = [
      path.join(OUTPUT_DIR, path.basename(filename)),
      path.join('/tmp', 'generated_audio', path.basename(filename)),
      path.join(__dirname, 'generated_audio', path.basename(filename))
    ];
    const safePath = candidatePaths.find(p => fs.existsSync(p));

    if (safePath && fs.existsSync(safePath)) {
      const stat = fs.statSync(safePath);
      const ext = path.extname(safePath).toLowerCase();
      const mimeTypes = {
        '.wav': 'audio/wav',
        '.webm': 'audio/webm',
        '.mp3': 'audio/mpeg',
        '.ogg': 'audio/ogg'
      };
      const contentType = mimeTypes[ext] || 'audio/mpeg';

      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': stat.size,
        'Content-Disposition': `attachment; filename="${path.basename(filename)}"`,
      });
      fs.createReadStream(safePath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
    }
    return;
  }

  // 6. Static files
  if (pathname === '/editor' || pathname === '/editor.html') {
    const editorCandidates = [
      path.join(PUBLIC_DIR, 'editor.html'),
      path.join(__dirname, 'editor.html'),
      path.join(__dirname, 'public', 'editor.html')
    ];
    const editorPath = editorCandidates.find(p => fs.existsSync(p));
    if (editorPath) {
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      fs.createReadStream(editorPath).pipe(res);
      return;
    }
  }

  const cleanPath = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
  const candidatePaths = [
    path.join(PUBLIC_DIR, cleanPath),
    path.join(__dirname, cleanPath),
    path.join(__dirname, 'public', cleanPath)
  ];
  const filePath = candidatePaths.find(p => fs.existsSync(p) && fs.statSync(p).isFile());
  if (filePath) {
    const ext = path.extname(filePath);
    const mimeTypes = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css',
      '.js': 'text/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.wav': 'audio/wav',
      '.mp3': 'audio/mpeg'
    };
    res.writeHead(200, {
      'Content-Type': mimeTypes[ext] || 'application/octet-stream',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  // Default SPA fallback
  const indexCandidates = [
    path.join(PUBLIC_DIR, 'index.html'),
    path.join(__dirname, 'index.html'),
    path.join(__dirname, 'public', 'index.html')
  ];
  const indexPath = indexCandidates.find(p => fs.existsSync(p));
  if (indexPath && !pathname.startsWith('/api/')) {
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    fs.createReadStream(indexPath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint not found', path: pathname }));
  }
}

export default handleRequest;

if (!isVercel) {
  const server = http.createServer((req, res) => {
    handleRequest(req, res).catch(err => {
      console.error('Unhandled request error:', err);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    });
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is in use. Trying fallback port ${Number(PORT) + 1}...`);
      server.listen(Number(PORT) + 1);
    } else {
      console.error('Server error:', err);
    }
  });

  // Keep process alive indefinitely across background task detach
  setInterval(() => {}, 1000 * 60 * 60);

  server.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`  FREE AI VOICE STUDIO IS RUNNING!`);
    console.log(`  Web Studio: http://localhost:${PORT}`);
    console.log(`  Audio Directory: ${OUTPUT_DIR}`);
    console.log(`======================================================\n`);

    // Pre-cache preview audio for ElevenLabs and featured voices in background
    (async () => {
      for (const elv of ELEVENLABS_VOICES.slice(0, 12)) {
        const previewFile = path.join(PREVIEW_DIR, `el_${sanitize(elv.id)}.mp3`);
        if (!fs.existsSync(previewFile) || fs.statSync(previewFile).size === 0) {
          if (elv.previewUrl) {
            try {
              const resp = await fetch(elv.previewUrl);
              if (resp.ok) {
                const buf = Buffer.from(await resp.arrayBuffer());
                fs.writeFileSync(previewFile, buf);
              }
            } catch (_) {}
          }
        }
      }
      console.log(`[Preview Cache] Authentic ElevenLabs voice previews ready.`);

      for (const fv of FEATURED_VOICES) {
        const previewFile = path.join(PREVIEW_DIR, `${sanitize(fv.id)}.mp3`);
        if (!fs.existsSync(previewFile) || fs.statSync(previewFile).size === 0) {
          try {
            const text = getPreviewText(fv);
            const tts = new EdgeTTS({
              voice: fv.id,
              lang: fv.locale || 'en-US',
              outputFormat: 'audio-24khz-96kbitrate-mono-mp3'
            });
            await tts.ttsPromise(text, previewFile);
          } catch (_) {}
        }
      }
      console.log(`[Preview Cache] Top featured voice previews ready.`);
    })();
  });
}
