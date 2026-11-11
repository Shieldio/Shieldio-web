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
  assert.doesNotMatch(html,/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/);
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

test('PZTS export shows items outside the initial 1600 × 900 work area',()=>{
  const start=source.indexOf('function exportBounds(){');
  const end=source.indexOf('function schematicSvg()',start);
  assert.ok(start>0&&end>start,'dynamic export bounds must exist');
  const project={nodes:[{x:2800,y:-960},{x:3500,y:-100}],wires:[{a:{x:2750,y:-900},b:{x:3550,y:-40}}]};
  const bounds=Function('doc','WIDTH','HEIGHT','endPoint',source.slice(start,end)+';return exportBounds();')(project,1600,900,p=>p);
  assert.ok(bounds.x<=2710 && bounds.x+bounds.w>=3590,'all symbols are inside export');
  assert.ok(bounds.y<=-1035 && bounds.y+bounds.h>=0,'vertical labels are inside export');
  assert.ok(Math.abs(bounds.w/bounds.h-1600/900)<1e-10,'landscape aspect ratio is preserved');
});
test('PZTS project import sanitizes positions and rejects broken references',()=>{
  const start=source.indexOf('function validateProject(');
  const end=source.indexOf('function library()',start);
  assert.ok(start>0&&end>start);
  let i=0;
  const validate=Function('BYID','newId','snap',source.slice(start,end)+';return validateProject;')(
    new Map(catalog.map(c=>[c.id,c])),()=>String(++i),n=>Math.round(n/20)*20);
  const base={title:'test',nodes:[{id:'a',type:'panel',x:2,y:24,label:'PZTS'}],wires:[{a:{id:'a',port:'r'},b:{x:120,y:100}}]};
  const parsed=validate(base);
  assert.equal(parsed.nodes[0].x,0);
  assert.equal(parsed.nodes[0].y,20);
  assert.equal(parsed.wires[0].a.port,'r');
  assert.throws(()=>validate({...base,nodes:[{...base.nodes[0],type:'unknown'}]}));
  assert.throws(()=>validate({...base,nodes:[base.nodes[0],base.nodes[0]]}));
  assert.throws(()=>validate({...base,wires:[{a:{id:'missing',port:'l'},b:{x:0,y:0}}]}));
  assert.throws(()=>validate({...base,wires:new Array(1501).fill(base.wires[0])}));
});
