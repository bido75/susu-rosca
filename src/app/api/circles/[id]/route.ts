import { requireUser } from '@/lib/auth';import { failure,success } from '@/lib/http';import { memberAccess } from '@/lib/circles';
export async function GET(_:Request,ctx:{params:Promise<{id:string}>}){try{const params=await ctx.params;const user=await requireUser();return success({circle:await memberAccess(params.id,user.id),viewerId:user.id});}catch(e){return failure(e)}}
