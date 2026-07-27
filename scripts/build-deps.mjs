#!/usr/bin/env node
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const depsDir = join(process.cwd(), 'node_modules', '@breakit');

if (!existsSync(depsDir)) {
  console.log('No @breakit dependencies found, skipping build');
  process.exit(0);
}

const packages = readdirSync(depsDir).filter(d =>
  existsSync(join(depsDir, d, 'package.json'))
);

if (packages.length === 0) {
  console.log('No @breakit packages to build');
  process.exit(0);
}

console.log(`Building ${packages.length} @breakit packages...`);

let failed = 0;
for (const pkg of packages) {
  const pkgDir = join(depsDir, pkg);
  try {
    console.log(`Building ${pkg}...`);
    execSync('npm run build', { cwd: pkgDir, stdio: 'inherit' });
    console.log(`✓ ${pkg} built successfully`);
  } catch (e) {
    console.error(`✗ Failed to build ${pkg}:`, e.message);
    failed++;
  }
}

if (failed > 0) {
  console.error(`\n${failed} package(s) failed to build`);
  process.exit(1);
}

console.log('\nAll @breakit packages built successfully');
