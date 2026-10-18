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

    // Dynamically compute current attempt number from audit history
    const pastRetries = loanWiseStore
      .getAuditEvents()
      .filter((e) => e.applicationId === id && e.eventType === 'DEPENDENCY_RETRY');
    const attemptNumber = pastRetries.length + 2; // attempt 1 = initial submission; 2+ = retries

    // Enforce max-retry ceiling; if exhausted, transition to REFER without re-running the engine
    if (attemptNumber > policy.dependencies.maxRetries + 1) {
      const exhaustedApp = loanWiseStore.updateApplication(id, { status: 'REFER' });
      loanWiseStore.addAuditEvent({
        id: `AUD-${Date.now()}`,
        applicationId: id,
        eventType: 'DEPENDENCY_RETRY',
        actor: 'System Auto-Retry Worker',
        policyVersion: policy.policyVersion,
        timestamp: new Date().toISOString(),
        details: `Retry exhausted (attempt ${attemptNumber - 1}/${policy.dependencies.maxRetries}). Application escalated to REFER for manual underwriting review.`,
      });
      return NextResponse.json(exhaustedApp, { status: 200 });
    }

    // Use live simulation settings so the retry genuinely reflects current dependency state
    const simSettings = loanWiseStore.getSimulationSettings();
    const newDecision = await orchestrateDecision(
      app.applicant,
      policy,
      simSettings,
      attemptNumber
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
      details: `Verification retry attempt ${attemptNumber - 1}/${policy.dependencies.maxRetries}. New outcome: ${newDecision.outcome}.`,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
