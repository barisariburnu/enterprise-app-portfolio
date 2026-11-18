import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import { createMonitoring } from '../src/lib/monitoring.cjs';
const require = createRequire(import.meta.url);
const envelopes = [];
const monitor = createMonitoring({ dsn: 'https://public@example.invalid/1', release: 'enterprise-app-portfolio' + '@' + 'a'.repeat(40), transport: () => ({ send(e) { envelopes.push(e); return Promise.resolve({ statusCode: 200 }); }, flush() { return Promise.resolve(true); } }) });
function loadRoute(path, dependencies) {
 const source = readFileSync(path, 'utf8');
 const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
 const exports = {};
 const next = require('next/server');
 const loader = name => {
  if (name === 'next/server') return next;
  if (name === '@/lib/monitoring.cjs') return { reportError: monitor.report };
  if (Object.hasOwn(dependencies, name)) return dependencies[name];
  throw new Error('Unexpected dependency: ' + name);
 };
 vm.runInNewContext('(function(require,exports){' + js + '\n})', { console, Buffer, URL, process, Error, SyntaxError })(loader, exports);
 return exports;
}
test('caught project DB failure emits exactly one safe event while auth denial remains silent', async () => {
 const error = new Error('SQL PASSWORD PRIVATE FILENAME');
 const route = loadRoute('src/app/api/projects/route.ts', { '@/lib/db': { db: { project: { findMany: async () => { throw error; } } } }, '@/lib/admin': { isAdminRequest: () => false } });
 assert.equal((await route.GET()).status, 500);
 await monitor.flush();
 assert.equal(envelopes.length, 1);
 assert.equal(JSON.stringify(envelopes).includes(error.message), false);
 assert.equal((await route.POST({})).status, 403);
 await monitor.flush();
 assert.equal(envelopes.length, 1);
});

test('Next request hook ignores health checks and deduplicates the same escaped error', async () => {
 const previous = envelopes.length;
 const hook = loadRoute('src/instrumentation.ts', { './lib/monitoring.cjs': { reportError: monitor.report } });
 const error = new Error('PRIVATE RENDER PASSWORD');
 await hook.onRequestError(error, { path: '/api/health?private=query' });
 await monitor.flush();
 assert.equal(envelopes.length, previous);
 await hook.onRequestError(error, { path: '/private?secret=private' });
 await hook.onRequestError(error, { path: '/private?secret=private' });
 await monitor.flush();
 assert.equal(envelopes.length, previous + 1);
 assert.equal(JSON.stringify(envelopes).includes('PRIVATE RENDER PASSWORD'), false);
});

test('caught admin session operational failure reports once, malformed JSON remains silent', async () => {
 const previous = envelopes.length;
 const error = new Error('PRIVATE AUTH CONFIG');
 const route = loadRoute('src/app/api/admin/session/route.ts', { '@/lib/admin': { isAdminCredentials: () => { throw error; } } });
 assert.equal((await route.POST({ json: async () => ({ username: 'synthetic', password: 'synthetic' }) })).status, 400);
 await monitor.flush();
 assert.equal(envelopes.length, previous + 1);
 assert.equal((await route.POST({ json: async () => { throw new SyntaxError('PRIVATE BODY'); } })).status, 400);
 await monitor.flush();
 assert.equal(envelopes.length, previous + 1);
});

test('JSON handlers reject null, arrays and scalar bodies before mutation without telemetry', async () => {
 const previous = envelopes.length;
 const dependencies = { '@/lib/db': { db: {} }, '@/lib/admin': { isAdminRequest: () => true } };
 const cases = [["projects", "POST"], ["projects/[id]", "PUT"]];
 for (const [path, method] of cases) {
  const route = loadRoute('src/app/api/' + path + '/route.ts', dependencies);
  for (const body of [null, [], true, 42, 'invalid']) {
   const response = await route[method]({ json: async () => body, headers: new Headers({ 'content-type': 'application/json' }) }, { params: Promise.resolve({ id: 'target' }) });
   assert.equal(response.status, 400, path + ' rejects ' + JSON.stringify(body));
  }
 }
 await monitor.flush();
 assert.equal(envelopes.length, previous);
});

test('operational TypeError still produces one sanitized event', async () => {
 const previous = envelopes.length;
 const error = new TypeError('PRIVATE DB TYPE FAILURE');
 const route = loadRoute('src/app/api/projects/route.ts', { '@/lib/db': { db: { project: { create: async () => { throw error; } } } }, '@/lib/admin': { isAdminRequest: () => true } });
 assert.equal((await route.POST({ json: async () => ({ name: 'synthetic', description: 'synthetic' }) })).status, 500);
 await monitor.flush();
 assert.equal(envelopes.length, previous + 1);
 assert.equal(JSON.stringify(envelopes).includes(error.message), false);
});
