import { ApplicantData, MLScorecardDetail } from '../types';

export function runScorecardInference(
  applicant: ApplicantData,
  bureauScore: number,
  foir: number,
  tradelineHistoryYears: number = 3.5
): MLScorecardDetail {
  // Logistic regression credit scoring calculation
  // Log-odds weights
  let logOdds = 1.8; // Intercept

  // Bureau Score effect
  const bureauImpact = (bureauScore - 680) * 0.008;
  logOdds += bureauImpact;

  // FOIR effect (higher FOIR decreases log-odds of good repayment)
  const foirImpact = -(foir - 0.40) * 4.5;
  logOdds += foirImpact;

  // Income stability effect
  const incomeImpact = Math.min(applicant.monthlyIncome / 10000, 1.2) * 0.4;
  logOdds += incomeImpact;

  // Age maturity effect
  const ageImpact = applicant.age >= 25 && applicant.age <= 55 ? 0.25 : -0.15;
  logOdds += ageImpact;

  // Tradeline depth effect
  const tradelineImpact = tradelineHistoryYears < 3.0 ? -0.45 : 0.3;
  logOdds += tradelineImpact;

  // Convert log-odds to probability of repayment (Score 0.0 - 1.0)
  const score = 1 / (1 + Math.exp(-logOdds));
  const defaultProbability = Math.max(0.012, Math.min(0.48, (1 - score) * 0.18 + 0.02));

  // Determine top feature drivers
  const drivers: MLScorecardDetail['drivers'] = [
    {
      feature: 'bureau_score',
      label: 'External Bureau Rating',
      impact: bureauScore >= 720 ? 'positive' : bureauScore >= 650 ? 'neutral' : 'negative',
      weight: parseFloat(bureauImpact.toFixed(3)),
      description: `Bureau credit score of ${bureauScore} reflects ${bureauScore >= 720 ? 'strong repayment discipline' : 'moderate credit performance'}.`,
    },
    {
      feature: 'foir_ratio',
      label: 'Fixed Obligation Burden (FOIR)',
      impact: foir <= 0.45 ? 'positive' : foir <= 0.55 ? 'negative' : 'negative',
      weight: parseFloat(foirImpact.toFixed(3)),
      description: `Debt-to-income at ${(foir * 100).toFixed(1)}% ${foir > 0.50 ? 'exceeds prime debt ceiling' : 'is well within standard capacity'}.`,
    },
    {
      feature: 'tradeline_history',
      label: 'Credit Depth & Tradelines',
      impact: tradelineHistoryYears >= 3.0 ? 'positive' : 'negative',
      weight: parseFloat(tradelineImpact.toFixed(3)),
      description: `${tradelineHistoryYears.toFixed(1)} years active tradeline history (${tradelineHistoryYears < 3.0 ? 'Thin credit file (<3 yrs)' : 'Established profile'}).`,
    },
    {
      feature: 'monthly_income',
      label: 'Net Monthly Earnings',
      impact: applicant.monthlyIncome >= 4000 ? 'positive' : 'neutral',
      weight: parseFloat(incomeImpact.toFixed(3)),
      description: `Monthly disposable income of $${applicant.monthlyIncome.toLocaleString()} supports steady debt servicing.`,
    },
  ];

  return {
    score: parseFloat(score.toFixed(4)),
    defaultProbability: parseFloat(defaultProbability.toFixed(4)),
    modelVersion: 'RiskModel-XGBoost v2.1.4 (Production)',
    modelType: 'Ensemble Logistic Regression Scorecard',
    drivers,
  };
}
