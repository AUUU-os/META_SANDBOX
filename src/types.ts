export type MemoryType = 'episodic' | 'semantic' | 'meta';

export interface Memory {
  id: string;
  type: MemoryType;
  content: string;
  timestamp: string;
  sourceTaskId?: string;
  tags?: string[];
}

export interface CognitiveDomain {
  id: 'researcher' | 'coder' | 'planner' | 'scientist' | 'gamer';
  name: string;
  description: string;
  objectives: string[];
  metrics: { name: string; description: string }[];
  commonFailures: string[];
}

export interface AuditReport {
  score: number; // 0 to 10
  findings: string[];
  recommendation: string;
}

export interface CriticEngineOutput {
  logical: AuditReport;
  factual: AuditReport;
  procedural: AuditReport;
  overallCritique: string;
}

export interface ConfidenceAssessment {
  score: number; // 0 to 100
  selfRating: number;
  verifierEstimate: number;
  ensembleDisagreement: number; // Simulated variance
  justification: string;
}

export type StrategyDecision = 'accept' | 'retry' | 'decompose' | 'abstain';

export interface StrategyControllerOutput {
  decision: StrategyDecision;
  explanation: string;
  subTasks?: string[];
  adjustedConfidenceThreshold?: number;
}

export interface TrustFactor {
  logic: number; // 0 to 100
  memory: number; // 0 to 100
  factualRecall: number; // 0 to 100
}

export interface SelfModel {
  strengths: string[];
  weaknesses: string[];
  failurePatterns: string[];
  trustProfile: TrustFactor;
}

export interface IntrospectionOutput {
  whySelected: string;
  howToImprove: string;
  patternDetected: boolean;
  patternExplanation?: string;
  selfModelAdjustments: {
    strengthAdded?: string;
    weaknessAdded?: string;
    trustAdjustments?: Partial<TrustFactor>;
  };
}

export interface PhaseStep {
  phaseIndex: number;
  phaseId: string;
  title: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  timestamp: string;
  data: any;
}

export interface MetacognitiveRun {
  id: string;
  task: string;
  domainId: string;
  steps: PhaseStep[];
  finalResponse?: string;
  createdAt: string;
}
