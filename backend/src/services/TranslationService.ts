import { TranslationKey, ITranslationKey } from '../models/TranslationKey';
import { TranslationHistory, ITranslationHistory } from '../models/TranslationHistory';
import { 
  TranslationService as ITranslationService, 
  TranslationMap, 
  ValidationReport, 
  ImportResult,
  CreateTranslationRequest,
  UpdateTranslationRequest
} from './types/translation.types';
import mongoose from 'mongoose';

export class TranslationService implements ITranslationService {
  /**
   * Get translations for a specific language and optional namespace
   */
  async getTranslations(language: 'en' | 'ne', namespace?: string): Promise<TranslationMap> {
    const query: any = {};
    if (namespace && namespace.trim() !== '') {
      query.namespace = namespace;
    }

    const translationKeys = await TranslationKey.find(query).lean();
    const translationMap: TranslationMap = {};

    for (const translationKey of translationKeys) {
      const translation = translationKey.translations[language];
      if (translation) {
        // If filtering by namespace, strip the namespace prefix from the key
        let keyToUse = translationKey.key;
        if (namespace && namespace.trim() !== '' && translationKey.key.startsWith(namespace + '.')) {
          keyToUse = translationKey.key.substring(namespace.length + 1);
        }
        this.setNestedProperty(translationMap, keyToUse, translation);
      } else if (language === 'ne' && translationKey.translations.en) {
        // Fallback to English if Nepali translation is not available
        let keyToUse = translationKey.key;
        if (namespace && namespace.trim() !== '' && translationKey.key.startsWith(namespace + '.')) {
          keyToUse = translationKey.key.substring(namespace.length + 1);
        }
        this.setNestedProperty(translationMap, keyToUse, translationKey.translations.en);
      }
    }

    return translationMap;
  }

  /**
   * Update a translation key with new translations
   */
  async updateTranslation(key: string, translations: Partial<TranslationMap>): Promise<void> {
    const translationKey = await TranslationKey.findOne({ key });
    if (!translationKey) {
      throw new Error(`Translation key '${key}' not found`);
    }

    // Update translations
    if (translations.en) {
      translationKey.translations.en = translations.en as string;
    }
    if (translations.ne) {
      translationKey.translations.ne = translations.ne as string;
    }

    translationKey.lastUpdated = new Date();
    await translationKey.save();
  }

  /**
   * Validate translation completeness for a namespace
   */
  async validateTranslationCompleteness(namespace?: string): Promise<ValidationReport> {
    const query: any = {};
    if (namespace && namespace.trim() !== '') {
      query.namespace = namespace;
    }

    const translationKeys = await TranslationKey.find(query).lean();
    const totalKeys = translationKeys.length;
    const missingKeys: string[] = [];

    let completeTranslations = 0;
    for (const translationKey of translationKeys) {
      if (translationKey.translations.en && translationKey.translations.ne) {
        completeTranslations++;
      } else if (!translationKey.translations.ne) {
        missingKeys.push(translationKey.key);
      }
    }

    const completeness = totalKeys > 0 ? (completeTranslations / totalKeys) * 100 : 100;

    return {
      namespace: namespace || 'all',
      completeness: Math.round(completeness * 100) / 100,
      missingKeys,
      totalKeys
    };
  }

  /**
   * Export translations in specified format
   */
  async exportTranslations(format: 'json' | 'csv'): Promise<Buffer> {
    const translationKeys = await TranslationKey.find({}).lean();

    if (format === 'json') {
      const exportData = {
        exportDate: new Date().toISOString(),
        translations: translationKeys.map(tk => ({
          key: tk.key,
          namespace: tk.namespace,
          en: tk.translations.en,
          ne: tk.translations.ne || '',
          context: tk.context || '',
          isRequired: tk.isRequired
        }))
      };
      return Buffer.from(JSON.stringify(exportData, null, 2));
    } else if (format === 'csv') {
      const csvHeader = 'key,namespace,en,ne,context,isRequired\n';
      const csvRows = translationKeys.map(tk => {
        const escapeCsv = (str: string) => `"${str.replace(/"/g, '""')}"`;
        return [
          escapeCsv(tk.key),
          escapeCsv(tk.namespace),
          escapeCsv(tk.translations.en),
          escapeCsv(tk.translations.ne || ''),
          escapeCsv(tk.context || ''),
          tk.isRequired.toString()
        ].join(',');
      }).join('\n');
      return Buffer.from(csvHeader + csvRows);
    }

    throw new Error(`Unsupported export format: ${format}`);
  }

