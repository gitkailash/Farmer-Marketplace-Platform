import { Request, Response } from 'express';
import { TranslationService } from '../services/TranslationService';
import { ContentLocalizer } from '../services/ContentLocalizer';
import { CreateTranslationRequest, UpdateTranslationRequest } from '../services/types/translation.types';
import { CreateContentRequest, UpdateContentRequest, SearchQuery } from '../services/types/content.types';

const translationService = new TranslationService();
const contentLocalizer = new ContentLocalizer();

export class TranslationController {
  /**
   * Get translations for a specific language and namespace
   */
  async getTranslations(req: Request, res: Response): Promise<void> {
    try {
      const { language, namespace } = req.query;
      
      if (!language || (language !== 'en' && language !== 'ne')) {
        res.status(400).json({ 
          error: 'Language parameter is required and must be "en" or "ne"' 
        });
        return;
      }

      const translations = await translationService.getTranslations(
        language as 'en' | 'ne',
        namespace as string
      );

      res.json({
        success: true,
        data: {
          language,
          namespace: namespace || 'all',
          translations
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Create a new translation key
   */
  async createTranslation(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const translationData: CreateTranslationRequest = req.body;
      
      // Validate required fields
      if (!translationData.key || !translationData.namespace || !translationData.translations?.en) {
        res.status(400).json({
          error: 'Key, namespace, and English translation are required'
        });
        return;
      }

      const translation = await translationService.createTranslation(translationData, userId);

      res.status(201).json({
        success: true,
        data: translation
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('already exists')) {
        res.status(409).json({
          success: false,
          error: errorMessage
        });
      } else {
        res.status(500).json({
          success: false,
          error: errorMessage
        });
      }
    }
  }

  /**
   * Update an existing translation key
   */
  async updateTranslation(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { key } = req.params;
      if (!key) {
        res.status(400).json({ error: 'Translation key is required' });
        return;
      }

      const updateData: UpdateTranslationRequest = req.body;

      const translation = await translationService.updateTranslationKey(key, updateData, userId);

      res.json({
        success: true,
        data: translation
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('not found')) {
        res.status(404).json({
          success: false,
          error: errorMessage
        });
      } else {
        res.status(500).json({
          success: false,
          error: errorMessage
        });
      }
    }
  }

  /**
   * Delete a translation key
   */
  async deleteTranslation(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      if (!key) {
        res.status(400).json({ error: 'Translation key is required' });
        return;
      }

      await translationService.deleteTranslation(key);

      res.json({
        success: true,
        message: 'Translation deleted successfully'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('not found')) {
        res.status(404).json({
          success: false,
          error: errorMessage
        });
      } else {
        res.status(500).json({
          success: false,
          error: errorMessage
        });
      }
    }
  }

  /**
   * Get all translation keys with pagination
   */
  async getTranslationKeys(req: Request, res: Response): Promise<void> {
    try {
      const { namespace, page = '1', limit = '50' } = req.query;
      
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
        res.status(400).json({
          error: 'Invalid pagination parameters'
        });
        return;
      }

      const result = await translationService.getTranslationKeys(
        namespace as string,
        pageNum,
        limitNum
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Validate translation completeness
   */
  async validateCompleteness(req: Request, res: Response): Promise<void> {
    try {
      const { namespace } = req.query;
      
      const report = await translationService.validateTranslationCompleteness(
        namespace as string
      );

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Export translations
   */
  async exportTranslations(req: Request, res: Response): Promise<void> {
    try {
      const { format = 'json' } = req.query;
      
      if (format !== 'json' && format !== 'csv') {
        res.status(400).json({
          error: 'Format must be "json" or "csv"'
        });
        return;
      }

      const exportData = await translationService.exportTranslations(format as 'json' | 'csv');
      
      const filename = `translations_${new Date().toISOString().split('T')[0]}.${format}`;
      const contentType = format === 'json' ? 'application/json' : 'text/csv';

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(exportData);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Import translations
   */
  async importTranslations(req: Request, res: Response): Promise<void> {
    try {
      const { format = 'json' } = req.body;
      
      if (!req.file) {
        res.status(400).json({
          error: 'File is required for import'
        });
        return;
      }

      if (format !== 'json' && format !== 'csv') {
        res.status(400).json({
          error: 'Format must be "json" or "csv"'
        });
        return;
      }

      const result = await translationService.importTranslations(
        req.file.buffer,
        format as 'json' | 'csv'
      );

      res.json({
        success: result.success,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Create multilingual content
   */
  async createMultilingualContent(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const contentData: CreateContentRequest = {
        ...req.body,
        metadata: {
          ...req.body.metadata,
          createdBy: userId
        }
      };

      const content = await contentLocalizer.createMultilingualContent(contentData);

      res.status(201).json({
        success: true,
        data: content
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Update multilingual content
   */
  async updateMultilingualContent(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ error: 'Content ID is required' });
        return;
      }

      const updateData: UpdateContentRequest = req.body;

      const content = await contentLocalizer.updateMultilingualContent(id, updateData);

      res.json({
        success: true,
        data: content
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('not found')) {
        res.status(404).json({
          success: false,
          error: errorMessage
        });
      } else {
        res.status(500).json({
          success: false,
          error: errorMessage
        });
      }
    }
  }

  /**
   * Search multilingual content
   */
  async searchMultilingualContent(req: Request, res: Response): Promise<void> {
    try {
      const searchQuery: SearchQuery = {
        text: req.query.text as string,
        language: req.query.language as 'en' | 'ne' | 'both',
        contentType: req.query.contentType as string,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string, 10) : 0
      };

      // Parse date filters if provided
      if (req.query.dateFrom) {
        searchQuery.dateFrom = new Date(req.query.dateFrom as string);
      }
      if (req.query.dateTo) {
        searchQuery.dateTo = new Date(req.query.dateTo as string);
      }

      const results = await contentLocalizer.searchMultilingualContent(searchQuery);

      res.json({
        success: true,
        data: {
          results,
          query: searchQuery,
          total: results.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get localized content
   */
  async getLocalizedContent(req: Request, res: Response): Promise<void> {
    try {
      const { contentType, id } = req.params;
      const { language = 'en' } = req.query;

      if (!contentType || !id) {
        res.status(400).json({
          error: 'Content type and ID are required'
        });
        return;
      }

      if (language !== 'en' && language !== 'ne') {
        res.status(400).json({
          error: 'Language must be "en" or "ne"'
        });
        return;
      }

      const content = await contentLocalizer.getLocalizedContent(
        contentType,
        id,
        language as 'en' | 'ne'
      );

      res.json({
        success: true,
        data: content
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('not found')) {
        res.status(404).json({
          success: false,
          error: errorMessage
        });
      } else {
        res.status(500).json({
          success: false,
          error: errorMessage
        });
      }
    }
  }

  /**
   * Get translation history for a specific key
   */
  async getTranslationHistory(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      const { limit = '10' } = req.query;

      if (!key) {
        res.status(400).json({ error: 'Translation key is required' });
        return;
      }

      const limitNum = parseInt(limit as string, 10);
      if (limitNum < 1 || limitNum > 100) {
        res.status(400).json({
          error: 'Limit must be between 1 and 100'
        });
        return;
      }

      const history = await translationService.getTranslationHistory(
        decodeURIComponent(key),
        limitNum
      );

      res.json({
        success: true,
        data: {
          key: decodeURIComponent(key),
          history
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('not found')) {
        res.status(404).json({
          success: false,
          error: errorMessage
        });
      } else {
        res.status(500).json({
          success: false,
          error: errorMessage
        });
      }
    }
  }

  /**
   * Get recent changes across all translations
   */
  async getRecentChanges(req: Request, res: Response): Promise<void> {
    try {
      const { namespace, limit = '50' } = req.query;

      const limitNum = parseInt(limit as string, 10);
      if (limitNum < 1 || limitNum > 100) {
        res.status(400).json({
          error: 'Limit must be between 1 and 100'
        });
        return;
      }

      const changes = await translationService.getRecentChanges(
        namespace as string,
        limitNum
      );

      res.json({
        success: true,
        data: {
          namespace: namespace || 'all',
          changes
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Rollback a translation to a previous version
   */
  async rollbackTranslation(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { key } = req.params;
      const { version, reason } = req.body;

      if (!key) {
        res.status(400).json({ error: 'Translation key is required' });
        return;
      }

      if (!version || typeof version !== 'number' || version < 1) {
        res.status(400).json({ error: 'Valid version number is required' });
        return;
      }

      const translation = await translationService.rollbackTranslation(
        decodeURIComponent(key),
        version,
        userId,
        reason
      );

      res.json({
        success: true,
        data: translation
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('not found')) {
        res.status(404).json({
          success: false,
          error: errorMessage
        });
      } else {
        res.status(500).json({
          success: false,
          error: errorMessage
        });
      }
    }
  }

  /**
   * Compare two versions of a translation
   */
  async compareVersions(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      const { version1, version2 } = req.query;

      if (!key) {
        res.status(400).json({ error: 'Translation key is required' });
        return;
      }

      const v1 = parseInt(version1 as string, 10);
      const v2 = parseInt(version2 as string, 10);

      if (!v1 || !v2 || v1 < 1 || v2 < 1) {
        res.status(400).json({ error: 'Valid version numbers are required' });
        return;
      }

      const comparison = await translationService.compareVersions(
        decodeURIComponent(key),
        v1,
        v2
      );

      res.json({
        success: true,
        data: comparison
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('not found')) {
        res.status(404).json({
          success: false,
          error: errorMessage
        });
      } else {
        res.status(500).json({
          success: false,
          error: errorMessage
        });
      }
    }
  }
}