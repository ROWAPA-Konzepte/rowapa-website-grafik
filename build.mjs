// Baut src/index.js zu dist/rowapa-grafik.min.js und gibt Grösse und SRI-Prüfsumme aus.
import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url)));
const out = new URL('./dist/rowapa-grafik.min.js', import.meta.url);
await build({
  entryPoints: [new URL('./src/index.js', import.meta.url).pathname],
  bundle: true, minify: true, format: 'iife', target: ['es2019'],
  legalComments: 'none', outfile: out.pathname,
  banner: { js: `/* ROWAPA Grafik ${pkg.version} · github.com/ROWAPA-Konzepte/rowapa-website-grafik */` }
});
let code = readFileSync(out, 'utf8').replace('"__VERSION__"', JSON.stringify(pkg.version));
writeFileSync(out, code);
const sri = 'sha384-' + createHash('sha384').update(code).digest('base64');
writeFileSync(new URL('./dist/sri.txt', import.meta.url), sri + '\n');
console.log(`dist/rowapa-grafik.min.js  ${(code.length / 1024).toFixed(1)} KB, gzip ${(gzipSync(code).length / 1024).toFixed(1)} KB`);
console.log(sri);
