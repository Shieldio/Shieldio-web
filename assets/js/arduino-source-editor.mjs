// Pure text edit used by the textarea, including multi-line indent/outdent.
export function indentSelection(text, start, end, outdent = false) {
  const lineStart = start > 0 ? text.lastIndexOf('\n', start - 1) + 1 : 0;
  if (start === end && !outdent) return {text:text.slice(0,start)+'  '+text.slice(end),start:start+2,end:start+2};
  const stop = end > start && text[end-1] === '\n' ? end-1 : end;
  const nextBreak = text.indexOf('\n', stop);
  const lineEnd = nextBreak < 0 ? text.length : nextBreak;
  const original = text.slice(lineStart,lineEnd).split('\n');
  const delta = original.map(line => outdent ? -(line.startsWith('\t') ? 1 : Math.min(2,line.match(/^ */)[0].length)) : 2);
  const edited = original.map((line,i) => outdent ? line.slice(-delta[i]) : '  '+line).join('\n');
  return {text:text.slice(0,lineStart)+edited+text.slice(lineEnd),start:Math.max(lineStart,start+delta[0]),end:Math.max(lineStart,end+delta.reduce((n,d)=>n+d,0))};
}

// Mask comments and literals without changing offsets or line numbers. Preserve
// multiline literal/comment bodies during indentation, including C++ raw strings.
export function scanCpp(text) {
  const masked = text.split('');
  const protectedLines = new Set();
  let state = 'code', quote = '', rawEnd = '', line = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], next = text[i + 1];
    if (c === '\n') {
      line++;
      if (state === 'line') state = 'code';
      else if (state !== 'code') protectedLines.add(line);
      continue;
    }
    if (state === 'line') { masked[i] = ' '; continue; }
    if (state === 'block') {
      masked[i] = ' ';
      if (c === '*' && next === '/') { masked[++i] = ' '; state = 'code'; }
      continue;
    }
    if (state === 'raw') {
      masked[i] = ' ';
      if (text.startsWith(rawEnd, i)) {
        for (let j = 0; j < rawEnd.length; j++) masked[i + j] = ' ';
        i += rawEnd.length - 1; state = 'code';
      }
      continue;
    }
    if (state === 'string') {
      masked[i] = ' ';
      if (c === '\\' && next !== undefined && next !== '\n') masked[++i] = ' ';
      else if (c === quote) state = 'code';
      continue;
    }
    if (c === '/' && (next === '/' || next === '*')) {
      masked[i] = masked[i + 1] = ' '; i++;
      state = next === '/' ? 'line' : 'block';
    } else if (c === 'R' && next === '"') {
      const match = text.slice(i).match(/^R"([^ ()\\\t\r\n]{0,16})\(/);
      if (match) {
        rawEnd = ')' + match[1] + '"'; state = 'raw';
        for (let j = 0; j < match[0].length; j++) masked[i + j] = ' ';
        i += match[0].length - 1;
      }
    } else if (c === '"' || (c === "'" && !(/[\da-f]/i.test(text[i - 1] || '') && /[\da-f]/i.test(next || '')))) {
      quote = c; state = 'string'; masked[i] = ' ';
    }
  }
  return { masked: masked.join(''), protectedLines, state };
}

function replaceRange(text, start, end, inserted, selectionStart, selectionEnd = selectionStart) {
  return { text: text.slice(0, start) + inserted + text.slice(end), start: selectionStart, end: selectionEnd };
}

