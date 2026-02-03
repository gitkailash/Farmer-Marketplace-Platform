export interface MultilingualField {
  en: string;
  ne?: string;
  _lastUpdated?: {
    en: Date;
    ne?: Date;
  };
}

export interface MultilingualContent {
  en?: string;
  ne?: string;
  _id?: string;
  lastUpdated?: Date;
}

export interface ContentData {
  title: string;
  description: string;
  body?: string;
  tags?: string[];
}

export interface ContentMetadata {
  type: 'product' | 'news' | 'gallery' | 'message' | 'mayor';
  priority?: 'LOW' | 'NORMAL' | 'HIGH';
  isActive?: boolean;
  createdBy: string;
  // Gallery-specific fields
  imageUrl?: string;
  category?: string;
  order?: number;
}

export interface CreateContentRequest {
  en: Partial<ContentData>;
  ne?: Partial<ContentData>;
  metadata: ContentMetadata;
}

export interface UpdateContentRequest {
  en?: Partial<ContentData>;
  ne?: Partial<ContentData>;
  metadata?: Partial<ContentMetadata>;
}

export interface MultilingualDocument {
  _id: string;
  content: {
    en: ContentData;
    ne?: ContentData;
  };
  metadata: ContentMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchQuery {
  text?: string;
  language?: 'en' | 'ne' | 'both';
  contentType?: string;
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  _id: string;
  title: MultilingualField;
  description: MultilingualField;
  contentType: string;
  language: 'en' | 'ne';
  relevanceScore: number;
  createdAt: Date;
}

export interface ContentLocalizer {
  localizeContent<T>(content: T, language: 'en' | 'ne'): Promise<T>;
  createMultilingualContent(data: CreateContentRequest): Promise<MultilingualDocument>;
  updateMultilingualContent(id: string, data: UpdateContentRequest): Promise<MultilingualDocument>;
  searchMultilingualContent(query: SearchQuery): Promise<SearchResult[]>;
}