/**
 * Dine Supervisor Script
 * Quick CLI to audit dine-order implementation completeness.
 * Usage (ts-node or compiled): node dist/scripts/dine-supervisor.js
 */
import * as fs from 'fs';
import * as path from 'path';

interface Task {
  id: string; desc: string; check: () => boolean; fixHint?: string;
}

const root = path.resolve(__dirname, '..');
const srcRoot = path.join(root, 'src');

function fileExists(p: string) { return fs.existsSync(p); }
function fileIncludes(p: string, snippet: string) {
  if (!fileExists(p)) return false; return fs.readFileSync(p,'utf8').includes(snippet);
}

const tasks: Task[] = [
  { id: 'constants-enum', desc: 'ServiceState & LogEvent enums created', check: () => fileExists(path.join(srcRoot,'order','dine-order.constants.ts')) },
  { id: 'queue-serviceState', desc: 'queue() returns serviceState', check: () => fileIncludes(path.join(srcRoot,'order','dine-order.service.ts'), 'serviceState: extractServiceState') },
  { id: 'state-mapping', desc: 'ServiceState mapped to order_status', check: () => fileIncludes(path.join(srcRoot,'order','dine-order.service.ts'), 'ServiceStateToOrderStatus') },
  { id: 'log-events-enum', desc: 'Log events use LogEvent enum', check: () => fileIncludes(path.join(srcRoot,'order','dine-order.service.ts'), 'LogEvent.CREATE') },
  { id: 'detail-aggregation', desc: 'detail() aggregates items', check: () => fileIncludes(path.join(srcRoot,'order','dine-order.service.ts'), 'aggMap') },
];

function run() {
  const results = tasks.map(t => ({ id: t.id, desc: t.desc, ok: t.check() }));
  const width = Math.max(...results.map(r=>r.desc.length))+2;
  console.log('\nDine Order Implementation Audit');
  console.log('='.repeat(40));
  results.forEach(r => console.log(`${r.ok ? '✅':'❌'} ${r.desc.padEnd(width)} ${r.ok ? 'OK':'MISSING'}`));
  const missing = results.filter(r=>!r.ok);
  console.log('\nSummary:');
  console.log(`  Total: ${results.length}, Passed: ${results.length-missing.length}, Missing: ${missing.length}`);
  if (missing.length) {
    console.log('\nNext Actions:');
    missing.forEach(m => console.log(`  - ${m.id}: ${m.desc}`));
  } else {
    console.log('\nAll dine-order baseline tasks satisfied.');
  }
}

run();
