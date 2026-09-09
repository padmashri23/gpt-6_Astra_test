import http from 'node:http';
import {createReadStream,existsSync} from 'node:fs';
import {stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';

const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'dist');
const port=Number(process.env.PORT||5173);
if(!existsSync(path.join(root,'index.html'))){console.error('Production build missing. Run npm ci and npm run build first.');process.exit(1);}
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.ttf':'font/ttf','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8','.json':'application/json'};
const server=http.createServer(async(req,res)=>{
 try{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  const url=new URL(req.url,'http://127.0.0.1');const pathname=decodeURIComponent(url.pathname);const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end('Forbidden');return;}
  const info=await stat(file);if(!info.isFile())throw Error('Not a file');
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Content-Length':info.size,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
  if(req.method==='HEAD')res.end();else createReadStream(file).pipe(res);
 }catch{res.writeHead(404);res.end('Not found');}
});
server.on('error',error=>{console.error(error.code==='EADDRINUSE'?`Port ${port} is already in use. If the game is running, open http://127.0.0.1:${port}. Otherwise choose another PORT.`:error.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>{
 const url=`http://127.0.0.1:${port}`;console.log(`\nCINDER CIRCUIT\nPlay at ${url}\nKeep this terminal open. Ctrl+C stops the server.\n`);
 if(process.argv.includes('--open')){
  const command=process.platform==='win32'?'rundll32':process.platform==='darwin'?'open':'xdg-open';const args=process.platform==='win32'?['url.dll,FileProtocolHandler',url]:[url];
  const child=spawn(command,args,{detached:true,stdio:'ignore',windowsHide:true});child.on('error',()=>console.log(`Open ${url} in your browser.`));child.unref();
 }
});
