// Local C++ Arduino-library import and dependency resolution. No package registry or code upload.
export const LIBRARY_LIMITS = Object.freeze({ count: 8, files: 160, bytes: 2 * 1024 * 1024, units: 12 });
const header = /\.(?:h|hpp|hh)$/i;
const supportedFile = /\.(?:h|hpp|hh|inc|ipp|tpp|cpp|cc|cxx)$/i;
const sourceFile = /\.(?:cpp|cc|cxx)$/i;
const forbiddenHeader = /^(?:Arduino|Wire|SPI|Servo|Adafruit_GFX|Adafruit_SSD1306|ShieldioDisplay)\.h$/;
function fail(code, detail = '') { const e = new Error(code); e.details = detail; throw e; }
function safePath(path) {
  if (typeof path !== 'string' || path.length > 220 || !path || /[\\\x00-\x1f:]/.test(path) || path.startsWith('/') || path.split('/').some(p => !p || p === '.' || p === '..')) fail('LIBRARY_PATH', String(path));
  return path;
}
export function validateLibraries(libraries = []) {
  if (!Array.isArray(libraries) || libraries.length > LIBRARY_LIMITS.count) fail('LIBRARY_LIMIT');
  let bytes = 0, count = 0, units = 0;
  const names = new Set();
  for (const library of libraries) {
    if (!library || typeof library.name !== 'string' || !/^[\w .+-]{1,80}$/.test(library.name) || names.has(library.name) || !Array.isArray(library.files)) fail('LIBRARY_FORMAT');
    names.add(library.name);
    const paths = new Set();
    for (const file of library.files) {
      safePath(file.path);
      if (!supportedFile.test(file.path) || typeof file.content !== 'string' || paths.has(file.path)) fail('LIBRARY_FORMAT', file.path);
      paths.add(file.path);bytes += new TextEncoder().encode(file.content).length;count++;
      if (sourceFile.test(file.path)) units++;
    }
    if (!library.files.some(f => header.test(f.path))) fail('LIBRARY_FORMAT');
  }
  if (bytes > LIBRARY_LIMITS.bytes || count > LIBRARY_LIMITS.files || units > LIBRARY_LIMITS.units) fail('LIBRARY_LIMIT');
  return libraries;
}
export async function importLibrary(fileList) {
  const input = [...fileList];
  if (!input.length || input.length > 1200 || input.reduce((sum, f) => sum + f.size, 0) > 20 * 1024 * 1024) fail('LIBRARY_LIMIT');
  const raw = input.map(file => ({ file, path: safePath(file.webkitRelativePath || file.name) }));
  const folder = raw[0].path.split('/')[0];
  if (!raw.every(f => f.path.startsWith(folder + '/'))) fail('LIBRARY_FORMAT');
  const entries = raw.map(f => ({ file:f.file, path:f.path.slice(folder.length + 1) }));
  const props = entries.find(f => f.path === 'library.properties');
  const values = Object.fromEntries((props ? await props.file.text() : '').split(/\r?\n/).filter(l => l.includes('=') && !l.trim().startsWith('#')).map(l => {const i=l.indexOf('=');return [l.slice(0,i).trim(),l.slice(i+1).trim()];}));
  if (values.architectures && !values.architectures.split(',').some(a => ['avr', '*'].includes(a.trim()))) fail('LIBRARY_ARCH', values.architectures);
  const modern = entries.some(f => f.path.startsWith('src/'));
  const candidates = entries.filter(f => modern ? f.path.startsWith('src/') : !f.path.includes('/') || f.path.startsWith('utility/'));
  if (candidates.some(f => /\.(?:c|s|S|a|o)$/.test(f.path))) fail('LIBRARY_LANGUAGE');
  const code = candidates.filter(f => supportedFile.test(f.path));
  if (code.reduce((n,f) => n+f.file.size, 0) > LIBRARY_LIMITS.bytes) fail('LIBRARY_LIMIT');
  if (code.some(f => forbiddenHeader.test(f.path.split('/').at(-1)))) fail('LIBRARY_CONFLICT');
  const library = { name: values.name || folder, version: values.version || '', files: await Promise.all(code.map(async f => ({path:f.path, content:await f.file.text()}))) };
  validateLibraries([library]);
  return library;
}
const includes = text => [...text.matchAll(/^\s*#\s*include\s*[<"]([^>"\r\n]+)[>"]/gm)].map(m => m[1]);
export function resolveLibraries(source, libraries = []) {
  validateLibraries(libraries);
  const selected = new Set();
  let text = source, changed = true;
  const roots = lib => lib.files.some(f => f.path.startsWith('src/')) ? ['src/'] : ['', 'utility/'];
  while (changed) {
    changed = false;
    const needed = new Set(includes(text));
    for (const library of libraries) {
      if (selected.has(library)) continue;
      if (library.files.some(f => roots(library).some(root => f.path.startsWith(root) && needed.has(f.path.slice(root.length))))) {
        selected.add(library);text += '\n' + library.files.map(f => f.content).join('\n');changed = true;
      }
    }
  }
  const files = [], includeDirs = [], sources = [];
  [...selected].forEach((library, index) => {
    const base = '/custom/lib' + index;
    roots(library).forEach(root => includeDirs.push(base + (root ? '/' + root.slice(0,-1) : '')));
    library.files.forEach(f => {const file = {...f, path:base+'/'+f.path};files.push(file);if(sourceFile.test(f.path))sources.push(file);});
  });
  // Ambiguous public include names are rejected instead of silently choosing an import order.
  const owners = new Map();
  for (const library of selected) for (const f of library.files.filter(f => header.test(f.path))) for (const root of roots(library)) {
    if (!f.path.startsWith(root)) continue;
    const name = f.path.slice(root.length);
    if (owners.has(name) && owners.get(name) !== library) fail('LIBRARY_CONFLICT', name);
    owners.set(name, library);
  }
  return {files, includeDirs, sources, dependencySource:text};
}
