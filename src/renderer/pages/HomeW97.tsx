import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Monitor,
  FolderOpen,
  FileText,
  CheckSquare,
  Settings,
  Play,
  LogOut,
  X,
  Minimize2,
  Maximize2,
  Folder,
  User,
  Search,
  Database,
  Network,
  HelpCircle,
  Clock,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { getCanvasList, CanvasInfo } from '../features/Canvas/canvasStorage';
import { getTasksData, TaskData } from '../features/Tasks/Tasks/tasksStorage';
import styles from './HomeW97.module.css';
import logoImg from '../logo.png';

// ─── TYPES FOR RETRO WINDOW SYSTEM ───────────────────
interface RetroWindow {
  id: string;
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

// ─── TYPES FOR NEURAL GRAPH ──────────────────────────
interface GraphNode {
  id: string;
  label: string;
  type: 'canvas' | 'task' | 'profile' | 'document';
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  originalObject: any;
}

interface GraphLink {
  source: string;
  target: string;
  reason: string;
}

// ─── MOCK TEXT FILES FOR RELATIONSHIPS ───────────────
const MOCK_DOCUMENTS = [
  {
    id: 'doc-1',
    name: 'AxeVault_Arquitetura.txt',
    type: 'document',
    content: 'O AxeVault é um navegador multi-profile projetado para automação e segurança. O núcleo utiliza Chromium modificado e gerencia impressões digitais (fingerprint) para evitar bloqueios. Conectado ao banco de dados Supabase.',
    tags: ['arquitetura', 'segurança', 'supabase'],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5
  },
  {
    id: 'doc-2',
    name: 'Seguranca_Privacidade.txt',
    type: 'document',
    content: 'As diretrizes de segurança do AxeVault incluem rotação de proxies (HTTP, SOCKS5), limpeza de cookies e criptografia de senhas locais. O módulo MetaClean ajuda a limpar dados de rastreamento de metadados de arquivos.',
    tags: ['segurança', 'privacidade', 'metaclean', 'proxies'],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3
  },
  {
    id: 'doc-3',
    name: 'Ideias_Campanha_Marketing.txt',
    type: 'document',
    content: 'Ideias de marketing: Focar em agências de tráfego pago, automação de tarefas repetitivas e facilidade de gerenciar múltiplos perfis de redes sociais (Facebook, Instagram, Google) sem sofrer shadowban.',
    tags: ['marketing', 'redes-sociais', 'automação'],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 1
  }
];

export const HomeW97: React.FC = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { currentWorkspace } = useWorkspace();

  // ─── STATE FOR SYSTEM BOOT SCREEN ────────────────────
  const [booting, setBooting] = useState(true);
  const [bootProgress, setBootProgress] = useState(0);
  const [bootLogs, setBootLogs] = useState<string[]>([]);

  // ─── WINDOW STATE ────────────────────────────────────
  const [windows, setWindows] = useState<Record<string, RetroWindow>>({
    documents: {
      id: 'documents',
      title: 'Meus Documentos',
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      x: 80,
      y: 60,
      width: 480,
      height: 340,
      zIndex: 10
    },
    neuralNetwork: {
      id: 'neuralNetwork',
      title: 'Rede Neural de Conexões',
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      x: 120,
      y: 40,
      width: 720,
      height: 500,
      zIndex: 11
    },
    systemAbout: {
      id: 'systemAbout',
      title: 'Sobre o Axe 97',
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      x: 200,
      y: 120,
      width: 380,
      height: 220,
      zIndex: 12
    },
    notes: {
      id: 'notes',
      title: 'Bloco de Notas',
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      x: 150,
      y: 80,
      width: 550,
      height: 400,
      zIndex: 13
    }
  });

  // ─── START MENU & SELECTED ICON STATE ───────────────
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [selectedDesktopIcon, setSelectedDesktopIcon] = useState<string | null>(null);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState('');
  const [maxZIndex, setMaxZIndex] = useState(15);

