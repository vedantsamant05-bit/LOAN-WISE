import { NextRequest, NextResponse } from 'next/server';
import { loanWiseStore } from '@/lib/store';
import { PolicyConfig } from '@/lib/types';

export async function GET() {
  const policy = loanWiseStore.getPolicy();
  return NextResponse.json(policy);
}

export async function POST(req: NextRequest) {
  try {
    const body: PolicyConfig = await req.json();
    if (!body.policyVersion || !body.rules) {
      return NextResponse.json({ error: 'Invalid policy payload' }, { status: 400 });
    }

    loanWiseStore.updatePolicy(body);
    return NextResponse.json({
      message: 'Policy configuration updated successfully',
      policy: loanWiseStore.getPolicy(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
