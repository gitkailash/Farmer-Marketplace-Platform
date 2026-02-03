export interface TranslationMap {
  [key: string]: string | TranslationMap;
}

export interface ValidationReport {
  namespace: string;
  completeness: number;
  missingKeys: string[];
  totalKeys: number;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  errors: string[];
  warnings: string[];
}

export interface TranslationService {
  getTranslations(language: 'en' | 'ne', namespace?: string): Promise<TranslationMap>;
  updateTranslation(key: string, translations: Partial<TranslationMap>): Promise<void>;
  validateTranslationCompleteness(namespace?: string): Promise<ValidationReport>;
  exportTranslations(format: 'json' | 'csv'): Promise<Buffer>;
  importTranslations(data: Buffer, format: 'json' | 'csv'): Promise<ImportResult>;
}

export interface TranslationKey {
  key: string;
  namespace: string;
  translations: {
    en: string;
    ne?: string;
  };
  context?: string;
  isRequired: boolean;
  lastUpdated: Date;
  updatedBy: string;
}

export interface CreateTranslationRequest {
  key: string;
  namespace: string;
  translations: {
    en: string;
    ne?: string;
  };
  context?: string;
  isRequired?: boolean;
}

export interface UpdateTranslationRequest {
  translations?: {
    en?: string;
    ne?: string;
  };
  context?: string;
  isRequired?: boolean;
}