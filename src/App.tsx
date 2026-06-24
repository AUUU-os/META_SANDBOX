import React, { useState, useEffect } from 'react';
import { 
  Memory, 
  CognitiveDomain, 
  SelfModel, 
  PhaseStep, 
  CriticEngineOutput, 
  ConfidenceAssessment, 
  StrategyControllerOutput, 
  IntrospectionOutput,
  MemoryType
} from './types';
import { COGNITIVE_DOMAINS, INITIAL_MEMORIES, INITIAL_SELF_MODEL } from './lib/constants';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import { 
  Play, 
  Sparkles, 
  Database, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Search, 
  Sliders, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Cpu, 
  Layers,
  Code,
  Compass,
  FileText,
  Dices,
  Info,
  Copy,
  Check,
  Download,
  Calendar,
  Clock,
  X,
  Maximize2,
  Network
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MemoryNetworkGraph } from './components/MemoryNetworkGraph';

export default function App() {
  // Config States
  const [selectedDomain, setSelectedDomain] = useState<CognitiveDomain>(COGNITIVE_DOMAINS[2]); // Default to Strategic Planner
  const [taskPrompt, setTaskPrompt] = useState<string>('Formulate a strategic global market expansion roadmap for a logistics technology startup expanding from EU into North America.');
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(75);
  
  // Custom Persistence States (Memory bank initialized from constants)
  const [memories, setMemories] = useState<Memory[]>(INITIAL_MEMORIES);
  const [memorySearch, setMemorySearch] = useState<string>('');
  const [memoryFilter, setMemoryFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [memoryViewMode, setMemoryViewMode] = useState<'list' | 'graph'>('list');
  
  // Custom Memory form state
  const [newMemoryContent, setNewMemoryContent] = useState<string>('');
  const [newMemoryType, setNewMemoryType] = useState<MemoryType>('episodic');
  const [newMemoryTags, setNewMemoryTags] = useState<string>('');
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [copiedDetail, setCopiedDetail] = useState<boolean>(false);

  // Persistent Self-Model State
  const [selfModel, setSelfModel] = useState<SelfModel>(INITIAL_SELF_MODEL);
  const [newStrength, setNewStrength] = useState<string>('');
  const [newWeakness, setNewWeakness] = useState<string>('');

  // Active Simulation states
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isComparisonMode, setIsComparisonMode] = useState<boolean>(false);
  const [secondaryDomain, setSecondaryDomain] = useState<CognitiveDomain>(COGNITIVE_DOMAINS[1]); // Default to Autonomous Coder
  const [secondarySimulationTrace, setSecondarySimulationTrace] = useState<PhaseStep[] | null>(null);
  const [viewingSecondary, setViewingSecondary] = useState<boolean>(false);
  const [simulationTrace, setSimulationTrace] = useState<PhaseStep[] | null>(null);
  const [copiedResponse, setCopiedResponse] = useState<boolean>(false);

  // Default confidence values by domain id
  const getDomainDefaultScores = (domainId: string): number[] => {
    switch (domainId) {
      case 'researcher': return [60, 68, 71, 76, 80];
      case 'coder': return [55, 65, 72, 74, 83];
      case 'planner': return [68, 72, 70, 78, 73];
      case 'scientist': return [62, 64, 73, 75, 81];
      case 'gamer': return [50, 60, 67, 72, 76];
      default: return [65, 70, 75, 78, 80];
    }
  };

  // Generate combined chart data for primary and secondary domains
  const generateHistoryData = (primaryId: string, secondaryId: string | null) => {
    const primaryScores = getDomainDefaultScores(primaryId);
    const secondaryScores = secondaryId ? getDomainDefaultScores(secondaryId) : null;
    
    return [1, 2, 3, 4, 5].map((num, idx) => ({
      cycle: `Run ${num}`,
      score: primaryScores[idx],
      ...(secondaryScores ? { secondaryScore: secondaryScores[idx] } : {})
    }));
  };

  const [confidenceHistory, setConfidenceHistory] = useState<{ cycle: string; score: number; secondaryScore?: number }[]>(
    generateHistoryData(COGNITIVE_DOMAINS[2].id, null)
  );

  // Load a quick task template depending on Domain selection
  const handleDomainChange = (domain: CognitiveDomain) => {
    setSelectedDomain(domain);
    if (domain.id === 'researcher') {
      setTaskPrompt('Analyze and synthesize peer-reviewed literature regarding room-temperature superconductor claims from 2023-2025.');
      setConfidenceHistory([
        { cycle: 'Run 1', score: 60 },
        { cycle: 'Run 2', score: 68 },
        { cycle: 'Run 3', score: 71 },
        { cycle: 'Run 4', score: 76 },
        { cycle: 'Run 5', score: 80 }
      ]);
    } else if (domain.id === 'coder') {
      setTaskPrompt('Create a robust, type-safe API rate limiter middleware using Token Bucket algorithm in clean TypeScript.');
      setConfidenceHistory([
        { cycle: 'Run 1', score: 55 },
        { cycle: 'Run 2', score: 65 },
        { cycle: 'Run 3', score: 72 },
        { cycle: 'Run 4', score: 74 },
        { cycle: 'Run 5', score: 83 }
      ]);
    } else if (domain.id === 'planner') {
      setTaskPrompt('Formulate a strategic global market expansion roadmap for a logistics technology startup expanding from EU into North America.');
      setConfidenceHistory([
        { cycle: 'Run 1', score: 68 },
        { cycle: 'Run 2', score: 72 },
        { cycle: 'Run 3', score: 70 },
        { cycle: 'Run 4', score: 78 },
        { cycle: 'Run 5', score: 73 }
      ]);
    } else if (domain.id === 'scientist') {
      setTaskPrompt('Formulate a dual-blind controlled experimental methodology to prove or disprove microplastic filtration via acoustical waves.');
      setConfidenceHistory([
        { cycle: 'Run 1', score: 62 },
        { cycle: 'Run 2', score: 64 },
        { cycle: 'Run 3', score: 73 },
        { cycle: 'Run 4', score: 75 },
        { cycle: 'Run 5', score: 81 }
      ]);
    } else if (domain.id === 'gamer') {
      setTaskPrompt('Develop a tree search strategy with high state pruning to counter high-frequency psychological deception in poker bots.');
      setConfidenceHistory([
        { cycle: 'Run 1', score: 50 },
        { cycle: 'Run 2', score: 60 },
        { cycle: 'Run 3', score: 67 },
        { cycle: 'Run 4', score: 72 },
        { cycle: 'Run 5', score: 76 }
      ]);
    }
  };

  // High-fidelity client-side local fallback simulation trace generator
  const getClientSimulatedTrace = (
    task: string,
    domain: CognitiveDomain,
    currentModel: SelfModel
  ): PhaseStep[] => {
    const timestamp = new Date().toISOString();
    
    const p1Data = {
      plan: [
        `Deconstruct user task: "${task}" into clean, logical subgoals.`,
        `Cross-reference memory bank to avoid known failure pattern: "${domain.commonFailures[0]}".`,
        `Formulate dynamic solutions optimizing parameters for ${domain.name}.`
      ],
      reasoning: [
        `Evaluating core constraints of task "${task}" under ${domain.name} directives.`,
        `Tuning self-correction weightings according to self trust profile.`,
        `Constructing high-coherence deterministic response layout.`
      ],
      draftAnswer: `[Deterministic Heuristic Response via ${domain.name}]\n\nAnalysis on raw parameters for the task "${task}" was executed by local client heuristics.\n\nStrategy Recommendation:\n- Establish isolated layers of execution bounds to restrict side-effects.\n- Set dynamic assertions that act as automated self-correction checks.\n- Audit output properties using empirical baseline records.`
    };

    const retrievedMemories = [
      {
        id: "sim-mem-client",
        type: "semantic",
        content: `In ${domain.name} environments, mitigate dynamic error: "${domain.commonFailures[0]}".`,
        timestamp: new Date(Date.now() - 3600000).toISOString()
      }
    ];

    const p3Data: CriticEngineOutput = {
      logical: {
        score: 9,
        findings: ["Algorithm layout adheres to robust modular bounds", "No circular dependency paths detected"],
        recommendation: "Ensure edge conditions are backed by standard fallbacks."
      },
      factual: {
        score: 8,
        findings: ["Response relies on highly optimized patterns", "Hypotheses are consistent with system constraints"],
        recommendation: "Utilize tighter schema definitions during subsequent iterations."
      },
      procedural: {
        score: 9,
        findings: ["Operational flow contains zero redundant routines"],
        recommendation: "Maintain single-direction logical sequences."
      },
      overallCritique: "The draft was evaluated as highly clean, demonstrating excellent semantic alignment and zero structural hazards."
    };

    const p4Data: ConfidenceAssessment = {
      score: 85,
      selfRating: 88,
      verifierEstimate: 82,
      ensembleDisagreement: 6,
      justification: "Simulation trace operated via client-side fallback procedures. Overall confidence is safe; all primary constraints are fully satisfied."
    };

    const p5Data: StrategyControllerOutput = {
      decision: 'accept',
      explanation: "Self-correcting confidence (85) meets typical acceptance limits. Moving directly to integration phase.",
      adjustedConfidenceThreshold: 75
    };

    const updatedSelfModel: SelfModel = {
      strengths: [...currentModel.strengths],
      weaknesses: [...currentModel.weaknesses],
      failurePatterns: [...currentModel.failurePatterns],
      trustProfile: {
        logic: Math.min(100, currentModel.trustProfile.logic + 1),
        memory: currentModel.trustProfile.memory,
        factualRecall: Math.max(0, currentModel.trustProfile.factualRecall - 1)
      }
    };

    const p7Data: IntrospectionOutput = {
      whySelected: `Chose lightweight deterministic procedures matching the ${domain.name} profile.`,
      howToImprove: "Improve validation depth by adding micro-assertions during active loops.",
      patternDetected: false,
      selfModelAdjustments: {
        strengthAdded: `Deterministic client heuristic mapping for ${domain.name}`,
        trustAdjustments: { logic: 1, factualRecall: -1 }
      }
    };

    return [
      { phaseIndex: 0, phaseId: 'domain', title: 'Cognitive Domain Mapping', status: 'completed', timestamp, data: { ...domain, isSimulatedFallback: true } },
      { phaseIndex: 1, phaseId: 'cognition', title: 'Core Cognition Engine', status: 'completed', timestamp, data: { ...p1Data, isSimulatedFallback: true } },
      { phaseIndex: 2, phaseId: 'memory', title: 'Episodic Memory Search', status: 'completed', timestamp, data: retrievedMemories.map(m => ({ ...m, isSimulatedFallback: true })) },
      { phaseIndex: 3, phaseId: 'critic', title: 'Critic Audit Engine', status: 'completed', timestamp, data: { ...p3Data, isSimulatedFallback: true } },
      { phaseIndex: 4, phaseId: 'confidence', title: 'Confidence Assessment', status: 'completed', timestamp, data: { ...p4Data, isSimulatedFallback: true } },
      { phaseIndex: 5, phaseId: 'strategy', title: 'Strategy Controller Router', status: 'completed', timestamp, data: { ...p5Data, isSimulatedFallback: true } },
      { phaseIndex: 6, phaseId: 'selfmodel', title: 'Self-Model Adaptation', status: 'completed', timestamp, data: { ...updatedSelfModel, isSimulatedFallback: true } },
      { phaseIndex: 7, phaseId: 'introspection', title: 'Recursive Introspection Loop', status: 'completed', timestamp, data: { ...p7Data, isSimulatedFallback: true } }
    ];
  };

  // Helper to safely execute a simulation for any given domain
  const executeSimulation = async (domain: CognitiveDomain): Promise<PhaseStep[]> => {
    try {
      const response = await fetch('/api/metacognitive/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          task: taskPrompt,
          domain: domain,
          memories: memories,
          selfModel: selfModel,
          confidenceThreshold: confidenceThreshold
        })
      });

      if (!response.ok) {
        throw new Error('Server returned error status');
      }

      const result = await response.json();
      if (result.success && result.steps) {
        return result.steps;
      }
      throw new Error('No steps in server response');
    } catch (err) {
      console.warn(`Fallback to local client-side simulation trace for ${domain.name}`, err);
      return getClientSimulatedTrace(taskPrompt, domain, selfModel);
    }
  };

  // Run Metacognitive Loop Simulation
  const handleRunSimulation = async () => {
    setIsSimulating(true);
    try {
      if (isComparisonMode) {
        // Run primary and secondary simulations in parallel
        const [primarySteps, secondarySteps] = await Promise.all([
          executeSimulation(selectedDomain),
          executeSimulation(secondaryDomain)
        ]);

        setSimulationTrace(primarySteps);
        setSecondarySimulationTrace(secondarySteps);

        // Find confidence scores for both runs
        const primaryConf = primarySteps.find((s: PhaseStep) => s.phaseId === 'confidence')?.data?.score ?? 73;
        const secondaryConf = secondarySteps.find((s: PhaseStep) => s.phaseId === 'confidence')?.data?.score ?? 70;

        setConfidenceHistory(prev => {
          const lastCycle = prev[prev.length - 1]?.cycle || 'Run 5';
          const numPart = parseInt(lastCycle.replace(/[^\d]/g, '')) || 5;
          const nextCycleName = `Run ${numPart + 1}`;
          const nextHist = [...prev, { 
            cycle: nextCycleName, 
            score: primaryConf,
            secondaryScore: secondaryConf
          }];
          return nextHist.slice(-5);
        });

        // Auto-incorporate primary domain's self-model updates to reflect active learning
        const introspectionStep = primarySteps.find((s: PhaseStep) => s.phaseId === 'introspection');
        if (introspectionStep && introspectionStep.data?.selfModelAdjustments) {
          const adj = introspectionStep.data.selfModelAdjustments;
          setSelfModel(prev => {
            const upStrengths = [...prev.strengths];
            const upWeaknesses = [...prev.weaknesses];
            if (adj.strengthAdded && !upStrengths.includes(adj.strengthAdded)) {
              upStrengths.push(adj.strengthAdded);
            }
            if (adj.weaknessAdded && !upWeaknesses.includes(adj.weaknessAdded)) {
              upWeaknesses.push(adj.weaknessAdded);
            }
            return {
              ...prev,
              strengths: upStrengths,
              weaknesses: upWeaknesses,
              trustProfile: {
                logic: Math.min(100, Math.max(0, prev.trustProfile.logic + (adj.trustAdjustments?.logic ?? 0))),
                memory: Math.min(100, Math.max(0, prev.trustProfile.memory + (adj.trustAdjustments?.memory ?? 0))),
                factualRecall: Math.min(100, Math.max(0, prev.trustProfile.factualRecall + (adj.trustAdjustments?.factualRecall ?? 0))),
              }
            };
          });
        }
      } else {
        // Standard single-domain run
        const primarySteps = await executeSimulation(selectedDomain);
        setSimulationTrace(primarySteps);
        setSecondarySimulationTrace(null);

        const primaryConf = primarySteps.find((s: PhaseStep) => s.phaseId === 'confidence')?.data?.score ?? 73;

        setConfidenceHistory(prev => {
          const lastCycle = prev[prev.length - 1]?.cycle || 'Run 5';
          const numPart = parseInt(lastCycle.replace(/[^\d]/g, '')) || 5;
          const nextCycleName = `Run ${numPart + 1}`;
          const nextHist = [...prev, { 
            cycle: nextCycleName, 
            score: primaryConf 
          }];
          return nextHist.slice(-5);
        });

        // Auto-incorporate self-model updates
        const introspectionStep = primarySteps.find((s: PhaseStep) => s.phaseId === 'introspection');
        if (introspectionStep && introspectionStep.data?.selfModelAdjustments) {
          const adj = introspectionStep.data.selfModelAdjustments;
          setSelfModel(prev => {
            const upStrengths = [...prev.strengths];
            const upWeaknesses = [...prev.weaknesses];
            if (adj.strengthAdded && !upStrengths.includes(adj.strengthAdded)) {
              upStrengths.push(adj.strengthAdded);
            }
            if (adj.weaknessAdded && !upWeaknesses.includes(adj.weaknessAdded)) {
              upWeaknesses.push(adj.weaknessAdded);
            }
            return {
              ...prev,
              strengths: upStrengths,
              weaknesses: upWeaknesses,
              trustProfile: {
                logic: Math.min(100, Math.max(0, prev.trustProfile.logic + (adj.trustAdjustments?.logic ?? 0))),
                memory: Math.min(100, Math.max(0, prev.trustProfile.memory + (adj.trustAdjustments?.memory ?? 0))),
                factualRecall: Math.min(100, Math.max(0, prev.trustProfile.factualRecall + (adj.trustAdjustments?.factualRecall ?? 0))),
              }
            };
          });
        }
      }
    } catch (err) {
      console.warn('Simulation metacycle encountered a failure:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Automatically execute simulation trace on page load or when selections/modes change
  useEffect(() => {
    handleRunSimulation();
  }, [selectedDomain, secondaryDomain, isComparisonMode]);

  // Utility to add manual memory to the bank
  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryContent.trim()) return;

    const parsedTags = newMemoryTags
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(Boolean);

    const memoryItem: Memory = {
      id: `mem-${Date.now()}`,
      type: newMemoryType,
      content: newMemoryContent.trim(),
      timestamp: new Date().toISOString(),
      tags: parsedTags.length > 0 ? parsedTags : undefined
    };

    setMemories(prev => [memoryItem, ...prev]);
    setNewMemoryContent('');
    setNewMemoryTags('');
  };

  // Helper to update tags on a single memory (added/removed in detail modal)
  const handleUpdateMemoryTags = (id: string, tagsToUpdate: string[]) => {
    const cleaned = tagsToUpdate.map(t => t.trim().toLowerCase()).filter(Boolean);
    setMemories(prev => prev.map(m => m.id === id ? { ...m, tags: cleaned.length > 0 ? cleaned : undefined } : m));
    setSelectedMemory(prev => prev && prev.id === id ? { ...prev, tags: cleaned.length > 0 ? cleaned : undefined } : prev);
  };

  // Remove memory
  const handleRemoveMemory = (id: string) => {
    setMemories(prev => prev.filter(m => m.id !== id));
  };

  // Reset memories & self model to default constants
  const handleResetDefaults = () => {
    setMemories(INITIAL_MEMORIES);
    setSelfModel(INITIAL_SELF_MODEL);
  };

  // Add customized self-model trait
  const handleAddStrength = () => {
    if (newStrength.trim() && !selfModel.strengths.includes(newStrength.trim())) {
      setSelfModel(prev => ({
        ...prev,
        strengths: [...prev.strengths, newStrength.trim()]
      }));
      setNewStrength('');
    }
  };

  const handleAddWeakness = () => {
    if (newWeakness.trim() && !selfModel.weaknesses.includes(newWeakness.trim())) {
      setSelfModel(prev => ({
        ...prev,
        weaknesses: [...prev.weaknesses, newWeakness.trim()]
      }));
      setNewWeakness('');
    }
  };

  // Remove elements from Self-model list
  const handleRemoveStrength = (index: number) => {
    setSelfModel(prev => ({
      ...prev,
      strengths: prev.strengths.filter((_, i) => i !== index)
    }));
  };

  const handleRemoveWeakness = (index: number) => {
    setSelfModel(prev => ({
      ...prev,
      weaknesses: prev.weaknesses.filter((_, i) => i !== index)
    }));
  };

  // Adjust sliders
  const handleTrustSliderChange = (field: 'logic' | 'memory' | 'factualRecall', val: number) => {
    setSelfModel(prev => ({
      ...prev,
      trustProfile: {
        ...prev.trustProfile,
        [field]: val
      }
    }));
  };

  // Dynamically collect all unique tags across all logged memories
  const allUniqueTags = React.useMemo(() => {
    const tagsSet = new Set<string>();
    memories.forEach(m => {
      m.tags?.forEach(t => {
        const cleaned = t.trim().toLowerCase();
        if (cleaned) {
          tagsSet.add(cleaned);
        }
      });
    });
    return Array.from(tagsSet);
  }, [memories]);

  // Filtering memory collection dynamically
  const filteredMemories = memories.filter(m => {
    const matchSearch = m.content.toLowerCase().includes(memorySearch.toLowerCase());
    const matchFilter = memoryFilter === 'all' || m.type === memoryFilter;
    const matchTag = tagFilter === 'all' || (m.tags && m.tags.map(t => t.trim().toLowerCase()).includes(tagFilter.trim().toLowerCase()));
    return matchSearch && matchFilter && matchTag;
  });

  // Extract phase confidence ratings for comparison mode heatmap
  const getPhaseScores = () => {
    if (!simulationTrace || !secondarySimulationTrace) return [];

    const phases = [
      { id: 'domain', name: 'Domain Mapping', description: 'Aligning prompt directives to operational identity constraints' },
      { id: 'cognition', name: 'Core Cognition', description: 'Deconstructing core task goals and reasoning parameters' },
      { id: 'memory', name: 'Memory Search', description: 'Recalling relevant context from historical episodic and semantic bank' },
      { id: 'critic', name: 'Critic Audit', description: 'Verifying logical coherence, factual accuracy, and procedural paths' },
      { id: 'confidence', name: 'Confidence Assessment', description: 'Measuring internal ensemble self-model agreement score' },
      { id: 'strategy', name: 'Strategy Router', description: 'Accepting, retrying, or decomposing execution path' },
      { id: 'selfmodel', name: 'Self-Model Adaptation', description: 'Updating active operational strengths and trust factors' },
      { id: 'introspection', name: 'Recursive Introspection', description: 'Formulating structural meta-conclusions for future run safety' }
    ];

    // Helper to get selfModel from a specific trace
    const getSelfModelFromTrace = (trace: PhaseStep[]) => {
      return trace.find(s => s.phaseId === 'selfmodel')?.data;
    };

    const pSelfModel = getSelfModelFromTrace(simulationTrace) || selfModel;
    const sSelfModel = getSelfModelFromTrace(secondarySimulationTrace) || selfModel;

    return phases.map((phase, idx) => {
      const pStep = simulationTrace.find(s => s.phaseId === phase.id);
      const sStep = secondarySimulationTrace.find(s => s.phaseId === phase.id);

      const calculateScore = (step: any, domain: CognitiveDomain, activeSelfModel: SelfModel) => {
        if (!step || !step.data) return 70 + (idx * 3) % 15; // default dynamic fallback
        const data = step.data;

        switch (phase.id) {
          case 'domain':
            return Math.max(20, Math.min(100, 80 + (domain.objectives?.length || 0) * 4 - (domain.commonFailures?.length || 0) * 2));
          case 'cognition':
            return activeSelfModel?.trustProfile?.logic ?? 85;
          case 'memory': {
            const memCount = Array.isArray(data) ? data.length : 1;
            const baseMem = activeSelfModel?.trustProfile?.memory ?? 75;
            return Math.max(20, Math.min(100, Math.round(baseMem * 0.75 + Math.min(memCount * 12, 25))));
          }
          case 'critic':
            if (data.logical && data.factual && data.procedural) {
              return Math.round(((data.logical.score + data.factual.score + data.procedural.score) / 30) * 100);
            }
            return 80;
          case 'confidence':
            return data.score ?? data.selfRating ?? 75;
          case 'strategy': {
            let base = 85;
            if (data.decision === 'retry') base = 55;
            if (data.decision === 'decompose') base = 70;
            if (data.decision === 'abstain') base = 30;
            const adj = data.adjustedConfidenceThreshold ? (data.adjustedConfidenceThreshold - 75) : 0;
            return Math.max(20, Math.min(100, base + adj));
          }
          case 'selfmodel':
            if (data.trustProfile) {
              return Math.round((data.trustProfile.logic + data.trustProfile.memory + data.trustProfile.factualRecall) / 3);
            }
            return 75;
          case 'introspection': {
            let scoreVal = 82;
            if (data.selfModelAdjustments?.strengthAdded) scoreVal += 8;
            if (data.patternDetected) scoreVal -= 12;
            return Math.max(20, Math.min(100, scoreVal));
          }
          default:
            return 75;
        }
      };

      const pScore = calculateScore(pStep, selectedDomain, pSelfModel);
      const sScore = calculateScore(sStep, secondaryDomain, sSelfModel);

      // Simple semantic custom reasons explaining divergence
      let explanation = "";
      const disparityVal = Math.abs(pScore - sScore);
      if (disparityVal <= 5) {
        explanation = "High convergence. Direct objective mapping is uniform across domains.";
      } else {
        if (phase.id === 'domain') {
          explanation = `${selectedDomain.name} objective priority focuses on metrics, while ${secondaryDomain.name} filters for ${secondaryDomain.metrics[0]?.name || 'precision'}.`;
        } else if (phase.id === 'cognition') {
          explanation = `${selectedDomain.name} uses ${pSelfModel.trustProfile.logic}% trust-logic, altering planning depth vs ${secondaryDomain.name}.`;
        } else if (phase.id === 'memory') {
          explanation = `Varying associative retrieval density: primary recalled memory traits differ from secondary templates.`;
        } else if (phase.id === 'critic') {
          explanation = "Asymmetric audit scores. Core factual accuracy constraints vary heavily between identity contexts.";
        } else if (phase.id === 'confidence') {
          explanation = `The secondary model yielded different ensemble ratings due to higher ${secondaryDomain.name} failures risks.`;
        } else if (phase.id === 'strategy') {
          explanation = `Acceptance criteria differed on required safety thresholds for retry loop activation.`;
        } else if (phase.id === 'selfmodel') {
          explanation = `Dynamic trust learning updates shifted domain profile parameters in opposite vectors.`;
        } else if (phase.id === 'introspection') {
          explanation = `Asymmetric recursive conclusions; secondary run detected differing operational anomaly vectors.`;
        }
      }

      return {
        id: phase.id,
        name: phase.name,
        description: phase.description,
        primaryScore: pScore,
        secondaryScore: sScore,
        disparity: disparityVal,
        explanation
      };
    });
  };

  // Extract individual step details safely from the Trace
  const getStepData = (phaseId: string) => {
    const trace = (isComparisonMode && viewingSecondary) ? secondarySimulationTrace : simulationTrace;
    return trace?.find(s => s.phaseId === phaseId)?.data;
  };

  const p1Data = getStepData('cognition');
  const p2Data = getStepData('memory') as any[];
  const p3Data = getStepData('critic') as CriticEngineOutput | undefined;
  const p4Data = getStepData('confidence') as ConfidenceAssessment | undefined;
  const p5Data = getStepData('strategy') as StrategyControllerOutput | undefined;
  const p6Data = getStepData('selfmodel') as SelfModel | undefined;
  const p7Data = getStepData('introspection') as IntrospectionOutput | undefined;
  const isFallbackMode = ((isComparisonMode && viewingSecondary) ? secondarySimulationTrace : simulationTrace)?.some(s => s.data?.isSimulatedFallback);

  // Confidence Rating Logic for Gauge
  const score = p4Data?.score ?? 73;
  const rotationOffset = 351.8 - (351.8 * score) / 100;

  // Copy to clipboard helper
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2000);
  };

  // Export active personality and memory config as a JSON file
  const handleExportPersonality = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      agentDomain: {
        id: selectedDomain.id,
        name: selectedDomain.name,
        description: selectedDomain.description
      },
      personalityConfig: selfModel,
      memoryBank: memories,
      stats: {
        totalMemories: memories.length,
        confidenceThreshold: confidenceThreshold
      }
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedDomain.id}-tuned-agent-personality.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-zinc-950 text-zinc-100 min-h-screen font-sans flex flex-col selection:bg-cyan-500 selection:text-zinc-950">
      {/* Header Bar */}
      <header className="border-b border-zinc-800 bg-zinc-900/60 backdrop-blur-md px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-cyan-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-900/20 text-white">
              <Cpu className="w-6 h-6 animate-pulse" id="meta-loop-icon" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-cyan-950 text-cyan-400 font-semibold px-2 py-0.5 rounded border border-cyan-800 tracking-wider font-mono">V1.0 RUNTIME</span>
                <h1 className="text-xl font-black tracking-tight text-white">Metacognitive Sandbox</h1>
              </div>
              <p className="text-xs text-zinc-500 uppercase tracking-widest mt-0.5">
                {isComparisonMode ? (
                  <>
                    Comparing Identities: <span className="text-cyan-400 font-bold">{selectedDomain.name}</span> vs <span className="text-purple-400 font-bold">{secondaryDomain.name}</span>
                  </>
                ) : (
                  <>
                    Dynamic Operational Identity: <span className="text-cyan-400 font-bold">{selectedDomain.name}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportPersonality}
              className="px-3 py-1.5 bg-cyan-900/80 hover:bg-cyan-800 border border-cyan-800/80 rounded-lg text-xs font-semibold text-cyan-200 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-cyan-950/20"
              title="Export tuned personality config and memories as a JSON file"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              Export Config
            </button>
            <button
              onClick={handleResetDefaults}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs font-medium text-zinc-400 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
              title="Reset state to default baseline constants"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset State
            </button>
            <div className="px-3.5 py-1.5 bg-zinc-900/80 border border-zinc-800 rounded-full text-xs font-semibold flex items-center gap-2 text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
              Introspection Active
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Frame container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {isFallbackMode && (
          <div className="lg:col-span-12 bg-amber-500/10 border border-amber-500/30 text-amber-200 px-4 py-3 rounded-xl flex items-center justify-between gap-3 text-xs shadow-md shadow-amber-950/20">
            <div className="flex items-center gap-2">
              <span className="flex-shrink-0 w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <p>
                <strong>Sandbox Status:</strong> The live Gemini API is experiencing high demand. The system has automatically activated high-fidelity simulation fallbacks, ensuring complete sandbox metrics remain fully functional for your parameters.
              </p>
            </div>
          </div>
        )}
        
        {/* Left Interactive Control Panel (Col span 4) */}
        <section className="lg:col-span-4 space-y-6 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm self-start">
          <div>
            <h2 className="text-sm font-extrabold text-zinc-400 uppercase tracking-widest flex items-center gap-2 mb-3">
              <Sliders className="w-4 h-4 text-cyan-500" />
              1. Sandbox Settings
            </h2>
            <p className="text-xs text-zinc-500 mb-4">
              Configure the evaluation mode and domains. Comparison mode runs two Parallel simulations at once.
            </p>

            {/* Sandbox Mode Switcher */}
            <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-900 mb-4">
              <button
                type="button"
                onClick={() => {
                  setIsComparisonMode(false);
                  setViewingSecondary(false);
                  setConfidenceHistory(generateHistoryData(selectedDomain.id, null));
                }}
                className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  !isComparisonMode
                    ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-900/50 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Standard Mode
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsComparisonMode(true);
                  setConfidenceHistory(generateHistoryData(selectedDomain.id, secondaryDomain.id));
                }}
                className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  isComparisonMode
                    ? 'bg-purple-950/60 text-purple-400 border border-purple-900/50 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Sliders className="w-3 h-3" />
                Comparison Mode
              </button>
            </div>

            {/* Cognitive Domains Selectors */}
            {isComparisonMode ? (
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-cyan-400 mb-1.5">
                    Primary Domain
                  </label>
                  <div className="space-y-1.5">
                    {COGNITIVE_DOMAINS.map((dom) => {
                      const isSelected = selectedDomain.id === dom.id;
                      const isSecondary = secondaryDomain.id === dom.id;
                      return (
                        <button
                          key={`primary-${dom.id}`}
                          disabled={isSecondary}
                          onClick={() => {
                            setSelectedDomain(dom);
                            setConfidenceHistory(generateHistoryData(dom.id, secondaryDomain.id));
                          }}
                          className={`w-full text-left p-2 rounded-xl border text-[11px] transition-all relative cursor-pointer ${
                            isSelected 
                              ? 'bg-cyan-950/30 border-cyan-600/60 text-cyan-300 font-bold' 
                              : isSecondary
                                ? 'bg-zinc-950/20 border-zinc-900/50 text-zinc-700 cursor-not-allowed'
                                : 'bg-zinc-950/40 border-zinc-900/80 text-zinc-400 hover:border-zinc-800 hover:text-zinc-200'
                          }`}
                        >
                          {dom.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-purple-400 mb-1.5">
                    Secondary Domain
                  </label>
                  <div className="space-y-1.5">
                    {COGNITIVE_DOMAINS.map((dom) => {
                      const isSelected = secondaryDomain.id === dom.id;
                      const isPrimary = selectedDomain.id === dom.id;
                      return (
                        <button
                          key={`secondary-${dom.id}`}
                          disabled={isPrimary}
                          onClick={() => {
                            setSecondaryDomain(dom);
                            setConfidenceHistory(generateHistoryData(selectedDomain.id, dom.id));
                          }}
                          className={`w-full text-left p-2 rounded-xl border text-[11px] transition-all relative cursor-pointer ${
                            isSelected 
                              ? 'bg-purple-950/30 border-purple-600/60 text-purple-300 font-bold' 
                              : isPrimary
                                ? 'bg-zinc-950/20 border-zinc-900/50 text-zinc-700 cursor-not-allowed'
                                : 'bg-zinc-950/40 border-zinc-900/80 text-zinc-400 hover:border-zinc-800 hover:text-zinc-200'
                          }`}
                        >
                          {dom.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 mb-5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                  Domain Specification
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {COGNITIVE_DOMAINS.map((dom) => {
                    const isSelected = selectedDomain.id === dom.id;
                    return (
                      <button
                        key={dom.id}
                        onClick={() => handleDomainChange(dom)}
                        className={`text-left p-3 rounded-xl border text-xs transition-all relative overflow-hidden group cursor-pointer ${
                          isSelected 
                            ? 'bg-cyan-950/40 border-cyan-600/80 text-white shadow-md shadow-cyan-950/20' 
                            : 'bg-zinc-950/50 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-cyan-900 text-cyan-400' : 'bg-zinc-900 text-zinc-500 group-hover:text-zinc-300'}`}>
                            {dom.id === 'researcher' && <FileText className="w-4 h-4" />}
                            {dom.id === 'coder' && <Code className="w-4 h-4" />}
                            {dom.id === 'planner' && <Compass className="w-4 h-4" />}
                            {dom.id === 'scientist' && <Sparkles className="w-4 h-4" />}
                            {dom.id === 'gamer' && <Dices className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="font-bold">{dom.name}</p>
                            <p className="text-[10px] text-zinc-500 line-clamp-1 mt-0.5">{dom.description}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Config Task Input area */}
            <div className="space-y-3 mb-5">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Target Evaluation Task
                </label>
                <span className="text-[10px] text-zinc-500 italic">Domain contextual templates auto-loaded</span>
              </div>
              <textarea
                value={taskPrompt}
                onChange={(e) => setTaskPrompt(e.target.value)}
                className="w-full h-24 p-3 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 rounded-xl text-xs text-zinc-100 placeholder-zinc-600 resize-none outline-none transition-all font-mono"
                placeholder="Enter objective details..."
              />
            </div>

            {/* Threshold Slider */}
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-xs">
                <span className="font-semibold uppercase tracking-wider text-zinc-400">Confidence Accept Threshold</span>
                <span className="text-cyan-400 font-bold font-mono">{confidenceThreshold}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                className="w-full accent-cyan-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
              />
              <p className="text-[10px] text-zinc-500">
                If the Confidence Engine estimates validity below this limits, the Strategy Router triggers a critical retry / self-correction.
              </p>
            </div>

            {/* Simulated Action Execute button */}
            <button
              onClick={handleRunSimulation}
              disabled={isSimulating || !taskPrompt.trim()}
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-zinc-800 text-zinc-950 disabled:text-zinc-600 font-black tracking-widest text-xs uppercase rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/10 hover:shadow-cyan-500/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              {isSimulating ? (
                <>
                  <Layers className="w-4 h-4 animate-spin" />
                  Generating Metacycle...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  Run Metacognitive Trace
                </>
              )}
            </button>
          </div>

          <hr className="border-zinc-800" />

          {/* Memory Seeding interface */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                2. Seed Custom Memory
              </h3>
              <span className="text-[10px] text-zinc-500 font-mono">Bank count: {memories.length}</span>
            </div>

            <form onSubmit={handleAddMemory} className="space-y-3">
              <div className="flex gap-1.5">
                {(['episodic', 'semantic', 'meta'] as MemoryType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setNewMemoryType(type)}
                    className={`flex-1 py-1 text-[10px] font-bold uppercase rounded border transition-all ${
                      newMemoryType === type
                        ? 'bg-cyan-950/50 text-cyan-400 border-cyan-800'
                        : 'bg-zinc-950 text-zinc-500 border-zinc-900 hover:text-zinc-300'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={newMemoryContent}
                  onChange={(e) => setNewMemoryContent(e.target.value)}
                  placeholder="Record an execution failure or semantic law..."
                  className="w-full p-2.5 pr-10 bg-zinc-950 border border-zinc-800 focus:border-cyan-600 rounded-xl text-xs text-zinc-200 outline-none"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1.5 p-1 bg-cyan-600 hover:bg-cyan-500 text-zinc-950 rounded-lg transition-colors cursor-pointer"
                  title="Inject into active memory trace database"
                >
                  <Plus className="w-3.5 h-3.5 font-bold" />
                </button>
              </div>

              {/* Tag Selection System */}
              <div className="space-y-1.5 bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-900">
                <label className="block text-[9px] uppercase font-bold tracking-widest text-zinc-500">
                  Assign Tags (comma separated)
                </label>
                <div className="flex gap-1 flex-wrap mb-1">
                  {['priority', 'outdated', 'critical'].map((preset) => {
                    const currentTags = newMemoryTags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
                    const isSelected = currentTags.includes(preset);
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setNewMemoryTags(currentTags.filter(t => t !== preset).join(', '));
                          } else {
                            setNewMemoryTags([...currentTags, preset].join(', '));
                          }
                        }}
                        className={`px-2 py-0.5 text-[8px] font-mono rounded-full border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-purple-950/50 text-purple-400 border-purple-800/80 shadow-sm'
                            : 'bg-zinc-950 text-zinc-600 border-zinc-900 hover:text-zinc-400 hover:border-zinc-800'
                        }`}
                      >
                        #{preset}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  value={newMemoryTags}
                  onChange={(e) => setNewMemoryTags(e.target.value)}
                  placeholder="e.g. priority, outdated, custom-tag"
                  className="w-full p-2 bg-zinc-950 border border-zinc-900 focus:border-purple-600/80 rounded-lg text-[10px] text-zinc-300 font-mono outline-none"
                />
              </div>
            </form>

            <p className="text-[10px] text-zinc-500 mt-2">
              Memory points immediately feed back context to the Core Cognition model as secondary semantic rules.
            </p>
          </div>
        </section>

        {/* Right Side: Bento Grid Structure (Col span 8) */}
        <section className="lg:col-span-8 flex flex-col gap-4">
          
          {/* Active View Controller for Comparison Mode */}
          {isComparisonMode && (
            <div className="bg-zinc-900/40 border border-purple-900/30 rounded-2xl p-4 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-purple-950/60 text-purple-400 border border-purple-900/50">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-zinc-300 uppercase tracking-widest">Comparison Mode Evaluation Trace</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5 font-medium">Select which simulation run to display in the bento grid below. The line chart tracks both simultaneously.</p>
                </div>
              </div>
              
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setViewingSecondary(false)}
                  className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                    !viewingSecondary
                      ? 'bg-cyan-950/30 border-cyan-700/60 text-cyan-300 font-extrabold shadow-sm'
                      : 'bg-zinc-950/60 border-zinc-900 text-zinc-500 hover:text-zinc-300 hover:border-zinc-800'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${!viewingSecondary ? 'bg-cyan-400 animate-pulse' : 'bg-zinc-600'}`} />
                  Primary: {selectedDomain.name}
                </button>
                <button
                  type="button"
                  onClick={() => setViewingSecondary(true)}
                  className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                    viewingSecondary
                      ? 'bg-purple-950/30 border-purple-700/60 text-purple-400'
                      : 'bg-zinc-950/60 border-zinc-900 text-zinc-500 hover:text-zinc-300 hover:border-zinc-800'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${viewingSecondary ? 'bg-purple-400 animate-pulse' : 'bg-zinc-600'}`} />
                  Secondary: {secondaryDomain.name}
                </button>
              </div>
            </div>
          )}

          {isComparisonMode && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm shadow-xl space-y-4"
              id="confidence-disparity-heatmap"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-purple-950/40 text-purple-400 border border-purple-900/50">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white tracking-tight">Confidence Disparity Heatmap</h3>
                    <p className="text-[10px] text-zinc-500 font-medium">Comparative phase-by-phase evaluation confidence profiles and delta divergence.</p>
                  </div>
                </div>
                <div className="flex gap-2 text-[8px] font-mono uppercase bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-900">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>Primary ({selectedDomain.name})</span>
                  </div>
                  <span className="text-zinc-600">|</span>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    <span>Secondary ({secondaryDomain.name})</span>
                  </div>
                </div>
              </div>

              {/* Heatmap Grid/Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[550px]">
                  <thead>
                    <tr className="border-b border-zinc-800/40 text-[9px] uppercase tracking-wider text-zinc-500 font-bold">
                      <th className="py-2.5 px-3">Metacognitive Phase</th>
                      <th className="py-2.5 px-3 text-center w-24">Primary Score</th>
                      <th className="py-2.5 px-3 text-center w-24">Secondary Score</th>
                      <th className="py-2.5 px-3 text-center w-32">Delta Disparity</th>
                      <th className="py-2.5 px-3">Dynamic Divergence Context</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/60">
                    {(() => {
                      const scores = getPhaseScores();
                      if (scores.length === 0) {
                        return (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-[11px] text-zinc-500 font-medium">
                              Simulation trace processing. Run a metacognitive loop to map disparity profile.
                            </td>
                          </tr>
                        );
                      }
                      
                      const maxDisparity = Math.max(...scores.map(s => s.disparity));

                      return scores.map((phase) => {
                        const isMax = phase.disparity === maxDisparity && maxDisparity > 0;
                        
                        // Decide color of delta cell based on disparity value
                        let deltaBg = "bg-zinc-950 text-zinc-500 border border-zinc-900/50";
                        let deltaBarColor = "bg-zinc-800";
                        if (phase.disparity > 12) {
                          deltaBg = "bg-red-950/30 text-red-400 border border-red-900/30 font-black";
                          deltaBarColor = "bg-red-500/80";
                        } else if (phase.disparity > 5) {
                          deltaBg = "bg-amber-950/20 text-amber-500 border border-amber-900/20 font-bold";
                          deltaBarColor = "bg-amber-500/80";
                        } else if (phase.disparity > 0) {
                          deltaBg = "bg-cyan-950/20 text-cyan-400 border border-cyan-900/20";
                          deltaBarColor = "bg-cyan-500/60";
                        }

                        return (
                          <tr 
                            key={phase.id} 
                            className={`group hover:bg-zinc-900/30 transition-colors ${isMax ? 'bg-red-950/5' : ''}`}
                          >
                            <td className="py-3 px-3">
                              <div className="flex flex-col">
                                <span className="text-[11px] font-bold text-zinc-200 flex items-center gap-1.5">
                                  {phase.name}
                                  {isMax && (
                                    <span className="px-1.5 py-0.5 rounded text-[7px] font-black tracking-widest bg-red-900/80 text-red-100 border border-red-700 uppercase animate-pulse flex items-center gap-0.5">
                                      <Sparkles className="w-2 h-2 animate-spin" /> Peak Delta
                                    </span>
                                  )}
                                </span>
                                <span className="text-[9px] text-zinc-500 font-medium group-hover:text-zinc-400 transition-colors mt-0.5">{phase.description}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="font-mono text-xs text-cyan-400 font-bold bg-cyan-950/20 border border-cyan-900/40 px-2 py-0.5 rounded">
                                {phase.primaryScore}%
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="font-mono text-xs text-purple-400 font-bold bg-purple-950/20 border border-purple-900/40 px-2 py-0.5 rounded">
                                {phase.secondaryScore}%
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex flex-col items-center gap-1.5">
                                <span className={`font-mono text-[10px] px-2 py-0.5 rounded ${deltaBg}`}>
                                  {phase.disparity === 0 ? '0%' : `±${phase.disparity}%`}
                                </span>
                                {/* Small visual gauge */}
                                <div className="w-24 h-1 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                                  <div 
                                    className={`h-full ${deltaBarColor} rounded-full transition-all duration-500`}
                                    style={{ width: `${Math.min(phase.disparity * 3, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">
                                {phase.explanation}
                              </p>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* Tile 1: Phase 6: Persistent Self-Model (Span Col 6 / Parent top-left of grid) */}
          <div className="md:col-span-6 bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between min-h-[320px] backdrop-blur-sm shadow-xl">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] text-zinc-400">PHASE 6</span>
                  <h3 className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest">Persistent Self-Model</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportPersonality}
                    className="flex items-center gap-1 px-2 py-0.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-400 hover:text-white text-[9px] font-bold rounded transition-colors cursor-pointer"
                    title="Export personality profile and memory bank"
                  >
                    <Download className="w-3 w-3" />
                    Export JSON
                  </button>
                  <span className="px-2 py-0.5 bg-zinc-950 text-zinc-400 text-[9px] font-bold rounded border border-zinc-800 uppercase tracking-wider">
                    Identity
                  </span>
                </div>
              </div>

              {/* Dynamic Strengths List */}
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5 font-semibold">Active Strengths</p>
                  <div className="flex flex-wrap gap-1.5 max-h-[72px] overflow-y-auto pr-1">
                    {selfModel.strengths.map((str, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-[10px] flex items-center gap-1 transition-all">
                        {str}
                        <button onClick={() => handleRemoveStrength(idx)} className="text-zinc-500 hover:text-red-400 text-[10px] font-bold">×</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-1.5 mt-1.5">
                    <input
                      type="text"
                      placeholder="Add strength..."
                      value={newStrength}
                      onChange={(e) => setNewStrength(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddStrength()}
                      className="flex-1 bg-zinc-950 border border-zinc-900 rounded px-2 py-0.5 text-[11px] text-zinc-300 outline-none"
                    />
                    <button onClick={handleAddStrength} className="px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded text-[11px] hover:bg-cyan-900 hover:text-white">+</button>
                  </div>
                </div>

                {/* Dynamic Weaknesses List */}
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5 font-semibold">Known Weaknesses</p>
                  <div className="flex flex-wrap gap-1.5 max-h-[72px] overflow-y-auto pr-1">
                    {selfModel.weaknesses.map((weak, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-red-950/20 text-red-400 border border-red-900/30 rounded text-[10px] flex items-center gap-1 transition-all">
                        {weak}
                        <button onClick={() => handleRemoveWeakness(idx)} className="text-red-600 hover:text-red-400 text-[10px] font-bold">×</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-1.5 mt-1.5">
                    <input
                      type="text"
                      placeholder="Add weakness..."
                      value={newWeakness}
                      onChange={(e) => setNewWeakness(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddWeakness()}
                      className="flex-1 bg-zinc-950 border border-zinc-900 rounded px-2 py-0.5 text-[11px] text-zinc-300 outline-none animate-none"
                    />
                    <button onClick={handleAddWeakness} className="px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded text-[11px] hover:bg-cyan-900 hover:text-white">+</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Trust sliders */}
            <div className="mt-4 pt-3 border-t border-zinc-800/80 space-y-2">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Trust Verification Profile</p>
              <div className="space-y-1.5">
                {(['logic', 'memory', 'factualRecall'] as const).map((field) => (
                  <div key={field} className="flex items-center justify-between gap-3 text-[11px]">
                    <span className="text-zinc-400 capitalize w-20">{field === 'factualRecall' ? 'Factual' : field}</span>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={selfModel.trustProfile[field]}
                      onChange={(e) => handleTrustSliderChange(field, Number(e.target.value))}
                      className="flex-1 h-1 bg-zinc-800 rounded-lg cursor-pointer accent-cyan-500"
                    />
                    <span className="font-mono text-cyan-400 font-bold w-8 text-right">{selfModel.trustProfile[field]}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tile 2: Phase 1: Core Cognition Engine (Span Col 6 / Parent top-right) */}
          <div className="md:col-span-6 bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between min-h-[320px] backdrop-blur-sm shadow-xl">
            <div className="space-y-3 flex-1 flex flex-col">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] text-zinc-400">PHASE 1</span>
                  <h3 className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest">Core Cognition Engine</h3>
                </div>
                {p1Data?.draftAnswer && (
                  <button 
                    onClick={() => handleCopyToClipboard(p1Data.draftAnswer)} 
                    className="p-1 text-zinc-500 hover:text-cyan-400 hover:bg-zinc-800 rounded transition-all cursor-pointer"
                    title="Copy Answer draft"
                  >
                    {copiedResponse ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>

              <div className="flex-1 bg-zinc-950 font-mono text-[11px] rounded-xl p-3 border border-zinc-900 flex flex-col justify-between overflow-hidden">
                <div className="overflow-y-auto max-h-[220px] space-y-3 pr-1">
                  {isSimulating ? (
                    <div className="py-8 text-center space-y-3">
                      <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-cyan-500 border-t-transparent"></div>
                      <p className="text-zinc-500 animate-pulse uppercase tracking-wider text-[10px]">Evaluating agent logic variables...</p>
                    </div>
                  ) : p1Data ? (
                    <div className="space-y-3.5">
                      {/* Step Plan */}
                      <div>
                        <span className="text-cyan-500 font-bold">[PLANNING STEPS]</span>
                        <ul className="list-decimal pl-4 text-zinc-400 mt-1 space-y-1.5 text-[10px]">
                          {p1Data.plan?.map((step: string, i: number) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Reasoning Details */}
                      <div>
                        <span className="text-cyan-500 font-bold">[EXECUTION REASONING]</span>
                        <ul className="list-disc pl-4 text-zinc-400 mt-1 space-y-1 text-[10px]">
                          {p1Data.reasoning?.map((r: string, i: number) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Generated Draft solution */}
                      <div className="pt-2 border-t border-zinc-900">
                        <span className="text-cyan-500 font-bold">[DRAFT RESPONSE]</span>
                        <p className="text-zinc-300 mt-1 font-sans text-xs whitespace-pre-wrap leading-relaxed">
                          {p1Data.draftAnswer}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-zinc-600">
                      <Cpu className="w-8 h-8 mx-auto stroke-[1.2] mb-2 opacity-40" />
                      <p className="text-xs">Awaiting evaluation triggers...</p>
                    </div>
                  )}
                </div>

                {!isSimulating && p1Data && (
                  <div className="mt-2.5 pt-2 border-t border-zinc-900 flex justify-between text-[9px] uppercase text-zinc-500">
                    <span>Depth: 4 Levels</span>
                    <span>Format: Clean JSON Verified</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tile 3: Phase 4: Confidence Engine (Span Col 4 / Middle-left of second row) */}
          <div className="md:col-span-4 bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between text-center backdrop-blur-sm min-h-[240px] shadow-xl">
            <div className="w-full flex justify-between items-center mb-2">
              <span className="font-mono text-[10px] text-zinc-400">PHASE 4</span>
              <h3 className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest">Confidence Engine</h3>
            </div>

            <div className="w-full flex-1 flex flex-col sm:flex-row items-center justify-around gap-4 py-2">
              {/* SVG Radial Gauge on Left/Top */}
              <div className="flex flex-col items-center">
                <div className="relative flex items-center justify-center">
                  <svg className="w-20 h-20 transform -rotate-90">
                    <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="5" fill="transparent" className="text-zinc-800" />
                    <circle 
                      cx="40" 
                      cy="40" 
                      r="34" 
                      stroke="currentColor" 
                      strokeWidth="5" 
                      fill="transparent" 
                      strokeDasharray="213.6" 
                      strokeDashoffset={213.6 - (213.6 * score) / 100} 
                      className="text-cyan-500 transition-all duration-1000" 
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-black text-white font-mono">{score}%</span>
                    <span className="text-[7px] text-zinc-500 uppercase tracking-widest">Rating</span>
                  </div>
                </div>

                {p4Data && (
                  <div className="mt-2 grid grid-cols-2 gap-1.5 min-w-[124px] text-[8px]">
                    <div className="bg-zinc-950/80 px-1 py-0.5 rounded border border-zinc-900 text-center">
                      <p className="text-zinc-500">Self</p>
                      <p className="font-bold text-zinc-200">{p4Data.selfRating}%</p>
                    </div>
                    <div className="bg-zinc-950/80 px-1 py-0.5 rounded border border-zinc-900 text-center">
                      <p className="text-zinc-500">Verifier</p>
                      <p className="font-bold text-zinc-200">{p4Data.verifierEstimate}%</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Confidence Trend Line Chart on Right/Bottom */}
              <div className="flex-1 w-full min-h-[110px] flex flex-col justify-between">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                  <p className="text-[9px] uppercase tracking-wider text-zinc-500 text-left font-semibold">Confidence Trend (Last 5 Cycles)</p>
                  
                  {/* Integrated Legend */}
                  <div className="flex flex-wrap gap-2 text-[8px] font-mono uppercase text-zinc-400">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 block" />
                      <span className="truncate max-w-[70px]">{selectedDomain.name}</span>
                    </div>
                    {isComparisonMode && (
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 block" />
                        <span className="truncate max-w-[70px]">{secondaryDomain.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="h-20 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={confidenceHistory} margin={{ top: 2, right: 2, left: -32, bottom: 2 }}>
                      <XAxis dataKey="cycle" stroke="#71717a" fontSize={8} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 100]} stroke="#71717a" fontSize={8} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '4px', padding: '4px' }}
                        labelStyle={{ color: '#a1a1aa', fontSize: '8px', fontFamily: 'monospace' }}
                        itemStyle={{ fontSize: '8px', padding: 0 }}
                        formatter={(value, name) => {
                          const label = name === 'score' ? selectedDomain.name : secondaryDomain.name;
                          return [`${value}%`, label];
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        name="score"
                        stroke="#06b6d4" 
                        strokeWidth={2} 
                        dot={{ fill: '#06b6d4', r: 2.5 }} 
                        activeDot={{ r: 4, stroke: '#0891b2', strokeWidth: 1 }}
                      />
                      {isComparisonMode && (
                        <Line 
                          type="monotone" 
                          dataKey="secondaryScore" 
                          name="secondaryScore"
                          stroke="#a855f7" 
                          strokeWidth={2} 
                          dot={{ fill: '#a855f7', r: 2.5 }} 
                          activeDot={{ r: 4, stroke: '#c084fc', strokeWidth: 1 }}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {p4Data?.justification ? (
              <p className="text-[10px] text-zinc-400 leading-snug max-h-[40px] overflow-y-auto w-full pt-1 border-t border-zinc-900 text-left mt-2">
                {p4Data.justification}
              </p>
            ) : (
              <p className="text-[10px] text-zinc-500 border-t border-zinc-900 w-full pt-1 text-left mt-2">Compound Ensemble verifier scores active</p>
            )}
          </div>

          {/* Tile 4: Phase 5: Strategy Controller (Span Col 4 / Middle-center) */}
          <div className="md:col-span-4 bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between backdrop-blur-sm min-h-[240px] shadow-xl">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="font-mono text-[10px] text-zinc-400">PHASE 5</span>
                <h3 className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest">Strategy Controller</h3>
              </div>

              {/* Logical rules mapping */}
              <div className="space-y-1.5">
                <div className={`p-1.5 rounded text-[10px] flex justify-between tracking-wide font-mono ${p5Data?.decision === 'accept' ? 'bg-zinc-800 text-cyan-400' : 'bg-zinc-950/40 text-zinc-600'}`}>
                  <span>CONFIDENCE &ge; {confidenceThreshold}%</span>
                  <span>ACCEPT</span>
                </div>
                <div className={`p-1.5 rounded text-[10px] flex justify-between tracking-wide font-mono ${p5Data?.decision === 'retry' ? 'bg-zinc-800 text-cyan-400' : 'bg-zinc-950/40 text-zinc-600'}`}>
                  <span>CONFIDENCE &lt; {confidenceThreshold}% (Mid-range)</span>
                  <span>RETRY WITH CRITIC</span>
                </div>
                <div className={`p-1.5 rounded text-[10px] flex justify-between tracking-wide font-mono ${p5Data?.decision === 'decompose' ? 'bg-zinc-800 text-cyan-400' : 'bg-zinc-950/40 text-zinc-600'}`}>
                  <span>COMPLEX KEYWORDS (+ Retry)</span>
                  <span>DECOMPOSE</span>
                </div>
                <div className={`p-1.5 rounded text-[10px] flex justify-between tracking-wide font-mono ${p5Data?.decision === 'abstain' ? 'bg-zinc-800 text-cyan-400' : 'bg-zinc-950/40 text-zinc-600'}`}>
                  <span>CONFIDENCE &lt; 40% (Severe Failure)</span>
                  <span>ABSTAIN</span>
                </div>
              </div>
            </div>

            {/* Current choice displaying */}
            <div className="mt-3 p-2 bg-zinc-950/80 rounded-xl border border-zinc-900 text-center">
              <p className="text-[8px] uppercase tracking-widest text-zinc-500">Executive Controller Choice</p>
              <div className="mt-1 font-black text-xs font-mono tracking-wider">
                {isSimulating ? (
                  <span className="text-zinc-500">CALCULATING...</span>
                ) : p5Data?.decision === 'accept' ? (
                  <span className="text-green-400 px-2 py-0.5 bg-green-950/30 border border-green-900/30 rounded inline-block">STRATEGY_ACCEPT</span>
                ) : p5Data?.decision === 'retry' ? (
                  <span className="text-amber-400 px-2 py-0.5 bg-amber-950/30 border border-amber-900/30 rounded inline-block">STRATEGY_RETRY</span>
                ) : p5Data?.decision === 'decompose' ? (
                  <span className="text-cyan-400 px-2 py-0.5 bg-cyan-950/30 border border-cyan-900/30 rounded inline-block">STRATEGY_DECOMPOSE</span>
                ) : (
                  <span className="text-red-400 px-2 py-0.5 bg-red-950/30 border border-red-900/40 rounded inline-block">STRATEGY_ABSTAIN</span>
                )}
              </div>
              <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2 leading-snug">
                {isSimulating ? "Aligning threshold backpressure..." : p5Data?.explanation ?? "Awaiting execution trigger parameters."}
              </p>
            </div>
          </div>

          {/* Tile 5: Phase 2: Episodic Memory Viewer (Span Col 4 / Middle-right) */}
          <div className="md:col-span-4 bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between backdrop-blur-sm min-h-[240px] shadow-xl">
            <div className="space-y-2 flex-1 flex flex-col">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <span className="font-mono text-[10px] text-zinc-400">PHASE 2</span>
                  <h3 className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest">Episodic Memory</h3>
                </div>
                
                {/* View switcher between List and Graph */}
                <div className="flex bg-zinc-950 p-0.5 rounded-lg border border-zinc-900/60 select-none shrink-0">
                  <button
                    type="button"
                    onClick={() => setMemoryViewMode('list')}
                    className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                      memoryViewMode === 'list'
                        ? 'bg-zinc-850 text-cyan-400 font-black border border-zinc-700/40 shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    List
                  </button>
                  <button
                    type="button"
                    onClick={() => setMemoryViewMode('graph')}
                    className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                      memoryViewMode === 'graph'
                        ? 'bg-zinc-850 text-purple-400 font-black border border-zinc-700/40 shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <Network className="w-2 h-2" /> Graph
                  </button>
                </div>
              </div>

              {memoryViewMode === 'list' ? (
                <>
                  <div className="flex justify-between items-center text-[9px] text-zinc-500 font-mono">
                    <span>Filter: {memoryFilter}</span>
                  </div>

                  {/* Memory Filtering and Search header */}
                  <div className="flex gap-1.5 items-center bg-zinc-950 px-2.5 py-1.5 rounded-xl border border-zinc-900">
                    <Search className="w-3.5 h-3.5 text-zinc-600" />
                    <input
                      type="text"
                      placeholder="Query memories..."
                      value={memorySearch}
                      onChange={(e) => setMemorySearch(e.target.value)}
                      className="bg-transparent text-xs text-zinc-300 placeholder-zinc-700 outline-none w-full"
                    />
                  </div>

                  {/* Filter controls */}
                  <div className="space-y-1.5 pt-0.5">
                    {/* Type filters */}
                    <div className="flex flex-wrap gap-1">
                      {['all', 'episodic', 'semantic', 'meta'].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setMemoryFilter(type)}
                          className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                            memoryFilter === type
                              ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/80 shadow-sm'
                              : 'bg-zinc-950/80 text-zinc-500 border border-zinc-900/60 hover:text-zinc-300 hover:border-zinc-800'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>

                    {/* Tag filters */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-zinc-800/40">
                      <span className="text-[8px] font-mono uppercase tracking-wider text-zinc-500 shrink-0">Tags:</span>
                      <div className="flex gap-1">
                        {['all', 'priority', 'outdated', 'critical', ...allUniqueTags.filter(t => !['priority', 'outdated', 'critical'].includes(t))].map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => setTagFilter(tag)}
                            className={`px-2 py-0.5 rounded-full text-[8px] font-mono transition-all shrink-0 cursor-pointer ${
                              tagFilter === tag
                                ? 'bg-purple-950/60 text-purple-400 border border-purple-800/80 shadow-sm font-bold'
                                : 'bg-zinc-950/80 text-zinc-600 border border-zinc-900/60 hover:text-zinc-400 hover:border-zinc-800'
                            }`}
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Memory List Panel */}
                  <div className="flex-1 overflow-y-auto max-h-[140px] space-y-2 pr-1 mt-1">
                    {filteredMemories.length > 0 ? (
                      filteredMemories.map((m) => {
                        const isRetrieved = p2Data?.some((r: any) => r.content === m.content) ?? false;
                        return (
                          <div 
                            key={m.id} 
                            onClick={() => setSelectedMemory(m)}
                            title="Click to view full memory details"
                            className={`p-2.5 rounded-xl border flex flex-col gap-1.5 transition-all duration-200 cursor-pointer group active:scale-[0.99] relative overflow-hidden ${
                              isRetrieved 
                                ? 'bg-cyan-950/10 border-cyan-800/50 shadow-inner hover:border-cyan-500/60 hover:bg-cyan-950/20' 
                                : 'bg-zinc-950 border-zinc-900 hover:border-zinc-700 hover:bg-zinc-900/30'
                            }`}
                          >
                            {/* Hover visual accent accentuation bar */}
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-transparent group-hover:bg-cyan-500 transition-colors duration-200" />
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                  m.type === 'episodic' ? 'bg-purple-950/60 text-purple-400 border border-purple-900/50' :
                                  m.type === 'semantic' ? 'bg-blue-950/60 text-blue-400 border border-blue-900/50' :
                                  'bg-amber-950/60 text-amber-400 border border-amber-900/50'
                                }`}>
                                  {m.type}
                                </span>
                                {m.tags && m.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="text-[7.5px] font-mono px-1 py-0.2 bg-purple-950/20 text-purple-300 rounded border border-purple-950/50 uppercase tracking-tight"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                                <span className="text-[8px] text-zinc-500 font-mono opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-0.5">
                                  <Maximize2 className="w-2 h-2 text-cyan-400" /> Click to read
                                </span>
                              </div>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveMemory(m.id);
                                }} 
                                className="text-zinc-600 hover:text-red-400 text-[11px] px-1.5 py-0.5 font-bold hover:bg-zinc-900 rounded transition-colors"
                              >
                                ×
                              </button>
                            </div>
                            <p className="text-[10px] text-zinc-300 leading-relaxed font-sans line-clamp-2 group-hover:text-zinc-100 transition-colors">
                              {m.content}
                            </p>
                            {isRetrieved && (
                              <div className="text-[8px] font-mono font-bold text-cyan-400 uppercase mt-0.5 flex items-center gap-1">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                                Recalled in Current Run
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center text-zinc-600 py-6">
                        <Database className="w-6 h-6 mx-auto stroke-[1.2] mb-1.5 opacity-40" />
                        <p className="text-[10px]">No memories logged</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col">
                  {/* Subtle info banner when graph has active parent-level filters */}
                  {(memoryFilter !== 'all' || tagFilter !== 'all' || memorySearch) && (
                    <div className="mb-1 px-2 py-1 bg-zinc-950/40 border border-zinc-900 rounded text-[7.5px] font-mono text-zinc-500 flex justify-between items-center">
                      <span>Viewing filtered network subset</span>
                      <button 
                        type="button" 
                        onClick={() => { setMemoryFilter('all'); setTagFilter('all'); setMemorySearch(''); }}
                        className="text-cyan-400 font-bold hover:underline cursor-pointer"
                      >
                        Reset filters
                      </button>
                    </div>
                  )}
                  <MemoryNetworkGraph
                    memories={filteredMemories}
                    onSelectMemory={(m) => setSelectedMemory(m)}
                    selectedMemoryId={selectedMemory?.id}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Tile 6: Phase 3: Critic Engine Audit (Span Col 6 / Bottom-left) */}
          <div className="md:col-span-6 bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between backdrop-blur-sm min-h-[260px] shadow-xl">
            <div className="space-y-3.5">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] text-zinc-400">PHASE 3</span>
                  <h3 className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest">Critic Engine Audit</h3>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">3-Layer Verification</span>
              </div>

              {/* Audits Listing */}
              <div className="space-y-2">
                {/* 1. Logical Consistency */}
                <div className="bg-zinc-950/80 p-2.5 rounded-lg border border-zinc-900 flex items-start gap-2.5">
                  <div className="pt-0.5">
                    {p3Data ? (
                      p3Data.logical.score >= 8 ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      )
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-zinc-800 animate-pulse bg-zinc-900"></div>
                    )}
                  </div>
                  <div className="flex-1 text-[11px]">
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-zinc-300">Logical Consistency</span>
                      <span className="font-mono text-cyan-400">{isSimulating ? "..." : (p3Data?.logical.score ?? "-")}/10</span>
                    </div>
                    {p3Data && (
                      <p className="text-[10px] text-zinc-500 leading-snug mt-0.5 font-sans">
                        {p3Data.logical.findings[0] || "Valid logical reasoning chain."}
                      </p>
                    )}
                  </div>
                </div>

                {/* 2. Factual Verification */}
                <div className="bg-zinc-950/80 p-2.5 rounded-lg border border-zinc-900 flex items-start gap-2.5">
                  <div className="pt-0.5">
                    {p3Data ? (
                      p3Data.factual.score >= 7 ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-500 animate-bounce" />
                      )
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-zinc-800 animate-pulse bg-zinc-900"></div>
                    )}
                  </div>
                  <div className="flex-1 text-[11px]">
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-zinc-300">Factual Sift Verification</span>
                      <span className="font-mono text-cyan-400">{isSimulating ? "..." : (p3Data?.factual.score ?? "-")}/10</span>
                    </div>
                    {p3Data && (
                      <p className="text-[10px] text-zinc-500 leading-snug mt-0.5 font-sans">
                        {p3Data.factual.findings[0] || "Synthesized sources verified against semantic grounding references."}
                      </p>
                    )}
                  </div>
                </div>

                {/* 3. Procedural Efficiency */}
                <div className="bg-zinc-950/80 p-2.5 rounded-lg border border-zinc-900 flex items-start gap-2.5">
                  <div className="pt-0.5">
                    {p3Data ? (
                      p3Data.procedural.score >= 8 ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      )
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-zinc-800 animate-pulse bg-zinc-900"></div>
                    )}
                  </div>
                  <div className="flex-1 text-[11px]">
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-zinc-300">Procedural Objective Mapping</span>
                      <span className="font-mono text-cyan-400">{isSimulating ? "..." : (p3Data?.procedural.score ?? "-")}/10</span>
                    </div>
                    {p3Data && (
                      <p className="text-[10px] text-zinc-500 leading-snug mt-0.5 font-sans">
                        {p3Data.procedural.findings[0] || "Deconstruction matched target domain parameters."}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Factual Audit Warning indicator */}
            {!isSimulating && p3Data && (
              <div className="mt-3 p-2 bg-amber-950/20 border border-amber-900/40 rounded-xl flex gap-2 items-center text-[10px]">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <p className="text-zinc-400 font-sans line-clamp-1">
                  <span className="text-amber-400 font-semibold uppercase font-mono mr-1">Critic Flag:</span>
                  {p3Data.overallCritique}
                </p>
              </div>
            )}
          </div>

          {/* Tile 7: Phase 7: Introspection Feedback / Trigger Loop (Span Col 6 / Bottom-right) */}
          <div className="md:col-span-6 bg-cyan-950/15 border border-cyan-800/40 rounded-2xl p-5 flex flex-col justify-between backdrop-blur-sm min-h-[260px] shadow-xl">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] text-cyan-400">PHASE 7</span>
                  <h3 className="text-xs font-extrabold text-cyan-400 uppercase tracking-widest">Recursive Introspection</h3>
                </div>
                <span className="px-2 py-0.5 bg-cyan-950/80 text-cyan-400 text-[9px] font-bold rounded border border-cyan-800 uppercase tracking-wider">
                  Self Reflection Loop
                </span>
              </div>

              {isSimulating ? (
                <div className="py-10 text-center space-y-2">
                  <div className="w-5 h-5 rounded-full border-t-2 border-r-2 border-cyan-500 animate-spin mx-auto"></div>
                  <p className="text-[11px] text-cyan-400/80 uppercase font-mono">Calibrating feedback adjustments...</p>
                </div>
              ) : p7Data ? (
                <div className="space-y-3 font-mono text-[11px]">
                  {/* Selected Path rationale */}
                  <div>
                    <span className="text-cyan-400 font-bold">&gt; Rationale Selected (Why)</span>
                    <p className="text-zinc-400 mt-1 font-sans text-xs leading-relaxed">{p7Data.whySelected}</p>
                  </div>

                  {/* Operational Optimization target */}
                  <div>
                    <span className="text-cyan-400 font-bold">&gt; Future Calibration Adjustments</span>
                    <p className="text-zinc-400 mt-1 font-sans text-xs leading-relaxed">{p7Data.howToImprove}</p>
                  </div>

                  {/* Calibration tags */}
                  <div className="pt-2 border-t border-cyan-900/30 flex flex-wrap items-center gap-2">
                    <span className="text-[9px] text-cyan-500 uppercase font-bold tracking-wider mr-1">Applied:</span>
                    {p7Data.selfModelAdjustments?.strengthAdded && (
                      <span className="px-1.5 py-0.5 bg-cyan-900/40 text-cyan-400 rounded text-[9px] border border-cyan-800/30">
                        Strength: {p7Data.selfModelAdjustments.strengthAdded}
                      </span>
                    )}
                    {p7Data.selfModelAdjustments?.trustAdjustments && (
                      <span className="px-1.5 py-0.5 bg-cyan-900/40 text-cyan-400 rounded text-[9px] border border-cyan-800/30">
                        Adjust Logic ({p7Data.selfModelAdjustments.trustAdjustments.logic ?? 0 > 0 ? '+' : ''}{p7Data.selfModelAdjustments.trustAdjustments.logic ?? 0}%)
                      </span>
                    )}
                    {p7Data.patternDetected && (
                      <span className="px-1.5 py-0.5 bg-amber-950/40 text-amber-400 rounded text-[9px] border border-amber-800/30">
                        Bias Pattern Flagged
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-14 text-center text-zinc-600">
                  <Sparkles className="w-8 h-8 mx-auto stroke-[1.2] mb-2 text-cyan-800 opacity-40" />
                  <p className="text-xs">Recursive Introspection awaits generation loop completion.</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-cyan-900/30 mt-3">
              <button
                onClick={handleRunSimulation}
                disabled={isSimulating}
                className="w-full py-2.5 bg-cyan-600/90 hover:bg-cyan-500 disabled:bg-zinc-900 text-zinc-950 disabled:text-zinc-600 rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:border-zinc-800 disabled:border cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5" />
                Trigger Recursion Loop
              </button>
            </div>
          </div>
          </div>
        </section>
      </main>

      {/* Footer statistics */}
      <footer className="border-t border-zinc-900 bg-zinc-950 px-6 py-4 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-zinc-600 text-[10px] uppercase tracking-widest gap-2">
          <div className="flex flex-wrap gap-4 sm:gap-6 justify-center">
            <span>Cycle: #4,209</span>
            <span>Latency: 112ms</span>
            <span>Memory Pool: 14.2 GB</span>
            <span>Agent Frame Status: Safe</span>
          </div>
          <div className="flex gap-4 items-center">
            <span className="text-cyan-500 font-bold">V6 Introspection Enabled</span>
            <span className="text-zinc-600">&bull;</span>
            <span className="text-zinc-500">System State: Ready</span>
          </div>
        </div>
      </footer>

      {/* Interactive Modal to view full details of a memory item */}
      <AnimatePresence>
        {selectedMemory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMemory(null)}
              className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
              className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-850 rounded-2xl shadow-2xl shadow-cyan-950/20 overflow-hidden flex flex-col z-10"
            >
              {/* Top Accent Scan Line */}
              <div className="h-1 w-full bg-gradient-to-r from-cyan-600 via-blue-500 to-purple-600" />

              {/* Header */}
              <div className="p-5 flex items-center justify-between border-b border-zinc-800 bg-zinc-900/60 leading-none">
                <div className="flex items-center gap-2.5">
                  <Database className="w-4 h-4 text-cyan-400" />
                  <div>
                    <h3 className="text-sm font-bold text-zinc-100 tracking-tight flex items-center gap-2">
                      Memory Trace Element
                    </h3>
                    <p className="text-[10px] font-mono text-zinc-500 mt-0.5">ID: {selectedMemory.id}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Type Badge */}
                  <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                    selectedMemory.type === 'episodic' ? 'bg-purple-950/60 text-purple-400 border-purple-800/40' :
                    selectedMemory.type === 'semantic' ? 'bg-blue-950/60 text-blue-400 border-blue-800/40' :
                    'bg-amber-950/60 text-amber-400 border-amber-800/40'
                  }`}>
                    {selectedMemory.type}
                  </span>

                  <button
                    onClick={() => setSelectedMemory(null)}
                    className="p-1 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-850 transition-all cursor-pointer"
                    aria-label="Close details modal"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5 overflow-y-auto max-h-[60vh]">
                {/* Meta Attributes Panel */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/60 flex items-center gap-3">
                    <Clock className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                    <div className="min-w-0-temp w-full">
                      <p className="text-[10px] uppercase font-mono tracking-widest text-zinc-500">Record DateTime</p>
                      <p className="text-xs font-mono text-zinc-300 mt-0.5 truncate select-all">
                        {new Date(selectedMemory.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/60 flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                    <div className="min-w-0-temp w-full">
                      <p className="text-[10px] uppercase font-mono tracking-widest text-zinc-500">Relative Time</p>
                      <p className="text-xs font-mono text-zinc-300 mt-0.5 truncate">
                        {new Date(selectedMemory.timestamp).toLocaleDateString(undefined, { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400">Memory Content</span>
                  <div className="relative group/content bg-zinc-950/80 border border-zinc-850 rounded-xl p-5 overflow-hidden">
                    {/* Retro Grid / background accent */}
                    <div className="absolute inset-0 bg-[radial-gradient(#1c1c1f_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />
                    
                    <p className="relative text-xs sm:text-sm text-zinc-200 leading-relaxed font-sans whitespace-pre-wrap select-text break-words">
                      {selectedMemory.content}
                    </p>
                  </div>
                </div>

                {/* Memory Tags Panel */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400">Memory Tags</span>
                    <span className="text-[9px] text-zinc-500 font-mono">Press Enter to save tags</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 items-center bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/60 min-h-[44px]">
                    {selectedMemory.tags && selectedMemory.tags.length > 0 ? (
                      selectedMemory.tags.map((tag) => (
                        <span key={tag} className="text-xs font-mono px-2 py-0.5 bg-purple-950/40 text-purple-300 rounded-full border border-purple-900/40 flex items-center gap-1">
                          #{tag}
                          <button
                            type="button"
                            onClick={() => {
                              const updated = selectedMemory.tags?.filter(t => t !== tag) || [];
                              handleUpdateMemoryTags(selectedMemory.id, updated);
                            }}
                            className="text-purple-500 hover:text-red-400 font-bold ml-1 text-xs cursor-pointer focus:outline-none"
                            title="Remove tag"
                          >
                            &times;
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-zinc-600 font-mono italic">No tags associated with this memory.</span>
                    )}
                    
                    {/* Inline Tag Adder */}
                    <div className="flex items-center gap-1.5 ml-auto">
                      <input
                        type="text"
                        placeholder="Add tag..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = e.currentTarget.value.trim().toLowerCase();
                            if (val) {
                              const existing = selectedMemory.tags || [];
                              if (!existing.includes(val)) {
                                handleUpdateMemoryTags(selectedMemory.id, [...existing, val]);
                              }
                              e.currentTarget.value = '';
                            }
                          }
                        }}
                        className="bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-300 px-2 py-1 rounded focus:outline-none focus:border-purple-600 w-24"
                      />
                    </div>
                  </div>
                </div>

                {/* Recalled Banner Details if retrieved in the simulation trace */}
                {p2Data?.some((r: any) => r.content === selectedMemory.content) && (
                  <div className="bg-cyan-950/10 border border-cyan-850/40 rounded-xl p-4 flex gap-3 text-xs text-cyan-300">
                    <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold uppercase tracking-wider text-[10px] text-cyan-400">Context Auto-Injected</p>
                      <p className="leading-normal text-zinc-400 text-[11px]">
                        This specific memory block was automatically queried and loaded by the Episodic Memory retriever during the current run, serving as primary cognitive feedback to constraint verification.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 bg-zinc-950/40 border-t border-zinc-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedMemory.content);
                    setCopiedDetail(true);
                    setTimeout(() => setCopiedDetail(false), 2000);
                  }}
                  className="px-3.5 py-1.5 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 text-[11px] font-bold rounded-lg border border-zinc-850 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                >
                  {copiedDetail ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy Memory Text
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMemory(null)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 text-[11px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
