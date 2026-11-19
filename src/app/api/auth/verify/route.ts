import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';import { hashToken,newToken,cookieOptions } from '@/lib/auth';
export async function GET(req:NextRequest){
 const url=new URL('/circles',req.url);const token=req.nextUrl.searchParams.get('token');if(!token)return NextResponse.redirect(new URL('/login?error=invalid',req.url));
 try{
  const raw=newToken(),expiry=new Date(Date.now()+7*86400000);
  const accepted=await db.$transaction(async tx=>{
   const changed=await tx.magicLink.updateMany({where:{tokenHash:hashToken(token),usedAt:null,expiresAt:{gt:new Date()}},data:{usedAt:new Date()}});
   if(changed.count!==1)return false;
   const link=await tx.magicLink.findUniqueOrThrow({where:{tokenHash:hashToken(token)}});
   await tx.session.create({data:{userId:link.userId,tokenHash:hashToken(raw),expiresAt:expiry}});return true;
  });
  if(!accepted)return NextResponse.redirect(new URL('/login?error=expired',req.url));
  const res=NextResponse.redirect(url);res.cookies.set('susuflow_session',raw,cookieOptions(expiry));return res;
 }catch{return NextResponse.redirect(new URL('/login?error=invalid',req.url));}
}
