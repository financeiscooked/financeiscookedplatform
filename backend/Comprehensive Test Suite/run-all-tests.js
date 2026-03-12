#!/usr/bin/env node

/**
 * run-all-tests.js
 * Runs all test suites sequentially and collects results.
 */

import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

const SUITES = [
  { name: 'Admin',    file: 'Admin/admin-tests.js' },
  { name: 'Episodes', file: 'Episodes/episodes-tests.js' },
  { name: 'Segments', file: 'Segments/segments-tests.js' },
  { name: 'Slides',   file: 'Slides/slides-tests.js' },
  { name: 'Votes',    file: 'Votes/votes-tests.js' },
];

function runSuite(suite) {
  return new Promise((resolve) => {
    const filePath = join(__dirname, suite.file);
    console.log(`\n${COLORS.cyan}${COLORS.bright}${'='.repeat(60)}${COLORS.reset}`);
    console.log(`${COLORS.cyan}${COLORS.bright}  Running: ${suite.name}${COLORS.reset}`);
    console.log(`${COLORS.cyan}${COLORS.bright}${'='.repeat(60)}${COLORS.reset}\n`);

    const child = spawn(process.execPath, [filePath], {
      stdio: 'inherit',
      env: { ...process.env },
      cwd: __dirname,
    });

    child.on('close', (code) => {
      resolve({ name: suite.name, code: code || 0 });
    });

    child.on('error', (err) => {
      console.error(`${COLORS.red}Failed to start ${suite.name}: ${err.message}${COLORS.reset}`);
      resolve({ name: suite.name, code: 1 });
    });
  });
}

async function main() {
  const startTime = Date.now();

  console.log(`${COLORS.magenta}${COLORS.bright}`);
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║       financeiscooked Platform - API Test Suite         ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`${COLORS.reset}`);

  const baseUrl = process.env.BASE_URL || 'https://backend-production-0e40.up.railway.app';
  console.log(`${COLORS.yellow}Target: ${baseUrl}${COLORS.reset}`);

  const results = [];
  for (const suite of SUITES) {
    const result = await runSuite(suite);
    results.push(result);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const passed = results.filter(r => r.code === 0);
  const failed = results.filter(r => r.code !== 0);

  console.log(`\n${COLORS.magenta}${COLORS.bright}`);
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║                    FINAL RESULTS                        ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`${COLORS.reset}`);

  for (const r of results) {
    const icon = r.code === 0
      ? `${COLORS.green}PASS${COLORS.reset}`
      : `${COLORS.red}FAIL${COLORS.reset}`;
    console.log(`  ${icon}  ${r.name}`);
  }

  console.log(`\n  Suites: ${COLORS.green}${passed.length} passed${COLORS.reset}, ${COLORS.red}${failed.length} failed${COLORS.reset} of ${results.length}`);
  console.log(`  Time:   ${elapsed}s\n`);

  process.exit(failed.length > 0 ? 1 : 0);
}

main();
