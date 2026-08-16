import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const src = fs.readFileSync(new URL('./GrainTCP.js', import.meta.url), 'utf8')
  .replace(/^export default[^;]+;/m, '')
  .replace(/const CFG =/, 'globalThis.CFG =')
  + '\nglobalThis.__test={proxyList,dial,addr};';
const ctx={console,TextDecoder,TextEncoder,Uint8Array,ArrayBuffer,Promise,setTimeout,clearTimeout};
vm.createContext(ctx); vm.runInContext(src,ctx); const {proxyList,dial,addr}=ctx.__test;
assert.deepEqual(JSON.parse(JSON.stringify(proxyList('proxy.example:8443,1.2.3.4,[2606:4700::1]:443'))),[
 {h:'proxy.example',p:8443},{h:'1.2.3.4',p:443},{h:'2606:4700::1',p:443}
]);
assert.equal(addr(4,new Uint8Array([0x26,0x06,0x47,0,0,0,0,0,0,0,0,0,0,0,0,1])),'2606:4700:0:0:0:0:0:1');
const attempts=[];
const f={connect({hostname,port}){attempts.push(`${hostname}:${port}`);const ok=hostname==='proxy.example';return {opened:ok?Promise.resolve():Promise.reject(new Error('blocked')),close(){}}}};
const s=await dial(f,'cloudflare.com',443,'proxy.example:443');
assert.ok(s); assert.ok(attempts.includes('cloudflare.com:443')); assert.ok(attempts.includes('proxy.example:443'));
await assert.rejects(()=>dial(f,'cloudflare.com',443,''));
console.log('ok proxy parser, IPv6 direct dial, fallback dial');
