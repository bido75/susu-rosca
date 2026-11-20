import { notifyCircle } from '@/lib/realtime';
import { db } from '@/lib/db';import { requireUser,ApiError } from '@/lib/auth';import { failure,success } from '@/lib/http';import { audit,lockCircle } from '@/lib/circles';
export async function POST(req:Request,ctx:{params:Promise<{id:string}>}){try{const params=await ctx.params;const user=await requireUser();const {code}=await req.json();const result=await db.$transaction(async tx=>{
 await lockCircle(tx,params.id);const circle=await tx.circle.findUnique({where:{id:params.id},include:{_count:{select:{members:true}}}});
 if(!circle||circle.inviteCode!==code)throw new ApiError(404,'Invalid invitation.');
 if(circle.status!=='FORMING')throw new ApiError(409,'Circle is closed for new members.');
 const already=await tx.circleMember.findUnique({where:{circleId_userId:{circleId:params.id,userId:user.id}}});
 if(already)return {joined:true};
 if(circle._count.members>=circle.totalCycles)throw new ApiError(409,'Circle is full.');
 await tx.circleMember.create({data:{circleId:params.id,userId:user.id}});await audit(tx,user.id,params.id,'MEMBER_JOINED',params.id,{userId:user.id});return {joined:true};
 });  void notifyCircle(params.id);
  return success(result);
}catch(e){return failure(e)}}
