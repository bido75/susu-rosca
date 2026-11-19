import { randomBytes } from 'node:crypto';import { db } from '@/lib/db';import { requireUser,ApiError } from '@/lib/auth';import { failure,success } from '@/lib/http';import { lockCircle,audit } from '@/lib/circles';
// Simulation only: no real ACH debit, bank access or money movement.
export async function POST(_:Request,{params}:{params:{id:string}}){try{const user=await requireUser();const result=await db.$transaction(async tx=>{
 await lockCircle(tx,params.id);const circle=await tx.circle.findUnique({where:{id:params.id}});
 if(!circle||circle.status!=='ACTIVE'||circle.mode!=='AUTOMATED_SIMULATED')throw new ApiError(409,'Simulation unavailable');
 const member=await tx.circleMember.findUnique({where:{circleId_userId:{circleId:params.id,userId:user.id}}});if(!member)throw new ApiError(403,'Not a member');
 const cycle=await tx.cycle.findUniqueOrThrow({where:{circleId_cycleNumber:{circleId:params.id,cycleNumber:circle.currentCycle}}});
 const contribution=await tx.contribution.findUnique({where:{cycleId_userId:{cycleId:cycle.id,userId:user.id}}});
 if(!contribution||contribution.status!=='PENDING')throw new ApiError(409,'Contribution not pending');
 const ref='SIM-ACH-'+randomBytes(8).toString('hex');const updated=await tx.contribution.update({where:{id:contribution.id},data:{status:'SUBMITTED',paymentMethod:'ACH',externalTxRef:ref}});
 await audit(tx,user.id,params.id,'ACH_SIMULATED',updated.id,{ref,simulation:true});return {contribution:updated};
 });return success(result);
}catch(e){return failure(e)}}
