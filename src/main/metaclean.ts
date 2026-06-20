import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';

ffmpeg.setFfmpegPath(ffmpegInstaller.path.replace('app.asar', 'app.asar.unpacked'));
ffmpeg.setFfprobePath(ffprobeInstaller.path.replace('app.asar', 'app.asar.unpacked'));

export interface MetadataField {
    key: string;
    label: string;
    value: string;
    removable: boolean;
}

export interface CleanResult {
    success: boolean;
    outputPath?: string;
    removedCount?: number;
    warnings?: string[];
    error?: string;
}

export interface HistoryEntry {
    id: string;
    fileName: string;
    fileType: string;
    processedAt: string;
    outputPath: string;
    metadataRemoved: number;
}

const HISTORY_FILE = path.join(app.getPath('userData'), 'metaclean-history.json');

export function getHistory(): HistoryEntry[] {
    try {
        if (fs.existsSync(HISTORY_FILE)) {
            return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
        }
    } catch { /* ignore */ }
    return [];
}

export function clearHistory(): void {
    try { fs.writeFileSync(HISTORY_FILE, '[]'); } catch { /* ignore */ }
}

function appendHistory(entry: HistoryEntry): void {
    const list = getHistory();
    list.unshift(entry);
    if (list.length > 200) list.splice(200);
    try { fs.writeFileSync(HISTORY_FILE, JSON.stringify(list, null, 2)); } catch { /* ignore */ }
}

// ─── JPEG ─────────────────────────────────────────────────────────────────────

function readJpegMetadata(buf: Buffer): MetadataField[] {
    const fields: MetadataField[] = [];
    if (buf[0] !== 0xFF || buf[1] !== 0xD8) return fields;

    let i = 2;
    while (i < buf.length - 4) {
        if (buf[i] !== 0xFF) break;
        const marker = buf[i + 1];
        if (marker === 0xDA) break;
        if (marker >= 0xD0 && marker <= 0xD9) { i += 2; continue; }

        const segLen = (buf[i + 2] << 8) | buf[i + 3];

        if (marker === 0xE1) {
            const header = buf.slice(i + 4, i + 10).toString('ascii');
            if (header.startsWith('Exif\0\0')) {
                fields.push({ key: 'exif', label: 'Dados EXIF', value: 'Presente (câmera, GPS, data, modelo)', removable: true });
                const chunk = buf.slice(i + 4, Math.min(i + 2 + segLen, i + 65536)).toString('binary');
                if (chunk.includes('GPS')) {
                    fields.push({ key: 'gps', label: 'Localização GPS', value: 'Detectada', removable: true });
                }
                const makes = ['Canon', 'Nikon', 'Sony', 'Apple', 'Samsung', 'Huawei', 'Google', 'FUJIFILM', 'Olympus', 'Pentax', 'Leica', 'Panasonic', 'Motorola', 'LG', 'Xiaomi'];
                for (const make of makes) {
                    if (chunk.includes(make)) {
                        fields.push({ key: 'make', label: 'Fabricante/Modelo do Dispositivo', value: make, removable: true });
                        break;
                    }
                }
                const softs = ['Photoshop', 'Lightroom', 'GIMP', 'Snapseed', 'Instagram', 'WhatsApp', 'iOS', 'Android', 'Paint'];
                for (const sw of softs) {
                    if (chunk.includes(sw)) {
                        fields.push({ key: 'software', label: 'Software Utilizado', value: sw, removable: true });
                        break;
                    }
                }
            } else {
                const xmpPeek = buf.slice(i + 4, Math.min(i + 100, buf.length)).toString('ascii');
                if (xmpPeek.includes('xpacket') || xmpPeek.includes('xmpmeta')) {
                    fields.push({ key: 'xmp', label: 'Metadados XMP', value: 'Presente', removable: true });
                }
            }
        } else if (marker === 0xE2) {
            fields.push({ key: 'icc', label: 'Perfil de Cor ICC', value: 'Presente', removable: true });
        } else if (marker === 0xED) {
            fields.push({ key: 'iptc', label: 'Dados IPTC / Photoshop', value: 'Presente (autor, direitos, legenda)', removable: true });
        } else if (marker === 0xFE) {
            const comment = buf.slice(i + 4, i + 2 + segLen).toString('utf8').trim();
            if (comment) fields.push({ key: 'comment', label: 'Comentário Embutido', value: comment.substring(0, 80), removable: true });
        }

        i += 2 + segLen;
    }

    if (fields.length === 0) fields.push({ key: 'none', label: 'Sem metadados detectados', value: 'Arquivo já limpo', removable: false });
    return fields;
}

