import http from 'http';

function post(url, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const postData = JSON.stringify(body);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(data) });
        } catch (_) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function get(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: 'GET',
      headers
    }, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        let parsed = null;
        try {
          parsed = JSON.parse(buf.toString('utf-8'));
        } catch (_) {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          buffer: buf,
          length: buf.length,
          data: parsed
        });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runAllTests() {
  console.log('======================================================');
  console.log(' STARTING 10 RIGOROUS AUTOMATED VERIFICATION TESTS');
  console.log('======================================================\n');

  let passed = 0;
  let testNum = 0;

  // TEST 1
  testNum++;
  try {
    process.stdout.write(`[Test ${testNum}/10] ElevenLabs Adam (pNInz6obpgDQGcFmaJgB) generation without API key... `);
    const res = await post('http://localhost:3000/api/elevenlabs/generate', {
      text: 'In the heart of the ancient forest, Adam paused and listened.',
      voiceId: 'pNInz6obpgDQGcFmaJgB'
    });
    if (res.status === 200 && res.data?.success && res.data?.audio?.audioBase64?.startsWith('data:audio/mp3;base64,')) {
      console.log(`PASSED! (Bytes: ${res.data.audio.sizeBytes}, Engine: ${res.data.audio.engine})`);
      passed++;
    } else {
      console.log(`FAILED! Status: ${res.status}, Error:`, res.data);
    }
  } catch (e) {
    console.log(`FAILED with exception:`, e.message);
  }

  // TEST 2
  testNum++;
  try {
    process.stdout.write(`[Test ${testNum}/10] ElevenLabs Rachel (21m00Tcm4TlvDq8ikWAM) generation via /api/generate... `);
    const res = await post('http://localhost:3000/api/generate', {
      text: 'Good morning! This is Rachel delivering your daily news briefing.',
      voiceId: '21m00Tcm4TlvDq8ikWAM',
      engine: 'elevenlabs'
    });
    if (res.status === 200 && res.data?.success && res.data?.audio?.sizeBytes > 5000) {
      console.log(`PASSED! (Bytes: ${res.data.audio.sizeBytes}, Voice: ${res.data.audio.voiceName})`);
      passed++;
    } else {
      console.log(`FAILED! Status: ${res.status}, Error:`, res.data);
    }
  } catch (e) {
    console.log(`FAILED with exception:`, e.message);
  }

  // TEST 3
  testNum++;
  try {
    process.stdout.write(`[Test ${testNum}/10] ElevenLabs Daniel (onwK4e9ZLuTAKqWW03F9) British Broadcaster... `);
    const res = await post('http://localhost:3000/api/elevenlabs/generate', {
      text: 'BBC World Service. The headline tonight: extraordinary discoveries.',
      voiceId: 'onwK4e9ZLuTAKqWW03F9'
    });
    if (res.status === 200 && res.data?.success && res.data?.audio?.audioBase64) {
      console.log(`PASSED! (Bytes: ${res.data.audio.sizeBytes})`);
      passed++;
    } else {
      console.log(`FAILED! Status: ${res.status}, Error:`, res.data);
    }
  } catch (e) {
    console.log(`FAILED with exception:`, e.message);
  }

  // TEST 4
  testNum++;
  try {
    process.stdout.write(`[Test ${testNum}/10] Ultra-Realistic Ava (en-US-AvaMultilingualNeural) Human Studio Female... `);
    const res = await post('http://localhost:3000/api/generate', {
      text: 'Welcome to our studio. The sound of a real human voice brings every story to life.',
      voiceId: 'en-US-AvaMultilingualNeural',
      mood: 'studio'
    });
    if (res.status === 200 && res.data?.success && res.data?.audio?.sizeBytes > 5000) {
      console.log(`PASSED! (Bytes: ${res.data.audio.sizeBytes}, Mood: ${res.data.audio.mood})`);
      passed++;
    } else {
      console.log(`FAILED! Status: ${res.status}, Error:`, res.data);
    }
  } catch (e) {
    console.log(`FAILED with exception:`, e.message);
  }

  // TEST 5
  testNum++;
  try {
    process.stdout.write(`[Test ${testNum}/10] Ultra-Realistic Andrew (en-US-AndrewMultilingualNeural) Human Conversational Male... `);
    const res = await post('http://localhost:3000/api/generate', {
      text: 'Hey everyone, Andrew here. Thanks for joining today podcast episode.',
      voiceId: 'en-US-AndrewMultilingualNeural',
      mood: 'podcast'
    });
    if (res.status === 200 && res.data?.success && res.data?.audio?.sizeBytes > 5000) {
      console.log(`PASSED! (Bytes: ${res.data.audio.sizeBytes})`);
      passed++;
    } else {
      console.log(`FAILED! Status: ${res.status}, Error:`, res.data);
    }
  } catch (e) {
    console.log(`FAILED with exception:`, e.message);
  }

  // TEST 6
  testNum++;
  try {
    process.stdout.write(`[Test ${testNum}/10] Hindi Voice Madhur (hi-IN-MadhurNeural) with Devanagari text... `);
    const res = await post('http://localhost:3000/api/generate', {
      text: 'उस रात हवेली के बाहर बहुत गहरा अंधेरा था। सब खामोश थे।',
      voiceId: 'hi-IN-MadhurNeural',
      mood: 'suspense'
    });
    if (res.status === 200 && res.data?.success && res.data?.audio?.sizeBytes > 5000) {
      console.log(`PASSED! (Bytes: ${res.data.audio.sizeBytes})`);
      passed++;
    } else {
      console.log(`FAILED! Status: ${res.status}, Error:`, res.data);
    }
  } catch (e) {
    console.log(`FAILED with exception:`, e.message);
  }

  // TEST 7
  testNum++;
  try {
    process.stdout.write(`[Test ${testNum}/10] Voice Audio Preview for ElevenLabs voice (/api/preview?voiceId=pNInz6obpgDQGcFmaJgB)... `);
    const res = await get('http://localhost:3000/api/preview?voiceId=pNInz6obpgDQGcFmaJgB');
    if (res.status === 200 && res.length > 1000 && res.headers['content-type']?.includes('audio')) {
      console.log(`PASSED! (Audio size: ${res.length} bytes, Type: ${res.headers['content-type']})`);
      passed++;
    } else {
      console.log(`FAILED! Status: ${res.status}, Size: ${res.length}`);
    }
  } catch (e) {
    console.log(`FAILED with exception:`, e.message);
  }

  // TEST 8
  testNum++;
  try {
    process.stdout.write(`[Test ${testNum}/10] Voice Audio Preview for Neural voice (/api/preview?voiceId=en-US-BrianMultilingualNeural)... `);
    const res = await get('http://localhost:3000/api/preview?voiceId=en-US-BrianMultilingualNeural');
    if (res.status === 200 && res.length > 1000) {
      console.log(`PASSED! (Audio size: ${res.length} bytes)`);
      passed++;
    } else {
      console.log(`FAILED! Status: ${res.status}, Size: ${res.length}`);
    }
  } catch (e) {
    console.log(`FAILED with exception:`, e.message);
  }

  // TEST 9
  testNum++;
  try {
    process.stdout.write(`[Test ${testNum}/10] RFC 7233 Range Audio Streaming (bytes=0-1023)... `);
    // Find an existing file in history or generated
    const hist = await get('http://localhost:3000/api/history');
    const firstAudio = hist.data?.[0];
    if (firstAudio?.url) {
      const res = await get(`http://localhost:3000${firstAudio.url}`, { 'Range': 'bytes=0-1023' });
      if (res.status === 206 && res.headers['content-range'] && res.length === 1024) {
        console.log(`PASSED! (HTTP 206 Partial Content, Range: ${res.headers['content-range']})`);
        passed++;
      } else {
        console.log(`FAILED! Status: ${res.status}, Length: ${res.length}`);
      }
    } else {
      console.log(`SKIPPED! No audio in history yet.`);
    }
  } catch (e) {
    console.log(`FAILED with exception:`, e.message);
  }

  // TEST 10
  testNum++;
  try {
    process.stdout.write(`[Test ${testNum}/10] Catalog & History Endpoint Integrity (/api/voices & /api/history)... `);
    const voicesRes = await get('http://localhost:3000/api/voices');
    const historyRes = await get('http://localhost:3000/api/history');
    const totalVoices = voicesRes.data?.length || 0;
    const historyItems = historyRes.data?.length || 0;
    if (totalVoices >= 340 && historyItems > 0) {
      console.log(`PASSED! (${totalVoices} total voices available, ${historyItems} generations in history)`);
      passed++;
    } else {
      console.log(`FAILED! Voices count: ${totalVoices}, History count: ${historyItems}`);
    }
  } catch (e) {
    console.log(`FAILED with exception:`, e.message);
  }

  console.log('\n======================================================');
  console.log(` TEST SUMMARY: ${passed}/10 TESTS PASSED SUCCESSFULLY!`);
  console.log('======================================================');

  if (passed === 10) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
