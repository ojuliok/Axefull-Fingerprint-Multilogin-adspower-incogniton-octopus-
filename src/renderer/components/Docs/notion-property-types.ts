import React from 'react';
import { PostgresDataType } from '../../../shared/postgres-types';

export interface NotionPropertyTypeDefinition {
    id: string;
    label: string;
    iconName: string;
    postgresType: PostgresDataType;
    defaultBg?: string;
    defaultColor?: string;
}

export const NOTION_PROPERTY_TYPES: NotionPropertyTypeDefinition[] = [
    { id: 'text', label: 'Texto', iconName: 'Type', postgresType: 'text' },
    { id: 'number', label: 'Número', iconName: 'Hash', postgresType: 'numeric' },
    { id: 'select', label: 'Selecionar', iconName: 'CircleDot', postgresType: 'text' },
    { id: 'multi_select', label: 'Seleção múltipla', iconName: 'ListFilter', postgresType: 'jsonb' },
    { id: 'status', label: 'Status', iconName: 'Sparkles', postgresType: 'text' },
    { id: 'date', label: 'Data', iconName: 'Calendar', postgresType: 'timestamptz' },
    { id: 'person', label: 'Pessoa', iconName: 'User', postgresType: 'text' },
    { id: 'files', label: 'Arquivos e mídia', iconName: 'Paperclip', postgresType: 'text' },
    { id: 'checkbox', label: 'Caixa de seleção', iconName: 'CheckSquare', postgresType: 'bool' },
    { id: 'url', label: 'URL', iconName: 'Link', postgresType: 'text' },
    { id: 'email', label: 'E-mail', iconName: 'Mail', postgresType: 'text' },
    { id: 'phone', label: 'Telefone', iconName: 'Phone', postgresType: 'text' },
    { id: 'formula', label: 'Fórmula', iconName: 'Calculator', postgresType: 'text' },
    { id: 'relation', label: 'Relação', iconName: 'ArrowUpRight', postgresType: 'uuid' },
    { id: 'rollup', label: 'Rollup', iconName: 'Search', postgresType: 'text' },
    { id: 'created_time', label: 'Criado em', iconName: 'Clock', postgresType: 'timestamptz' },
    { id: 'created_by', label: 'Criado por', iconName: 'UserCheck', postgresType: 'text' },
    { id: 'last_edited_time', label: 'Última edição', iconName: 'Clock', postgresType: 'timestamptz' },
    { id: 'last_edited_by', label: 'Última edição por', iconName: 'UserCheck', postgresType: 'text' },
    { id: 'button', label: 'Botão', iconName: 'MousePointer', postgresType: 'text' },
];
