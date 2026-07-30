/**
 * ============================================================================
 * FINGERPRINT CORE - CONTRATO E INTERFACE PÚBLICA PROTEGIDA
 * ============================================================================
 * Este módulo atua como a fachada (Facade) do motor de Anti-Detect e Fingerprint.
 * Todas as chamadas externas (inclusive do módulo Multi) DEVEM passar por este contrato.
 * A implementação interna (em `src/main/features/fingerprint` e `src/main/features/browser`)
 * permanece congelada e isolada contra alterações indevidas.
 */

import { generateFingerprint as internalGenerateFingerprint } from '../features/fingerprint/generator';
import { validateConsistency as internalValidateConsistency } from '../features/fingerprint/consistency-engine';
import {
    launchProfile as internalLaunchProfile,
    closeProfile as internalCloseProfile,
    closeAllProfiles as internalCloseAllProfiles,
    isProfileActive as internalIsProfileActive,
    getActiveContexts as internalGetActiveContexts,
    NativeBrowserContext
} from '../features/browser/browser-engine';
import { Fingerprint, Profile } from '../features/profile/types';

export interface IFingerprintCoreAPI {
    /**
     * Gera uma nova impressão digital (Fingerprint) consistente.
     */
    generateFingerprint(profileId: string, options?: { platform?: 'windows' | 'macos' | 'linux'; country?: any }): Fingerprint;

    /**
     * Valida a consistência de um objeto Fingerprint existente.
     */
    validateConsistency(fp: Fingerprint, proxyCountry?: string, proxyTimezone?: string): ReturnType<typeof internalValidateConsistency>;

    /**
     * Lança o navegador para o ID de perfil especificado.
     */
    launchProfile(profileId: string): Promise<NativeBrowserContext>;

    /**
     * Encerra a execução de um perfil específico.
     */
    closeProfile(profileId: string): Promise<boolean>;

    /**
     * Encerra todas as instâncias de perfis em execução.
     */
    closeAllProfiles(): Promise<void>;

    /**
     * Verifica se um perfil está em execução no momento.
     */
    isProfileRunning(profileId: string): boolean;

    /**
     * Retorna a lista de IDs de perfis em execução.
     */
    getRunningProfiles(): string[];
}

export const FingerprintCoreAPI: IFingerprintCoreAPI = {
    generateFingerprint: (profileId, options) => internalGenerateFingerprint(profileId, options as any),
    validateConsistency: (fp, proxyCountry, proxyTimezone) => internalValidateConsistency(fp, proxyCountry, proxyTimezone),
    launchProfile: (profileId) => internalLaunchProfile(profileId),
    closeProfile: (profileId) => internalCloseProfile(profileId),
    closeAllProfiles: () => internalCloseAllProfiles(),
    isProfileRunning: (profileId) => internalIsProfileActive(profileId),
    getRunningProfiles: () => Array.from(internalGetActiveContexts().keys()),
};

export type { Fingerprint, Profile, NativeBrowserContext };
