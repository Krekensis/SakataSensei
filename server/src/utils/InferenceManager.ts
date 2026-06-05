import { spawn } from 'child_process';
import fetch from 'node-fetch';
import type { ChildProcessWithoutNullStreams } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface RecommendationRequest {
    entries: any[];
    exclude_watched: boolean;
}

interface RecommendationResponse {
    recommendations?: { id: number, score: number, reasons?: number[] }[];
    error?: string;
}

class InferenceManager {
    private pythonProcess: ChildProcessWithoutNullStreams | null = null;
    private isReady: boolean = false;
    private requestQueue: Map<string, { resolve: (val: any) => void, reject: (err: any) => void }> = new Map();
    private reqIdCounter: number = 0;
    private buffer: string = '';

    constructor() {
        if (process.env.HF_INFERENCE_URL) {
            console.log(`Using Hugging Face inference API at: ${process.env.HF_INFERENCE_URL}`);
            this.isReady = true;
        } else {
            console.log('HF_INFERENCE_URL not provided, falling back to local Python subprocess.');
            this.initProcess();
        }
    }

    private initProcess() {
        const scriptPath = path.join(__dirname, '..', '..', 'inference.py');
        
        // Ensure python command is correct for Windows or Unix
        const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
        
        console.log(`Starting Python inference process: ${pythonCmd} ${scriptPath}`);
        this.pythonProcess = spawn(pythonCmd, [scriptPath]);

        this.pythonProcess.stdout.on('data', (data) => {
            this.buffer += data.toString();
            this.processBuffer();
        });

        this.pythonProcess.stderr.on('data', (data) => {
            console.error(`[Inference Python STDERR]: ${data}`);
        });

        this.pythonProcess.on('close', (code) => {
            console.log(`Python inference process exited with code ${code}`);
            this.isReady = false;
            // Optionally restart
            setTimeout(() => this.initProcess(), 5000);
        });
    }

    private processBuffer() {
        let newlineIndex;
        while ((newlineIndex = this.buffer.indexOf('\n')) !== -1) {
            const line = this.buffer.substring(0, newlineIndex).trim();
            this.buffer = this.buffer.substring(newlineIndex + 1);

            if (!line) continue;

            try {
                const response = JSON.parse(line);
                if (response.status === 'ready') {
                    console.log('Python inference process is ready.');
                    this.isReady = true;
                    continue;
                }

                const reqId = response.req_id;
                if (reqId !== undefined && this.requestQueue.has(reqId.toString())) {
                    const { resolve, reject } = this.requestQueue.get(reqId.toString())!;
                    this.requestQueue.delete(reqId.toString());
                    
                    if (response.error) {
                        reject(new Error(response.error));
                    } else {
                        resolve(response.recommendations);
                    }
                } else if (response.error) {
                    console.error('[Inference Python Error]:', response.error);
                }
            } catch (err) {
                console.error('Error parsing Python output:', err, 'Line:', line);
            }
        }
    }

    public async getRecommendations(entries: any[], excludeWatched: boolean): Promise<{ id: number, score: number, reasons?: number[] }[]> {
        if (process.env.HF_INFERENCE_URL) {
            // Use Hugging Face API
            try {
                const response = await fetch(`${process.env.HF_INFERENCE_URL}/predict`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        entries,
                        exclude_watched: excludeWatched
                    })
                });

                if (!response.ok) {
                    throw new Error(`HF API error: ${response.statusText}`);
                }

                const data = await response.json() as any;
                return data.recommendations;
            } catch (err) {
                console.error('Failed to fetch from HF API:', err);
                throw new Error('Inference API is currently unavailable.');
            }
        }

        // Fallback to local python process
        if (!this.isReady || !this.pythonProcess) {
            throw new Error('Inference model is not ready yet. Please try again in a few moments.');
        }

        const reqId = (this.reqIdCounter++).toString();
        
        return new Promise((resolve, reject) => {
            this.requestQueue.set(reqId, { resolve, reject });
            
            const request = {
                req_id: reqId,
                entries: entries,
                exclude_watched: excludeWatched
            };
            
            this.pythonProcess!.stdin.write(JSON.stringify(request) + '\n');
            
            // Timeout after 30 seconds
            setTimeout(() => {
                if (this.requestQueue.has(reqId)) {
                    this.requestQueue.delete(reqId);
                    reject(new Error('Inference request timed out after 30 seconds'));
                }
            }, 30000);
        });
    }
}

// Export a singleton instance
export const inferenceManager = new InferenceManager();
