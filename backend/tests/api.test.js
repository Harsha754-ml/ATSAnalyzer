/**
 * Simple API test runner (no test framework needed)
 * Run: node tests/api.test.js
 */

const http = require('http');

const BASE = 'http://localhost:5000/api';
let TOKEN  = '';
let USER_ID = '';

const request = (method, path, body, token) =>
  new Promise((resolve, reject) => {
    const data    = body ? JSON.stringify(body) : null;
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(data && { 'Content-Length': Buffer.byteLength(data) }),
    };

    const url     = new URL(BASE + path);
    const options = { hostname: url.hostname, port: url.port, path: url.pathname, method, headers };

    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });

const log = (label, res) => {
  const ok = res.status < 400 ? '✅' : '❌';
  console.log(`\n${ok} [${res.status}] ${label}`);
  console.log(JSON.stringify(res.body, null, 2));
};

const run = async () => {
  console.log('🧪 Resume Analyzer API Tests\n' + '='.repeat(40));

  // 1. Health check
  const health = await request('GET', '/../', null, null);
  log('GET / (health check)', health);

  // 2. Signup
  const signup = await request('POST', '/auth/signup', {
    name:     'Test User',
    email:    `test_${Date.now()}@example.com`,
    password: 'password123',
  });
  log('POST /auth/signup', signup);
  if (signup.body.token) {
    TOKEN   = signup.body.token;
    USER_ID = signup.body.user?.id;
  }

  // 3. Login
  const login = await request('POST', '/auth/login', {
    email:    signup.body.user?.email,
    password: 'password123',
  });
  log('POST /auth/login', login);
  if (login.body.token) TOKEN = login.body.token;

  // 4. Get me
  const me = await request('GET', '/auth/me', null, TOKEN);
  log('GET /auth/me', me);

  // 5. Analyze (no resume yet)
  const analyze = await request('GET', '/resume/analyze', null, TOKEN);
  log('GET /resume/analyze (no resume)', analyze);

  // 6. Get portfolio (no portfolio yet)
  const portfolio = await request('GET', '/portfolio/me', null, TOKEN);
  log('GET /portfolio/me (no portfolio)', portfolio);

  // 7. Get portfolio by userId
  if (USER_ID) {
    const portById = await request('GET', `/portfolio/${USER_ID}`, null, TOKEN);
    log(`GET /portfolio/${USER_ID}`, portById);
  }

  // 8. Update portfolio manually
  const updatePort = await request('PUT', '/portfolio/update', {
    title:   'Full Stack Developer',
    skills:  ['React', 'Node.js', 'MongoDB'],
    summary: 'Passionate developer with 2 years of experience.',
    isPublic: true,
  }, TOKEN);
  log('PUT /portfolio/update', updatePort);

  // 9. Resume history
  const history = await request('GET', '/resume/history', null, TOKEN);
  log('GET /resume/history', history);

  console.log('\n' + '='.repeat(40));
  console.log('✅ Tests complete. Upload test requires multipart/form-data (use Postman or curl).');
  console.log('\nTo test file upload with curl:');
  console.log(`curl -X POST http://localhost:5000/api/resume/upload \\`);
  console.log(`  -H "Authorization: Bearer ${TOKEN}" \\`);
  console.log(`  -F "resume=@/path/to/your/resume.pdf"`);
};

run().catch(console.error);
