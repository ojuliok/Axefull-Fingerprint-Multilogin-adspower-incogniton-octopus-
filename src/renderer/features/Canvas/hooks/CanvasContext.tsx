import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CanvasNode, CanvasData, Stroke, CanvasConnection, debouncedSaveCanvasData } from '../canvasStorage';

export type ActiveTool = 'select' | 'hand' | 'rectangle' | 'diamond' | 'ellipse' | 'line' | 'arrow' | 'triangle' | 'blockArrow' | 'elbowArrow' | 'pen' | 'arrowPen' | 'freetext' | 'frame';

interface CanvasStateContextType {
    canvasId: string;
    nodes: CanvasNode[];
    strokes: Stroke[];
    connections: CanvasConnection[];
    viewport: { x: number; y: number; zoom: number };
    
    // Tools
    activeTool: ActiveTool;
    setActiveTool: (tool: ActiveTool) => void;
    isToolLocked: boolean;
    setIsToolLocked: (locked: boolean) => void;
    
    // Selection
    selectedIds: Set<string>;
    setSelectedIds: (ids: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
    
    // Properties
    currentStrokeColor: string;
    setCurrentStrokeColor: (color: string) => void;
    currentStrokeWidth: number;
    setCurrentStrokeWidth: (width: number) => void;
    currentStrokeStyle: 'solid' | 'dashed' | 'dotted';
    setCurrentStrokeStyle: (style: 'solid' | 'dashed' | 'dotted') => void;
    currentFillColor: string;
    setCurrentFillColor: (color: string) => void;
    currentShapeRoughness: number;
    setCurrentShapeRoughness: (roughness: number) => void;
    
    // Grid
    gridSnap: boolean;
    setGridSnap: (snap: boolean) => void;

    // View
    viewMode: 'canvas' | 'page';
    setViewMode: (mode: 'canvas' | 'page') => void;
    
    // Actions
    setNodes: React.Dispatch<React.SetStateAction<CanvasNode[]>>;
    setStrokes: React.Dispatch<React.SetStateAction<Stroke[]>>;
    setConnections: React.Dispatch<React.SetStateAction<CanvasConnection[]>>;
    setViewport: React.Dispatch<React.SetStateAction<{ x: number; y: number; zoom: number }>>;
    
    saveData: (nodes: CanvasNode[], strokes: Stroke[], viewport: { x: number; y: number; zoom: number }, connections?: CanvasConnection[], pushToHistory?: boolean) => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
}

export const CanvasContext = createContext<CanvasStateContextType | null>(null);

export const CanvasProvider: React.FC<{
    canvasId: string;
    initialData: CanvasData;
    onDataChange: (data: CanvasData) => void;
    children: React.ReactNode;
}> = ({ canvasId, initialData, onDataChange, children }) => {
    const [nodes, setNodes] = useState<CanvasNode[]>(initialData?.nodes || []);
    const [strokes, setStrokes] = useState<Stroke[]>(initialData?.strokes || []);
    const [connections, setConnections] = useState<CanvasConnection[]>(initialData?.connections || []);
    const [viewport, setViewport] = useState(initialData?.viewport || { x: 0, y: 0, zoom: 1 });
    
    const [activeTool, setActiveTool] = useState<ActiveTool>('select');
    const [isToolLocked, setIsToolLocked] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    
    const [currentStrokeColor, setCurrentStrokeColor] = useState('#a78bfa');
    const [currentStrokeWidth, setCurrentStrokeWidth] = useState(2);
    const [currentStrokeStyle, setCurrentStrokeStyle] = useState<'solid' | 'dashed' | 'dotted'>('solid');
    const [currentFillColor, setCurrentFillColor] = useState('transparent');
    const [currentShapeRoughness, setCurrentShapeRoughness] = useState(1);
    
    const [gridSnap, setGridSnap] = useState(false);
    const [viewMode, setViewMode] = useState<'canvas' | 'page'>('canvas');

    const [history, setHistory] = useState<{nodes: CanvasNode[], connections: CanvasConnection[], strokes: Stroke[]}[]>([{ nodes: initialData?.nodes || [], connections: initialData?.connections || [], strokes: initialData?.strokes || [] }]);
    const historyIndexRef = useRef(0);
    const [historyTrigger, setHistoryTrigger] = useState(0);

    const saveData = useCallback((
        updatedNodes: CanvasNode[], 
        updatedStrokes: Stroke[], 
        updatedViewport: typeof viewport, 
        updatedConnections: CanvasConnection[] = connections,
        pushToHistory: boolean = true
    ) => {
        const newData: CanvasData = { 
            nodes: updatedNodes, 
            strokes: updatedStrokes, 
            connections: updatedConnections, 
            viewport: updatedViewport 
        };
        onDataChange(newData);
        debouncedSaveCanvasData(canvasId, newData);

        if (pushToHistory) {
            setHistory(prev => {
                const currentIdx = historyIndexRef.current;
                const last = prev[currentIdx];
                if (last && last.nodes === updatedNodes && last.strokes === updatedStrokes && last.connections === updatedConnections) return prev;
                
                const next = prev.slice(0, currentIdx + 1);
                next.push({ nodes: updatedNodes, connections: updatedConnections, strokes: updatedStrokes });
                if (next.length > 50) next.shift();
                historyIndexRef.current = next.length - 1;
                setHistoryTrigger(t => t + 1);
                return next;
            });
        }
    }, [canvasId, onDataChange, connections]);

    const undo = useCallback(() => {
        if (historyIndexRef.current > 0) {
            historyIndexRef.current -= 1;
            const state = history[historyIndexRef.current];
            setNodes(state.nodes);
            setConnections(state.connections);
            setStrokes(state.strokes);
            setHistoryTrigger(t => t + 1);
            saveData(state.nodes, state.strokes, viewport, state.connections, false);
        }
    }, [history, viewport, saveData]);

    const redo = useCallback(() => {
        if (historyIndexRef.current < history.length - 1) {
            historyIndexRef.current += 1;
            const state = history[historyIndexRef.current];
            setNodes(state.nodes);
            setConnections(state.connections);
            setStrokes(state.strokes);
            setHistoryTrigger(t => t + 1);
            saveData(state.nodes, state.strokes, viewport, state.connections, false);
        }
    }, [history, viewport, saveData]);

    return (
        <CanvasContext.Provider value={{
            canvasId, nodes, setNodes, strokes, setStrokes, connections, setConnections, viewport, setViewport,
            activeTool, setActiveTool, isToolLocked, setIsToolLocked,
            selectedIds, setSelectedIds,
            currentStrokeColor, setCurrentStrokeColor, currentStrokeWidth, setCurrentStrokeWidth, currentStrokeStyle, setCurrentStrokeStyle, currentFillColor, setCurrentFillColor, currentShapeRoughness, setCurrentShapeRoughness,
            gridSnap, setGridSnap, viewMode, setViewMode,
            saveData, undo, redo, canUndo: historyIndexRef.current > 0, canRedo: historyIndexRef.current < history.length - 1
        }}>
            {children}
        </CanvasContext.Provider>
    );
};

export const useCanvasContext = () => {
    const ctx = useContext(CanvasContext);
    if (!ctx) throw new Error("useCanvasContext must be used within CanvasProvider");
    return ctx;
};
