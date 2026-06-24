import React, { useState, useEffect, useRef } from 'react';
import { X, Clock, User, AlignLeft, MessageSquare, Play, Square, Calendar as CalendarIcon, Pin, CheckCircle2, Circle, Sparkles, Bold, Italic, List as ListIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import styles from './TaskDetailModal.module.css';
import { TaskData, updateTask, addTaskComment, setPinnedTaskId, Subtask, RecurringRule } from './tasksStorage';
import { getMarketingData } from '../../Marketing/marketingStorage';
import { getCanvasList } from '../../Canvas/canvasStorage';
import CustomDatePicker from './CustomDatePicker';

interface TaskDetailModalProps {
    task: TaskData;
    onClose: () => void;
    onUpdate: (taskId: string, updates: Partial<TaskData>) => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, onClose, onUpdate }) => {
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description);
    const [status, setStatus] = useState(task.status);
    const [crmContactId, setCrmContactId] = useState(task.crmContactId || '');
    const [startTime, setStartTime] = useState(task.startTime || '');
    const [endTime, setEndTime] = useState(task.endTime || '');
    const [linkedCanvasId, setLinkedCanvasId] = useState(task.linkedCanvasIds?.[0] || '');
    
    // Date & Tags
    const [endDate, setEndDate] = useState<number | null>(task.endDate || null);
    const [tags, setTags] = useState<string[]>(task.tags || []);
    const [newTag, setNewTag] = useState('');

    // Custom Fields
    const [customFields, setCustomFields] = useState(task.customFields || {});
    const [newFieldName, setNewFieldName] = useState('');

    const [newComment, setNewComment] = useState('');
    
    // Subtasks State
    const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks || []);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    
    // Pomodoro State
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [timeSpent, setTimeSpent] = useState(task.timeSpent || 0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const [taskDate, setTaskDate] = useState<number | null>(task.date || null);
    const [recurringRule, setRecurringRule] = useState<RecurringRule>(task.recurringRule || 'none');
    const modalRef = useRef<HTMLDivElement>(null);

    // Load CRM & Canvas Data
    const crmData = getMarketingData();
    const leads = crmData.leads;
    const allCanvas = getCanvasList();
    const canvasPages = allCanvas.filter(c => c.type === 'page' || c.type === 'canvas');

    useEffect(() => {
        if (isTimerRunning) {
            timerRef.current = setInterval(() => {
                setTimeSpent(prev => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isTimerRunning]);

    const saveRef = useRef<() => void>();
    saveRef.current = () => {
        const updates: Partial<TaskData> = {
            title,
            description,
            status,
            crmContactId: crmContactId || null,
            timeSpent,
            startTime: startTime || null,
            endTime: endTime || null,
            linkedCanvasIds: linkedCanvasId ? [linkedCanvasId] : [],
            customFields,
            subtasks,
            date: taskDate,
            endDate,
            tags,
            recurringRule
        };
        updateTask(task.id, updates);
        onUpdate(task.id, updates);
    };

    const handleClose = () => {
        saveRef.current?.();
        onClose();
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                handleClose();
            }
        };
        
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 100);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleAddSubtask = () => {
        if (!newSubtaskTitle.trim()) return;
        const newSub: Subtask = {
            id: Date.now().toString(),
            title: newSubtaskTitle.trim(),
            completed: false
        };
        const updated = [...subtasks, newSub];
        setSubtasks(updated);
        setNewSubtaskTitle('');
        updateTask(task.id, { subtasks: updated });
        onUpdate(task.id, { subtasks: updated });
    };

    const handleToggleSubtask = (subtaskId: string) => {
        const updated = subtasks.map(s => 
            s.id === subtaskId ? { ...s, completed: !s.completed } : s
        );
        setSubtasks(updated);
        updateTask(task.id, { subtasks: updated });
        onUpdate(task.id, { subtasks: updated });
    };

    const handleDeleteSubtask = (subtaskId: string) => {
        const updated = subtasks.filter(s => s.id !== subtaskId);
        setSubtasks(updated);
        updateTask(task.id, { subtasks: updated });
        onUpdate(task.id, { subtasks: updated });
    };

    const handleAddComment = () => {
        if (!newComment.trim()) return;
        addTaskComment(task.id, newComment, 'Você');
        setNewComment('');
        // We simulate a local update for the UI immediately
        task.comments.push({
            id: Date.now().toString(),
            author: 'Você',
            content: newComment,
            createdAt: Date.now()
        });
    };

    const formatTime = (totalSeconds: number) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className={styles.modalOverlay} onClick={handleClose}>
            <div className={styles.modalContent} ref={modalRef} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <input 
                        className={styles.titleInput} 
                        value={title} 
                        onChange={e => setTitle(e.target.value)} 
                        placeholder="Título da Tarefa"
                    />
                    <div className={styles.headerActions}>
                        <button className={styles.iconBtn} onClick={() => setPinnedTaskId(task.id)} title="Fixar/Levar Tarefa">
                            <Pin size={18} />
                        </button>
                        <button className={styles.iconBtn} onClick={handleClose}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className={styles.modalBody}>
                    {/* Status, Dates, CRM Contact Grid */}
                    <div className={styles.infoGrid}>
                        <div className={styles.infoField}>
                            <div className={styles.sectionTitle}>Status</div>
                            <select 
                                className={styles.select} 
                                style={{ width: '100%' }}
                                value={status} 
                                onChange={e => setStatus(e.target.value as any)}
                            >
                                <option value="todo">A fazer</option>
                                <option value="in-progress">Em progresso</option>
                                <option value="in-review">Em revisão</option>
                                <option value="done">Concluído</option>
                            </select>
                        </div>
                        
                        <div className={styles.infoField}>
                            <div className={styles.sectionTitle}>Contato CRM</div>
                            <select 
                                className={styles.select} 
                                style={{ width: '100%' }}
                                value={crmContactId} 
                                onChange={e => setCrmContactId(e.target.value)}
                            >
                                <option value="">Sem Contato CRM</option>
                                {leads.map(lead => (
                                    <option key={lead.id} value={lead.id}>{lead.title}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.infoField} style={{ gridColumn: 'span 2' }}>
                            <div className={styles.sectionTitle}>
                                <CalendarIcon size={14} style={{ marginRight: '6px' }} /> Período
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ flex: 1 }}>
                                    <CustomDatePicker 
                                        selectedDate={taskDate}
                                        onChange={setTaskDate}
                                        placeholder="Data de início"
                                    />
                                </div>
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>até</span>
                                <div style={{ flex: 1 }}>
                                    <CustomDatePicker 
                                        selectedDate={endDate}
                                        onChange={setEndDate}
                                        placeholder="Data de término"
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <select 
                                        className={styles.select} 
                                        style={{ width: '100%' }}
                                        value={recurringRule} 
                                        onChange={e => setRecurringRule(e.target.value as RecurringRule)}
                                    >
                                        <option value="none">Sem repetição</option>
                                        <option value="daily">Diariamente</option>
                                        <option value="weekly">Semanalmente</option>
                                        <option value="monthly">Mensalmente</option>
                                        <option value="yearly">Anualmente</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Advanced Fields Section */}
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <div className={styles.sectionTitle}>Link com Canvas/Página</div>
                            <select 
                                className={styles.select} 
                                style={{ width: '100%' }}
                                value={linkedCanvasId} 
                                onChange={e => setLinkedCanvasId(e.target.value)}
                            >
                                <option value="">Sem vínculo</option>
                                {canvasPages.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ flex: 1, minWidth: '200px', display: 'flex', gap: '8px' }}>
                            <div style={{ flex: 1 }}>
                                <div className={styles.sectionTitle}>Início</div>
                                <input 
                                    type="time" 
                                    className={styles.select} 
                                    style={{ width: '100%' }}
                                    value={startTime}
                                    onClick={(e) => {
                                        try { e.currentTarget.showPicker(); } catch {}
                                    }}
                                    onChange={e => setStartTime(e.target.value)}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div className={styles.sectionTitle}>Fim</div>
                                <input 
                                    type="time" 
                                    className={styles.select} 
                                    style={{ width: '100%' }}
                                    value={endTime}
                                    onClick={(e) => {
                                        try { e.currentTarget.showPicker(); } catch {}
                                    }}
                                    onChange={e => setEndTime(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Description Section */}
                    <div style={{ marginBottom: '16px' }}>
                        <div className={styles.sectionTitle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><AlignLeft size={16} /> Descrição</div>
                            <div className={styles.richTextToolbar} style={{ display: 'flex', gap: '4px' }}>
                                <button type="button" onClick={() => setDescription(description + '**Texto em negrito**')} title="Negrito" style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}><Bold size={14}/></button>
                                <button type="button" onClick={() => setDescription(description + '*Texto em itálico*')} title="Itálico" style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}><Italic size={14}/></button>
                                <button type="button" onClick={() => setDescription(description + '\n- Item de lista')} title="Lista" style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}><ListIcon size={14}/></button>
                            </div>
                        </div>
                        <textarea 
                            className={styles.textarea}
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Adicione uma descrição detalhada para esta tarefa (Suporta Markdown)..."
                            style={{ minHeight: '120px' }}
                        />
                    </div>

                    {/* Tags Section */}
                    <div style={{ marginBottom: '16px' }}>
                        <div className={styles.sectionTitle}>Tags / Categorias</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                            {tags.map((tag, idx) => (
                                <span 
                                    key={idx} 
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        background: 'rgba(139, 92, 246, 0.12)',
                                        color: '#a78bfa',
                                        padding: '3px 8px',
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        fontWeight: '600',
                                        border: '1px solid rgba(139, 92, 246, 0.2)'
                                    }}
                                >
                                    {tag}
                                    <button 
                                        onClick={() => {
                                            const updated = tags.filter(t => t !== tag);
                                            setTags(updated);
                                        }}
                                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0, fontSize: '12px', lineHeight: 1 }}
                                    >
                                        &times;
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input 
                                className={styles.select}
                                style={{ flex: 1 }}
                                placeholder="Nova tag (ex: Saas, Web, Redesign)"
                                value={newTag}
                                onChange={e => setNewTag(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        if (newTag.trim() && !tags.includes(newTag.trim())) {
                                            setTags([...tags, newTag.trim()]);
                                            setNewTag('');
                                        }
                                    }
                                }}
                            />
                            <button 
                                className={styles.pomodoroBtn}
                                onClick={() => {
                                    if (newTag.trim() && !tags.includes(newTag.trim())) {
                                        setTags([...tags, newTag.trim()]);
                                        setNewTag('');
                                    }
                                }}
                            >
                                Adicionar
                            </button>
                        </div>
                    </div>

                    {/* Custom Properties */}
                    <div style={{ marginBottom: '16px' }}>
                        <div className={styles.sectionTitle}>Propriedades (Campos Customizados)</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            {Object.entries(customFields).map(([key, value]) => (
                                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#18181b', padding: '6px', borderRadius: '6px', border: '1px solid #27272a' }}>
                                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', width: '80px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{key}</span>
                                    <input 
                                        className={styles.select}
                                        style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: '1px dashed #3f3f46', borderRadius: 0 }}
                                        value={value as string}
                                        onChange={(e) => setCustomFields({ ...customFields, [key]: e.target.value })}
                                        placeholder="Valor..."
                                    />
                                    <button 
                                        onClick={() => { const nf = {...customFields}; delete nf[key]; setCustomFields(nf); }}
                                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                    ><X size={14} /></button>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            <input 
                                className={styles.select}
                                placeholder="Nova propriedade (ex: Tags, Cliente, URL)"
                                value={newFieldName}
                                onChange={e => setNewFieldName(e.target.value)}
                            />
                            <button 
                                className={styles.pomodoroBtn}
                                onClick={() => {
                                    if(newFieldName.trim() && !customFields[newFieldName]) {
                                        setCustomFields({ ...customFields, [newFieldName.trim()]: '' });
                                        setNewFieldName('');
                                    }
                                }}
                            >Adicionar</button>
                        </div>
                    </div>
                    
                    {/* Pomodoro Timer */}
                    <div className={styles.pomodoroSection}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Clock size={24} color="#8b5cf6" />
                            <div>
                                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Tempo Dedicado</div>
                                <div className={styles.timerDisplay}>{formatTime(timeSpent)}</div>
                            </div>
                        </div>
                        <div className={styles.pomodoroActions}>
                            <button 
                                className={`${styles.pomodoroBtn} ${isTimerRunning ? styles.active : ''}`}
                                onClick={() => setIsTimerRunning(!isTimerRunning)}
                            >
                                {isTimerRunning ? <><Square size={16} /> Parar</> : <><Play size={16} /> Iniciar</>}
                            </button>
                        </div>
                    </div>

                    {/* Subtasks Section */}
                    <div style={{ marginBottom: '16px' }}>
                        <div className={styles.sectionTitle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Subtarefas</span>
                            <button 
                                className={styles.pomodoroBtn}
                                style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(139, 92, 246, 0.1)', color: '#c084fc', border: '1px solid rgba(139, 92, 246, 0.2)' }}
                                onClick={() => {
                                    if (!title.trim()) {
                                        alert("Por favor, insira um título para a tarefa primeiro.");
                                        return;
                                    }
                                    const aiSubtasks = [
                                        { id: Date.now().toString() + '1', title: `Analisar requisitos para: ${title}`, completed: false },
                                        { id: Date.now().toString() + '2', title: 'Desenhar proposta de solução', completed: false },
                                        { id: Date.now().toString() + '3', title: 'Revisar com a equipe', completed: false }
                                    ];
                                    const updated = [...subtasks, ...aiSubtasks];
                                    setSubtasks(updated);
                                    updateTask(task.id, { subtasks: updated });
                                    onUpdate(task.id, { subtasks: updated });
                                }}
                            >
                                <Sparkles size={14} /> Gerar com IA
                            </button>
                        </div>
                        <div className={styles.subtaskList}>
                            {subtasks.map(sub => (
                                <div key={sub.id} className={styles.subtaskItem}>
                                    <div 
                                        className={`${styles.subtaskCheckbox} ${sub.completed ? styles.checked : ''}`}
                                        onClick={() => handleToggleSubtask(sub.id)}
                                    >
                                        {sub.completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                                    </div>
                                    <span className={`${styles.subtaskTitle} ${sub.completed ? styles.completed : ''}`}>
                                        {sub.title}
                                    </span>
                                    <button 
                                        onClick={() => handleDeleteSubtask(sub.id)}
                                        style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
                                    ><X size={14} /></button>
                                </div>
                            ))}
                        </div>
                        <div className={styles.addSubtaskWrapper}>
                            <input 
                                placeholder="Adicionar subtarefa..."
                                value={newSubtaskTitle}
                                onChange={e => setNewSubtaskTitle(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddSubtask()}
                            />
                            <button onClick={handleAddSubtask}>Adicionar</button>
                        </div>
                    </div>

                    {/* Comments Section */}
                    <div className={styles.commentsSection}>
                        <div className={styles.sectionTitle}>
                            <MessageSquare size={16} /> Comentários
                        </div>
                        <div className={styles.commentList}>
                            {task.comments?.map(c => (
                                <div key={c.id} className={styles.commentItem}>
                                    <div className={styles.commentHeader}>
                                        <span className={styles.commentAuthor}>{c.author}</span>
                                        <span>{format(new Date(c.createdAt), "dd/MM 'às' HH:mm")}</span>
                                    </div>
                                    <div className={styles.commentContent}>{c.content}</div>
                                </div>
                            ))}
                        </div>
                        <div className={styles.commentInputWrapper}>
                            <input 
                                placeholder="Escreva um comentário..."
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                            />
                            <button onClick={handleAddComment}>Enviar</button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default TaskDetailModal;
