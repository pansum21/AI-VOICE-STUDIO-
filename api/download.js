import { handleRequest } from '../server.js';

export default async function handler(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const file = url.searchParams.get('file');
  if (file) {
    req.url = `/download/${encodeURIComponent(file)}`;
  }
  return handleRequest(req, res);
}
