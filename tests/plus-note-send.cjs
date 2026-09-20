const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto').webcrypto;
const source = fs.readFileSync(require('node:path').join(__dirname, '../learn/worker.js'), 'utf8');
const ctx = vm.createContext({ Request, Response, Headers, URL, URLSearchParams, TextEncoder, TextDecoder, AbortSignal, crypto, console });
vm.runInContext(source.replace('export class', 'class').replace('export default', 'const worker =') + ';globalThis.api={probeEdupage,NoteSubmissionGuard,noteDialogAccepted};', ctx);
class Storage {
  constructor() { this.values = new Map(); this.tail = Promise.resolve(); }
  async get(k) { return structuredClone(this.values.get(k)); }
  async put(k,v) { this.values.set(k,structuredClone(v)); }
  async setAlarm(t) { this.alarm = t; }
  async deleteAll() { this.values.clear(); }
  transaction(fn) { const result = this.tail.then(()=>fn(this)); this.tail = result.catch(()=>{}); return result; }
}
const fields = ['datefrom','dateto','periodfrom','periodto','note','day_periodfrom','day_periodto','advanced_mode','day0','day1','day2','day3','day4','day5','day6','remove_menu_evidence'];
const formSource = `gi42._gclass="OspravedlnenkaDlg";gi42.myphpfile="/gcall";gi42._gparam="gpid=1234&gsh=FAKE";ASC.jscFieldsParams(gi42,${JSON.stringify(fields)});gi42.ASC_action('ok',params);var gi88_c = new ASC.ui.ComboBox(null,"",[{"value":""},{"value":"7"}],{});gi42.periodfrom=gi88;var gi99_c = new ASC.ui.ComboBox(null,"",[{"value":""},{"value":"9"}],{});gi42.periodto=gi99;`;
const accepted = `JS: var gi55 = document.getElementById('gip1234').ASC_gjsc;gi55.ASC_cop="ok";gi55.dlg.hide();`;
const note = { date:'2026-09-17',first:7,last:9,reason:'Kulturní akce' };
const attendance = dates => `ASC.requireAsync('/dashboard/dochadzka.js#initZiak').then(function(f){return f(null,null,${JSON.stringify({students:{TEST_STUDENT:dates}})});});`;
const response = (url,body,extra={}) => { const r = new Response(body,extra); Object.defineProperty(r,'url',{value:String(url)}); return r; };
function harness(mode='success') {
  let writes=0, requests=0, currentNote=note;
  const guards = new Map();
  const env = { EDUPAGE_LOCAL_ENABLED:'true',EDUPAGE_NOTES_ENABLED:'true',PUBLIC_HOST:'learn.shieldio.cz',LEARN_SESSION_SECRET:'FAKE_SECRET',EDUPAGE_RATE_LIMITER:{limit:async()=>({success:true})},NOTE_SUBMISSIONS:{idFromName:k=>k,get:k=>{if(!guards.has(k)) guards.set(k,new ctx.api.NoteSubmissionGuard({storage:new Storage()}));return guards.get(k);}} };
  ctx.fetch = async (url,opts) => {
    requests++;
    const path = new URL(url).pathname;
    if (path === '/login/') return response(url,'{"csrftoken":"FAKE"}');
    if (path === '/login/edubarLogin.php') return response(url,'userhome({})',{headers:{'set-cookie':'PHPSESSID=FAKE; Path=/'}});
    if (path === '/timeline/') return response(url,mode==='protocol'?'unknown':formSource);
    if (path === '/dashboard/eb.php') {
      const rows = mode==='existing' || writes && !['missing','timeout'].includes(mode) ? {ROW:{sa_note_subId:'NEW_FAKE_ID',sanote:note.reason}} : {};
      const dates = {}; for (let d=Date.parse(currentNote.date); d<=Date.parse(currentNote.to || currentNote.date); d+=86400000) dates[new Date(d).toISOString().slice(0,10)]=rows;
      return response(url,attendance(dates));
    }
    if (path === '/gcall') {
      writes++;
      const b=new URLSearchParams(opts.body);
      assert.equal(b.get('action'),'ok');assert.equal(b.get('note'),note.reason);assert.equal(b.get('datefrom'),currentNote.date);assert.equal(b.get('dateto'),currentNote.to || currentNote.date);assert.equal(b.get('periodfrom'),currentNote.scope==='days'?'':'7');assert.equal(b.get('periodto'),currentNote.scope==='days'?'':'9');assert.equal(b.get('remove_menu_evidence'),'0');assert.equal(b.get('_LJSL'),'4096');
      if(mode==='timeout') throw new Error('synthetic timeout');
      return response(url,accepted);
    }
    throw new Error('unexpected endpoint');
  };
  const run = async (extra={}) => {
    currentNote=extra.note || note;
    const req = new Request('https://learn.shieldio.cz/api/edupage/absence-note',{method:'POST',headers:{origin:'https://learn.shieldio.cz','content-type':'application/json'},body:JSON.stringify({school:'spszl',username:'FAKE_USER',password:'FAKE_PASSWORD',privacyConsent:true,submissionConsent:true,note,...extra})});
    const result = await ctx.api.probeEdupage(req,env,true);return result.json();
  };
  return {run,env,guards,writes:()=>writes,requests:()=>requests};
}
(async()=>{
  let h=harness(); assert.equal((await h.run({submissionConsent:false})).code,'notes-consent');assert.equal(h.requests(),0);
  assert.equal((await h.run({note:{...note,first:10}})).code,'notes-input');assert.equal(h.requests(),0);
  h=harness('existing');assert.equal((await h.run()).code,'notes-existing');assert.equal(h.writes(),0);
  h=harness('protocol');assert.equal((await h.run()).code,'notes-protocol');assert.equal(h.writes(),0);
  h=harness();assert.equal((await h.run()).code,'notes-verified');assert.equal(h.writes(),1);
  h=harness('timeout');assert.equal((await h.run()).code,'notes-uncertain');assert.equal(h.writes(),1);assert.equal((await h.run()).code,'notes-duplicate');assert.equal(h.writes(),1);
  h=harness('missing');assert.equal((await h.run()).code,'notes-uncertain');assert.equal((await h.run()).code,'notes-duplicate');assert.equal(h.writes(),1);
  const wholeDay={...note,scope:'days',to:note.date};
  h=harness();assert.equal((await h.run({note:wholeDay})).code,'notes-verified');assert.equal(h.writes(),1);
  const range={...wholeDay,to:'2026-09-20'};
  h=harness();assert.equal((await h.run({note:range})).code,'notes-verified');assert.equal(h.writes(),1);assert.equal(h.guards.size,4);
  h=harness('timeout');assert.equal((await h.run({note:range})).code,'notes-uncertain');assert.equal((await h.run({note:{...wholeDay,date:'2026-09-19',to:'2026-09-19'}})).code,'notes-duplicate');assert.equal(h.writes(),1);
  h=harness();for (const invalid of [{...range,to:'2026-09-16'},{...range,to:'2026-12-01'},{...range,scope:'periods'},{...range,scope:'unknown'},{...range,to:'2026-02-30'}]) {assert.equal((await h.run({note:invalid})).code,'notes-input');}assert.equal(h.writes(),0);assert.equal(h.requests(),0);
  assert.equal(ctx.api.noteDialogAccepted(accepted,'999'),false);
  const storage=new Storage();let guard=new ctx.api.NoteSubmissionGuard({storage});
  const claim=()=>guard.fetch(new Request('https://guard/claim',{method:'POST'})).then(r=>r.json());
  const claims=await Promise.all([claim(),claim()]);assert.equal(claims.filter(r=>r.claimed).length,1);
  guard=new ctx.api.NoteSubmissionGuard({storage});assert.equal((await claim()).claimed,false);
  assert.ok(!JSON.stringify([...storage.values]).match(/Kulturní|FAKE_PASSWORD|TEST_STUDENT/));
  await guard.alarm();assert.equal(storage.values.size,0);
  console.log('Omluvenky: souhlas, validace, existující záznam, nový dialog, potvrzení, timeout bez retry, chybějící záznam, atomický guard a obnova OK. Žádná skutečná síť.');
})().catch(e=>{console.error(e);process.exitCode=1;});
