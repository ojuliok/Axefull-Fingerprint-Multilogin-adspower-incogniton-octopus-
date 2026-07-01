import fs from 'fs';
import path from 'path';
import { app } from 'electron';

export interface EmailParams {
    to: string;
    subject: string;
    body: string;
    html?: string;
}

export interface EmailResult {
    success: boolean;
    error?: string;
    simulated?: boolean;
    filePath?: string;
}

export async function sendEmail(params: EmailParams): Promise<EmailResult> {
    const { to, subject, body, html } = params;
    console.log(`[EmailManager] Enviando e-mail para: ${to} | Assunto: ${subject}`);

    try {
        const emailsDir = path.join(app.getPath('userData'), 'sent_emails');
        if (!fs.existsSync(emailsDir)) {
            fs.mkdirSync(emailsDir, { recursive: true });
        }

        const fileName = `${Date.now()}-${to.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
        const filePath = path.join(emailsDir, fileName);

        const emailData = {
            timestamp: new Date().toISOString(),
            to,
            subject,
            body,
            html: html || body
        };

        fs.writeFileSync(filePath, JSON.stringify(emailData, null, 2), 'utf-8');
        console.log(`[EmailManager] E-mail simulado e salvo em: ${filePath}`);
        
        return {
            success: true,
            simulated: true,
            filePath
        };
    } catch (error: any) {
        console.error('[EmailManager] Erro ao enviar e-mail:', error);
        return {
            success: false,
            error: error.message || String(error)
        };
    }
}
