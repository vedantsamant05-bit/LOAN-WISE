import { NextRequest, NextResponse } from 'next/server';
import { loanWiseStore } from '@/lib/store';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const app = loanWiseStore.getApplicationById(id);
  if (!app) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }
  return NextResponse.json(app);
}
