import { EdgeTTS } from 'node-edge-tts';
import fs from 'fs';

async function testNatural() {
  const text = 'एक संकरी और अंधेरी जेल की कोठरी में जॉनसन बेचैनी से इधर-उधर घूम रहा था। उसके हाथ में अपने भाई की फोटो थी जिसे वह बार-बार देख रहा था।';

  // 1. With pitch shift (sounds robotic)
  const ttsRobotic = new EdgeTTS({
    voice: 'hi-IN-MadhurNeural',
    lang: 'hi-IN',
    rate: '-10%',
    pitch: '-5Hz',
    timeout: 30000
  });
  await ttsRobotic.ttsPromise(text, './test_robotic.mp3');

  // 2. Pure Natural Native Neural (zero pitch shift, 100% natural human timbre)
  const ttsNatural = new EdgeTTS({
    voice: 'hi-IN-MadhurNeural',
    lang: 'hi-IN',
    rate: 'default',
    pitch: 'default',
    timeout: 30000
  });
  await ttsNatural.ttsPromise(text, './test_natural.mp3');

  console.log('Robotic size:', fs.statSync('./test_robotic.mp3').size);
  console.log('Natural size:', fs.statSync('./test_natural.mp3').size);
}

testNatural().catch(console.error);
