import { scanCpp } from './arduino-source-editor.mjs?v=20261103-assist2';

export function parseCompilerDiagnostics(log, source = '') {
  const result = [], seen = new Set();
  for (const raw of String(log || '').split('\n')) {
    const line = raw.replace(/^\s*\[[^\]]+\]\s*/, '').replace(/\x1b\[[0-9;]*m/g, '');
    const match = line.match(/^(.*?):(\d+)(?::(\d+))?:\s*(fatal error|error|warning|note):\s*(.*)$/);
    if (!match || !['error', 'fatal error'].includes(match[4])) continue;
    const diagnostic = { file: match[1].trim(), line: Number(match[2]), column: Number(match[3]) || 1, message: match[5].trim() };
    const key = [diagnostic.file, diagnostic.line, diagnostic.column, diagnostic.message].join(':');
    if (seen.has(key)) continue;
    seen.add(key);
    diagnostic.inSketch = /(?:^|[\/\\])shieldio\.ino$/.test(diagnostic.file) && diagnostic.line > 0 && diagnostic.line <= source.split('\n').length;
    diagnostic.kind = 'generic';
    if (/expected ['‘]\)['’] before ['‘];['’]/.test(diagnostic.message)) diagnostic.kind = 'closingParen';
    else if (/expected ['‘];['’]/.test(diagnostic.message)) diagnostic.kind = 'semicolon';
    else if (/expected ['‘]}['’] at end of input/.test(diagnostic.message)) diagnostic.kind = 'closingBrace';
    else if (/missing terminating ["'‘’]/.test(diagnostic.message)) diagnostic.kind = 'quote';
    else if (/was not declared in this scope/.test(diagnostic.message)) {
      diagnostic.kind = 'identifier';
      diagnostic.symbol = diagnostic.message.match(/['‘]([^'’]+)['’]/)?.[1] || '';
    } else if (/No such file or directory/.test(diagnostic.message)) {
      diagnostic.kind = 'library'; diagnostic.symbol = diagnostic.message.split(':')[0];
    } else if (/no matching function|invalid conversion|too (?:few|many) arguments/.test(diagnostic.message)) diagnostic.kind = 'arguments';
    if (diagnostic.inSketch && diagnostic.kind === 'closingParen') {
      const lines = source.split('\n'), code = lines[diagnostic.line - 1], masked = scanCpp(code).masked;
      const offset = diagnostic.column - 1;
      const prefix = masked.slice(0, offset);
      const opens = [...prefix].filter(c => c === '(').length - [...prefix].filter(c => c === ')').length;
      // Only offer a one-character patch when the compiler points precisely to
      // the semicolon and exactly one call parenthesis is open on that line.
      if (code[offset] === ';' && masked[offset] === ';' && opens === 1) {
        const start = lines.slice(0, diagnostic.line - 1).reduce((n, line) => n + line.length + 1, 0) + offset;
        diagnostic.fix = { start, end: start, text: ')' };
      }
    }
    result.push(diagnostic);
  }
  return result;
}

export function describeDiagnostic(diagnostic, language = 'cs') {
  const en = language === 'en', symbol = diagnostic.symbol || '';
  const copy = {
    closingParen: ['Chybí uzavírací závorka ).', 'A closing parenthesis ) is missing.'],
    semicolon: ['Chybí středník ;.', 'A semicolon ; is expected.'],
    closingBrace: ['Chybí uzavírací složená závorka }.', 'A closing brace } is missing.'],
    quote: ['Řetězec nebo znak nemá uzavírací uvozovku.', 'A string or character literal has no closing quote.'],
    identifier: [symbol ? `Neznámý název: ${symbol}.` : 'Neznámý název v programu.', symbol ? `Unknown name: ${symbol}.` : 'Unknown name in the program.'],
    library: [`Chybí soubor knihovny: ${symbol}.`, `Missing library file: ${symbol}.`],
    arguments: ['Volání funkce má nesprávné argumenty.', 'The function call has incorrect arguments.'],
    generic: ['Chyba v programu.', 'Error in the program.'],
  };
  const hints = {
    closingParen: ['Před středník doplň ). Například digitalWrite(LED_GREEN, LOW);', 'Add ) before the semicolon. For example: digitalWrite(LED_GREEN, LOW);'],
    semicolon: ['Středník může chybět na předchozím řádku.', 'The semicolon may be missing on the previous line.'],
    closingBrace: ['Každá otevírací { musí mít odpovídající }. Zkontroluj bloky funkcí, podmínek a cyklů.', 'Each opening { needs a matching }. Check functions, conditions and loops.'],
    quote: ['Zkontroluj dvojici uvozovek a případná zpětná lomítka před nimi.', 'Check the matching quotes and any backslashes before them.'],
    identifier: ['Zkontroluj překlep, velká a malá písmena a deklaraci proměnné nebo funkce před použitím.', 'Check spelling, letter case, and whether the variable or function is declared before use.'],
    library: ['Zkontroluj název v #include. Vlastní knihovnu přidej přes Knihovny → Přidat složku knihovny.', 'Check the #include name. Add a custom library through Libraries → Add library folder.'],
    arguments: ['Porovnej počet a typ hodnot v závorkách s návodem nebo deklarací funkce.', 'Compare the number and types of arguments with the guide or function declaration.'],
    generic: ['Začni touto chybou. Další zprávy mohou být jejím důsledkem; po úpravě spusť kontrolu znovu.', 'Start with this error. Later messages may follow from it; check again after editing.'],
  };
  return { title: (copy[diagnostic.kind] || copy.generic)[en ? 1 : 0], hint: (hints[diagnostic.kind] || hints.generic)[en ? 1 : 0] };
}

export function applyDiagnosticFix(source, expectedSource, fix) {
  if (source !== expectedSource || !fix || !Number.isInteger(fix.start) || !Number.isInteger(fix.end) || fix.start < 0 || fix.end < fix.start || fix.end > source.length) return null;
  return { text: source.slice(0, fix.start) + fix.text + source.slice(fix.end), start: fix.start + fix.text.length, end: fix.start + fix.text.length };
}
