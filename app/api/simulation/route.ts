import { NextRequest, NextResponse } from 'next/server';
import { loanWiseStore } from '@/lib/store';

export async function GET() {
  return NextResponse.json(loanWiseStore.getSimulationSettings());
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    loanWiseStore.setSimulationSettings(body);
    return NextResponse.json({
      message: 'Simulation parameters updated',
      settings: loanWiseStore.getSimulationSettings(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
