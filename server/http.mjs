export function appBasePath(env){
 const value=env.APP_BASE_PATH??'/';
 if(typeof value!=='string'||!/^\/(?:[a-z0-9][a-z0-9-]*\/)*$/.test(value))throw Object.assign(new Error('Application base path is not configured correctly.'),{status:503});
 return value;
}
export async function boundedText(request,maximum){
 if(Number(request.headers.get('content-length')||0)>maximum)throw Object.assign(new Error('Request is too large.'),{status:413});
 if(!request.body)return'';const reader=request.body.getReader(),chunks=[];let length=0;
 while(true){const{done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>maximum){await reader.cancel();throw Object.assign(new Error('Request is too large.'),{status:413});}chunks.push(value);}
 const data=new Uint8Array(length);let offset=0;for(const chunk of chunks){data.set(chunk,offset);offset+=chunk.byteLength;}return new TextDecoder('utf-8',{fatal:true}).decode(data);
}
