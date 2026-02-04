import { 
  ContentLocalizer as IContentLocalizer,
  MultilingualField,
  MultilingualContent,
  CreateContentRequest,
  UpdateContentRequest,
  MultilingualDocument,
  SearchQuery,
  SearchResult
} from './types/content.types';
import { Product, NewsItem, GalleryItem, MayorMessage } from '../models';
import mongoose from 'mongoose';

export class ContentLocalizer implements IContentLocalizer {
  /**
   * Localize content based on user's preferred language
   */
  async localizeContent<T>(content: T, language: 'en' | 'ne'): Promise<T> {
    if (!content || typeof content !== 'object') {
      return content;
    }

    const localizedContent = { ...content } as any;

    // Recursively localize multilingual fields
    for (const [key, value] of Object.entries(localizedContent)) {
      if (this.isMultilingualField(value)) {
        localizedContent[key] = this.localizeField(value, language);
      } else if (Array.isArray(value)) {
        localizedContent[key] = await Promise.all(
          value.map(item => this.localizeContent(item, language))
        );
      } else if (value && typeof value === 'object') {
        localizedContent[key] = await this.localizeContent(value, language);
      }
    }

    return localizedContent;
  }

  /**
   * Create multilingual content
   */
  async createMultilingualContent(data: CreateContentRequest): Promise<MultilingualDocument> {
    const { metadata } = data;
    let document: any;

    switch (metadata.type) {
      case 'product':
        document = await this.createMultilingualProduct(data);
        break;
      case 'news':
        document = await this.createMultilingualNews(data);
        break;
      case 'gallery':
        document = await this.createMultilingualGallery(data);
        break;
      case 'mayor':
        document = await this.createMultilingualMayorMessage(data);
        break;
      default:
        throw new Error(`Unsupported content type: ${metadata.type}`);
    }

    return this.formatMultilingualDocument(document, metadata.type);
  }

  /**
   * Update multilingual content
   */
  async updateMultilingualContent(id: string, data: UpdateContentRequest): Promise<MultilingualDocument> {
    // First, determine the content type by checking which collection contains this ID
    const contentType = await this.determineContentType(id);
    
    let document: any;
    switch (contentType) {
      case 'product':
        document = await this.updateMultilingualProduct(id, data);
        break;
      case 'news':
        document = await this.updateMultilingualNews(id, data);
        break;
      case 'gallery':
        document = await this.updateMultilingualGallery(id, data);
        break;
      case 'mayor':
        document = await this.updateMultilingualMayorMessage(id, data);
        break;
      default:
        throw new Error(`Content with ID ${id} not found`);
    }

    return this.formatMultilingualDocument(document, contentType);
  }

  /**
   * Search multilingual content
   */
  async searchMultilingualContent(query: SearchQuery): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const { text, language = 'both', contentType, limit = 50, offset = 0 } = query;

    // Build search conditions
    const searchConditions: any = {};
    if (text) {
      const textRegex = new RegExp(text, 'i');
      if (language === 'both') {
        searchConditions.$or = [
          { 'name.en': textRegex },
          { 'name.ne': textRegex },
          { 'description.en': textRegex },
          { 'description.ne': textRegex },
          { 'text': textRegex } // For MayorMessage
        ];
      } else {
        searchConditions.$or = [
          { [`name.${language}`]: textRegex },
          { [`description.${language}`]: textRegex },
          { 'text': textRegex } // For MayorMessage
        ];
      }
    }

    if (query.dateFrom || query.dateTo) {
      searchConditions.createdAt = {};
      if (query.dateFrom) searchConditions.createdAt.$gte = query.dateFrom;
      if (query.dateTo) searchConditions.createdAt.$lte = query.dateTo;
    }

    // Search in different collections based on contentType
    if (!contentType || contentType === 'product') {
      const products = await Product.find(searchConditions)
        .limit(limit)
        .skip(offset)
        .sort({ createdAt: -1 });
      
      results.push(...products.map(p => this.formatSearchResult(p, 'product', language)));
    }

    if (!contentType || contentType === 'news') {
      const news = await NewsItem.find(searchConditions)
        .limit(limit)
        .skip(offset)
        .sort({ createdAt: -1 });
      
      results.push(...news.map(n => this.formatSearchResult(n, 'news', language)));
    }

    if (!contentType || contentType === 'gallery') {
      const gallery = await GalleryItem.find(searchConditions)
        .limit(limit)
        .skip(offset)
        .sort({ createdAt: -1 });
      
      results.push(...gallery.map(g => this.formatSearchResult(g, 'gallery', language)));
    }