export function codeKeyEdit(text, start, end, event) {
  if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return null;
  if (event.key === 'Tab') return indentSelection(text, start, end, event.shiftKey);
  if (!['Enter', 'Backspace', '(', ')', '[', ']', '{', '}', '"', "'"].includes(event.key)) return null;
  const lineStart = start > 0 ? text.lastIndexOf('\n', start - 1) + 1 : 0;
  const before = text.slice(lineStart, start), after = text.slice(end);
  const state = scanCpp(text.slice(0, start)).state;
  if (event.key === 'Enter') {
    if (state === 'raw' || state === 'string') return replaceRange(text, start, end, '\n', start + 1);
    const indent = before.match(/^[ \t]*/)[0];
    const opener = state === 'code' && /[{[(]\s*$/.test(scanCpp(before).masked);
    if (opener && /^[ \t]*[}\])]/.test(after)) {
      const spaces = after.match(/^[ \t]*/)[0].length;
      return replaceRange(text, start, end + spaces, '\n' + indent + '  \n' + indent, start + indent.length + 3);
    }
    const inserted = '\n' + indent + (opener ? '  ' : '');
    return replaceRange(text, start, end, inserted, start + inserted.length);
  }
  const pairs = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'" };
  if (event.key === 'Backspace' && start === end && start > 0 && pairs[text[start - 1]] === text[end]) {
    return replaceRange(text, start - 1, end + 1, '', start - 1);
  }
  const quote = event.key === '"' || event.key === "'";
  const escaped = /\\(?:\\\\)*$/.test(text.slice(0, start));
  if (start === end && text[start] === event.key && (/^[)\]}]$/.test(event.key) && state === 'code' || quote && state === 'string' && !escaped)) {
    return { text, start: start + 1, end: start + 1 };
  }
  if (pairs[event.key] && state === 'code' && (!quote || !/[\w]/.test(text[start - 1] || ''))) {
    if (start !== end) return replaceRange(text, start, end, event.key + text.slice(start, end) + pairs[event.key], start + 1, end + 1);
    if (!after || /^[\s)\]};,]/.test(after)) return replaceRange(text, start, end, event.key + pairs[event.key], start + 1);
  }
  if (event.key === '}' && state === 'code' && start === end && /^[ \t]+$/.test(before)) {
    const remove = before.endsWith('\t') ? 1 : Math.min(2, before.length);
    return replaceRange(text, start - remove, end, '}', start - remove + 1);
  }
  return null;
}

export function formatIndentation(text, start = 0, end = start) {
  const scan = scanCpp(text), original = text.split('\n'), masked = scan.masked.split('\n');
  const changes = [];
  let depth = 0, continuation = false, oldOffset = 0;
  const lines = original.map((line, i) => {
    const syntax = masked[i].trim(), macro = continuation || /^\s*#/.test(line);
    continuation = macro && /\\\s*$/.test(line);
    if (macro) { oldOffset += line.length + 1; return line; }
    const leadingClose = syntax.match(/^}+/)?.[0].length || 0;
    const indent = line.trim() ? '  '.repeat(Math.max(0, depth - leadingClose)) : '';
    const oldIndent = line.match(/^[ \t]*/)[0].length;
    const result = scan.protectedLines.has(i) ? line : indent + line.slice(oldIndent);
    if (!scan.protectedLines.has(i)) changes.push({ offset: oldOffset, oldIndent, newIndent: indent.length });
    for (const c of syntax) { if (c === '{') depth++; else if (c === '}') depth = Math.max(0, depth - 1); }
    oldOffset += line.length + 1;
    return result;
  });
  const remap = position => {
    let delta = 0;
    for (const change of changes) {
      if (position < change.offset) break;
      if (position <= change.offset + change.oldIndent) return change.offset + delta + Math.max(0, change.newIndent - change.oldIndent + position - change.offset);
      delta += change.newIndent - change.oldIndent;
    }
    return position + delta;
  };
  return { text: lines.join('\n'), start: remap(start), end: remap(end) };
}

export function toggleLineComment(text, start, end) {
  const first = start > 0 ? text.lastIndexOf('\n', start - 1) + 1 : 0;
  const stop = end > start && text[end - 1] === '\n' ? end - 1 : end;
  let last = text.indexOf('\n', stop); if (last < 0) last = text.length;
  const lines = text.slice(first, last).split('\n'), nonempty = lines.filter(line => line.trim());
  const remove = nonempty.length > 0 && nonempty.every(line => /^\s*\/\//.test(line));
  const edited = lines.map(line => {
    if (!line.trim()) return line;
    return remove ? line.replace(/^(\s*)\/\/ ?/, '$1') : line.replace(/^(\s*)/, '$1// ');
  }).join('\n');
  return { text: text.slice(0, first) + edited + text.slice(last), start: first, end: first + edited.length };
}
