import { TranslationService } from './TranslationService';

export interface NotificationTemplate {
  type: 'ORDER_UPDATE' | 'NEW_MESSAGE' | 'REVIEW_APPROVED' | 'ADMIN_ANNOUNCEMENT';
  titleKey: string;
  messageKey: string;
  variables?: string[];
}

export interface LocalizedNotification {
  title: string;
  message: string;
  language: 'en' | 'ne';
}

export class NotificationTemplateService {
  private translationService: TranslationService;
  
  // Predefined notification templates
  private templates: Record<string, NotificationTemplate> = {
    ORDER_CREATED: {
      type: 'ORDER_UPDATE',
      titleKey: 'notifications.order.created.title',
      messageKey: 'notifications.order.created.message',
      variables: ['orderNumber', 'farmerName']
    },
    ORDER_ACCEPTED: {
      type: 'ORDER_UPDATE',
      titleKey: 'notifications.order.accepted.title',
      messageKey: 'notifications.order.accepted.message',
      variables: ['orderNumber']
    },
    ORDER_COMPLETED: {
      type: 'ORDER_UPDATE',
      titleKey: 'notifications.order.completed.title',
      messageKey: 'notifications.order.completed.message',
      variables: ['orderNumber']
    },
    ORDER_CANCELLED: {
      type: 'ORDER_UPDATE',
      titleKey: 'notifications.order.cancelled.title',
      messageKey: 'notifications.order.cancelled.message',
      variables: ['orderNumber', 'reason']
    },
    NEW_MESSAGE: {
      type: 'NEW_MESSAGE',
      titleKey: 'notifications.message.new.title',
      messageKey: 'notifications.message.new.message',
      variables: ['senderName', 'preview']
    },
    REVIEW_APPROVED: {
      type: 'REVIEW_APPROVED',
      titleKey: 'notifications.review.approved.title',
      messageKey: 'notifications.review.approved.message',
      variables: ['reviewerName', 'rating']
    },
    ADMIN_ANNOUNCEMENT: {
      type: 'ADMIN_ANNOUNCEMENT',
      titleKey: 'notifications.admin.announcement.title',
      messageKey: 'notifications.admin.announcement.message',
      variables: ['subject']
    },
    PRODUCT_LOW_STOCK: {
      type: 'ADMIN_ANNOUNCEMENT',
      titleKey: 'notifications.product.lowStock.title',
      messageKey: 'notifications.product.lowStock.message',
      variables: ['productName', 'currentStock']
    },
    FARMER_VERIFICATION: {
      type: 'ADMIN_ANNOUNCEMENT',
      titleKey: 'notifications.farmer.verification.title',
      messageKey: 'notifications.farmer.verification.message',
      variables: ['status']
    }
  };

  constructor(translationService: TranslationService) {
    this.translationService = translationService;
  }

  /**
   * Generate localized notification based on template and user's preferred language
   */
  async generateNotification(
    templateKey: string,
    userLanguage: 'en' | 'ne',
    variables: Record<string, string> = {}
  ): Promise<LocalizedNotification> {
    const template = this.templates[templateKey];
    if (!template) {
      throw new Error(`Notification template '${templateKey}' not found`);
    }

    // Get translations for the user's preferred language
    const translations = await this.translationService.getTranslations(userLanguage, 'notifications');

    // Get title and message templates
    const titleTemplate = this.getNestedValue(translations, template.titleKey) || 
                         this.getNestedValue(translations, template.titleKey.replace('notifications.', ''));
    const messageTemplate = this.getNestedValue(translations, template.messageKey) || 
                           this.getNestedValue(translations, template.messageKey.replace('notifications.', ''));

    if (!titleTemplate || !messageTemplate) {
      // Fallback to English if translation not found
      const englishTranslations = await this.translationService.getTranslations('en', 'notifications');
      const fallbackTitle = this.getNestedValue(englishTranslations, template.titleKey) || 
                           this.getNestedValue(englishTranslations, template.titleKey.replace('notifications.', ''));
      const fallbackMessage = this.getNestedValue(englishTranslations, template.messageKey) || 
                             this.getNestedValue(englishTranslations, template.messageKey.replace('notifications.', ''));
      
      return {
        title: this.interpolateTemplate(fallbackTitle || 'Notification', variables),
        message: this.interpolateTemplate(fallbackMessage || 'You have a new notification', variables),
        language: 'en' // Indicate fallback was used
      };
    }

    return {
      title: this.interpolateTemplate(titleTemplate, variables),
      message: this.interpolateTemplate(messageTemplate, variables),
      language: userLanguage
    };
  }

  /**
   * Generate system message in user's preferred language
   */
  async generateSystemMessage(
    messageKey: string,
    userLanguage: 'en' | 'ne',
    variables: Record<string, string> = {}
  ): Promise<string> {
    const translations = await this.translationService.getTranslations(userLanguage, 'common');
    const messageTemplate = this.getNestedValue(translations, messageKey);

    if (!messageTemplate) {
      // Fallback to English
      const englishTranslations = await this.translationService.getTranslations('en', 'common');
      const fallbackMessage = this.getNestedValue(englishTranslations, messageKey);
      return this.interpolateTemplate(fallbackMessage || messageKey, variables);
    }

    return this.interpolateTemplate(messageTemplate, variables);
  }

  /**
   * Get available notification templates
   */
  getAvailableTemplates(): Record<string, NotificationTemplate> {
    return { ...this.templates };
  }

  /**
   * Add or update a notification template
   */
  setTemplate(key: string, template: NotificationTemplate): void {
    this.templates[key] = template;
  }

  /**
   * Remove a notification template
   */
  removeTemplate(key: string): boolean {
    if (this.templates[key]) {
      delete this.templates[key];
      return true;
    }
    return false;
  }

  // Private helper methods

  private getNestedValue(obj: any, path: string): string | undefined {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  private interpolateTemplate(template: string, variables: Record<string, string>): string {
    let result = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), value);
    });

    return result;
  }
}