import { NextRequest, NextResponse } from 'next/server';
import { loanWiseStore } from '@/lib/store';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action, notes, actor = 'Elena Vance (Risk Underwriting)' } = body;

    if (!['APPROVE_OVERRIDE', 'REJECT_OVERRIDE'].includes(action)) {
      return NextResponse.json({ error: 'Invalid review action' }, { status: 400 });
    }

    const app = loanWiseStore.getApplicationById(id);
    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const newStatus = action === 'APPROVE_OVERRIDE' ? 'APPROVE' : 'REJECT';

    const updatedApp = loanWiseStore.updateApplication(id, {
      status: newStatus,
      manualReview: {
        resolvedAt: new Date().toISOString(),
        resolvedBy: actor,
        resolution: action,
        notes: notes || 'Reviewed and confirmed by credit underwriter.',
      },
    });

    // Record audit event
    loanWiseStore.addAuditEvent({
      id: `AUD-${Date.now()}`,
      applicationId: app.id,
      eventType: 'MANUAL_REVIEW_RESOLVED',
      actor,
      policyVersion: app.decision?.policyVersion || 'v4.2-active',
      timestamp: new Date().toISOString(),
      details: `Manual review override applied: ${action}. Notes: ${notes || 'N/A'}.`,
    });

    return NextResponse.json(updatedApp);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