function stripJpeg(buf: Buffer): Buffer {
    if (buf[0] !== 0xFF || buf[1] !== 0xD8) throw new Error('JPEG inválido');
    const strip = new Set([0xE1, 0xE2, 0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8, 0xE9, 0xEA, 0xEB, 0xEC, 0xED, 0xEE, 0xEF, 0xFE]);
    const parts: Buffer[] = [Buffer.from([0xFF, 0xD8])];
    let i = 2;
    while (i < buf.length) {
        if (buf[i] !== 0xFF) { parts.push(buf.slice(i)); break; }
        const marker = buf[i + 1];
        if (marker === 0xDA) { parts.push(buf.slice(i)); break; }
        if (marker === 0xD9) { parts.push(Buffer.from([0xFF, 0xD9])); break; }
        if (marker >= 0xD0 && marker <= 0xD8) { parts.push(buf.slice(i, i + 2)); i += 2; continue; }
        if (i + 3 >= buf.length) break;
        const segLen = (buf[i + 2] << 8) | buf[i + 3];
        if (strip.has(marker)) { i += 2 + segLen; } else { parts.push(buf.slice(i, i + 2 + segLen)); i += 2 + segLen; }
    }
    return Buffer.concat(parts);
}

// ─── PNG ──────────────────────────────────────────────────────────────────────

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

function readPngMetadata(buf: Buffer): MetadataField[] {
    const fields: MetadataField[] = [];
    for (let j = 0; j < 8; j++) if (buf[j] !== PNG_SIG[j]) return fields;
    let i = 8;
    while (i < buf.length - 12) {
        const chunkLen = buf.readUInt32BE(i);
        const type = buf.slice(i + 4, i + 8).toString('ascii');
        if (type === 'tEXt' || type === 'iTXt' || type === 'zTXt') {
            const data = buf.slice(i + 8, i + 8 + chunkLen);
            const ni = data.indexOf(0);
            const key = data.slice(0, ni).toString('ascii');
            const val = data.slice(ni + 1).toString('utf8').replace(/\0/g, '').trim();
            fields.push({ key: `text_${key}`, label: key, value: (val || '(presente)').substring(0, 100), removable: true });
        } else if (type === 'eXIf') {
            fields.push({ key: 'exif', label: 'Dados EXIF', value: 'Presente', removable: true });
        } else if (type === 'tIME') {
            fields.push({ key: 'time', label: 'Data/Hora de Modificação', value: 'Presente', removable: true });
        } else if (['cHRM', 'gAMA', 'sRGB', 'iCCP'].includes(type)) {
            fields.push({ key: type, label: `Perfil de Cor (${type})`, value: 'Presente', removable: true });
        }
        i += 12 + chunkLen;
        if (type === 'IEND') break;
    }
    if (fields.length === 0) fields.push({ key: 'none', label: 'Sem metadados detectados', value: 'Arquivo já limpo', removable: false });
    return fields;
}

function stripPng(buf: Buffer): Buffer {
    for (let j = 0; j < 8; j++) if (buf[j] !== PNG_SIG[j]) throw new Error('PNG inválido');
    const keep = new Set(['IHDR', 'PLTE', 'IDAT', 'IEND', 'tRNS', 'acTL', 'fcTL', 'fdAT']);
    const parts: Buffer[] = [PNG_SIG];
    let i = 8;
    while (i < buf.length - 12) {
        const chunkLen = buf.readUInt32BE(i);
        const type = buf.slice(i + 4, i + 8).toString('ascii');
        if (keep.has(type)) parts.push(buf.slice(i, i + 12 + chunkLen));
        i += 12 + chunkLen;
        if (type === 'IEND') break;
    }
    return Buffer.concat(parts);
}

// ─── WEBP ─────────────────────────────────────────────────────────────────────

function readWebpMetadata(buf: Buffer): MetadataField[] {
    const fields: MetadataField[] = [];
    if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') return fields;
    let i = 12;
    while (i < buf.length - 8) {
        const id = buf.toString('ascii', i, i + 4);
        const size = buf.readUInt32LE(i + 4);
        if (id === 'EXIF') fields.push({ key: 'exif', label: 'Dados EXIF', value: 'Presente', removable: true });
        else if (id === 'XMP ') fields.push({ key: 'xmp', label: 'Metadados XMP', value: 'Presente', removable: true });
        else if (id === 'ICCP') fields.push({ key: 'icc', label: 'Perfil de Cor ICC', value: 'Presente', removable: true });
        i += 8 + size + (size % 2);
    }
    if (fields.length === 0) fields.push({ key: 'none', label: 'Sem metadados detectados', value: 'Arquivo já limpo', removable: false });
    return fields;
}

