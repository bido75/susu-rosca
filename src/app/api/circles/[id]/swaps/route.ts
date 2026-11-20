import { notifyCircle } from '@/lib/realtime';
import { z } from 'zod';import { db } from '@/lib/db';import { requireUser,ApiError } from '@/lib/auth';import { failure,success } from '@/lib/http';import { lockCircle,audit } from '@/lib/circles';
export async function POST(req:Request,ctx:{params:Promise<{id:string}>}){try{const params=await ctx.params;const user=await requireUser();const {targetUserId}=z.object({targetUserId:z.uuid()}).parse(await req.json());const swap=await db.$transaction(async tx=>{
 await lockCircle(tx,params.id);const circle=await tx.circle.findUnique({where:{id:params.id},include:{members:true}});if(!circle||circle.status!=='ACTIVE')throw new ApiError(409,'Circle not active');
 const a=circle.members.find(m=>m.userId===user.id),b=circle.members.find(m=>m.userId===targetUserId);
 if(!a||!b||!a.slotNumber||!b.slotNumber||a.id===b.id)throw new ApiError(400,'Invalid swap members');
 if(a.slotNumber<=circle.currentCycle||b.slotNumber<=circle.currentCycle)throw new ApiError(409,'Only future slots can be swapped');
 const existing=await tx.slotSwap.findFirst({where:{circleId:params.id,status:'PENDING',OR:[{requesterId:user.id},{targetId:user.id},{requesterId:targetUserId},{targetId:targetUserId}]}});
 if(existing)throw new ApiError(409,'One of the members has a pending request');
 const s=await tx.slotSwap.create({data:{circleId:params.id,requesterId:user.id,targetId:targetUserId}});
 await audit(tx,user.id,params.id,'SWAP_REQUESTED',s.id,{targetUserId});return s;
 });void notifyCircle(params.id);
return success({swap},201);
}catch(e){return failure(e)}}
