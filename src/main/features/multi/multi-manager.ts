/**
 * ============================================================================
 * MÓDULO MULTI - GERENCIADOR DE MÚLTIPLOS PERFIS E ISOLAMENTO DE CONTAS
 * ============================================================================
 * Este módulo orquestra ações em massa, execução isolada de múltiplos perfis,
 * proxies e sincronização de contas sem interferir na lógica do motor Fingerprint Core.
 */

import { FingerprintCoreAPI } from '../../fingerprint-core';
import { getProfileById } from '../profile/profile-manager';

export interface MultiLaunchResult {
    profileId: string;
    success: boolean;
    error?: string;
}

export class MultiManager {
    /**
     * Executa a inicialização em massa de múltiplos perfis isolados.
     */
    static async launchProfiles(profileIds: string[]): Promise<MultiLaunchResult[]> {
        const results: MultiLaunchResult[] = [];

        for (const id of profileIds) {
            try {
                const profile = getProfileById(id);
                if (!profile) {
                    results.push({ profileId: id, success: false, error: 'Perfil não encontrado no banco local.' });
                    continue;
                }

                if (FingerprintCoreAPI.isProfileRunning(id)) {
                    results.push({ profileId: id, success: true, error: 'Perfil já se encontra em execução.' });
                    continue;
                }

                await FingerprintCoreAPI.launchProfile(id);
                results.push({
                    profileId: id,
                    success: true
                });
            } catch (err: any) {
                results.push({
                    profileId: id,
                    success: false,
                    error: err?.message || 'Erro desconhecido ao lançar perfil.'
                });
            }
        }

        return results;
    }

    /**
     * Encerra a execução em massa de múltiplos perfis.
     */
    static async stopProfiles(profileIds: string[]): Promise<Record<string, boolean>> {
        const results: Record<string, boolean> = {};
        for (const id of profileIds) {
            results[id] = await FingerprintCoreAPI.closeProfile(id);
        }
        return results;
    }

    /**
     * Encerra todas as instâncias ativas do sistema Multi.
     */
    static async stopAll(): Promise<void> {
        await FingerprintCoreAPI.closeAllProfiles();
    }

    /**
     * Retorna o status de execução de todos os perfis cadastrados.
     */
    static getActiveProfilesStatus(): { runningCount: number; activeIds: string[] } {
        const activeIds = FingerprintCoreAPI.getRunningProfiles();
        return {
            runningCount: activeIds.length,
            activeIds
        };
    }
}
