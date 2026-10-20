import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const target=new URL('./vendor/eecircuit-engine-1.8.0.mjs',import.meta.url);
const digest='a4a4776888e6fbbd1c1be755adba8bc48c0921a26649e86c7539c40433cfe66e';
const hash=data=>createHash('sha256').update(data).digest('hex');
let cached;
try{cached=await readFile(target);}catch{}
if(cached&&hash(cached)===digest){console.log('ngspice WASM 1.8.0: ověřený lokální soubor.');}
else {
 const response=await fetch('https://cdn.jsdelivr.net/npm/eecircuit-engine@1.8.0/dist/eecircuit-engine.mjs',{signal:AbortSignal.timeout(90000)});
 if(!response.ok)throw Error(`Stažení ngspice selhalo: HTTP ${response.status}`);
 const data=new Uint8Array(await response.arrayBuffer());
 if(hash(data)!==digest)throw Error('Nesouhlasí SHA-256 simulačního jádra. Nasazení zastaveno.');
 await mkdir(new URL('./vendor/',import.meta.url),{recursive:true});
 await writeFile(target,data);
 console.log('ngspice WASM 1.8.0: staženo a SHA-256 ověřeno.');
}
