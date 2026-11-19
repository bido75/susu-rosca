import { cookies } from 'next/headers';
import { createHash, randomBytes } from 'node:crypto';
import { db } from './db';
export const hashToken = (token:string) => createHash('sha256').update(token).digest('hex');
export const newToken = () => randomBytes(32).toString('hex');
export async function currentUser() {
  const token = cookies().get('susuflow_session')?.value;
  if(!token) return null;
  const session = await db.session.findUnique({where:{tokenHash:hashToken(token)},include:{user:true}});
  return session && session.expiresAt > new Date() ? session.user : null;
}
export async function requireUser() {
  const user = await currentUser();
  if(!user) throw new ApiError(401,'Please sign in.');
  return user;
}
export class ApiError extends Error { constructor(public status:number,message:string){super(message);} }
export function cookieOptions(expires:Date) {return {httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax' as const,path:'/',expires};}