    if (!contentType || contentType === 'mayor') {
      const mayorMessages = await MayorMessage.find(searchConditions)
        .limit(limit)
        .skip(offset)
        .sort({ createdAt: -1 });
      
      results.push(...mayorMessages.map(m => this.formatSearchResult(m, 'mayor', language)));
    }

    // Sort by relevance score (simple implementation based on text match)
    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  /**
   * Get content in user's preferred language
   */
  async getLocalizedContent(
    contentType: string, 
    id: string, 
    language: 'en' | 'ne'
  ): Promise<any> {
    let content: any;

    switch (contentType) {
      case 'product':
        content = await Product.findById(id);
        break;
      case 'news':
        content = await NewsItem.findById(id);
        break;
      case 'gallery':
        content = await GalleryItem.findById(id);
        break;
      case 'mayor':
        content = await MayorMessage.findById(id);
        break;
      default:
        throw new Error(`Unsupported content type: ${contentType}`);
    }

    if (!content) {
      throw new Error(`Content not found`);
    }

    return this.localizeContent(content.toObject(), language);
  }

  // Private helper methods

  private isMultilingualField(value: any): value is MultilingualField {
    return value && 
           typeof value === 'object' && 
           typeof value.en === 'string' &&
           (value.ne === undefined || typeof value.ne === 'string');
  }

  private localizeField(field: MultilingualField, language: 'en' | 'ne'): string {
    if (language === 'ne' && field.ne) {
      return field.ne;
    }
    return field.en; // Fallback to English
  }

  private async createMultilingualProduct(data: CreateContentRequest): Promise<any> {
    const productData = {
      name: {
        en: data.en.title || '',
        ne: data.ne?.title
      },
      description: {
        en: data.en.description || '',
        ne: data.ne?.description
      },
      farmer: new mongoose.Types.ObjectId(data.metadata.createdBy),
      price: 0, // Default values - should be provided in actual implementation
      unit: 'kg',
      category: 'other',
      images: [],
      isActive: data.metadata.isActive !== false
    };

    const product = new Product(productData);
    return await product.save();
  }

  private async createMultilingualNews(data: CreateContentRequest): Promise<any> {
    const newsData = {
      headline: {
        en: data.en.title || '',
        ne: data.ne?.title
      },
      content: {
        en: data.en.body || data.en.description || '',
        ne: data.ne?.body || data.ne?.description
      },
      summary: data.en.description ? {
        en: data.en.description,
        ne: data.ne?.description
      } : undefined,
      priority: data.metadata.priority || 'NORMAL',
      isActive: data.metadata.isActive !== false,
      createdBy: new mongoose.Types.ObjectId(data.metadata.createdBy),
      publishedAt: new Date()
    };

    const news = new NewsItem(newsData);
    return await news.save();
  }

  private async createMultilingualGallery(data: CreateContentRequest): Promise<any> {
    const galleryData: any = {
      title: {
        en: data.en.title || '',
        ...(data.ne?.title && { ne: data.ne.title })
      },
      imageUrl: data.metadata.imageUrl || '', // Should be provided in actual implementation
      category: {
        en: data.metadata.category || 'Other'
      },
      createdBy: new mongoose.Types.ObjectId(data.metadata.createdBy),
      isActive: data.metadata.isActive !== false,
      order: data.metadata.order || 0
    };

    // Only add description if provided
    if (data.en.description || data.ne?.description) {
      galleryData.description = {
        en: data.en.description || '',
        ...(data.ne?.description && { ne: data.ne.description })
      };
    }

    const gallery = new GalleryItem(galleryData);
    return await gallery.save();
  }

  private async createMultilingualMayorMessage(data: CreateContentRequest): Promise<any> {
    const mayorData = {
      text: data.en.body || data.en.description || data.en.title || '',
      scrollSpeed: 50, // Default scroll speed
      isActive: data.metadata.isActive !== false,
      createdBy: new mongoose.Types.ObjectId(data.metadata.createdBy)
    };

    const mayor = new MayorMessage(mayorData);
    return await mayor.save();
  }

  private async updateMultilingualProduct(id: string, data: UpdateContentRequest): Promise<any> {
    const product = await Product.findById(id);
    if (!product) {
      throw new Error('Product not found');
    }

    if (data.en?.title) {
      product.name.en = data.en.title;
    }
    if (data.ne?.title) {
      product.name.ne = data.ne.title;
    }
    if (data.en?.description) {
      product.description.en = data.en.description;
    }
    if (data.ne?.description) {
      product.description.ne = data.ne.description;
    }

    return await product.save();
  }

