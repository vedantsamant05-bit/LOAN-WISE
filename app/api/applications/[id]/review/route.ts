import { NextRequest, NextResponse } from 'next/server';
import { loanWiseStore } from '@/lib/store';

// ---------------------------------------------------------------------------
// Authorization helper
// ---------------------------------------------------------------------------
// The review endpoint requires a valid Authorization header:
//   Authorization: Bearer <REVIEW_API_KEY>
// The key is read from the REVIEW_API_KEY environment variable (set in .env.local).
// Requests without a valid key are rejected with HTTP 401.
// ---------------------------------------------------------------------------
const REVIEW_API_KEY = process.env.REVIEW_API_KEY;

function isAuthorized(req: NextRequest): boolean {
  if (!REVIEW_API_KEY) {
    // If the env var is not configured, lock the endpoint entirely.
    return false;
  }
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  return token === REVIEW_API_KEY;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // --- Auth gate ---
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { error: 'Unauthorized: valid Bearer token required for manual review override.' },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { action, notes, actor = 'Pooja Deshmukh (Risk Underwriting)' } = body;

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