  // ─── DATA SOURCES FOR NEURAL GRAPH ──────────────────
  const [canvases, setCanvases] = useState<CanvasInfo[]>([]);
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);

  // ─── RETRO NOTES STATE & ACTIONS ─────────────────────
  const [retroNotes, setRetroNotes] = useState<any[]>([]);
  const [activeRetroNoteId, setActiveRetroNoteId] = useState<string>('');

  useEffect(() => {
    if (!booting) {
      const saved = localStorage.getItem('axe_notes_notes');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setRetroNotes(parsed);
          if (parsed.length > 0) {
            setActiveRetroNoteId(parsed[0].id);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [booting]);

  const saveRetroNotes = (updated: any[]) => {
    setRetroNotes(updated);
    localStorage.setItem('axe_notes_notes', JSON.stringify(updated));
  };

  const handleCreateRetroNote = () => {
    const newNote = {
      id: `note-${Date.now()}`,
      spaceId: 'space-2', // Default general space
      title: 'Nova Nota Retro',
      content: 'Digite o conteúdo aqui...',
      isStarred: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const updated = [newNote, ...retroNotes];
    saveRetroNotes(updated);
    setActiveRetroNoteId(newNote.id);
  };

  const handleDeleteRetroNote = () => {
    if (!activeRetroNoteId) return;
    if (confirm('Tem certeza que deseja excluir esta nota?')) {
      const updated = retroNotes.filter(n => n.id !== activeRetroNoteId);
      saveRetroNotes(updated);
      setActiveRetroNoteId(updated.length > 0 ? updated[0].id : '');
    }
  };

  const handleUpdateRetroNoteTitle = (newTitle: string) => {
    const updated = retroNotes.map(n => {
      if (n.id === activeRetroNoteId) {
        return { ...n, title: newTitle, updated_at: new Date().toISOString() };
      }
      return n;
    });
    saveRetroNotes(updated);
  };

  const handleUpdateRetroNoteContent = (newContent: string) => {
    const updated = retroNotes.map(n => {
      if (n.id === activeRetroNoteId) {
        return { ...n, content: newContent, updated_at: new Date().toISOString() };
      }
      return n;
    });
    saveRetroNotes(updated);
  };

  const handleSaveRetroNote = () => {
    alert('Nota salva com sucesso no banco de dados local!');
  };

  // ─── NEURAL GRAPH STATE ──────────────────────────────
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Dragging windows variables
  const dragInfo = useRef<{ windowId: string; startX: number; startY: number; initialX: number; initialY: number } | null>(null);

  // ─── LOAD SYSTEM TIME ────────────────────────────────
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setCurrentTime(
        d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // ─── BOOT BIOS EMULATION ANIMATION ───────────────────
  useEffect(() => {
    const logs = [
      'AxeVault v1.0.0 BIOS v4.97...',
      'CPU: Antigravity Multi-Core 3.5 GHz...',
      'RAM Test: 64MB OK',
      'Detecting Primary Master... Supabase Cloud DB',
      'Detecting Primary Slave... Local Fingerprint Storage',
      'Initializing network adapters... OK',
      'Mounting secure workspaces...',
      'Loading Windows 97 Desktop Theme...',
      'System ready.'
    ];

    let logIndex = 0;
    const logInterval = setInterval(() => {
      if (logIndex < logs.length) {
        setBootLogs(prev => [...prev, logs[logIndex]]);
        logIndex++;
      } else {
        clearInterval(logInterval);
      }
    }, 70);

    const progressInterval = setInterval(() => {
      setBootProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => setBooting(false), 200);
          return 100;
        }
        return prev + 5;
      });
    }, 40);

    return () => {
      clearInterval(logInterval);
      clearInterval(progressInterval);
    };
  }, []);

  // ─── LOAD DATA FOR NEURAL MAP ────────────────────────
  useEffect(() => {
    const loadData = async () => {
      if (currentWorkspace) {
        // Fetch Canvases
        const canvasList = await getCanvasList(currentWorkspace.id);
        setCanvases(canvasList || []);
      }
      
      // Fetch Tasks
      const taskList = getTasksData();
      setTasks(taskList || []);

      // Fetch Profiles
      try {
        if (window.api && window.api.profiles) {
          const result = await window.api.profiles.list();
          if (result.success && Array.isArray(result.data)) {
            setProfiles(result.data);
          }
        }
      } catch (err) {
        console.error('[HomeW97] Error fetching profiles:', err);
      }
    };

    if (!booting) {
      loadData();
    }
  }, [booting, currentWorkspace]);

  // ─── NEURAL GRAPH COMPUTED DATA & FILTERS ────────────
  const [graphFilter, setGraphFilter] = useState<'all' | 'notas' | 'tarefas' | 'perfis'>('all');
  const nodePositionsRef = useRef<Record<string, { x: number; y: number; vx: number; vy: number }>>({});

  const { allNodes, allLinks } = useMemo(() => {
    const newNodes: GraphNode[] = [];
    const newLinks: GraphLink[] = [];

    // Helper to add nodes safely
    const addNode = (id: string, label: string, type: 'canvas' | 'task' | 'profile' | 'document', color: string, original: any) => {
      if (!newNodes.some(n => n.id === id)) {
        const stored = nodePositionsRef.current[id] || {
          x: Math.random() * 500 + 100,
          y: Math.random() * 350 + 50,
          vx: 0,
          vy: 0
        };
        newNodes.push({
          id,
          label,
          type,
          x: stored.x,
          y: stored.y,
          vx: stored.vx,
          vy: stored.vy,
          radius: type === 'document' ? 16 : 14,
          color,
          originalObject: original
        });
      }
    };

    // 1. Add Canvas nodes
    canvases.forEach(c => {
      addNode(c.id, c.name, 'canvas', '#f59e0b', c); // Orange/Amber
    });

    // 2. Add Task nodes
    tasks.forEach(t => {
      addNode(t.id, t.title, 'task', '#3b82f6', t); // Blue
    });

    // 3. Add Profile nodes
    profiles.forEach(p => {
      addNode(p.id, p.name, 'profile', '#8b5cf6', p); // Violet
    });

    // 4. Add Mock Documents
    MOCK_DOCUMENTS.forEach(d => {
      addNode(d.id, d.name, 'document', '#10b981', d); // Emerald
    });

    // 5. Establish Connections
    // Connection type A: Direct link between Tasks and Canvases
    tasks.forEach(t => {
      if (t.linkedCanvasIds && Array.isArray(t.linkedCanvasIds)) {
        t.linkedCanvasIds.forEach(canvasId => {
          if (canvases.some(c => c.id === canvasId)) {
            newLinks.push({
              source: t.id,
              target: canvasId,
              reason: 'Tarefa associada ao Canvas'
            });
          }
        });
      }
    });

    // Connection type B: Shared tags (between canvases, tasks, documents)
    const getTagsOfNode = (node: any, type: string): string[] => {
      if (type === 'canvas' && node.tags) return node.tags;
      if (type === 'task' && node.tags) return node.tags;
      if (type === 'document' && node.tags) return node.tags;
      if (type === 'profile' && node.tags) {
        // Parse tags if string
        if (typeof node.tags === 'string') {
          return node.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
        }
        return Array.isArray(node.tags) ? node.tags : [];
      }
      return [];
    };

    for (let i = 0; i < newNodes.length; i++) {
      const tagsA = getTagsOfNode(newNodes[i].originalObject, newNodes[i].type);
      if (tagsA.length === 0) continue;

      for (let j = i + 1; j < newNodes.length; j++) {
        const tagsB = getTagsOfNode(newNodes[j].originalObject, newNodes[j].type);
        if (tagsB.length === 0) continue;

        // Find common tags
        const common = tagsA.filter(t => tagsB.includes(t));
        if (common.length > 0) {
          newLinks.push({
            source: newNodes[i].id,
            target: newNodes[j].id,
            reason: `Tag em comum: #${common[0]}`
          });
        }
      }
    }

    // Connection type C: Text similarities / Common keywords in titles/contents
    const keywords = ['automação', 'segurança', 'marketing', 'supabase', 'design', 'teste', 'social', 'perfil'];
    newNodes.forEach((nodeA, idxA) => {
      const textA = ((nodeA.label || '') + ' ' + (nodeA.originalObject.description || nodeA.originalObject.content || nodeA.originalObject.notes || '')).toLowerCase();
      
      newNodes.forEach((nodeB, idxB) => {
        if (idxB <= idxA) return;
        const textB = ((nodeB.label || '') + ' ' + (nodeB.originalObject.description || nodeB.originalObject.content || nodeB.originalObject.notes || '')).toLowerCase();

        // Check common keywords
        for (const kw of keywords) {
          if (textA.includes(kw) && textB.includes(kw)) {
            // Check if link already exists
            const exists = newLinks.some(l => 
              (l.source === nodeA.id && l.target === nodeB.id) || 
              (l.source === nodeB.id && l.target === nodeA.id)
            );
            if (!exists) {
              newLinks.push({
                source: nodeA.id,
                target: nodeB.id,
                reason: `Termo em comum: "${kw}"`
              });
            }
            break;
          }
        }
      });
    });

    return { allNodes: newNodes, allLinks: newLinks };
  }, [canvases, tasks, profiles]);

  const { nodes, links } = useMemo(() => {
    let filteredNodes = allNodes;
    if (graphFilter === 'notas') {
      filteredNodes = allNodes.filter(n => n.type === 'canvas' || n.type === 'document');
    } else if (graphFilter === 'tarefas') {
      filteredNodes = allNodes.filter(n => n.type === 'task');
    } else if (graphFilter === 'perfis') {
      filteredNodes = allNodes.filter(n => n.type === 'profile');
    }

    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredLinks = allLinks.filter(l => 
      filteredNodeIds.has(l.source) && filteredNodeIds.has(l.target)
    );

    return { nodes: filteredNodes, links: filteredLinks };
  }, [allNodes, allLinks, graphFilter]);

  // ─── PHYSICS-BASED FORCE DIRECTED GRAPH SIMULATION ───
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const simulationRef = useRef<number | null>(null);
  const dragNodeRef = useRef<GraphNode | null>(null);
  const panRef = useRef({ x: 0, y: 0, zoom: 1 });
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!windows.neuralNetwork.isOpen || windows.neuralNetwork.isMinimized) {
      if (simulationRef.current) {
        cancelAnimationFrame(simulationRef.current);
        simulationRef.current = null;
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.clientWidth;
    let height = canvas.clientHeight;
    canvas.width = width;
    canvas.height = height;

    const resizeObserver = new ResizeObserver(() => {
      if (!canvas) return;
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width;
      canvas.height = height;
    });
    resizeObserver.observe(canvas);

    // Forces Constants
    const kRepel = 600;
    const kAttract = 0.02;
    const restLength = 100;
    const friction = 0.85;
    const kGravity = 0.01;

    const render = () => {
      // ── PHYSICS SIMULATION STEP ──
      // 1. Repulsion force between all node pairs
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 300) {
            const force = kRepel / (dist * dist);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            if (n1 !== dragNodeRef.current) {
              n1.vx += fx;
              n1.vy += fy;
            }
            if (n2 !== dragNodeRef.current) {
              n2.vx -= fx;
              n2.vy -= fy;
            }
          }
        }
      }

      // 2. Attraction force along links
      links.forEach(link => {
        const sourceNode = nodes.find(n => n.id === link.source);
        const targetNode = nodes.find(n => n.id === link.target);
        if (sourceNode && targetNode) {
          const dx = targetNode.x - sourceNode.x;
          const dy = targetNode.y - sourceNode.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = kAttract * (dist - restLength);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          if (sourceNode !== dragNodeRef.current) {
            sourceNode.vx += fx;
            sourceNode.vy += fy;
          }
          if (targetNode !== dragNodeRef.current) {
            targetNode.vx -= fx;
            targetNode.vy -= fy;
          }
        }
      });

      // 3. Gravity pulling nodes towards the center
      const centerX = width / 2;
      const centerY = height / 2;
      nodes.forEach(n => {
        if (n !== dragNodeRef.current) {
          const dx = centerX - n.x;
          const dy = centerY - n.y;
          n.vx += dx * kGravity;
          n.vy += dy * kGravity;

          // Apply velocities and friction
          n.x += n.vx;
          n.y += n.vy;
          n.vx *= friction;
          n.vy *= friction;

          // Clamp inside bounds
          n.x = Math.max(20, Math.min(width - 20, n.x));
          n.y = Math.max(20, Math.min(height - 20, n.y));
        }

        // Persist position
        nodePositionsRef.current[n.id] = { x: n.x, y: n.y, vx: n.vx, vy: n.vy };
      });

      // ── DRAWING GRAPH ──
      ctx.clearRect(0, 0, width, height);

      // Draw background scanlines for sci-fi retro feel
      ctx.fillStyle = '#050508';
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      // Apply Zoom & Pan
      ctx.translate(panRef.current.x, panRef.current.y);
      ctx.scale(panRef.current.zoom, panRef.current.zoom);

      // Draw links/edges
      links.forEach(link => {
        const source = nodes.find(n => n.id === link.source);
        const target = nodes.find(n => n.id === link.target);
        if (source && target) {
          const isHovered = hoveredNodeId === source.id || hoveredNodeId === target.id;
          ctx.beginPath();
          ctx.moveTo(source.x, source.y);
          ctx.lineTo(target.x, target.y);
          
          if (isHovered) {
            ctx.strokeStyle = '#8B5CF6'; // Glow primary
            ctx.lineWidth = 2.0;
          } else {
            ctx.strokeStyle = 'rgba(139, 92, 246, 0.15)';
            ctx.lineWidth = 1.0;
          }
          ctx.stroke();
        }
      });

      // Draw nodes
      nodes.forEach(node => {
        const isSelected = selectedNode?.id === node.id;
        const isHovered = hoveredNodeId === node.id;

        // Node Glow
        if (isSelected || isHovered) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 6, 0, Math.PI * 2);
          ctx.fillStyle = `${node.color}20`;
          ctx.fill();
        }

        // Main Node Circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(255,255,255,0.4)';
        ctx.stroke();

        // Node Label
        ctx.font = isSelected ? 'bold 11px sans-serif' : '10px sans-serif';
        ctx.fillStyle = isSelected ? '#ffffff' : '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y + node.radius + 14);

        // Draw small indicator inside node
        ctx.beginPath();
        ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      });

      ctx.restore();

      simulationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (simulationRef.current) {
        cancelAnimationFrame(simulationRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [nodes, links, hoveredNodeId, selectedNode, windows.neuralNetwork.isOpen, windows.neuralNetwork.isMinimized]);

  // ─── SEARCH IN NEURAL NETWORK ────────────────────────
  const filteredNodes = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return nodes.filter(n => n.label.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm, nodes]);

  // ─── CLICK AND DRAG IN GRAPH ─────────────────────────
  const handleGraphMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Convert mouse coordinates to world coordinates (accounting for zoom & pan)
    const worldX = (clientX - panRef.current.x) / panRef.current.zoom;
    const worldY = (clientY - panRef.current.y) / panRef.current.zoom;

    // Find if clicked a node
    const clickedNode = nodes.find(node => {
      const dx = node.x - worldX;
      const dy = node.y - worldY;
      return Math.sqrt(dx * dx + dy * dy) <= node.radius + 5;
    });

    if (clickedNode) {
      dragNodeRef.current = clickedNode;
      setSelectedNode(clickedNode);
    } else {
      // Start panning background
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX - panRef.current.x, y: e.clientY - panRef.current.y };
    }
  };

  const handleGraphMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const worldX = (clientX - panRef.current.x) / panRef.current.zoom;
    const worldY = (clientY - panRef.current.y) / panRef.current.zoom;

    if (dragNodeRef.current) {
      dragNodeRef.current.x = worldX;
      dragNodeRef.current.y = worldY;
      dragNodeRef.current.vx = 0;
      dragNodeRef.current.vy = 0;
    } else if (isPanningRef.current) {
      panRef.current.x = e.clientX - panStartRef.current.x;
      panRef.current.y = e.clientY - panStartRef.current.y;
    } else {
      // Update hovered node
      const hoverNode = nodes.find(node => {
        const dx = node.x - worldX;
        const dy = node.y - worldY;
        return Math.sqrt(dx * dx + dy * dy) <= node.radius + 5;
      });
      setHoveredNodeId(hoverNode ? hoverNode.id : null);
    }
  };

  const handleGraphMouseUp = () => {
    dragNodeRef.current = null;
    isPanningRef.current = false;
  };

  const handleGraphWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = 1.05;
    if (e.deltaY < 0) {
      panRef.current.zoom = Math.min(panRef.current.zoom * zoomFactor, 3);
    } else {
      panRef.current.zoom = Math.max(panRef.current.zoom / zoomFactor, 0.4);
    }
  };

  // Get nodes connected to currently selected node
  const connectedNodes = useMemo(() => {
    if (!selectedNode) return [];
    return links
      .filter(l => l.source === selectedNode.id || l.target === selectedNode.id)
      .map(l => {
        const neighborId = l.source === selectedNode.id ? l.target : l.source;
        const neighbor = nodes.find(n => n.id === neighborId);
        return {
          node: neighbor,
          reason: l.reason
        };
      })
      .filter(item => item.node !== undefined) as { node: GraphNode; reason: string }[];
  }, [selectedNode, links, nodes]);

  // ─── RETRO WINDOW HELPERS ────────────────────────────
  const openWindow = (id: string) => {
    setWindows(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        isOpen: true,
        isMinimized: false,
        zIndex: maxZIndex + 1
      }
    }));
    setActiveWindowId(id);
    setMaxZIndex(prev => prev + 1);
    setStartMenuOpen(false);
  };

  const closeWindow = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setWindows(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        isOpen: false
      }
    }));
    if (activeWindowId === id) {
      setActiveWindowId(null);
    }
  };

  const minimizeWindow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWindows(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        isMinimized: true
      }
    }));
    if (activeWindowId === id) {
      setActiveWindowId(null);
    }
  };

  const toggleMaximizeWindow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWindows(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        isMaximized: !prev[id].isMaximized
      }
    }));
    focusWindow(id);
  };

  const focusWindow = (id: string) => {
    if (activeWindowId === id) return;
    setWindows(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        isMinimized: false,
        zIndex: maxZIndex + 1
      }
    }));
    setActiveWindowId(id);
    setMaxZIndex(prev => prev + 1);
  };

  // Window Drag Handlers
  const handleWindowMouseDown = (id: string, e: React.MouseEvent) => {
    focusWindow(id);
    const win = windows[id];
    if (win.isMaximized) return;

    dragInfo.current = {
      windowId: id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: win.x,
      initialY: win.y
    };

    document.addEventListener('mousemove', handleWindowMouseMove);
    document.addEventListener('mouseup', handleWindowMouseUp);
  };

  const handleWindowMouseMove = (e: MouseEvent) => {
    if (!dragInfo.current) return;
    const { windowId, startX, startY, initialX, initialY } = dragInfo.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    setWindows(prev => ({
      ...prev,
      [windowId]: {
        ...prev[windowId],
        x: initialX + dx,
        y: initialY + dy
      }
    }));
  };

  const handleWindowMouseUp = () => {
    dragInfo.current = null;
    document.removeEventListener('mousemove', handleWindowMouseMove);
    document.removeEventListener('mouseup', handleWindowMouseUp);
  };

  // Navigates from network nodes to correct views
  const handleVisitNode = (node: GraphNode) => {
    if (node.type === 'canvas') {
      navigate('/canvas');
    } else if (node.type === 'task') {
      navigate('/tasks');
    } else if (node.type === 'profile') {
      navigate('/profiles');
    }
  };

  if (booting) {
    return (
      <div className={styles.biosBoot}>
        <div>
          <h1 style={{ fontSize: '16px', fontWeight: 'bold', color: '#a78bfa' }}>AXE 97 OS — BOOT SYSTEM</h1>
          <div style={{ marginTop: '16px' }}>
            {bootLogs.map((log, i) => (
              <div key={i} style={{ marginBottom: '4px' }}>&gt; {log}</div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div>Carregando arquivos de espaço seguro...</div>
          <div className={styles.biosProgress}>
            <div className={styles.biosProgressBar} style={{ width: `${bootProgress}%` }} />
          </div>
          <div style={{ marginTop: '4px', fontSize: '10px', color: '#94a3b8' }}>Axe Vault Inc. (C) 1997-2026</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.w97Container} onClick={() => {
      setSelectedDesktopIcon(null);
      setStartMenuOpen(false);
    }}>
      
      {/* ─── DESKTOP SHORTCUTS GRID ────────────────────── */}
      <div className={styles.desktopGrid}>
        
        {/* Meu Computador */}
        <div
          className={`${styles.desktopIcon} ${selectedDesktopIcon === 'myComputer' ? styles.desktopIconSelected : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedDesktopIcon('myComputer');
          }}
          onDoubleClick={() => openWindow('systemAbout')}
        >
          <Monitor size={32} strokeWidth={1.5} className="text-blue-200" />
          <span className={styles.iconLabel}>Axe Computador</span>
        </div>

        {/* Meus Documentos */}
        <div
          className={`${styles.desktopIcon} ${selectedDesktopIcon === 'myDocuments' ? styles.desktopIconSelected : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedDesktopIcon('myDocuments');
          }}
          onDoubleClick={() => openWindow('documents')}
        >
          <FolderOpen size={32} strokeWidth={1.5} className="text-yellow-400" />
          <span className={styles.iconLabel}>Documentos & Conexões</span>
        </div>

        {/* Rede Neural */}
        <div
          className={`${styles.desktopIcon} ${selectedDesktopIcon === 'neuralNet' ? styles.desktopIconSelected : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedDesktopIcon('neuralNet');
          }}
          onDoubleClick={() => openWindow('neuralNetwork')}
        >
          <Network size={32} strokeWidth={1.5} className="text-purple-400 animate-pulse-slow" />
          <span className={styles.iconLabel}>Rede Neural</span>
        </div>

        {/* Profiles Shortcut */}
        <div
          className={`${styles.desktopIcon} ${selectedDesktopIcon === 'profiles' ? styles.desktopIconSelected : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedDesktopIcon('profiles');
          }}
          onDoubleClick={() => navigate('/profiles')}
        >
          <User size={32} strokeWidth={1.5} className="text-violet-400" />
          <span className={styles.iconLabel}>Perfis Multi</span>
        </div>

        {/* Canvas Shortcut */}
        <div
          className={`${styles.desktopIcon} ${selectedDesktopIcon === 'canvas' ? styles.desktopIconSelected : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedDesktopIcon('canvas');
          }}
          onDoubleClick={() => navigate('/canvas')}
        >
          <Layers size={32} strokeWidth={1.5} className="text-amber-400" />
          <span className={styles.iconLabel}>Telas Canvas</span>
        </div>

        {/* Tasks Shortcut */}
        <div
          className={`${styles.desktopIcon} ${selectedDesktopIcon === 'tasks' ? styles.desktopIconSelected : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedDesktopIcon('tasks');
          }}
          onDoubleClick={() => navigate('/tasks')}
        >
          <CheckSquare size={32} strokeWidth={1.5} className="text-blue-400" />
          <span className={styles.iconLabel}>Tarefas</span>
        </div>

        {/* DadosClean Shortcut */}
        <div
          className={`${styles.desktopIcon} ${selectedDesktopIcon === 'dadosclean' ? styles.desktopIconSelected : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedDesktopIcon('dadosclean');
          }}
          onDoubleClick={() => navigate('/dadosclean')}
        >
          <Settings size={32} strokeWidth={1.5} className="text-emerald-400" />
          <span className={styles.iconLabel}>MetaClean</span>
        </div>

        {/* Bloco de Notas Shortcut */}
        <div
          className={`${styles.desktopIcon} ${selectedDesktopIcon === 'retroNotes' ? styles.desktopIconSelected : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedDesktopIcon('retroNotes');
          }}
          onDoubleClick={() => openWindow('notes')}
        >
          <FileText size={32} strokeWidth={1.5} className="text-yellow-200" />
          <span className={styles.iconLabel}>Bloco de Notas</span>
        </div>

      </div>

      {/* ─── RETRO WINDOW: ABOUT / MY COMPUTER ─────────── */}
      {windows.systemAbout.isOpen && (
        <div
          className={`${styles.window} ${activeWindowId === 'systemAbout' ? styles.windowActive : ''}`}
          style={{
            left: windows.systemAbout.isMaximized ? 0 : windows.systemAbout.x,
            top: windows.systemAbout.isMaximized ? 0 : windows.systemAbout.y,
            width: windows.systemAbout.isMaximized ? '100%' : windows.systemAbout.width,
            height: windows.systemAbout.isMaximized ? 'calc(100% - 32px)' : windows.systemAbout.height,
            display: windows.systemAbout.isMinimized ? 'none' : 'flex'
          }}
          onClick={() => focusWindow('systemAbout')}
        >
          <div className={`${styles.titleBar} ${activeWindowId !== 'systemAbout' ? styles.titleBarInactive : ''}`} onMouseDown={(e) => handleWindowMouseDown('systemAbout', e)}>
            <div className={styles.titleText}>
              <Monitor size={12} />
              <span>Sobre o Axe 97 OS</span>
            </div>
            <div className={styles.titleControls}>
              <button className={styles.titleButton} onClick={(e) => minimizeWindow('systemAbout', e)}>_</button>
              <button className={styles.titleButton} onClick={(e) => toggleMaximizeWindow('systemAbout', e)}>□</button>
              <button className={styles.titleButton} onClick={(e) => closeWindow('systemAbout', e)}>X</button>
            </div>
          </div>
          <div className={styles.windowBody}>
            <div className="flex gap-4 items-start">
              <img src={logoImg} alt="Axe Logo" className="w-12 h-12 object-contain shrink-0" />
              <div>
                <h2 className="text-sm font-bold">Axe Vault Browser — Space OS 97</h2>
                <div className="text-[10px] text-gray-700 mt-1">Versão 1.0.0 (Build 9726)</div>
                <div className="text-gray-900 mt-3 text-[11px] leading-relaxed">
                  Este sistema emula uma interface clássica para oferecer navegação rápida, segura e visualização holística de conexões de textos, documentos, perfis e tarefas.
                </div>
                <div className="mt-4 text-[10px] text-gray-600">Desenvolvido pela equipe Axe Vault.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── RETRO WINDOW: FILE MANAGER (DOCUMENTS) ─────── */}
      {windows.documents.isOpen && (
        <div
          className={`${styles.window} ${activeWindowId === 'documents' ? styles.windowActive : ''}`}
          style={{
            left: windows.documents.isMaximized ? 0 : windows.documents.x,
            top: windows.documents.isMaximized ? 0 : windows.documents.y,
            width: windows.documents.isMaximized ? '100%' : windows.documents.width,
            height: windows.documents.isMaximized ? 'calc(100% - 32px)' : windows.documents.height,
            display: windows.documents.isMinimized ? 'none' : 'flex'
          }}
          onClick={() => focusWindow('documents')}
        >
          <div className={`${styles.titleBar} ${activeWindowId !== 'documents' ? styles.titleBarInactive : ''}`} onMouseDown={(e) => handleWindowMouseDown('documents', e)}>
            <div className={styles.titleText}>
              <FolderOpen size={12} />
              <span>Documentos e Objetos de Relação</span>
            </div>
            <div className={styles.titleControls}>
              <button className={styles.titleButton} onClick={(e) => minimizeWindow('documents', e)}>_</button>
              <button className={styles.titleButton} onClick={(e) => toggleMaximizeWindow('documents', e)}>□</button>
              <button className={styles.titleButton} onClick={(e) => closeWindow('documents', e)}>X</button>
            </div>
          </div>
          <div className={styles.menuBar}>
            <div className={styles.menuItem}>Arquivo</div>
            <div className={styles.menuItem}>Editar</div>
            <div className={styles.menuItem}>Exibir</div>
            <div className={styles.menuItem}>Ajuda</div>
          </div>
          <div className={`${styles.windowBody} ${styles.inset} !bg-gray-100 overflow-y-auto`}>
            <div className="p-2 grid grid-cols-2 gap-4">
              
              {/* Render User Canvases */}
              {canvases.map(c => (
                <div
                  key={c.id}
                  className="flex items-center gap-2 p-1.5 hover:bg-blue-900 hover:text-white cursor-pointer border border-transparent hover:border-blue-400 rounded"
                  onDoubleClick={() => {
                    openWindow('neuralNetwork');
                    // Find node in graph and select it
                    const node = nodes.find(n => n.id === c.id);
                    if (node) setSelectedNode(node);
                  }}
                >
                  <Layers size={18} className="text-amber-500" />
                  <div className="flex flex-col">
                    <span className="font-bold text-[11px] truncate max-w-[150px]">{c.name}</span>
                    <span className="text-[9px] text-gray-500">Tela de Notas</span>
                  </div>
                </div>
              ))}

              {/* Render User Tasks */}
              {tasks.map(t => (
                <div
                  key={t.id}
                  className="flex items-center gap-2 p-1.5 hover:bg-blue-900 hover:text-white cursor-pointer border border-transparent hover:border-blue-400 rounded"
                  onDoubleClick={() => {
                    openWindow('neuralNetwork');
                    const node = nodes.find(n => n.id === t.id);
                    if (node) setSelectedNode(node);
                  }}
                >
                  <CheckSquare size={18} className="text-blue-500" />
                  <div className="flex flex-col">
                    <span className="font-bold text-[11px] truncate max-w-[150px]">{t.title}</span>
                    <span className="text-[9px] text-gray-500">Tarefa pendente</span>
                  </div>
                </div>
              ))}

              {/* Render User Profiles */}
              {profiles.map(p => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 p-1.5 hover:bg-blue-900 hover:text-white cursor-pointer border border-transparent hover:border-blue-400 rounded"
                  onDoubleClick={() => {
                    openWindow('neuralNetwork');
                    const node = nodes.find(n => n.id === p.id);
                    if (node) setSelectedNode(node);
                  }}
                >
                  <User size={18} className="text-purple-500" />
                  <div className="flex flex-col">
                    <span className="font-bold text-[11px] truncate max-w-[150px]">{p.name}</span>
                    <span className="text-[9px] text-gray-500">Perfil de Navegação</span>
                  </div>
                </div>
              ))}

              {/* Render Mock Documents */}
              {MOCK_DOCUMENTS.map(d => (
                <div
                  key={d.id}
                  className="flex items-center gap-2 p-1.5 hover:bg-blue-900 hover:text-white cursor-pointer border border-transparent hover:border-blue-400 rounded"
                  onDoubleClick={() => {
                    openWindow('neuralNetwork');
                    const node = nodes.find(n => n.id === d.id);
                    if (node) setSelectedNode(node);
                  }}
                >
                  <FileText size={18} className="text-emerald-500" />
                  <div className="flex flex-col">
                    <span className="font-bold text-[11px] truncate max-w-[150px]">{d.name}</span>
                    <span className="text-[9px] text-gray-500">Arquivo de texto</span>
                  </div>
                </div>
              ))}

            </div>
          </div>
        </div>
      )}

      {/* ─── RETRO WINDOW: NEURAL NETWORK GRAPH ────────── */}
      {windows.neuralNetwork.isOpen && (
        <div
          className={`${styles.window} ${activeWindowId === 'neuralNetwork' ? styles.windowActive : ''}`}
          style={{
            left: windows.neuralNetwork.isMaximized ? 0 : windows.neuralNetwork.x,
            top: windows.neuralNetwork.isMaximized ? 0 : windows.neuralNetwork.y,
            width: windows.neuralNetwork.isMaximized ? '100%' : windows.neuralNetwork.width,
            height: windows.neuralNetwork.isMaximized ? 'calc(100% - 32px)' : windows.neuralNetwork.height,
            display: windows.neuralNetwork.isMinimized ? 'none' : 'flex'
          }}
          onClick={() => focusWindow('neuralNetwork')}
        >
          <div className={`${styles.titleBar} ${activeWindowId !== 'neuralNetwork' ? styles.titleBarInactive : ''}`} onMouseDown={(e) => handleWindowMouseDown('neuralNetwork', e)}>
            <div className={styles.titleText}>
              <Network size={12} />
              <span>Rede de Conexões de Arquivos e Textos Comuns</span>
            </div>
            <div className={styles.titleControls}>
              <button className={styles.titleButton} onClick={(e) => minimizeWindow('neuralNetwork', e)}>_</button>
              <button className={styles.titleButton} onClick={(e) => toggleMaximizeWindow('neuralNetwork', e)}>□</button>
              <button className={styles.titleButton} onClick={(e) => closeWindow('neuralNetwork', e)}>X</button>
            </div>
          </div>
          <div className={styles.menuBar}>
            <div className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-gray-400" onClick={e => e.stopPropagation()}>
              <Search size={10} className="text-gray-500" />
              <input
                type="text"
                placeholder="Buscar nó..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-transparent border-none text-[10px] outline-none w-28 text-black"
              />
            </div>
            {searchTerm.trim() && filteredNodes.length > 0 && (
              <div className="absolute top-[48px] left-[6px] bg-white border border-gray-400 w-36 shadow-lg z-50 max-h-40 overflow-y-auto" onClick={e => e.stopPropagation()}>
                {filteredNodes.map(fn => (
                  <div
                    key={fn.id}
                    className="p-1 hover:bg-blue-900 hover:text-white cursor-pointer text-[10px]"
                    onClick={() => {
                      setSelectedNode(fn);
                      setSearchTerm('');
                    }}
                  >
                    {fn.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Windows 97 style tab navigation bar */}
          <div className={styles.tabContainer} onClick={e => e.stopPropagation()}>
            <button
              className={`${styles.tab} ${graphFilter === 'all' ? styles.tabActive : ''}`}
              onClick={() => {
                setGraphFilter('all');
                setSelectedNode(null);
              }}
            >
              <span>Todos</span>
            </button>
            <button
              className={`${styles.tab} ${graphFilter === 'notas' ? styles.tabActive : ''}`}
              onClick={() => {
                setGraphFilter('notas');
                setSelectedNode(null);
              }}
            >
              <span>Canvas & Documentos (Notas)</span>
            </button>
            <button
              className={`${styles.tab} ${graphFilter === 'tarefas' ? styles.tabActive : ''}`}
              onClick={() => {
                setGraphFilter('tarefas');
                setSelectedNode(null);
              }}
            >
              <span>Tarefas</span>
            </button>
            <button
              className={`${styles.tab} ${graphFilter === 'perfis' ? styles.tabActive : ''}`}
              onClick={() => {
                setGraphFilter('perfis');
                setSelectedNode(null);
              }}
            >
              <span>Perfis / Objetos</span>
            </button>
          </div>
          
          <div className={styles.windowBody} style={{ padding: 0, position: 'relative' }}>
            <div className={styles.graphContainer}>
              <canvas
                ref={canvasRef}
                className={styles.graphCanvas}
                onMouseDown={handleGraphMouseDown}
                onMouseMove={handleGraphMouseMove}
                onMouseUp={handleGraphMouseUp}
                onMouseLeave={handleGraphMouseUp}
                onWheel={handleGraphWheel}
              />

              {/* Node Details Panel (Win97 sidebar) */}
              {selectedNode && (
                <div className={`${styles.nodePanel} ${styles.outset}`}>
                  <div className={`${styles.titleBar} justify-between px-2 py-1`}>
                    <span className="font-bold text-[10px]">Detalhes do Objeto</span>
                    <button onClick={() => setSelectedNode(null)} className="text-white hover:text-red-300 font-bold">X</button>
                  </div>
                  <div className="p-3 overflow-y-auto flex-1 flex flex-col gap-2">
                    <div className="flex items-center gap-1.5">
                      {selectedNode.type === 'canvas' && <Layers size={14} className="text-amber-500" />}
                      {selectedNode.type === 'task' && <CheckSquare size={14} className="text-blue-500" />}
                      {selectedNode.type === 'profile' && <User size={14} className="text-purple-500" />}
                      {selectedNode.type === 'document' && <FileText size={14} className="text-emerald-500" />}
                      <span className="font-bold text-gray-900 break-all">{selectedNode.label}</span>
                    </div>

                    <div className="text-[10px] text-gray-600">
                      Tipo: <span className="font-semibold text-gray-800 uppercase">{selectedNode.type}</span>
                    </div>

                    {/* Excerpt / Contents */}
                    <div className={`${styles.inset} p-2 bg-gray-50 text-[10px] text-gray-800 max-h-24 overflow-y-auto leading-relaxed border border-gray-400`}>
                      {selectedNode.originalObject.content || 
                       selectedNode.originalObject.description || 
                       selectedNode.originalObject.notes || 
                       'Nenhuma descrição ou texto detalhado disponível para este objeto.'}
                    </div>

                    {/* Relations / Neighbors list */}
                    {connectedNodes.length > 0 && (
                      <div className="mt-2">
                        <span className="font-semibold text-gray-700 block mb-1">Relações Neurais ({connectedNodes.length}):</span>
                        <div className="flex flex-col gap-1 max-h-24 overflow-y-auto">
                          {connectedNodes.map(item => (
                            <div
                              key={item.node?.id}
                              onClick={() => setSelectedNode(item.node || null)}
                              className="p-1 hover:bg-gray-200 cursor-pointer rounded border border-gray-300 bg-gray-100 flex flex-col"
                            >
                              <span className="font-bold text-[9px] text-gray-800 truncate">{item.node?.label}</span>
                              <span className="text-[8px] text-purple-600">{item.reason}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-auto pt-2 flex gap-2">
                      {selectedNode.type !== 'document' && (
                        <button
                          onClick={() => handleVisitNode(selectedNode)}
                          className={`${styles.outset} px-3 py-1 text-[10px] font-bold w-full hover:bg-gray-100`}
                        >
                          Visitar Workspace
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── RETRO WINDOW: NOTES / NOTEPAD ─────────────── */}
      {windows.notes.isOpen && (
        <div
          className={`${styles.window} ${activeWindowId === 'notes' ? styles.windowActive : ''}`}
          style={{
            left: windows.notes.isMaximized ? 0 : windows.notes.x,
            top: windows.notes.isMaximized ? 0 : windows.notes.y,
            width: windows.notes.isMaximized ? '100%' : windows.notes.width,
            height: windows.notes.isMaximized ? 'calc(100% - 32px)' : windows.notes.height,
            display: windows.notes.isMinimized ? 'none' : 'flex'
          }}
          onClick={() => focusWindow('notes')}
        >
          <div className={`${styles.titleBar} ${activeWindowId !== 'notes' ? styles.titleBarInactive : ''}`} onMouseDown={(e) => handleWindowMouseDown('notes', e)}>
            <div className={styles.titleText}>
              <FileText size={12} />
              <span>Bloco de Notas - Axe 97</span>
            </div>
            <div className={styles.titleControls}>
              <button className={styles.titleButton} onClick={(e) => minimizeWindow('notes', e)}>_</button>
              <button className={styles.titleButton} onClick={(e) => toggleMaximizeWindow('notes', e)}>□</button>
              <button className={styles.titleButton} onClick={(e) => closeWindow('notes', e)}>X</button>
            </div>
          </div>
          <div className={styles.menuBar}>
            <div className={styles.menuItem} onClick={handleCreateRetroNote}>Novo</div>
            <div className={styles.menuItem} onClick={handleDeleteRetroNote}>Excluir</div>
            <div className={styles.menuItem} onClick={handleSaveRetroNote}>Salvar</div>
          </div>
          <div className={`${styles.windowBody} ${styles.inset} !bg-white overflow-hidden flex flex-row`} style={{ padding: 0 }}>
            {/* Notes List Sidebar */}
            <div className="w-1/3 border-r border-gray-400 bg-gray-200 flex flex-col p-1 gap-1">
              <div className="text-[10px] font-bold text-gray-700 px-1 py-0.5 border-b border-gray-300">Minhas Notas:</div>
              <div className="flex-1 overflow-y-auto flex flex-col gap-0.5">
                {retroNotes.map(rn => (
                  <div
                    key={rn.id}
                    onClick={() => setActiveRetroNoteId(rn.id)}
                    className={`p-1 text-[11px] cursor-pointer truncate ${activeRetroNoteId === rn.id ? 'bg-blue-900 text-white' : 'text-black hover:bg-gray-300'}`}
                  >
                    📝 {rn.title || 'Sem Título'}
                  </div>
                ))}
                {retroNotes.length === 0 && (
                  <div className="text-[10px] text-gray-500 p-2 italic">Nenhuma nota.</div>
                )}
              </div>
            </div>

            {/* Note Editor Area */}
            <div className="w-2/3 flex flex-col bg-white">
              {activeRetroNoteId && retroNotes.find(n => n.id === activeRetroNoteId) ? (
                <div className="flex-1 flex flex-col p-2 gap-2 h-full">
                  <input
                    type="text"
                    value={retroNotes.find(n => n.id === activeRetroNoteId).title || ''}
                    onChange={(e) => handleUpdateRetroNoteTitle(e.target.value)}
                    className="border border-gray-400 p-1 text-xs text-black font-semibold bg-gray-50 focus:outline-none"
                    placeholder="Título da nota..."
                  />
                  <textarea
                    value={retroNotes.find(n => n.id === activeRetroNoteId).content || ''}
                    onChange={(e) => handleUpdateRetroNoteContent(e.target.value)}
                    className="flex-1 border border-gray-400 p-1.5 text-xs text-black font-mono resize-none focus:outline-none"
                    placeholder="Comece a digitar aqui..."
                  />
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center p-4">
                  <div className="text-gray-500 text-xs">Selecione uma nota ou clique em Novo para começar.</div>
                </div>
              )}
            </div>
          </div>
          {/* Status Bar */}
          <div className="bg-gray-200 text-[10px] px-2 py-0.5 border-t border-gray-400 text-gray-600 flex justify-between">
            <span>Total de notas: {retroNotes.length}</span>
            <span>Axe Vault 97</span>
          </div>
        </div>
      )}

      {/* ─── SYSTEM TASKBAR ────────────────────────────── */}
      <div className={`${styles.taskbar} ${styles.outset}`}>
        
        {/* Iniciar Button */}
        <button
          className={`${styles.startButton} ${styles.outset} ${startMenuOpen ? styles.startButtonActive : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setStartMenuOpen(!startMenuOpen);
          }}
        >
          <div className="w-4 h-4 rounded bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
            <span className="text-white font-extrabold text-[8px]">A</span>
          </div>
          <span>Iniciar</span>
        </button>

        {/* Opened Windows Tabs */}
        <div className={styles.taskbarTabs}>
          {Object.values(windows).map(win => {
            if (!win.isOpen) return null;
            const isActive = activeWindowId === win.id && !win.isMinimized;
            return (
              <button
                key={win.id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isActive) {
                    minimizeWindow(win.id, e);
                  } else {
                    focusWindow(win.id);
                  }
                }}
                className={`${styles.taskbarTab} ${styles.outset} ${isActive ? styles.taskbarTabActive : ''}`}
              >
                {win.id === 'neuralNetwork' && <Network size={12} className="text-purple-600" />}
                {win.id === 'documents' && <FolderOpen size={12} className="text-yellow-600" />}
                {win.id === 'systemAbout' && <Monitor size={12} className="text-blue-600" />}
                {win.id === 'notes' && <FileText size={12} className="text-yellow-600" />}
                <span>{win.title}</span>
              </button>
            );
          })}
        </div>

        {/* Tray / Clock */}
        <div className={`${styles.tray} ${styles.inset}`}>
          <Clock size={12} className="text-gray-700" />
          <span>{currentTime}</span>
        </div>

      </div>

      {/* ─── START MENU DROPDOWN ────────────────────────── */}
      {startMenuOpen && (
        <div className={`${styles.startMenu} ${styles.outset}`} onClick={e => e.stopPropagation()}>
          <div className={styles.startMenuSidebar}>
            <span className={styles.startMenuSidebarText}>AXE 97</span>
          </div>
          <div className={styles.startMenuItems}>
            <div className={styles.startMenuItem} onClick={() => { navigate('/profiles'); setStartMenuOpen(false); }}>
              <User size={14} className="text-purple-600" />
              <span>Multi Perfis</span>
            </div>
            <div className={styles.startMenuItem} onClick={() => { navigate('/canvas'); setStartMenuOpen(false); }}>
              <Layers size={14} className="text-amber-500" />
              <span>Tela Canvas</span>
            </div>
            <div className={styles.startMenuItem} onClick={() => { navigate('/tasks'); setStartMenuOpen(false); }}>
              <CheckSquare size={14} className="text-blue-500" />
              <span>Tarefas</span>
            </div>
            <div className={styles.startMenuItem} onClick={() => { navigate('/dadosclean'); setStartMenuOpen(false); }}>
              <Settings size={14} className="text-emerald-500" />
              <span>MetaClean</span>
            </div>

            <div className={styles.startMenuDivider} />

            <div className={styles.startMenuItem} onClick={() => openWindow('neuralNetwork')}>
              <Network size={14} className="text-purple-500" />
              <span>Rede de Conexões</span>
            </div>
            <div className={styles.startMenuItem} onClick={() => openWindow('documents')}>
              <FolderOpen size={14} className="text-yellow-600" />
              <span>Meus Documentos</span>
            </div>
            
            <div className={styles.startMenuItem} onClick={() => { openWindow('notes'); setStartMenuOpen(false); }}>
              <FileText size={14} className="text-yellow-600" />
              <span>Bloco de Notas</span>
            </div>
            
            <div className={styles.startMenuDivider} />

            <div className={styles.startMenuItem} onClick={() => { navigate('/settings'); setStartMenuOpen(false); }}>
              <Settings size={14} className="text-gray-600" />
              <span>Configurações</span>
            </div>

            <div className={styles.startMenuDivider} />

            <div className={styles.startMenuItem} onClick={() => logout()}>
              <LogOut size={14} className="text-red-600" />
              <span>Desligar (Sair)</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default HomeW97;
