import { NextRequest,NextResponse } from 'next/server';
export function middleware(req:NextRequest){
 if(['POST','PUT','PATCH','DELETE'].includes(req.method)){
  const origin=req.headers.get('origin');
  const expected=process.env.APP_URL ? new URL(process.env.APP_URL).origin : req.nextUrl.origin;
  if(!origin||origin!==expected)return NextResponse.json({error:'Invalid request origin'},{status:403});
 }
 return NextResponse.next();
}
export const config={matcher:['/api/:path*']};
