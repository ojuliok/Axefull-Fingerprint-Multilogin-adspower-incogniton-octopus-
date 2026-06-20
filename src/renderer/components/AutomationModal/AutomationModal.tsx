import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Code2, Zap, Globe } from 'lucide-react';
import styles from './AutomationModal.module.css';

const LOCAL_API_BASE = 'http://127.0.0.1:54345';

interface Props {
    profileName: string;
    profileId: string;
    cdpUrl: string;
    onClose: () => void;
}

const AutomationModal: React.FC<Props> = ({ profileName, profileId, cdpUrl, onClose }) => {
    const [copiedUrl, setCopiedUrl] = useState(false);
    const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'py' | 'js' | 'ts' | 'api'>('py');

    const copy = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopiedSnippet(key);
        setTimeout(() => setCopiedSnippet(null), 2000);
    };

    const copyUrl = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
    };

    const snippets = {
        py: `from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.connect_over_cdp("${cdpUrl}")
    context = browser.contexts[0]  # Contexto do perfil
    page = context.pages[0]

    # Sua automação aqui
    page.goto("https://example.com")
    print(page.title())`,

        js: `const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('${cdpUrl}');
  const context = browser.contexts()[0]; // Contexto do perfil
  const page = context.pages()[0];

  // Sua automação aqui
  await page.goto('https://example.com');
  console.log(await page.title());
})();`,

        ts: `import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.connectOverCDP('${cdpUrl}');
  const context = browser.contexts()[0]; // Contexto do perfil
  const page = context.pages()[0];

  // Sua automação aqui
  await page.goto('https://example.com');
  console.log(await page.title());
})();`,

        api: `# Axe MultiLogin Local REST API — porta 54345

# Listar todos os perfis
GET ${LOCAL_API_BASE}/profiles

# Iniciar este perfil
POST ${LOCAL_API_BASE}/profiles/${profileId}/start
→ { "success": true, "data": { "cdpUrl": "http://127.0.0.1:XXXX" } }

# Parar este perfil
POST ${LOCAL_API_BASE}/profiles/${profileId}/stop

# Status (ativo/inativo)
GET ${LOCAL_API_BASE}/profiles/${profileId}/status

# Obter CDP URL atual
GET ${LOCAL_API_BASE}/profiles/${profileId}/cdp-url

# Atualizar proxy do perfil
POST ${LOCAL_API_BASE}/profiles/${profileId}/proxy
Body: { "type": "http", "host": "proxy.example.com", "port": 8080 }

# Remover proxy
DELETE ${LOCAL_API_BASE}/profiles/${profileId}/proxy`,
    };

    const tabLabels: Record<string, string> = { py: 'Python', js: 'JavaScript', ts: 'TypeScript', api: 'REST API' };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-500/15 rounded-xl flex items-center justify-center">
                            <Zap size={17} className="text-emerald-400" />
                        </div>
                        <div>
                            <h2 className={styles.title}>API de Automação</h2>
                            <p className={styles.subtitle}>{profileName}</p>
                        </div>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
                </div>

                <div className={styles.body}>
                    {activeTab !== 'api' && (
                        <div className={styles.section}>
                            <label className={styles.label}><Terminal size={13} /> Endpoint CDP</label>
                            <div className={styles.urlRow}>
                                <code className={styles.urlCode}>{cdpUrl}</code>
                                <button className={styles.copyBtn} onClick={() => copyUrl(cdpUrl)}>
                                    {copiedUrl ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'api' && (
                        <div className={styles.section}>
                            <label className={styles.label}><Globe size={13} /> Base URL</label>
                            <div className={styles.urlRow}>
                                <code className={styles.urlCode}>{LOCAL_API_BASE}</code>
                                <button className={styles.copyBtn} onClick={() => copyUrl(LOCAL_API_BASE)}>
                                    {copiedUrl ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className={styles.section}>
                        <label className={styles.label}><Code2 size={13} /> {activeTab === 'api' ? 'Endpoints disponíveis' : 'Snippet de Conexão'}</label>
                        <div className={styles.tabs}>
                            {(['py', 'js', 'ts', 'api'] as const).map(lang => (
                                <button
                                    key={lang}
                                    className={`${styles.tab} ${activeTab === lang ? styles.tabActive : ''}`}
                                    onClick={() => setActiveTab(lang)}>
                                    {tabLabels[lang]}
                                </button>
                            ))}
                        </div>
                        <div className={styles.codeBlock}>
                            <pre className={styles.code}>{snippets[activeTab]}</pre>
                            <button
                                className={styles.copyCodeBtn}
                                onClick={() => copy(snippets[activeTab], activeTab)}>
                                {copiedSnippet === activeTab
                                    ? <><Check size={13} className="text-emerald-400" /> Copiado!</>
                                    : <><Copy size={13} /> Copiar</>}
                            </button>
                        </div>
                    </div>

                    <p className={styles.hint}>
                        {activeTab === 'api'
                            ? 'A API REST local roda em 127.0.0.1:54345 enquanto o Axe MultiLogin estiver aberto.'
                            : 'Conecte-se enquanto o perfil estiver ativo. O endpoint CDP muda a cada nova sessão.'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AutomationModal;
