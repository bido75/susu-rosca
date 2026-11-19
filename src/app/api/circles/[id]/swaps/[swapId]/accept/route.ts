import { db } from '@/lib/db';import { requireUser,ApiError } from '@/lib/auth';import { failure,success } from '@/lib/http';import { audit,lockCircle } from '@/lib/circles';
export async function POST(_:Request,{params}:{params:{id:string,swapId:string}}){try{const user=await requireUser();const result=await db.$transaction(async tx=>{
 await lockCircle(tx,params.id);const swap=await tx.slotSwap.findUnique({where:{id:params.swapId}});
 if(!swap||swap.circleId!==params.id||swap.status!=='PENDING')throw new ApiError(404,'Pending swap not found');
 if(swap.targetId!==user.id)throw new ApiError(403,'Only the invited member can approve');
 const circle=await tx.circle.findUniqueOrThrow({where:{id:params.id},include:{members:true}});
 if(circle.status!=='ACTIVE')throw new ApiError(409,'Circle not active');
 const a=circle.members.find(x=>x.userId===swap.requesterId),b=circle.members.find(x=>x.userId===swap.targetId);
 if(!a?.slotNumber||!b?.slotNumber||a.slotNumber<=circle.currentCycle||b.slotNumber<=circle.currentCycle)throw new ApiError(409,'Swaps must be for future unpaid cycles');
 const sa=a.slotNumber,sb=b.slotNumber;
 await tx.circleMember.update({where:{id:a.id},data:{slotNumber:null}});
 await tx.circleMember.update({where:{id:b.id},data:{slotNumber:sa}});
 await tx.circleMember.update({where:{id:a.id},data:{slotNumber:sb}});
 await tx.cycle.update({where:{circleId_cycleNumber:{circleId:params.id,cycleNumber:sa}},data:{recipientUserId:b.userId}});
 await tx.cycle.update({where:{circleId_cycleNumber:{circleId:params.id,cycleNumber:sb}},data:{recipientUserId:a.userId}});
 await tx.slotSwap.update({where:{id:swap.id},data:{status:'ACCEPTED',resolvedAt:new Date()}});
 await audit(tx,user.id,params.id,'SLOT_SWAP_ACCEPTED',swap.id,{requesterId:a.userId,targetId:b.userId,previousSlots:[sa,sb]});return {accepted:true};
 });return success(result);
}catch(e){return failure(e)}}
