import { NextRequest, NextResponse } from 'next/server';
import { loanWiseStore } from '@/lib/store';

export async function GET() {
  const auditEvents = loanWiseStore.getAuditEvents();
  return NextResponse.json({ total: auditEvents.length, events: auditEvents });
}
