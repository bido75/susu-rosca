import { NextResponse } from 'next/server';
import { ApiError } from './auth';
import { ZodError } from 'zod';
export function failure(err: unknown) {
  if(err instanceof ApiError) return NextResponse.json({error:err.message},{status:err.status});
  if(err instanceof ZodError) return NextResponse.json({error:err.issues.map(x=>x.message).join('; ')},{status:400});
  console.error(err);
  return NextResponse.json({error:'Unexpected server error'},{status:500});
}
export function success(data:unknown,status=200) {return NextResponse.json(data,{status});}
