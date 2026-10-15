import { handleRequest } from '../server.js';

export default async function handler(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const voiceId = url.searchParams.get('voiceId');
  if (voiceId) {
    req.url = `/api/preview?voiceId=${encodeURIComponent(voiceId)}`;
  } else {
    req.url = '/api/preview' + (req.url && req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '');
  }
  return handleRequest(req, res);
}