  /**
   * Import translations from buffer data
   */
  async importTranslations(data: Buffer, format: 'json' | 'csv'): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      imported: 0,
      errors: [],
      warnings: []
    };

    try {
      if (format === 'json') {
        const importData = JSON.parse(data.toString());
        if (!importData.translations || !Array.isArray(importData.translations)) {
          result.errors.push('Invalid JSON format: missing translations array');
          return result;
        }

        for (const translation of importData.translations) {
          try {
            await this.importSingleTranslation(translation);
            result.imported++;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            result.errors.push(`Error importing ${translation.key}: ${errorMessage}`);
          }
        }
      } else if (format === 'csv') {
        const csvContent = data.toString();
        const lines = csvContent.split('\n');
        if (lines.length === 0) {
          result.errors.push('CSV file is empty');
          return result;
        }

        const headers = lines[0]?.split(',').map(h => h.trim().replace(/"/g, '')) || [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          if (!line || line.trim() === '') continue;

          try {
            const values = this.parseCsvLine(line);
            const translation = {
              key: values[0],
              namespace: values[1],
              en: values[2],
              ne: values[3],
              context: values[4],
              isRequired: values[5] === 'true'
            };
            await this.importSingleTranslation(translation);
            result.imported++;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            result.errors.push(`Error importing line ${i + 1}: ${errorMessage}`);
          }
        }
      }

      result.success = result.errors.length === 0;
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Import failed: ${errorMessage}`);
      return result;
    }
  }

  /**
   * Create a new translation key
   */
  async createTranslation(data: CreateTranslationRequest, userId: string): Promise<ITranslationKey> {
    const existingKey = await TranslationKey.findOne({ key: data.key });
    if (existingKey) {
      throw new Error(`Translation key '${data.key}' already exists`);
    }

    const translationKey = new TranslationKey({
      key: data.key,
      namespace: data.namespace,
      translations: data.translations,
      context: data.context,
      isRequired: data.isRequired || false,
      updatedBy: new mongoose.Types.ObjectId(userId)
    });

    const savedKey = await translationKey.save();
    
    // Create history entry
    await (TranslationHistory as any).createHistoryEntry(
      savedKey,
      'CREATE',
      new mongoose.Types.ObjectId(userId),
      'Initial creation'
    );

    return savedKey;
  }

  /**
   * Update an existing translation key
   */
  async updateTranslationKey(key: string, data: UpdateTranslationRequest, userId: string): Promise<ITranslationKey> {
    const translationKey = await TranslationKey.findOne({ key });
    if (!translationKey) {
      throw new Error(`Translation key '${key}' not found`);
    }

    // Store original data for comparison
    const originalData = {
      translations: { ...translationKey.translations },
      context: translationKey.context,
      isRequired: translationKey.isRequired
    };

    if (data.translations) {
      if (data.translations.en) {
        translationKey.translations.en = data.translations.en;
      }
      if (data.translations.ne !== undefined) {
        translationKey.translations.ne = data.translations.ne;
      }
    }

    if (data.context !== undefined) {
      translationKey.context = data.context;
    }

    if (data.isRequired !== undefined) {
      translationKey.isRequired = data.isRequired;
    }

    translationKey.updatedBy = new mongoose.Types.ObjectId(userId);
    translationKey.lastUpdated = new Date();

    const savedKey = await translationKey.save();
    
    // Create history entry
    await (TranslationHistory as any).createHistoryEntry(
      savedKey,
      'UPDATE',
      new mongoose.Types.ObjectId(userId),
      'Translation updated'
    );

    return savedKey;
  }

  /**
   * Delete a translation key
   */
  async deleteTranslation(key: string): Promise<void> {
    const translationKey = await TranslationKey.findOne({ key });
    if (!translationKey) {
      throw new Error(`Translation key '${key}' not found`);
    }

    // Create history entry before deletion
    await (TranslationHistory as any).createHistoryEntry(
      translationKey,
      'DELETE',
      translationKey.updatedBy,
      'Translation key deleted'
    );

    const result = await TranslationKey.deleteOne({ key });
    if (result.deletedCount === 0) {
      throw new Error(`Translation key '${key}' not found`);
    }
  }

  /**
   * Get all translation keys with pagination and search
   */
  async getTranslationKeys(
    namespace?: string, 
    page: number = 1, 
    limit: number = 50,
    search?: string
  ): Promise<{ keys: ITranslationKey[], total: number, page: number, totalPages: number }> {
    const query: any = {};
    
    // Namespace filter
    if (namespace && namespace.trim() !== '') {
      query.namespace = namespace;
    }

    // Search filter
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { key: searchRegex },
        { 'translations.en': searchRegex },
        { 'translations.ne': searchRegex },
        { context: searchRegex }
      ];
    }

    const skip = (page - 1) * limit;
    const [keys, total] = await Promise.all([
      TranslationKey.find(query).skip(skip).limit(limit).sort({ key: 1 }),
      TranslationKey.countDocuments(query)
    ]);

    return {
      keys,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get version history for a translation key
   */
  async getTranslationHistory(
    key: string,
    limit: number = 10
  ): Promise<ITranslationHistory[]> {
    const translationKey = await TranslationKey.findOne({ key });
    if (!translationKey) {
      throw new Error(`Translation key '${key}' not found`);
    }

    return await (TranslationHistory as any).getVersionHistory(translationKey._id, limit);
  }

  /**
   * Get recent changes across all translations
   */
  async getRecentChanges(
    namespace?: string,
    limit: number = 50
  ): Promise<ITranslationHistory[]> {
    return await (TranslationHistory as any).getRecentChanges(namespace, limit);
  }

  /**
   * Rollback a translation key to a previous version
   */
  async rollbackTranslation(
    key: string,
    version: number,
    userId: string,
    reason?: string
  ): Promise<ITranslationKey> {
    const translationKey = await TranslationKey.findOne({ key });
    if (!translationKey) {
      throw new Error(`Translation key '${key}' not found`);
    }

    const historyEntry = await TranslationHistory.findOne({
      translationKey: translationKey._id,
      version
    });

    if (!historyEntry) {
      throw new Error(`Version ${version} not found for translation key '${key}'`);
    }

    // Update the translation key with historical data
    translationKey.translations.en = historyEntry.translations.en;
    if (historyEntry.translations.ne) {
      translationKey.translations.ne = historyEntry.translations.ne;
    }
    if (historyEntry.context !== undefined) {
      translationKey.context = historyEntry.context;
    }
    if (historyEntry.isRequired !== undefined) {
      translationKey.isRequired = historyEntry.isRequired;
    }
    translationKey.updatedBy = new mongoose.Types.ObjectId(userId);
    translationKey.lastUpdated = new Date();

    const savedKey = await translationKey.save();

    // Create history entry for rollback
    await (TranslationHistory as any).createHistoryEntry(
      savedKey,
      'UPDATE',
      new mongoose.Types.ObjectId(userId),
      reason || `Rolled back to version ${version}`
    );

    return savedKey;
  }

  /**
   * Compare two versions of a translation key
   */
  async compareVersions(
    key: string,
    version1: number,
    version2: number
  ): Promise<{ changes: string[], version1: ITranslationHistory, version2: ITranslationHistory }> {
    const translationKey = await TranslationKey.findOne({ key });
    if (!translationKey) {
      throw new Error(`Translation key '${key}' not found`);
    }

    const [hist1, hist2] = await Promise.all([
      TranslationHistory.findOne({ translationKey: translationKey._id, version: version1 }),
      TranslationHistory.findOne({ translationKey: translationKey._id, version: version2 })
    ]);

    if (!hist1) {
      throw new Error(`Version ${version1} not found for translation key '${key}'`);
    }
    if (!hist2) {
      throw new Error(`Version ${version2} not found for translation key '${key}'`);
    }

    const changes = hist2.compareWith(hist1);

    return {
      changes,
      version1: hist1,
      version2: hist2
    };
  }

  // Private helper methods

  private setNestedProperty(obj: TranslationMap, path: string, value: string): void {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!key) continue;
      
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key] as TranslationMap;
    }

    const lastKey = keys[keys.length - 1];
    if (lastKey) {
      current[lastKey] = value;
    }
  }

  private async importSingleTranslation(translation: any): Promise<void> {
    const existingKey = await TranslationKey.findOne({ key: translation.key });
    
    if (existingKey) {
      // Update existing translation
      if (translation.en) existingKey.translations.en = translation.en;
      if (translation.ne) existingKey.translations.ne = translation.ne;
      if (translation.context) existingKey.context = translation.context;
      if (translation.isRequired !== undefined) existingKey.isRequired = translation.isRequired;
      existingKey.lastUpdated = new Date();
      await existingKey.save();
    } else {
      // Create new translation
      const newTranslation = new TranslationKey({
        key: translation.key,
        namespace: translation.namespace,
        translations: {
          en: translation.en,
          ne: translation.ne || undefined
        },
        context: translation.context,
        isRequired: translation.isRequired || false,
        updatedBy: new mongoose.Types.ObjectId('000000000000000000000000') // Default system user
      });
      await newTranslation.save();
    }
  }

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 2;
        } else {
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }
    
    result.push(current);
    return result;
  }
}