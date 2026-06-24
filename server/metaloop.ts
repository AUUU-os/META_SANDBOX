import { getGeminiClient } from './gemini';
import { Type } from '@google/genai';
import { 
  Memory, 
  CognitiveDomain, 
  SelfModel, 
  CriticEngineOutput, 
  ConfidenceAssessment, 
  StrategyControllerOutput, 
  IntrospectionOutput, 
  PhaseStep 
} from '../src/types';

// Fallback high-fidelity simulation helper in case GEMINI_API_KEY is not defined.
function getSimulatedTrace(task: string, domain: CognitiveDomain, selfModel: SelfModel): PhaseStep[] {
  const timestamp = new Date().toISOString();
  
  // Phase 1 (Core Cognition)
  const p1Data = {
    plan: [
      `Deconstruct user task: "${task}" into atomic sub-questions.`,
      `Locate domain-specific markers for ${domain.name} monitoring.`,
      `Evaluate boundary variables and formulate primary hypotheses.`
    ],
    reasoning: [
      `Analyzing input constraints for "${task}" within domain ${domain.name}.`,
      `Synthesizing historical patterns against active self-properties.`,
      `Determining key output architecture.`
    ],
    draftAnswer: `[Core ${domain.name} Response Draft]\n\nBased on your request regarding "${task}", I analyzed the core attributes using the objective parameters of ${domain.name}. Here is the structured summary:\n\n1. Analysis: The core complexity is addressed through careful modular partitioning.\n2. Strategy: Integrated best-practice constraints and double-checked edge contingencies.\n3. Recommendation: Implement a layered defense-in-depth layout to limit failure propagation risks.`
  };

  // Phase 2 (Memory Retrieval)
  const retrievedMemories = [
    {
      id: "sim-mem-1",
      type: "semantic",
      content: `In ${domain.name} tasks, always check for the primary cognitive failure: "${domain.commonFailures[0]}" and mitigate prematurely.`,
      timestamp: new Date(Date.now() - 3600000).toISOString()
    }
  ];

  // Phase 3 (Critic Audit)
  const p3Data: CriticEngineOutput = {
    logical: {
      score: 8,
      findings: ["Inside-out logic is consistent", "Variables are correctly initialized", "No internal contradictions found"],
      recommendation: "Maintain the clear separation of concerns in subsequent refinements."
    },
    factual: {
      score: 7,
      findings: ["Citations and empirical backing are standard but could be more granular", "Hypothesis matches known database references"],
      recommendation: "Augment with exact quantitative control parameters if executing."
    },
    procedural: {
      score: 9,
      findings: ["Direct goal mapping covers 95% of user directives", "No unnecessary steps or bloated workflows introduced"],
      recommendation: "Ensure safety triggers are monitored in real-time execution."
    },
    overallCritique: "The draft is highly coherent but has standard minor factual generalization areas, easily fixed during reflective adjustment phases."
  };

  // Phase 4 (Confidence Engine)
  const p4Data: ConfidenceAssessment = {
    score: 82,
    selfRating: 85,
    verifierEstimate: 80,
    ensembleDisagreement: 5,
    justification: "Logical coherence is exceptional. The factual depth is solid but could benefit from targeted verification of specific parameters. The overall risk profile remains within acceptable levels of performance."
  };

  // Phase 5 (Strategy Controller)
  const p5Data: StrategyControllerOutput = {
    decision: 'accept',
    explanation: "Confidence score (82) meets the 75-point acceptance threshold. No major procedural or logical regressions were detected by the critic engine.",
    adjustedConfidenceThreshold: 75
  };

  // Phase 6 (Self-Model Adaptation)
  const updatedSelfModel: SelfModel = {
    strengths: [...selfModel.strengths],
    weaknesses: [...selfModel.weaknesses],
    failurePatterns: [...selfModel.failurePatterns],
    trustProfile: {
      logic: Math.min(100, selfModel.trustProfile.logic + 1),
      memory: selfModel.trustProfile.memory,
      factualRecall: Math.max(0, selfModel.trustProfile.factualRecall - 1)
    }
  };

  // Phase 7 (Recursive Introspection)
  const p7Data: IntrospectionOutput = {
    whySelected: `I chose direct synthesis supported by dynamic semantic constraints in ${domain.name}, which minimized search depth and kept logical coherence high.`,
    howToImprove: "For subsequent runs, I should incorporate a secondary verifier validation step to increase factual depth to match structural requirements.",
    patternDetected: false,
    selfModelAdjustments: {
      strengthAdded: `Real-time synthesis in domain ${domain.name}`,
      trustAdjustments: { logic: 1, factualRecall: -1 }
    }
  };

  return [
    { phaseIndex: 0, phaseId: 'domain', title: 'Cognitive Domain Mapping', status: 'completed', timestamp, data: domain },
    { phaseIndex: 1, phaseId: 'cognition', title: 'Core Cognition Engine', status: 'completed', timestamp, data: p1Data },
    { phaseIndex: 2, phaseId: 'memory', title: 'Episodic Memory Search', status: 'completed', timestamp, data: retrievedMemories },
    { phaseIndex: 3, phaseId: 'critic', title: 'Critic Audit Engine', status: 'completed', timestamp, data: p3Data },
    { phaseIndex: 4, phaseId: 'confidence', title: 'Confidence Assessment', status: 'completed', timestamp, data: p4Data },
    { phaseIndex: 5, phaseId: 'strategy', title: 'Strategy Controller Router', status: 'completed', timestamp, data: p5Data },
    { phaseIndex: 6, phaseId: 'selfmodel', title: 'Self-Model Adaptation', status: 'completed', timestamp, data: updatedSelfModel },
    { phaseIndex: 7, phaseId: 'introspection', title: 'Recursive Introspection Loop', status: 'completed', timestamp, data: p7Data }
  ];
}

