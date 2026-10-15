import { handleRequest } from '../server.js';

export default async function handler(req, res) {
  req.url = '/api/delete' + (req.url && req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '');
  return handleRequest(req, res);
}
