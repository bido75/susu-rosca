import { requireUser } from '@/lib/auth';import { db } from '@/lib/db';import { memberAccess } from '@/lib/circles';import { failure } from '@/lib/http';
export const runtime='nodejs';export const dynamic='force-dynamic';
// Database-backed event streaming across app instances; clients refetch authorized data.
export async function GET(_:Request,{params}:{params:{id:string}}){try{const user=await requireUser();await memberAccess(params.id,user.id);
 const encoder=new TextEncoder();let timer:ReturnType<typeof setInterval>|undefined;let last='';let busy=false;
 const stream=new ReadableStream({start(controller){
  controller.enqueue(encoder.encode('retry: 3000\n\n'));
  timer=setInterval(async()=>{if(busy)return;busy=true;try{
   const member=await db.circleMember.findUnique({where:{circleId_userId:{circleId:params.id,userId:user.id}}});if(!member){controller.close();if(timer)clearInterval(timer);return;}
   const [circle,latest]=await Promise.all([db.circle.findUnique({where:{id:params.id},select:{updatedAt:true}}),db.auditLog.findFirst({where:{circleId:params.id},orderBy:{createdAt:'desc'},select:{id:true}})]);
   const version=`${circle?.updatedAt.toISOString()}|${latest?.id||''}`;
   if(version!==last){last=version;controller.enqueue(encoder.encode(`event: changed\ndata: ${JSON.stringify({version})}\n\n`));}
  }catch{if(timer)clearInterval(timer);try{controller.close();}catch{}}finally{busy=false;}},2000);
 },cancel(){if(timer)clearInterval(timer);}});
 return new Response(stream,{headers:{'Content-Type':'text/event-stream','Cache-Control':'no-cache, no-transform','X-Accel-Buffering':'no'}});
}catch(e){return failure(e)}}
