import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const folder=dirname(fileURLToPath(import.meta.url));
const html=readFileSync(join(folder,'../ptzs.html'),'utf8');
const source=readFileSync(join(folder,'../ptzs.mjs'),'utf8');
const main=readFileSync(join(folder,'../app.mjs'),'utf8');
const catalogExpression=source.slice(source.indexOf('const CATALOG=['),source.indexOf('\nconst BYID='));
const catalog=Function(catalogExpression+'\nreturn CATALOG;')();
test('PTZS editor is separately linked from the simulation mode selector',()=>{
  assert.match(html,/<script type="module" src="\.\/ptzs\.mjs"><\/script>/);
  assert.doesNotMatch(html,/<script(?:\s+[^>]*)?>[\s\S]*?<\/script>/);
  assert.match(main,/data-mode-choice/);
  assert.match(main,/next==='ptzs'/);
  assert.match(main,/location\.assign\('\.\/ptzs\.html'\)/);
});
test('all PTZS symbols are unique and all include vector markup',()=>{
  assert.equal(catalog.length,20);
  assert.equal(new Set(catalog.map(x=>x.id)).size,20);
  assert.ok(catalog.every(x=>x.art.includes('<')&&x.name&&x.cat));
  for(const symbol of ['panel','keypad','reader','pir','glass','smoke','panic','siren','flood','contact'])assert.ok(catalog.some(x=>x.id===symbol));
});
test('SVG downloads and project import/export functionality are present',()=>{
  for(const method of ['schematicSvg','singleSvg','pngExport','validateProject','zipBytes','undo','redo'])assert.ok(source.includes('function '+method+'('));
  for(const id of ['downloadZip','saveJson','loadJson','exportSvg','exportPng','printPdf'])assert.ok(html.includes('id="'+id+'"'));
  assert.match(source,/pointerdown/);
  assert.match(source,/localStorage/);
});
test('generated ZIP contains valid local, central and end headers',async()=>{
  const start=source.indexOf('function zipBytes(entries){');
  const end=source.indexOf('\nfunction demo()',start);
  assert.ok(start>0&&end>start);
  const zipFn=Function('TextEncoder','Blob',source.slice(start,end)+'\nreturn zipBytes;')(TextEncoder,Blob);
  const out=zipFn([['ptzs/test.svg','<svg/>']]);
  const buf=await out.arrayBuffer();
  const b=new DataView(buf);
  assert.equal(b.getUint32(0,true),0x04034b50);
  assert.equal(b.getUint32(buf.byteLength-22,true),0x06054b50);
  const centralOffset=b.getUint32(buf.byteLength-22+16,true);
  assert.equal(b.getUint32(centralOffset,true),0x02014b50);
  assert.equal(b.getUint16(buf.byteLength-22+10,true),1);
});