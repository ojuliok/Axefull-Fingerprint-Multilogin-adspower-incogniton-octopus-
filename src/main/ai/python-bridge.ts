import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { app } from 'electron';
import { ProfileFeatures } from './feature-extractor';

let pyProcess: ChildProcess | null = null;
const pendingRequests = new Map<string, { resolve: (val: any) => void, reject: (err: any) => void }>();

export function initPythonEngine(): void {
    if (pyProcess) return;

    // Use python from system path. In a real build, you'd package a portable python
    const scriptDir = app.isPackaged 
        ? path.join(process.resourcesPath, 'app.asar.unpacked', 'src', 'main', 'ai')
        : __dirname;

    console.log('[AIEngine] Starting python bridge in...', scriptDir);
    pyProcess = spawn('python', ['engine.py'], { cwd: scriptDir });

    pyProcess.stdout?.on('data', (data) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
            if (!line.trim()) continue;
            try {
                const msg = JSON.parse(line);
                if (msg.id && pendingRequests.has(msg.id)) {
                    const req = pendingRequests.get(msg.id)!;
                    if (msg.error) {
                        req.reject(new Error(msg.error.message || 'RPC Error'));
                    } else {
                        req.resolve(msg.result);
                    }
                    pendingRequests.delete(msg.id);
                }
            } catch (err) {
                console.error('[AIEngine] Failed to parse stdout:', line);
            }
        }
    });

    pyProcess.stderr?.on('data', (data) => {
        console.error('[AIEngine-PyError]', data.toString());
    });

    pyProcess.on('close', (code) => {
        console.log(`[AIEngine] Python process exited with code ${code}`);
        pyProcess = null;
        // Optionally restart it
    });
}

function sendRpcRequest(method: string, params: any): Promise<any> {
    return new Promise((resolve, reject) => {
        if (!pyProcess || !pyProcess.stdin) {
            return reject(new Error('Python AI Engine is not running'));
        }
        
        const id = uuidv4();
        pendingRequests.set(id, { resolve, reject });
        
        const payload = JSON.stringify({ jsonrpc: '2.0', id, method, params });
        pyProcess.stdin.write(payload + '\n');
    });
}

export async function predictScore(features: ProfileFeatures): Promise<{ score: number; confidence: number; status: string }> {
    return sendRpcRequest('predict_score', { features });
}

export async function submitFeedback(profileId: string, feedback: 'thumbs_up' | 'thumbs_down', features: ProfileFeatures): Promise<void> {
    return sendRpcRequest('train', { profileId, feedback, features });
}
