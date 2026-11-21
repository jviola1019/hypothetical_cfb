// Real Node worker-thread bridge around the same browser Web Worker module.
import {parentPort} from 'node:worker_threads';
globalThis.self={onmessage:null,postMessage:(x)=>parentPort.postMessage(x)};
await import('../src/worker.js');
parentPort.on('message',d=>self.onmessage({data:d}));
parentPort.postMessage({type:'ready'});
