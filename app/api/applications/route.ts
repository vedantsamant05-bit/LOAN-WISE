import { NextRequest, NextResponse } from 'next/server';
import { loanWiseStore } from '@/lib/store';
import { orchestrateDecision } from '@/lib/engine/orchestrator';
import { ApplicantData, Application } from '@/lib/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const query = searchParams.get('q')?.toLowerCase();

  let applications = loanWiseStore.getApplications();

  if (status && status !== 'ALL') {
    applications = applications.filter((a) => a.status === status);
  }

  if (query) {
    applications = applications.filter(
      (a) =>
        a.id.toLowerCase().includes(query) ||
        a.applicant.name.toLowerCase().includes(query) ||
        a.applicant.city.toLowerCase().includes(query)
    );
  }

  return NextResponse.json({
    total: applications.length,
    applications,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Parse raw numeric inputs — preserve explicit zeros (don't swallow them with || fallbacks)
    const rawIncome = body.monthlyIncome !== undefined && body.monthlyIncome !== null
      ? Number(body.monthlyIncome)
      : NaN;
    const rawAmount = body.requestedAmount !== undefined && body.requestedAmount !== null
      ? Number(body.requestedAmount)
      : NaN;

    // Input Validation — reject if caller explicitly supplied 0 or negative values
    if (!isNaN(rawIncome) && rawIncome <= 0) {
      return NextResponse.json(
        { error: 'Monthly income and requested amount must be positive numbers.' },
        { status: 422 }
      );
    }
    if (!isNaN(rawAmount) && rawAmount <= 0) {
      return NextResponse.json(
        { error: 'Monthly income and requested amount must be positive numbers.' },
        { status: 422 }
      );
    }

    const monthlyIncome = isNaN(rawIncome) ? 50000 : rawIncome;
    const requestedAmount = isNaN(rawAmount) ? 500000 : rawAmount;

    const applicant: ApplicantData = {
      name: body.name || 'Anonymous Applicant',
      age: Number(body.age) || 30,
      city: body.city || 'Mumbai, MH',
      employmentType: body.employmentType || 'Salaried',
      monthlyIncome,
      declaredIncome: Number(body.declaredIncome) || monthlyIncome,
      requestedAmount,
      tenureMonths: Number(body.tenureMonths) || 36,
      existingMonthlyObligations: Number(body.existingMonthlyObligations) || 0,
      panNumber: body.panNumber || 'ABCDE1234F',
      avatarUrl: '',
    };

    const policy = loanWiseStore.getPolicy();
    const simSettings = loanWiseStore.getSimulationSettings();

    // Run decision orchestrator
    const decision = await orchestrateDecision(applicant, policy, simSettings);

    const newApp: Application = {
      id: decision.applicationId,
      applicant,
      requestedAmount: applicant.requestedAmount,
      tenureMonths: applicant.tenureMonths,
      status: decision.outcome,
      createdAt: decision.createdAt,
      updatedAt: decision.createdAt,
      decision,
    };

    loanWiseStore.addApplication(newApp);

    // Record audit event
    loanWiseStore.addAuditEvent({
      id: `AUD-${Date.now()}`,
      applicationId: newApp.id,
      eventType: 'APPLICATION_SUBMITTED',
      actor: `${applicant.name} (Direct Submission)`,
      policyVersion: policy.policyVersion,
      modelVersion: decision.modelVersion,
      timestamp: decision.createdAt,
      details: `Application submitted for ₹${applicant.requestedAmount.toLocaleString('en-IN')} over ${applicant.tenureMonths}m. Initial outcome: ${decision.outcome}.`,
    });

    return NextResponse.json(newApp, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
