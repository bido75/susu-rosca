import { requireUser } from '@/lib/auth';import { failure,success } from '@/lib/http';import { memberAccess } from '@/lib/circles';
export async function GET(_:Request,{params}:{params:{id:string}}){try{const user=await requireUser();return success({circle:await memberAccess(params.id,user.id),viewerId:user.id});}catch(e){return failure(e)}}
