export type PostgresDataType = 
  | 'int2' | 'int4' | 'int8' 
  | 'float4' | 'float8' | 'numeric' 
  | 'text' | 'varchar' | 'uuid' 
  | 'date' | 'time' | 'timestamp' | 'timestamptz' 
  | 'bool' | 'bytea' 
  | 'json' | 'jsonb';

export interface PostgresColumnSchema {
  id: string;
  name: string;
  type: PostgresDataType;
  isPrimaryKey?: boolean;
  isNullable?: boolean;
  defaultValue?: string;
  width?: number;
  hidden?: boolean;
}

export interface PostgresRowData {
  id: string;
  [key: string]: any;
}

export interface ViewSettingsConfig {
  layout: 'table' | 'board' | 'timeline' | 'calendar' | 'list' | 'gallery' | 'chart' | 'feed' | 'map' | 'dashboard' | 'form';
  showDataSourceTitle: boolean;
  showVerticalLines: boolean;
  showPageIcon: boolean;
  wrapAllContent: boolean;
  hiddenColumnIds: string[];
  openPagesIn: 'side_peek' | 'center_peek' | 'full_page';
  loadLimit: number;
}

export const POSTGRES_TYPE_GROUPS: Record<string, { label: string; types: PostgresDataType[] }> = {
  numbers: {
    label: 'Numéricos',
    types: ['int2', 'int4', 'int8', 'float4', 'float8', 'numeric']
  },
  text: {
    label: 'Texto & Identificadores',
    types: ['text', 'varchar', 'uuid']
  },
  datetime: {
    label: 'Data & Hora',
    types: ['date', 'time', 'timestamp', 'timestamptz']
  },
  boolean: {
    label: 'Lógicos & Binários',
    types: ['bool', 'bytea']
  },
  json: {
    label: 'Objetos & JSON',
    types: ['json', 'jsonb']
  }
};