  private async updateMultilingualNews(id: string, data: UpdateContentRequest): Promise<any> {
    const news = await NewsItem.findById(id);
    if (!news) {
      throw new Error('News item not found');
    }

    if (data.en?.title) {
      news.headline.en = data.en.title;
    }
    if (data.ne?.title) {
      if (news.headline.ne !== undefined) {
        news.headline.ne = data.ne.title;
      } else {
        // Initialize the ne field if it doesn't exist
        (news.headline as any).ne = data.ne.title;
      }
    }
    if (data.en?.body || data.en?.description) {
      if (!news.content) {
        news.content = { en: data.en.body || data.en.description || '' };
      } else {
        news.content.en = data.en.body || data.en.description || news.content.en;
      }
    }
    if (data.ne?.body || data.ne?.description) {
      if (!news.content) {
        news.content = { en: '', ne: data.ne.body || data.ne.description || '' };
      } else {
        news.content.ne = data.ne.body || data.ne.description || '';
      }
    }

    return await news.save();
  }

  private async updateMultilingualGallery(id: string, data: UpdateContentRequest): Promise<any> {
    const gallery = await GalleryItem.findById(id);
    if (!gallery) {
      throw new Error('Gallery item not found');
    }

    if (data.en?.title) {
      gallery.title.en = data.en.title;
    }
    if (data.ne?.title) {
      gallery.title.ne = data.ne.title;
    }
    if (data.en?.description) {
      if (!gallery.description) {
        gallery.description = { en: data.en.description };
      } else {
        gallery.description.en = data.en.description;
      }
    }
    if (data.ne?.description) {
      if (!gallery.description) {
        gallery.description = { en: '', ne: data.ne.description };
      } else {
        gallery.description.ne = data.ne.description;
      }
    }

    return await gallery.save();
  }

  private async updateMultilingualMayorMessage(id: string, data: UpdateContentRequest): Promise<any> {
    const mayor = await MayorMessage.findById(id);
    if (!mayor) {
      throw new Error('Mayor message not found');
    }

    if (data.en?.title || data.en?.body || data.en?.description) {
      // Update multilingual text field
      const newText = data.en.title || data.en.body || data.en.description;
      if (newText) {
        mayor.text = {
          en: newText,
          ne: mayor.text?.ne || ''
        };
      }
    }

    return await mayor.save();
  }

  private async determineContentType(id: string): Promise<string> {
    // Validate ObjectId format first
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error(`Invalid ObjectId format: ${id}`);
    }

    // Check Product
    try {
      const product = await Product.findById(id);
      if (product) return 'product';
    } catch (error) {
      // Continue to next model
    }

    // Check NewsItem
    try {
      const news = await NewsItem.findById(id);
      if (news) return 'news';
    } catch (error) {
      // Continue to next model
    }

    // Check GalleryItem
    try {
      const gallery = await GalleryItem.findById(id);
      if (gallery) return 'gallery';
    } catch (error) {
      // Continue to next model
    }

    // Check MayorMessage
    try {
      const mayor = await MayorMessage.findById(id);
      if (mayor) return 'mayor';
    } catch (error) {
      // Continue to next model
    }

    throw new Error(`Content with ID ${id} not found in any collection`);
  }

  private formatMultilingualDocument(document: any, contentType: string): MultilingualDocument {
    const doc = document.toObject();
    
    const neContent = (doc.name?.ne || doc.headline?.ne || doc.title?.ne) ? {
      title: doc.name?.ne || doc.headline?.ne || doc.title?.ne || '',
      description: doc.description?.ne || doc.summary?.ne || '',
      body: doc.content?.ne || doc.description?.ne || ''
    } : undefined;
    
    return {
      _id: doc._id.toString(),
      content: {
        en: {
          title: doc.name?.en || doc.headline?.en || doc.title?.en || doc.text || '',
          description: doc.description?.en || doc.summary?.en || '',
          body: doc.content?.en || doc.description?.en || doc.text || ''
        },
        ...(neContent && { ne: neContent })
      },
      metadata: {
        type: contentType as any,
        priority: doc.priority,
        isActive: doc.isActive,
        createdBy: doc.createdBy?.toString() || doc.farmer?.toString() || doc.uploadedBy?.toString()
      },
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    };
  }

  private formatSearchResult(document: any, contentType: string, language: 'en' | 'ne' | 'both'): SearchResult {
    const doc = document.toObject();
    const title = doc.name || doc.headline || doc.title || { en: doc.text || '', ne: '' };
    const description = doc.description || doc.summary || { en: '', ne: '' };

    // Calculate simple relevance score (can be enhanced with more sophisticated algorithms)
    let relevanceScore = 1.0;
    if (doc.priority === 'HIGH') relevanceScore += 0.5;
    if (doc.priority === 'NORMAL') relevanceScore += 0.2;

    return {
      _id: doc._id.toString(),
      title,
      description,
      contentType,
      language: language === 'both' ? 'en' : language,
      relevanceScore,
      createdAt: doc.createdAt
    };
  }
}