// Helper to retry Gemini calls in case of temporary 503 / unavailability
async function callWithRetry<T>(fn: () => Promise<T>, retries = 2, delayMs = 1500): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const is503 = error?.status === 503 || 
                  error?.status === 'UNAVAILABLE' ||
                  String(error?.message || '').includes('503') ||
                  String(error?.message || '').includes('UNAVAILABLE') ||
                  String(error?.message || '').includes('high demand') ||
                  String(error?.message || '').includes('temporary');
    
    if (is503 && retries > 0) {
      console.warn(`[Metaloop] Gemini API busy (503 / high demand). Retrying in ${delayMs}ms... (${retries} Q left)`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return callWithRetry(fn, retries - 1, delayMs * 1.5);
    }
    throw error;
  }
}

// Actual Gemini metacycle runner
export async function runMetacognitiveLoop(
  task: string,
  domain: CognitiveDomain,
  memories: Memory[],
  selfModel: SelfModel,
  confidenceThreshold: number = 75
): Promise<PhaseStep[]> {
  const ai = getGeminiClient();
  
  if (!ai) {
    console.log("No live Gemini client. Returning simulated Trace.");
    return getSimulatedTrace(task, domain, selfModel);
  }

  const timestamp = new Date().toISOString();
  const steps: PhaseStep[] = [];

  try {
    // ----------------------------------------------------
    // Phase 0: Cognitive Domain Mapping
    // ----------------------------------------------------
    steps.push({
      phaseIndex: 0,
      phaseId: 'domain',
      title: 'Cognitive Domain Mapping',
      status: 'completed',
      timestamp: new Date().toISOString(),
      data: domain
    });

    // ----------------------------------------------------
    // Phase 2: Memory Retrieval (Done beforehand so it can seed Phase 1)
    // ----------------------------------------------------
    const memoryString = memories.map(m => `[Type: ${m.type}] ${m.content}`).join('\n');
    let memoryPrompt = `Analyze the target task: "${task}".
Review the following memories from the agent's memory bank:
${memoryString}

Select the memories that are relevant to this task (if any) and explain why in a short report. Also state if there are any meta-memory lessons about biases (e.g. premature closure) to flag.`;

    const memoryResponse = await callWithRetry(() => ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: memoryPrompt,
      config: {
        systemInstruction: "You are the Memory Retrieval System of a Metacognitive Agent. Return the selected/relevant memories.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              type: { type: Type.STRING },
              content: { type: Type.STRING },
              relevanceExplanation: { type: Type.STRING }
            },
            required: ['type', 'content', 'relevanceExplanation']
          }
        }
      }
    }));

    const relevantMemories = JSON.parse(memoryResponse.text || "[]");
    steps.push({
      phaseIndex: 2,
      phaseId: 'memory',
      title: 'Episodic Memory Search',
      status: 'completed',
      timestamp: new Date().toISOString(),
      data: relevantMemories
    });

    // ----------------------------------------------------
    // Phase 1: Core Cognition Engine
    // ----------------------------------------------------
    const retrievedContext = relevantMemories.map((m: any) => `* Recall: ${m.content}`).join('\n');
    let cognitionPrompt = `You are a high-level Core Cognition Engine of a Metacognitive Agent.
Your current Cognitive Domain is: "${domain.name}" (${domain.description}).
Domain objectives to strive for:
${domain.objectives.map(o => `- ${o}`).join('\n')}

Active Self-Model Strengths:
${selfModel.strengths.map(s => `- ${s}`).join('\n')}
Active Self-Model Weaknesses and failure patterns to watch out:
${selfModel.failurePatterns.map(f => `- ${f}`).join('\n')}

Additional Retrieved Memory Context:
${retrievedContext}

Target User Task: "${task}"

Your objective:
1. Lay out a sequential step-by-step logic 'plan' to solve this task safely.
2. Outline your critical 'reasoning' analysis, detailing how you handle constraints and mitigate potential failures (like ${domain.commonFailures[0]}).
3. Produce a high quality, comprehensive 'draftAnswer' designed to solve the user's task.`;

    const configSchema = {
      type: Type.OBJECT,
      properties: {
        plan: { type: Type.ARRAY, items: { type: Type.STRING } },
        reasoning: { type: Type.ARRAY, items: { type: Type.STRING } },
        draftAnswer: { type: Type.STRING }
      },
      required: ['plan', 'reasoning', 'draftAnswer']
    };

    const cognitionResponse = await callWithRetry(() => ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: cognitionPrompt,
      config: {
        systemInstruction: `You are the Core Cognition Engine. Execute the core solutions within the ${domain.name} domain rules.`,
        responseMimeType: "application/json",
        responseSchema: configSchema
      }
    }));

    const p1Data = JSON.parse(cognitionResponse.text || "{}");
    steps.push({
      phaseIndex: 1,
      phaseId: 'cognition',
      title: 'Core Cognition Engine',
      status: 'completed',
      timestamp: new Date().toISOString(),
      data: p1Data
    });

    // ----------------------------------------------------
    // Phase 3: Critic Engine
    // ----------------------------------------------------
    const criticPrompt = `You are the Critic Engine in a Metacognitive Agent.
You must conduct a strict 3-layered audit of the solution generated by the Core Cognition Engine.

User Task: "${task}"
Draft Solution:
"${p1Data.draftAnswer}"

Core Reasoning Plan:
"${p1Data.plan?.join('\n')}"

Audit categories:
1. Logical Audit: Check if the internal logic is consistent, contradiction-free, and sound. Give a score 0-10, list findings, and a recommendation.
2. Factual Audit: Verify the factual claims or code syntax correctness against high standards. Score 0-10, list findings, and a recommendation.
3. Procedural Audit: Assess if the strategy and steps chose were optimal, or if a better strategy could have bypassed failures (i.e. avoided ${domain.commonFailures[0]}). Score 0-10, list findings, and a recommendation.

Also write an overallCritique summary.`;

    const criticSchema = {
      type: Type.OBJECT,
      properties: {
        logical: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            findings: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendation: { type: Type.STRING }
          },
          required: ['score', 'findings', 'recommendation']
        },
        factual: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            findings: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendation: { type: Type.STRING }
          },
          required: ['score', 'findings', 'recommendation']
        },
        procedural: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            findings: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendation: { type: Type.STRING }
          },
          required: ['score', 'findings', 'recommendation']
        },
        overallCritique: { type: Type.STRING }
      },
      required: ['logical', 'factual', 'procedural', 'overallCritique']
    };

    const criticResponse = await callWithRetry(() => ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: criticPrompt,
      config: {
        systemInstruction: "You are the autonomous Critic Audit Engine. Be extremely objective and critical. High standards.",
        responseMimeType: "application/json",
        responseSchema: criticSchema
      }
    }));

    const p3Data = JSON.parse(criticResponse.text || "{}");
    steps.push({
      phaseIndex: 3,
      phaseId: 'critic',
      title: 'Critic Audit Engine',
      status: 'completed',
      timestamp: new Date().toISOString(),
      data: p3Data
    });

    // ----------------------------------------------------
    // Phase 4: Confidence Engine
    // ----------------------------------------------------
    const p4Prompt = `You are the Confidence Engine.
Evaluate the User Task, Core Cognition's outputs, and the Critic Audits to determine a compound confidence rating (0 to 100).

Audits found:
- Logical Score: ${p3Data.logical?.score}/10
- Factual Score: ${p3Data.factual?.score}/10
- Procedural Score: ${p3Data.procedural?.score}/10
Critic Comments: "${p3Data.overallCritique}"

Active Trust Profile settings:
- Logic trust: ${selfModel.trustProfile.logic}/100
- Memory trust: ${selfModel.trustProfile.memory}/100
- Factual trust: ${selfModel.trustProfile.factualRecall}/100

Calculate a compound confidence (as a weighted average of how correct this is, coupled with self-risk metrics). Provide:
1. compound score (0-100)
2. selfRating (0-100)
3. verifierEstimate (0-100)
4. ensembleDisagreement (0-50, represents simulated variance in ensemble opinions)
5. justification explaining exactly why the confidence is rated this way.`;

    const confidenceSchema = {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER },
        selfRating: { type: Type.INTEGER },
        verifierEstimate: { type: Type.INTEGER },
        ensembleDisagreement: { type: Type.INTEGER },
        justification: { type: Type.STRING }
      },
      required: ['score', 'selfRating', 'verifierEstimate', 'ensembleDisagreement', 'justification']
    };

    const confidenceResponse = await callWithRetry(() => ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: p4Prompt,
      config: {
        systemInstruction: "You are the Confidence Engine. Map internal ratings and verifications into a compound mierzalny confidence metrics report.",
        responseMimeType: "application/json",
        responseSchema: confidenceSchema
      }
    }));

    const p4Data = JSON.parse(confidenceResponse.text || "{}");
    steps.push({
      phaseIndex: 4,
      phaseId: 'confidence',
      title: 'Confidence Assessment',
      status: 'completed',
      timestamp: new Date().toISOString(),
      data: p4Data
    });

    // ----------------------------------------------------
    // Phase 5: Strategy Controller
    // ----------------------------------------------------
    const score = p4Data.score || 50;
    let decision: string = 'accept';
    let strategyExplanation = "";
    let subtasks: string[] = [];

    if (score < confidenceThreshold) {
      if (score < 40) {
        decision = 'abstain';
        strategyExplanation = `Confidence score ${score} is extremely low (below 40%). We lack critical reference guidelines or suffer from severe epistemic failure. Refusing to guess to maintain alignment.`;
      } else {
        decision = 'retry';
        strategyExplanation = `Confidence score ${score} is below the threshold of ${confidenceThreshold}%. Initiating strategic retry with critical feedback backpressure alignment.`;
      }
    } else {
      decision = 'accept';
      strategyExplanation = `Confidence score ${score} matches or exceeds the threshold of ${confidenceThreshold}%. No structural blocking findings were logged. Proceeding with accept.`;
    }

    // Let's also verify if task is highly complex, in which case we simulated partial decomposition!
    if (task.length > 250 && decision === 'retry') {
      decision = 'decompose';
      strategyExplanation = `Confidence is medium-low (${score}%) and prompt complexity is rich. Decomposing task into modular sub-objectives.`;
      subtasks = [
        "Deconstruct primary logical core boundaries.",
        "Address edge condition integrations.",
        "Verify factual assembly via cross-layer checks."
      ];
    }

    const p5Data: StrategyControllerOutput = {
      decision: decision as any,
      explanation: strategyExplanation,
      subTasks: subtasks,
      adjustedConfidenceThreshold: confidenceThreshold
    };

    steps.push({
      phaseIndex: 5,
      phaseId: 'strategy',
      title: 'Strategy Controller Router',
      status: 'completed',
      timestamp: new Date().toISOString(),
      data: p5Data
    });

    // Handle strategic retry on the fly if requested to simulate a real Metacognitive retry
    let finalAnswer = p1Data.draftAnswer;
    if (decision === 'retry') {
      const retryPrompt = `You are the Core Cognition Engine executing a STRATEGIC RETRY.
Your previous draft was critiqued as follows:
"${p3Data.overallCritique}"

Please rewrite and output a revised high quality final answer for the user's task details, fixing all noted logical, factual or procedural defects.
User original task: "${task}"`;

      const retryRes = await callWithRetry(() => ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: retryPrompt,
        config: {
          systemInstruction: `You are the Core Cognition Engine performing a self-correction retry iteration within the ${domain.name} domain.`
        }
      }));
      finalAnswer = retryRes.text || p1Data.draftAnswer;
      p5Data.explanation += " (Revised response generated and stored successfully).";
    }

    // ----------------------------------------------------
    // Phase 6: Self-Model Adaptation
    // ----------------------------------------------------
    const p6Prompt = `You are a Persistent Self-Model manager of a Metacognitive Agent.
Based on the task performance and critic audits, we must dynamically update the agent's Self-Model properties.

Action Taken: ${decision}
Critic overall findings: "${p3Data.overallCritique}"
Confidence score: ${score}/100

Active Self-Model:
Strengths: ${JSON.stringify(selfModel.strengths)}
Weaknesses: ${JSON.stringify(selfModel.weaknesses)}
Failure Patterns: ${JSON.stringify(selfModel.failurePatterns)}
Trust profile: ${JSON.stringify(selfModel.trustProfile)}

Recommend dynamic adjustments to Strengths, Weaknesses, and Trust factor levels. For example, if factual correctness was low, decrease factual recall trust. If execution was flawless, increase logic trust. Save this operational identity status report.`;

    const selfModelSchema = {
      type: Type.OBJECT,
      properties: {
        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
        weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
        failurePatterns: { type: Type.ARRAY, items: { type: Type.STRING } },
        trustProfile: {
          type: Type.OBJECT,
          properties: {
            logic: { type: Type.INTEGER },
            memory: { type: Type.INTEGER },
            factualRecall: { type: Type.INTEGER }
          },
          required: ['logic', 'memory', 'factualRecall']
        }
      },
      required: ['strengths', 'weaknesses', 'failurePatterns', 'trustProfile']
    };

    const selfModelResponse = await callWithRetry(() => ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: p6Prompt,
      config: {
        systemInstruction: "You are the Persistent Self-Model updater. Calibrate operational weaknesses, strengths, and trust ratings.",
        responseMimeType: "application/json",
        responseSchema: selfModelSchema
      }
    }));

    const p6Data = JSON.parse(selfModelResponse.text || "{}");
    steps.push({
      phaseIndex: 6,
      phaseId: 'selfmodel',
      title: 'Self-Model Adaptation',
      status: 'completed',
      timestamp: new Date().toISOString(),
      data: p6Data
    });

    // ----------------------------------------------------
    // Phase 7: Recursive Introspection Loop
    // ----------------------------------------------------
    const p7Prompt = `You are the highest Metacognitive layer: The Recursive Introspection Loop.
Debrief this absolute episode of execution to build wisdom.

1. Explain EXACTLY WHY you selected the strategic path (e.g., accepted, retried with critique, or decomposed). Was it the right move?
2. Detail how your strategy can be fine-tuned or improved for this specific style of tasks.
3. Detect if this run highlights a recurring failure pattern (such as premature closure, or lack of boundary check).
4. Outline the exact self-model adjustment vectors: strengthAdded, weaknessAdded, trustAdjustments.`;

    const introspectionSchema = {
      type: Type.OBJECT,
      properties: {
        whySelected: { type: Type.STRING },
        howToImprove: { type: Type.STRING },
        patternDetected: { type: Type.BOOLEAN },
        patternExplanation: { type: Type.STRING },
        selfModelAdjustments: {
          type: Type.OBJECT,
          properties: {
            strengthAdded: { type: Type.STRING },
            weaknessAdded: { type: Type.STRING },
            trustAdjustments: {
              type: Type.OBJECT,
              properties: {
                logic: { type: Type.INTEGER },
                memory: { type: Type.INTEGER },
                factualRecall: { type: Type.INTEGER }
              }
            }
          }
        }
      },
      required: ['whySelected', 'howToImprove', 'patternDetected']
    };

    const introspectionResponse = await callWithRetry(() => ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: p7Prompt,
      config: {
        systemInstruction: "You are the Recursive Introspection Loop. Extract strategic wisdom and system adjustments.",
        responseMimeType: "application/json",
        responseSchema: introspectionSchema
      }
    }));

    const p7Data = JSON.parse(introspectionResponse.text || "{}");
    steps.push({
      phaseIndex: 7,
      phaseId: 'introspection',
      title: 'Recursive Introspection Loop',
      status: 'completed',
      timestamp: new Date().toISOString(),
      data: p7Data
    });

    // Inject final updated response into cognition step details
    if (decision === 'retry') {
      const cogStep = steps.find(s => s.phaseId === 'cognition');
      if (cogStep) {
        cogStep.data.draftAnswer = `[REVISED / SELF-CORRECTED ANSWER]\n\n${finalAnswer}`;
      }
    }

    return steps;
  } catch (error: any) {
    console.log("[Metaloop Status] Utilizing high-fidelity simulation fallback.");
    
    // Create custom simulated steps and tag them with isSimulatedFallback indicator
    const fallbackTrace = getSimulatedTrace(task, domain, selfModel);
    fallbackTrace.forEach(step => {
      if (step.data) {
        step.data.isSimulatedFallback = true;
      }
    });
    return fallbackTrace;
  }
}