function stripWebp(buf: Buffer): Buffer {
    if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') return buf;
    const keep = new Set(['VP8 ', 'VP8L', 'VP8X', 'ANIM', 'ANMF', 'ALPH']);
    const parts: Buffer[] = [buf.slice(0, 12)];
    let i = 12;
    while (i < buf.length - 8) {
        const id = buf.toString('ascii', i, i + 4);
        const size = buf.readUInt32LE(i + 4);
        const total = 8 + size + (size % 2);
        if (keep.has(id)) parts.push(buf.slice(i, i + total));
        i += total;
    }
    const result = Buffer.concat(parts);
    result.writeUInt32LE(result.length - 8, 4);
    return result;
}

// ─── PDF ──────────────────────────────────────────────────────────────────────

function readPdfMetadata(buf: Buffer): MetadataField[] {
    const fields: MetadataField[] = [];
    const text = buf.toString('latin1');
    const pick = (rx: RegExp, label: string, key: string) => {
        const m = text.match(rx);
        if (m && m[1].trim()) fields.push({ key, label, value: m[1].trim().substring(0, 80), removable: true });
    };
    pick(/\/Title\s*\(([^)]*)\)/, 'Título', 'title');
    pick(/\/Author\s*\(([^)]*)\)/, 'Autor', 'author');
    pick(/\/Subject\s*\(([^)]*)\)/, 'Assunto', 'subject');
    pick(/\/Keywords\s*\(([^)]*)\)/, 'Palavras-chave', 'keywords');
    pick(/\/Creator\s*\(([^)]*)\)/, 'Criado Com', 'creator');
    pick(/\/Producer\s*\(([^)]*)\)/, 'Produzido Por', 'producer');
    pick(/\/CreationDate\s*\(([^)]*)\)/, 'Data de Criação', 'creationDate');
    pick(/\/ModDate\s*\(([^)]*)\)/, 'Data de Modificação', 'modDate');
    if (text.includes('xmpmeta') || text.includes('x:xmpmeta')) {
        fields.push({ key: 'xmp', label: 'Metadados XMP', value: 'Presente', removable: true });
    }
    if (fields.length === 0) fields.push({ key: 'none', label: 'Sem metadados detectados', value: 'Arquivo já limpo', removable: false });
    return fields;
}

function stripPdf(buf: Buffer): Buffer {
    let text = buf.toString('latin1');
    const infoFields = ['Title', 'Author', 'Subject', 'Keywords', 'Creator', 'Producer', 'CreationDate', 'ModDate', 'Trapped'];
    for (const f of infoFields) {
        text = text.replace(new RegExp(`/${f}\\s*\\([^)]*\\)`, 'g'), `/${f} ()`);
        text = text.replace(new RegExp(`/${f}\\s*<[^>]*>`, 'g'), `/${f} <>`);
    }
    text = text.replace(/<\?xpacket[\s\S]*?\?>/g, '');
    text = text.replace(/<x:xmpmeta[\s\S]*?<\/x:xmpmeta>/g, '');
    return Buffer.from(text, 'latin1');
}

// ─── DOCX ─────────────────────────────────────────────────────────────────────

async function readDocxMetadata(buf: Buffer): Promise<MetadataField[]> {
    const fields: MetadataField[] = [];
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const JSZip = require('jszip');
        const zip = await JSZip.loadAsync(buf);
        const getTag = (xml: string, tag: string) => {
            const m = xml.match(new RegExp(`<[^>]*:?${tag}[^>]*>([^<]*)<`));
            return m ? m[1].trim() : null;
        };
        const coreFile = zip.file('docProps/core.xml');
        if (coreFile) {
            const xml = await coreFile.async('string');
            const pairs: [string, string, string][] = [
                ['creator', 'Autor', 'author'],
                ['lastModifiedBy', 'Última Modificação Por', 'lastModBy'],
                ['created', 'Data de Criação', 'created'],
                ['modified', 'Data de Modificação', 'modified'],
                ['title', 'Título', 'title'],
                ['description', 'Descrição', 'desc'],
                ['subject', 'Assunto', 'subject'],
                ['keywords', 'Palavras-chave', 'keywords'],
            ];
            for (const [tag, label, key] of pairs) {
                const val = getTag(xml, tag);
                if (val) fields.push({ key, label, value: val.substring(0, 80), removable: true });
            }
        }
        const appFile = zip.file('docProps/app.xml');
        if (appFile) {
            const xml = await appFile.async('string');
            const getSimple = (t: string) => { const m = xml.match(new RegExp(`<${t}>([^<]*)<`)); return m ? m[1].trim() : null; };
            const app = getSimple('Application');
            if (app) fields.push({ key: 'app', label: 'Aplicativo', value: app, removable: true });
            const company = getSimple('Company');
            if (company) fields.push({ key: 'company', label: 'Empresa', value: company, removable: true });
        }
    } catch (e) {
        fields.push({ key: 'err', label: 'Erro ao ler DOCX', value: String(e), removable: false });
    }
    if (fields.filter(f => f.removable).length === 0) {
        fields.push({ key: 'none', label: 'Sem metadados detectados', value: 'Arquivo já limpo', removable: false });
    }
    return fields;
}

