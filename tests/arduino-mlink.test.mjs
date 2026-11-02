import assert from 'node:assert/strict';
import { ReadableStream, WritableStream } from 'node:stream/web';
import { connectMlink } from '../assets/js/arduino-mlink.mjs';
import { flashNano } from '../assets/js/arduino-flasher.mjs';
globalThis.ReadableStream ||= ReadableStream;
globalThis.WritableStream ||= WritableStream;
class MockSocket {
  constructor({wrongChip=false,corrupt=false,unavailable=false,silentCommand=''}={}) {
    this.handlers=new Map();this.connected=false;this.calls=[];this.memory=new Uint8Array(32768).fill(255);this.address=0;
    Object.assign(this,{wrongChip,corrupt,unavailable,silentCommand});
  }
  on(name,fn){const list=this.handlers.get(name)||[];list.push(fn);this.handlers.set(name,list);}
  off(name,fn){this.handlers.set(name,(this.handlers.get(name)||[]).filter(x=>x!==fn));}
  dispatch(name,...args){for(const fn of [...this.handlers.get(name)||[]])fn(...args);}
  open(){queueMicrotask(()=>{if(this.unavailable)this.dispatch('connect_error',new Error('refused'));else{this.connected=true;this.dispatch('connect');}});}
  close(){this.connected=false;this.dispatch('disconnect');}
  emit(event,id,message){
    if(event==='check_mlink_version'){this.dispatch('mlink_version','2.1.1');return;}
    assert.equal(event,'c2s_send');assert.equal(message.connectType,'serialport');this.calls.push(message);
    const {cmd,params}=message;if(cmd===this.silentCommand)return;
    queueMicrotask(()=>{
      let data=true;
      if(cmd==='getDevices')data=[{comName:'/dev/cu.usbserial-RED',manufacturer:'USB serial'},{comName:'/dev/cu.usbserial-RED'},{comName:''}];
      if(cmd==='write'){
        const bytes=params.data;assert.ok(bytes instanceof Uint8Array);assert.equal(bytes.at(-1),0x20);let result=[];
        if(bytes[0]===0x75)result=this.wrongChip?[0x1e,0x95,0x16]:[0x1e,0x95,0x0f];
        if(bytes[0]===0x55)this.address=(bytes[1]|bytes[2]<<8)*2;
        if(bytes[0]===0x64)this.memory.set(bytes.slice(4,-1),this.address);
        if(bytes[0]===0x74){result=Array.from(this.memory.slice(this.address,this.address+128));if(this.corrupt)result[0]^=1;}
        this.dispatch('s2c_receive',{connectType:'serialport',connectName:'/dev/cu.unrelated',method:'onReceive',data:{type:'Buffer',data:[9,9]}});
        this.dispatch('s2c_receive',{connectType:'serialport',connectName:params.options.port,method:'onReceive',data:{type:'Buffer',data:[0x14,...result,0x10]}});
      }
      this.dispatch('s2c_send',id,{connectType:'serialport',method:cmd,error:null,data});
    });
  }
}
function factory(options){const socket=new MockSocket(options);return {socket,ioFactory:(url,opts)=>{assert.equal(url,'http://127.0.0.1:55278');assert.equal(opts.reconnection,false);return socket;}};}
const firmware=':0400000001020304F2\n:00000001FF\n';
export async function runMlinkTests(){
  let passed=0;
  for(const baudRate of [115200,57600]){
    const {socket,ioFactory}=factory();const client=await connectMlink({ioFactory});const ports=await client.listPorts();assert.equal(ports.length,1);
    assert.equal(socket.calls.filter(x=>x.cmd==='open').length,0,'Discovery must not open hardware');
    const progress=[];await flashNano(client.createPort(ports[0].path),firmware,{baudRate,onProgress:p=>progress.push(p)});
    assert.equal(progress.at(-1),'done');assert.deepEqual(Array.from(socket.memory.slice(0,4)),[1,2,3,4]);
    assert.equal(socket.calls.find(x=>x.cmd==='open').params.options.baudRate,baudRate);
    assert.ok(socket.calls.some(x=>x.cmd==='set'&&x.params.data.dtr===false));assert.ok(socket.calls.some(x=>x.cmd==='set'&&x.params.data.dtr===true));
    assert.equal(socket.calls.at(-1).cmd,'close');assert.equal(client.ports.size,0);client.close();passed++;
  }
  for(const options of [{wrongChip:true},{corrupt:true}]){
    const {socket,ioFactory}=factory(options);const client=await connectMlink({ioFactory});const progress=[];
    await assert.rejects(flashNano(client.createPort('/dev/cu.usbserial-RED'),firmware,{onProgress:p=>progress.push(p)}),options.wrongChip?/WRONG_CHIP/:/VERIFY_FAILED/);
    assert.ok(!progress.includes('done'));assert.equal(socket.calls.at(-1).cmd,'close');client.close();passed++;
  }
  {
    const {socket,ioFactory}=factory({unavailable:true});await assert.rejects(connectMlink({ioFactory}),error=>{
      assert.equal(error.message,'MLINK_UNAVAILABLE');assert.match(error.details,/127\.0\.0\.1:55278/);assert.match(error.details,/refused/);return true;
    });assert.equal(socket.connected,false);passed++;
  }
  {
    const {ioFactory}=factory({silentCommand:'getDevices'});const client=await connectMlink({ioFactory,timeout:20});await assert.rejects(client.listPorts(),/MLINK_TIMEOUT/);assert.equal(client.pending.size,0);client.close();passed++;
  }
  {
    const {socket,ioFactory}=factory({silentCommand:'open'});const client=await connectMlink({ioFactory,timeout:20});await assert.rejects(client.createPort('/dev/cu.usbserial-RED').open({baudRate:115200}),/MLINK_TIMEOUT/);assert.equal(socket.calls.at(-1).cmd,'close');assert.equal(client.ports.size,0);client.close();passed++;
  }
  {
    const {socket,ioFactory}=factory({silentCommand:'getDevices'});const client=await connectMlink({ioFactory});const pending=client.listPorts();socket.close();await assert.rejects(pending,/MLINK_DISCONNECTED/);assert.equal(client.pending.size,0);passed++;
  }
  return {passed};
}
if(typeof process!=='undefined'&&process.argv?.[1]&&import.meta.url.endsWith(process.argv[1]))console.log(await runMlinkTests());

