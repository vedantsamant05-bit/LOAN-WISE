import { NextRequest, NextResponse } from 'next/server';
import { loanWiseStore } from '@/lib/store';
import { orchestrateDecision } from '@/lib/engine/orchestrator';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const app = loanWiseStore.getApplicationById(id);
    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const policy = loanWiseStore.getPolicy();
    // For retry, we temporarily force successful dependency status if previous was failure/timeout
    const newDecision = await orchestrateDecision(
      app.applicant,
      policy,
      { bureauStatus: 'SUCCESS', kycStatus: 'SUCCESS', incomeStatus: 'SUCCESS' },
      2
    );

    const updated = loanWiseStore.updateApplication(id, {
      status: newDecision.outcome,
      decision: newDecision,
    });

    loanWiseStore.addAuditEvent({
      id: `AUD-${Date.now()}`,
      applicationId: app.id,
      eventType: 'DEPENDENCY_RETRY',
      actor: 'System Auto-Retry Worker',
      policyVersion: policy.policyVersion,
      timestamp: new Date().toISOString(),
      details: `Verification retry successful. New outcome: ${newDecision.outcome}.`,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
