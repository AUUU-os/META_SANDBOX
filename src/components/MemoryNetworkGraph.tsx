import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Memory } from '../types';
import { Network, ZoomIn, ZoomOut, RefreshCw, Layers } from 'lucide-react';

interface GNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: string;
  tags: string[];
  content: string;
}

interface GLink {
  source: string | GNode;
  target: string | GNode;
  sharedTags: string[];
  sharedKeywords?: string[];
  value: number;
  reason: 'tag' | 'source' | 'semantic';
}

interface MemoryNetworkGraphProps {
  memories: Memory[];
  onSelectMemory: (memory: Memory) => void;
  selectedMemoryId?: string;
}

export const MemoryNetworkGraph: React.FC<MemoryNetworkGraphProps> = ({
  memories,
  onSelectMemory,
  selectedMemoryId
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 300, height: 200 });
  const [hoveredNode, setHoveredNode] = useState<GNode | null>(null);
  const [hoveredLink, setHoveredLink] = useState<GLink | null>(null);
  const [activeRelationType, setActiveRelationType] = useState<'all' | 'tag' | 'source' | 'semantic'>('all');
  const [simulationIteration, setSimulationIteration] = useState(0);

  // Resize handler
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({
        width: Math.max(width, 200),
        height: Math.max(height, 180)
      });
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Compute graph data
  const { nodes, links } = useMemo(() => {
    // Clone memories to avoid mutating original list
    const nodesList: GNode[] = memories.map(m => ({
      id: m.id,
      label: m.content.substring(0, 35) + (m.content.length > 35 ? '...' : ''),
      type: m.type,
      tags: m.tags || [],
      content: m.content
    }));

    const linksList: GLink[] = [];
    const stopWords = new Set([
      'the', 'a', 'and', 'or', 'to', 'of', 'in', 'is', 'for', 'with', 'by', 'on', 'at', 'from', 'an', 'this', 'that', 'it', 'not', 'but', 'as', 'are', 'be', 'was', 'were', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'can', 'could', 'should', 'would', 'i', 'my', 'we', 'our', 'you', 'your', 'they', 'their', 'he', 'she', 'it', 'them', 'him', 'her', 'how', 'why', 'what', 'who', 'which', 'where', 'when', 'there', 'their'
    ]);

    // Tokenize text to extract key terms
    const getKeywords = (text: string) => {
      return new Set(
        text.toLowerCase()
          .replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, ' ')
          .split(/\s+/)
          .filter(w => w.length > 3 && !stopWords.has(w))
      );
    };

    const keywordsMap = new Map<string, Set<string>>();
    memories.forEach(m => {
      keywordsMap.set(m.id, getKeywords(m.content));
    });

    for (let i = 0; i < memories.length; i++) {
      for (let j = i + 1; j < memories.length; j++) {
        const m1 = memories[i];
        const m2 = memories[j];
        
        const sharedTags = (m1.tags || []).filter(t => (m2.tags || []).includes(t));
        const m1Keywords = keywordsMap.get(m1.id) || new Set();
        const m2Keywords = keywordsMap.get(m2.id) || new Set();
        const sharedKeywords = Array.from(m1Keywords).filter(k => m2Keywords.has(k));

        let value = 0;
        let reason: 'tag' | 'source' | 'semantic' | null = null;

        if (m1.sourceTaskId && m2.sourceTaskId && m1.sourceTaskId === m2.sourceTaskId) {
          value = 3;
          reason = 'source';
        } else if (sharedTags.length > 0) {
          value = 2 + sharedTags.length;
          reason = 'tag';
        } else if (sharedKeywords.length >= 1) {
          // Weight semantic links based on keywords match
          value = 1 + Math.min(sharedKeywords.length * 0.5, 2);
          reason = 'semantic';
        }

        if (reason) {
          linksList.push({
            source: m1.id,
            target: m2.id,
            sharedTags,
            sharedKeywords: sharedKeywords.slice(0, 3),
            value,
            reason
          });
        }
      }
    }

    // Filter links based on active tab filtering
    const filteredLinks = linksList.filter(l => activeRelationType === 'all' || l.reason === activeRelationType);

    return { nodes: nodesList, links: filteredLinks };
  }, [memories, activeRelationType]);

  // Handle D3 Force Directed Graph Simulation
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clean container

    // Base SVG setup
    const { width, height } = dimensions;
    const gContainer = svg.append('g').attr('class', 'graph-container');

    // Zoom setup
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on('zoom', (event) => {
        gContainer.attr('transform', event.transform);
      });

    svg.call(zoom);
    zoomBehaviorRef.current = zoom;

    // Define marker symbols for directional flows if any, or custom gradients
    const defs = svg.append('defs');
    
    // Gradients for node effects
    const radGradient = defs.append('radialGradient')
      .attr('id', 'selected-glow')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%');
    radGradient.append('stop').attr('offset', '0%').attr('stop-color', '#06b6d4').attr('stop-opacity', '0.4');
    radGradient.append('stop').attr('offset', '100%').attr('stop-color', '#06b6d4').attr('stop-opacity', '0');

    // Create D3 Force Layout
    const simulation = d3.forceSimulation<GNode>(nodes)
      .force('link', d3.forceLink<GNode, GLink>(links)
        .id(d => d.id)
        .distance((d) => {
          if (d.reason === 'source') return 55;
          if (d.reason === 'tag') return 75;
          return 100; // Semantic
        })
        .strength((d) => d.reason === 'source' ? 0.8 : d.reason === 'tag' ? 0.6 : 0.3)
      )
      .force('charge', d3.forceManyBody().strength(-120).distanceMax(250))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(22));

    // Render lines (links)
    const link = gContainer.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', (d: any) => {
        if (d.reason === 'source') return '#06b6d4'; // cyan
        if (d.reason === 'tag') return '#a855f7'; // purple
        return '#3f3f46'; // zinc-700
      })
      .attr('stroke-opacity', (d: any) => {
        if (d.reason === 'source') return 0.65;
        if (d.reason === 'tag') return 0.5;
        return 0.35;
      })
      .attr('stroke-width', (d: any) => Math.min(d.value * 1.2, 5))
      .attr('stroke-dasharray', (d: any) => d.reason === 'semantic' ? '3,3' : 'none')
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d: any) {
        d3.select(this).attr('stroke-opacity', 0.95).attr('stroke-width', Math.min(d.value * 1.2, 5) + 1.5);
        setHoveredLink(d);
      })
      .on('mouseout', function(event, d: any) {
        d3.select(this)
          .attr('stroke-opacity', d.reason === 'source' ? 0.65 : d.reason === 'tag' ? 0.5 : 0.35)
          .attr('stroke-width', Math.min(d.value * 1.2, 5));
        setHoveredLink(null);
      });

    // Render nodes (groups)
    const node = gContainer.append('g')
      .attr('class', 'nodes')
      .selectAll('g.node-group')
      .data(nodes)
      .enter().append('g')
      .attr('class', 'node-group')
      .style('cursor', 'pointer')
      .on('mouseover', (event, d: any) => {
        setHoveredNode(d);
        // Highlight neighbors
        const neighborIds = new Set<string>();
        links.forEach((l: any) => {
          const sourceId = typeof l.source === 'object' ? (l.source as GNode).id : l.source;
          const targetId = typeof l.target === 'object' ? (l.target as GNode).id : l.target;
          if (sourceId === d.id) neighborIds.add(targetId);
          if (targetId === d.id) neighborIds.add(sourceId);
        });

        node.style('opacity', (n: any) => n.id === d.id || neighborIds.has(n.id) ? 1.0 : 0.25);
        link.style('opacity', (l: any) => {
          const sourceId = typeof l.source === 'object' ? (l.source as GNode).id : l.source;
          const targetId = typeof l.target === 'object' ? (l.target as GNode).id : l.target;
          return sourceId === d.id || targetId === d.id ? 0.9 : 0.15;
        });
      })
      .on('mouseout', () => {
        setHoveredNode(null);
        node.style('opacity', 1.0);
        link.style('opacity', 1.0);
      })
      .on('click', (event, d: any) => {
        const originalMemory = memories.find(m => m.id === d.id);
        if (originalMemory) {
          onSelectMemory(originalMemory);
        }
      })
      .call(d3.drag<SVGGElement, GNode>()
        .on('start', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0.2).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d: any) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      );

    // Selected glow background circle
    node.filter((d: any) => d.id === selectedMemoryId)
      .append('circle')
      .attr('r', 18)
      .attr('fill', 'url(#selected-glow)');

    // Inner circle core
    node.append('circle')
      .attr('r', (d: any) => d.id === selectedMemoryId ? 8.5 : 6)
      .attr('fill', (d: any) => {
        if (d.type === 'episodic') return '#c084fc'; // purple
        if (d.type === 'semantic') return '#60a5fa'; // blue
        return '#fbbf24'; // amber
      })
      .attr('stroke', (d: any) => d.id === selectedMemoryId ? '#06b6d4' : '#18181b')
      .attr('stroke-width', (d: any) => d.id === selectedMemoryId ? 2 : 1.2)
      .attr('class', 'node-circle transition-all duration-200')
      .style('filter', (d: any) => d.id === selectedMemoryId ? 'drop-shadow(0 0 4px rgba(6, 182, 212, 0.6))' : 'none');

    // Outer ring for tags density indicator
    node.filter((d: any) => d.tags.length > 0)
      .append('circle')
      .attr('r', (d: any) => d.id === selectedMemoryId ? 12 : 9.5)
      .attr('fill', 'none')
      .attr('stroke', '#a855f7')
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2,2');

    // Labels
    node.append('text')
      .attr('dx', 12)
      .attr('dy', '.31em')
      .attr('fill', (d: any) => d.id === selectedMemoryId ? '#e2e8f0' : '#a1a1aa')
      .style('font-size', '8px')
      .style('font-family', 'var(--font-mono, monospace)')
      .style('font-weight', (d: any) => d.id === selectedMemoryId ? 'bold' : 'normal')
      .style('pointer-events', 'none')
      .text((d: any) => d.label);

    // Run ticks
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => (d.source as GNode).x ?? 0)
        .attr('y1', (d: any) => (d.source as GNode).y ?? 0)
        .attr('x2', (d: any) => (d.target as GNode).x ?? 0)
        .attr('y2', (d: any) => (d.target as GNode).y ?? 0);

      node.attr('transform', (d: any) => `translate(${d.x ?? 0}, ${d.y ?? 0})`);
    });

    // Re-adjust camera placement once simulation converges
    setTimeout(() => {
      if (!svgRef.current || !zoomBehaviorRef.current) return;
      
      const bounds = gContainer.node()?.getBBox();
      if (!bounds || bounds.width === 0 || bounds.height === 0) return;

      const fullWidth = width;
      const fullHeight = height;
      const midX = bounds.x + bounds.width / 2;
      const midY = bounds.y + bounds.height / 2;

      const scale = Math.max(0.4, Math.min(1.1, 0.85 / Math.max(bounds.width / fullWidth, bounds.height / fullHeight)));
      const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];

      svg.transition()
        .duration(650)
        .call(
          zoomBehaviorRef.current.transform,
          d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
        );
    }, 400);

    return () => {
      simulation.stop();
    };
  }, [nodes, links, dimensions, selectedMemoryId, memories]);

  const handleZoomIn = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(250).call(zoomBehaviorRef.current.scaleBy, 1.3);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(250).call(zoomBehaviorRef.current.scaleBy, 0.7);
    }
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const { width, height } = dimensions;
    d3.select(svgRef.current).transition().duration(350).call(
      zoomBehaviorRef.current.transform,
      d3.zoomIdentity.translate(0, 0).scale(1)
    );
    setSimulationIteration(prev => prev + 1); // Triggers simulation center realignment
  };

  return (
    <div className="flex-1 flex flex-col min-h-[220px] relative select-none">
      
      {/* Category filters */}
      <div className="flex bg-zinc-950/80 p-0.5 rounded-lg border border-zinc-900/60 items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 pl-2">
          <Layers className="w-3 h-3 text-zinc-500" />
          <span className="text-[8px] font-mono uppercase font-black text-zinc-500 tracking-wide">Mapping:</span>
        </div>
        <div className="flex gap-1">
          {[
            { id: 'all', label: 'All links' },
            { id: 'tag', label: 'Tag matches' },
            { id: 'source', label: 'Source matching' },
            { id: 'semantic', label: 'Semantics' }
          ].map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setActiveRelationType(type.id as any)}
              className={`px-1.5 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                activeRelationType === type.id
                  ? 'bg-purple-950/40 text-purple-300 border border-purple-900/40 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main SVG workspace */}
      <div 
        ref={containerRef} 
        className="flex-1 min-h-[160px] max-h-[260px] bg-zinc-950/50 rounded-xl border border-zinc-900/80 relative overflow-hidden"
      >
        {nodes.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <Network className="w-8 h-8 text-zinc-700 animate-pulse mb-1.5" />
            <span className="text-[10px] font-mono text-zinc-600">No matching connections in current scope.</span>
          </div>
        ) : (
          <svg 
            ref={svgRef} 
            width={dimensions.width} 
            height={dimensions.height} 
            className="w-full h-full block"
          />
        )}

        {/* Dynamic Tooltip */}
        {hoveredNode && (
          <div className="absolute top-2 left-2 z-10 p-2.5 max-w-[200px] bg-zinc-950/95 border border-zinc-800 rounded-lg shadow-2xl backdrop-blur-sm pointer-events-none text-left">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span className={`text-[7px] font-black uppercase tracking-wider px-1 py-0.2 rounded ${
                hoveredNode.type === 'episodic' ? 'bg-purple-950/60 text-purple-400 border border-purple-900/50' :
                hoveredNode.type === 'semantic' ? 'bg-blue-950/60 text-blue-400 border border-blue-900/50' :
                'bg-amber-950/60 text-amber-400 border border-amber-900/50'
              }`}>
                {hoveredNode.type}
              </span>
              {hoveredNode.tags.map(t => (
                <span key={t} className="text-[7px] font-mono text-purple-300 bg-purple-950/40 px-1 rounded uppercase">#{t}</span>
              ))}
            </div>
            <p className="text-[9px] font-mono text-zinc-300 leading-relaxed font-semibold line-clamp-3">
              {hoveredNode.content}
            </p>
            <p className="text-[7.5px] text-zinc-500 font-mono mt-1">Click node to inspect node logs</p>
          </div>
        )}

        {hoveredLink && (
          <div className="absolute bottom-2 left-2 z-10 p-2 max-w-[180px] bg-zinc-950/95 border border-zinc-800 rounded-lg shadow-2xl backdrop-blur-sm pointer-events-none text-left font-mono">
            <p className="text-[7.5px] uppercase text-zinc-500 font-bold mb-0.5">Relation Connection</p>
            <div className="text-[9px] text-zinc-300 font-medium leading-tight">
              {hoveredLink.reason === 'source' && (
                <span className="text-cyan-400 font-bold">Same Source Task Context</span>
              )}
              {hoveredLink.reason === 'tag' && (
                <div>
                  <span className="text-purple-400 font-bold">Shared Memory Tags:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {hoveredLink.sharedTags.map(t => (
                      <span key={t} className="text-[7px] bg-purple-950/50 text-purple-300 px-1 rounded border border-purple-900/30">#{t}</span>
                    ))}
                  </div>
                </div>
              )}
              {hoveredLink.reason === 'semantic' && (
                <div>
                  <span className="text-zinc-400 font-bold">Semantic Overlap:</span>
                  <div className="text-[8px] text-zinc-500 mt-0.5 italic">
                    Keywords: {hoveredLink.sharedKeywords?.join(', ')}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Zoom & Reset Control Bar overlay */}
        <div className="absolute bottom-2 right-2 flex gap-1 z-10">
          <button 
            type="button"
            onClick={handleZoomIn}
            className="p-1 rounded bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 text-zinc-400 hover:text-cyan-400 transition-all cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
          <button 
            type="button"
            onClick={handleZoomOut}
            className="p-1 rounded bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 text-zinc-400 hover:text-cyan-400 transition-all cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <button 
            type="button"
            onClick={handleResetZoom}
            className="p-1 rounded bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 text-zinc-400 hover:text-cyan-400 transition-all cursor-pointer"
            title="Reset view"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Small Legend */}
      <div className="flex gap-2.5 justify-center items-center mt-2 text-[7.5px] font-mono uppercase text-zinc-500">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block" />
          <span>Episodic</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
          <span>Semantic</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
          <span>Meta</span>
        </div>
        <div className="flex items-center gap-1 border-l border-zinc-800 pl-2">
          <span className="w-2.5 h-0.5 bg-cyan-500 inline-block" />
          <span>Task Src</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-0.5 bg-purple-500 inline-block" />
          <span>Tag Match</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-0.5 bg-zinc-700 border-t border-dashed inline-block" />
          <span>Semantic Link</span>
        </div>
      </div>
    </div>
  );
};
