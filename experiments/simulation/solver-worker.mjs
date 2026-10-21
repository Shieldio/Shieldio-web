import {dc,transient,ac} from './engine.mjs';
import {runSpice} from './spice-adapter.mjs';
import {isDigital} from './digital.mjs';
self.onmessage=async({data})=>{
 const {id,mode,project,options={}}=data;
 try {
  let result;
  if(mode==='bundle'){
   const s=options.settings||project.settings||{};
   const spice=s.engine==='spice'&&!isDigital(project);
   const point=options.analysis==='scope'?null:(spice?await runSpice(project,{mode:'op'}):dc(project));
   const analysis=options.analysis==='scope'?(spice?await runSpice(project,{mode:'tran',duration:s.duration,step:s.step}):transient(project,{duration:s.duration,step:s.step})):options.analysis==='bode'?(spice?await runSpice(project,{mode:'ac',start:s.acStart,stop:s.acStop,points:Math.min(1000,Math.max(10,s.acPoints||180))}):ac(project,{start:s.acStart,stop:s.acStop,points:Math.min(1000,Math.max(10,s.acPoints||180))})):null;
   result={dc:point,analysis};
  }else if(mode==='dc')result=dc(project);
  else if(mode==='tran')result=transient(project,options);
  else if(mode==='ac')result=ac(project,options);
  else throw Error('Neznámý druh analýzy.');
  self.postMessage({id,result});
 }catch(error){self.postMessage({id,error:error.message||String(error)});}
};