async function stripDocx(buf: Buffer): Promise<Buffer> {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const JSZip = require('jszip');
    const zip = await JSZip.loadAsync(buf);
    if (zip.file('docProps/core.xml')) {
        zip.file('docProps/core.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"></cp:coreProperties>`);
    }
    if (zip.file('docProps/app.xml')) {
        zip.file('docProps/app.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"></Properties>`);
    }
    return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

// ─── MP3 ──────────────────────────────────────────────────────────────────────

function readMp3Metadata(buf: Buffer): MetadataField[] {
    const fields: MetadataField[] = [];
    if (buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) {
        fields.push({ key: 'id3v2', label: 'Tag ID3v2', value: 'Presente (artista, álbum, data, capa)', removable: true });
        const peek = buf.slice(0, Math.min(8192, buf.length)).toString('binary');
        if (peek.includes('COMM')) fields.push({ key: 'comment', label: 'Comentário ID3', value: 'Presente', removable: true });
        if (peek.includes('APIC')) fields.push({ key: 'cover', label: 'Capa de Álbum Embutida', value: 'Presente', removable: true });
    }
    if (buf.length >= 128) {
        const tail = buf.slice(buf.length - 128);
        if (tail[0] === 0x54 && tail[1] === 0x41 && tail[2] === 0x47) {
            fields.push({ key: 'id3v1', label: 'Tag ID3v1', value: 'Presente', removable: true });
        }
    }
    if (fields.length === 0) fields.push({ key: 'none', label: 'Sem metadados detectados', value: 'Arquivo já limpo', removable: false });
    return fields;
}

function stripMp3(buf: Buffer): Buffer {
    let start = 0;
    let end = buf.length;
    if (buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) {
        const size = ((buf[6] & 0x7F) << 21) | ((buf[7] & 0x7F) << 14) | ((buf[8] & 0x7F) << 7) | (buf[9] & 0x7F);
        start = 10 + size;
    }
    if (buf.length >= 128) {
        const tail = buf.slice(buf.length - 128);
        if (tail[0] === 0x54 && tail[1] === 0x41 && tail[2] === 0x47) end = buf.length - 128;
    }
    return buf.slice(start, end);
}

// ─── WAV ──────────────────────────────────────────────────────────────────────

function readWavMetadata(buf: Buffer): MetadataField[] {
    const fields: MetadataField[] = [];
    if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE') return fields;
    let i = 12;
    while (i < buf.length - 8) {
        const id = buf.toString('ascii', i, i + 4);
        const size = buf.readUInt32LE(i + 4);
        if (id === 'LIST') {
            const listType = buf.toString('ascii', i + 8, i + 12);
            if (listType === 'INFO') fields.push({ key: 'info', label: 'Bloco INFO (artista, título, data)', value: 'Presente', removable: true });
        } else if (id === 'id3 ' || id === 'ID3 ') {
            fields.push({ key: 'id3', label: 'Tag ID3', value: 'Presente', removable: true });
        }
        i += 8 + size + (size % 2);
    }
    if (fields.length === 0) fields.push({ key: 'none', label: 'Sem metadados detectados', value: 'Arquivo já limpo', removable: false });
    return fields;
}

function stripWav(buf: Buffer): Buffer {
    if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE') return buf;
    const keep = new Set(['fmt ', 'data', 'fact', 'PEAK', 'cue ', 'smpl']);
    const parts: Buffer[] = [buf.slice(0, 12)];
    let i = 12;
    while (i < buf.length - 8) {
        const id = buf.toString('ascii', i, i + 4);
        const size = buf.readUInt32LE(i + 4);
        const total = 8 + size + (size % 2);
        if (keep.has(id)) parts.push(buf.slice(i, i + total));
        i += total;
    }
    const result = Buffer.concat(parts);
    result.writeUInt32LE(result.length - 8, 4);
    return result;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function readMetadata(filePath: string): Promise<MetadataField[]> {
    const ext = path.extname(filePath).toLowerCase().replace('.', '');
    
    if (ext === 'mp4' || ext === 'mov') {
        return new Promise((resolve) => {
            ffmpeg.ffprobe(filePath, (err, metadata) => {
                if (err) {
                    resolve([{ key: 'error', label: 'Erro', value: 'Falha ao ler metadados com ffprobe', removable: false }]);
                    return;
                }
                const fields: MetadataField[] = [];
                const formatTags = metadata.format?.tags || {};
                for (const [key, val] of Object.entries(formatTags)) {
                    fields.push({
                        key: `tag_${key}`,
                        label: key,
                        value: String(val).substring(0, 100),
                        removable: true
                    });
                }
                if (fields.length === 0) {
                    fields.push({ key: 'none', label: 'Sem metadados detectados', value: 'Arquivo de vídeo limpo', removable: false });
                }
                resolve(fields);
            });
        });
    }

    const buf = fs.readFileSync(filePath);
    switch (ext) {
        case 'jpg': case 'jpeg': return readJpegMetadata(buf);
        case 'png': return readPngMetadata(buf);
        case 'webp': return readWebpMetadata(buf);
        case 'pdf': return readPdfMetadata(buf);
        case 'docx': return readDocxMetadata(buf);
        case 'mp3': return readMp3Metadata(buf);
        case 'wav': return readWavMetadata(buf);
        default:
            return [{ key: 'unsupported', label: 'Formato não suportado', value: ext.toUpperCase(), removable: false }];
    }
}

export async function cleanFile(filePath: string): Promise<CleanResult> {
    const ext = path.extname(filePath).toLowerCase().replace('.', '');
    const baseName = path.basename(filePath, path.extname(filePath));
    const outputDir = path.join(path.dirname(filePath), 'arquivos_limpos');

    try {
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

        const outputPath = path.join(outputDir, `${baseName}_limpo.${ext}`);
        const warnings: string[] = [];
        let removed = 0;

        if (ext === 'mp4' || ext === 'mov') {
            await new Promise<void>((resolve, reject) => {
                ffmpeg(filePath)
                    .outputOptions([
                        '-map_metadata', '-1',
                        '-c:v', 'copy',
                        '-c:a', 'copy'
                    ])
                    .save(outputPath)
                    .on('end', () => resolve())
                    .on('error', (err) => reject(err));
            });
            removed = 1;
        } else {
            const buf = fs.readFileSync(filePath);
            let out: Buffer;

            switch (ext) {
                case 'jpg': case 'jpeg':
                    removed = readJpegMetadata(buf).filter(f => f.removable).length;
                    out = stripJpeg(buf);
                    break;
                case 'png':
                    removed = readPngMetadata(buf).filter(f => f.removable).length;
                    out = stripPng(buf);
                    break;
                case 'webp':
                    removed = readWebpMetadata(buf).filter(f => f.removable).length;
                    out = stripWebp(buf);
                    break;
                case 'pdf':
                    removed = readPdfMetadata(buf).filter(f => f.removable).length;
                    out = stripPdf(buf);
                    warnings.push('PDFs complexos podem manter metadados em streams internos. Verifique o resultado.');
                    break;
                case 'docx':
                    removed = (await readDocxMetadata(buf)).filter(f => f.removable).length;
                    out = await stripDocx(buf);
                    break;
                case 'mp3':
                    removed = readMp3Metadata(buf).filter(f => f.removable).length;
                    out = stripMp3(buf);
                    break;
                case 'wav':
                    removed = readWavMetadata(buf).filter(f => f.removable).length;
                    out = stripWav(buf);
                    break;
                default:
                    return { success: false, error: `Formato .${ext} não suportado` };
            }
            fs.writeFileSync(outputPath, out);
        }

        appendHistory({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            fileName: path.basename(filePath),
            fileType: ext.toUpperCase(),
            processedAt: new Date().toISOString(),
            outputPath,
            metadataRemoved: removed,
        });

        return { success: true, outputPath, removedCount: removed, warnings };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}
