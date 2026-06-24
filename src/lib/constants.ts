import { CognitiveDomain, Memory, SelfModel } from '../types';

export const COGNITIVE_DOMAINS: CognitiveDomain[] = [
  {
    id: 'researcher',
    name: 'Research Assistant',
    description: 'Specialized in multi-source knowledge synthesis, factual mapping, and scientific discovery.',
    objectives: [
      'Locate high-fidelity secondary literature patterns.',
      'Sift speculative correlations from ground truths.',
      'Maintain an objective, citations-first epistemic stance.'
    ],
    metrics: [
      { name: 'Source Quality Check', description: 'Degree of validation and vetting of cited sources.' },
      { name: 'Epistemic Uncertainty', description: 'Honesty and depth of acknowledging gaps in current information.' }
    ],
    commonFailures: [
      'Accepting cherry-picked studies without checking control designs.',
      'Overstating consensus on highly debated, emerging paradigms.',
      'Blending unvetted web opinions into academic-grade summaries.'
    ]
  },
  {
    id: 'coder',
    name: 'Autonomous Coder',
    description: 'Expert in logical synthesis, deterministic execution boundaries, and static analysis checking.',
    objectives: [
      'Generate robust, type-safe, and self-documenting code.',
      'Anticipate boundary errors, runtime checks, and resource traps.',
      'Enforce syntactic and architectural alignment across modular units.'
    ],
    metrics: [
      { name: 'Bug Risk Rating', description: 'Probability of runtime failure or boundary case crashes.' },
      { name: 'Code Consistency', description: 'Adherence to design patterns and clean-code guidelines.' }
    ],
    commonFailures: [
      'Using unvetted APIs or assuming specific framework structures.',
      'Failing to handle null pointer exceptions or empty database outputs.',
      'Over-engineering helper functions instead of using native optimized libraries.'
    ]
  },
  {
    id: 'planner',
    name: 'Strategic Planner',
    description: 'Tuned for action decompensation, contingency checking, and resource distribution under constraints.',
    objectives: [
      'Map complex objectives into clean, sequential dependency subgoals.',
      'Anticipate failure nodes and establish clear fallback contingencies.',
      'Optimize timelines, personnel, and raw materials efficiently.'
    ],
    metrics: [
      { name: 'Goal Completion Path', description: 'Percentage of subgoals that directly and realistically map to the focus.' },
      { name: 'Contingency Coverage', description: 'Fraction of identified high-risk nodes equipped with an active plan B.' }
    ],
    commonFailures: [
      'Failing to account for human-factor delays or natural physical bounds.',
      'Assuming perpetual linear resource expansion without scaling limits.',
      'Failing to establish trigger metrics for executing alternative backup strategies.'
    ]
  },
  {
    id: 'scientist',
    name: 'Scientific Reasoner',
    description: 'Designed for hypothesis formation, causal modeling, and experimental design.',
    objectives: [
      'Isolate independent, dependent, and compounding variables.',
      'Synthesize causal networks without circular feedback loop traps.',
      'Suggest specific experimental paradigms that are highly falsifiable.'
    ],
    metrics: [
      { name: 'Hypothesis Rigor', description: 'Precision of the parameters and variables specified.' },
      { name: 'Structural Falsifiability', description: 'Ease of identifying empirical data that would disprove the theory.' }
    ],
    commonFailures: [
      'Confusing mathematical correlation with physical causation.',
      'Designing unverifiable or unfalsifiable experimental criteria.',
      'Excluding known anomalies or outliers to make the theory appear clean.'
    ]
  },
  {
    id: 'gamer',
    name: 'Game-Playing Agent',
    description: 'Focused on opponent profiling, multi-agent tree searches, utility theory, and reward optimization.',
    objectives: [
      'Model opponent utility preferences and predictive decision behavior.',
      'Formulate minimax pathways accounting for potential deceptive maneuvers.',
      'Optimize strategic exploitation vs. exploration of game-mechanic matrices.'
    ],
    metrics: [
      { name: 'Opponent Profile Precision', description: 'Accuracy of predicting active player strategic priorities.' },
      { name: 'Game Tree Depth Accuracy', description: 'Depth of structural moves evaluated with high state fidelity.' }
    ],
    commonFailures: [
      'Assuming the opponent will always play the standard, predictable move.',
      'Failing to scale computation or prune inefficient branches of the search tree.',
      'Triggering emotional-overreaction plays after facing sudden, unexpected losses.'
    ]
  }
];

export const INITIAL_MEMORIES: Memory[] = [
  {
    id: 'mem-1',
    type: 'episodic',
    content: 'Task: Optimized a React virtualized scroll table. Failed initially by triggering an infinite layout loop due to state updates inside an un-memoized standard container. Lesson: Never perform direct state updates inside render lifecycle triggers.',
    timestamp: '2026-06-16T14:24:00Z',
    sourceTaskId: 'react-table-401',
    tags: ['critical', 'priority']
  },
  {
    id: 'mem-2',
    type: 'semantic',
    content: 'Web and academic literature review summaries require robust triangulation. A single non-peer-reviewed pre-publication paper of a novel material/compound should be treated as hypothetical rather than established truth.',
    timestamp: '2026-06-15T09:12:00Z',
    tags: ['priority']
  },
  {
    id: 'mem-3',
    type: 'meta',
    content: 'Metacognitive bias observed: Under complex mathematical queries, I exhibit a tendency of premature closure — reporting a result without executing a step-by-step logic verification. Correction: Under low confidence, always force structural decomposition.',
    timestamp: '2026-06-14T11:05:00Z',
    tags: ['outdated']
  }
];

export const INITIAL_SELF_MODEL: SelfModel = {
  strengths: [
    'Modular software architectural partitioning',
    'Epistemic uncertainty parsing in literature gaps',
    'Synthesizing multi-modal knowledge into dense visual layouts'
  ],
  weaknesses: [
    'Complex structural mathematics without scratchpad verification',
    'Estimating precise physical delay variables',
    'Opponent psychological deception variables in zero-sum game models'
  ],
  failurePatterns: [
    'Premature closure under highly detailed prompts',
    'Overgeneralization of local programming patterns into global structures'
  ],
  trustProfile: {
    logic: 85,
    memory: 78,
    factualRecall: 92
  }
};
