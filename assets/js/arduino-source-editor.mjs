// Pure text edit used by the textarea, including multi-line indent/outdent.
export function indentSelection(text, start, end, outdent = false) {
  const lineStart = text.lastIndexOf('\n', start - 1) + 1;
  if (start === end && !outdent) return {text:text.slice(0,start)+'  '+text.slice(end),start:start+2,end:start+2};
  const stop = end > start && text[end-1] === '\n' ? end-1 : end;
  const nextBreak = text.indexOf('\n', stop);
  const lineEnd = nextBreak < 0 ? text.length : nextBreak;
  const original = text.slice(lineStart,lineEnd).split('\n');
  const delta = original.map(line => outdent ? -(line.startsWith('\t') ? 1 : Math.min(2,line.match(/^ */)[0].length)) : 2);
  const edited = original.map((line,i) => outdent ? line.slice(-delta[i]) : '  '+line).join('\n');
  return {text:text.slice(0,lineStart)+edited+text.slice(lineEnd),start:Math.max(lineStart,start+delta[0]),end:Math.max(lineStart,end+delta.reduce((n,d)=>n+d,0))};
}
