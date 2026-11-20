import { z } from 'zod';import { db } from '@/lib/db';import { requireUser,ApiError } from '@/lib/auth';import { failure,success } from '@/lib/http';import { organizerOnly,lockCircle,audit } from '@/lib/circles';
import { verifySchema } from '@/lib/schemas';
export async function POST(req:Request,ctx:{params:Promise<{id:string}>}){try{const params=await ctx.params;const user=await requireUser();const {contributionId}=verifySchema.parse(await req.json());const result=await db.$transaction(async tx=>{
 await lockCircle(tx,params.id);const circle=await tx.circle.findUniqueOrThrow({where:{id:params.id}});organizerOnly(circle,user.id);
 if(circle.status!=='ACTIVE')throw new ApiError(409,'Not active');
 const cycle=await tx.cycle.findUniqueOrThrow({where:{circleId_cycleNumber:{circleId:params.id,cycleNumber:circle.currentCycle}}});
 const contribution=await tx.contribution.findUnique({where:{id:contributionId}});
 if(!contribution||contribution.cycleId!==cycle.id||contribution.status!=='SUBMITTED')throw new ApiError(409,'Only a submitted contribution in the active cycle can be verified');
 const updated=await tx.contribution.update({where:{id:contributionId},data:{status:'VERIFIED',verifiedBy:user.id,verifiedAt:new Date()}});
 await audit(tx,user.id,params.id,'PAYMENT_VERIFIED',updated.id,{cycle:circle.currentCycle,memberId:contribution.userId});return {contribution:updated};
 });return success(result);
}catch(e){return failure(e)}}
