import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { EdgeTTS } from 'node-edge-tts';
import { VOICES, FEATURED_VOICES, getAllVoices } from './voices.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const OUTPUT_DIR = path.join(__dirname, 'generated_audio');
const PREVIEW_DIR = path.join(__dirname, 'preview_cache');
const PUBLIC_DIR = path.join(__dirname, 'public');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}
if (!fs.existsSync(PREVIEW_DIR)) {
  fs.mkdirSync(PREVIEW_DIR, { recursive: true });
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

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. API: List Voices (Returns all 322 voices + featured flags)
  if (pathname === '/api/voices' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(getAllVoices()));
    return;
  }

  // 1.5 API: Voice Audio Preview (/api/preview?voiceId=...)
  if (pathname === '/api/preview' && req.method === 'GET') {
    const voiceId = parsedUrl.searchParams.get('voiceId');
    if (!voiceId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'voiceId parameter is required' }));
      return;
    }

    const safeVoiceId = sanitize(voiceId);
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
    const voiceModel = selectedVoice.underlyingVoice || selectedVoice.id;
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

  // 2. API: Generate Audio
  if (pathname === '/api/generate' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { text, voiceId, rate = 'default', pitch = 'default', quality = 'high', mood = 'normal' } = JSON.parse(body || '{}');

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
        const voiceModel = selectedVoice.underlyingVoice || selectedVoice.id;
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
          if (effectiveRate === 'default') effectiveRate = '-4%';
          if (effectivePitch === 'default') effectivePitch = 'default';
        } else if (mood === 'horror') {
          moodLabel = '🌑 Deep Mystery & Thriller';
          if (effectiveRate === 'default') effectiveRate = '-7%';
          if (effectivePitch === 'default') effectivePitch = 'default';
        } else if (mood === 'story') {
          moodLabel = '📖 Storytelling';
          if (effectiveRate === 'default') effectiveRate = '-2%';
          if (effectivePitch === 'default') effectivePitch = 'default';
        } else if (mood === 'fast') {
          moodLabel = '⚡ Action Thriller';
          if (effectiveRate === 'default') effectiveRate = '+8%';
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
        const metadata = {
          filename,
          url: `/audio/${encodeURIComponent(filename)}`,
          downloadUrl: `/download/${encodeURIComponent(filename)}`,
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
    });
    return;
  }

  // 2.5 API: Delete Audio Files (Single or Batch)
  if (pathname === '/api/delete' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { filenames = [] } = JSON.parse(body || '{}');
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
    });
    return;
  }

  // 2.8 API: Save Edited Audio
  if (pathname === '/api/save-edited' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { originalFilename, audioBase64, format = 'wav', editLabel = 'Edited', text = '', voiceName = 'Studio Voice' } = JSON.parse(body || '{}');

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
    });
    return;
  }

  // 3. API: History
  if (pathname === '/api/history' && req.method === 'GET') {
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
  if (pathname.startsWith('/audio/') && req.method === 'GET') {
    const filename = decodeURIComponent(pathname.replace('/audio/', ''));
    const safePath = path.join(OUTPUT_DIR, path.basename(filename));
    streamAudioWithRange(safePath, req, res);
    return;
  }

  // 5. Download Audio
  if (pathname.startsWith('/download/') && req.method === 'GET') {
    const filename = decodeURIComponent(pathname.replace('/download/', ''));
    const safePath = path.join(OUTPUT_DIR, path.basename(filename));

    if (fs.existsSync(safePath)) {
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
    const editorPath = path.join(PUBLIC_DIR, 'editor.html');
    if (fs.existsSync(editorPath)) {
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

  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    const mimeTypes = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css',
      '.js': 'text/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.svg': 'image/svg+xml'
    };
    res.writeHead(200, {
      'Content-Type': mimeTypes[ext] || 'text/plain',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    fs.createReadStream(filePath).pipe(res);
  } else {
    // Default to index.html for SPA
    const indexPath = path.join(PUBLIC_DIR, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      fs.createReadStream(indexPath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
    }
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is in use. Trying fallback port ${Number(PORT) + 1}...`);
    server.listen(Number(PORT) + 1);
  } else {
    console.error('Server error:', err);
  }
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  FREE AI VOICE STUDIO IS RUNNING!`);
  console.log(`  Web Studio: http://localhost:${PORT}`);
  console.log(`  Audio Directory: ${OUTPUT_DIR}`);
  console.log(`======================================================\n`);

  // Pre-cache preview audio for featured voices in background
  (async () => {
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
