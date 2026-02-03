/**
 * Enhanced SQL Injection Detection Engine
 * Implements context-aware validation to reduce false positives
 * while maintaining robust security protection
 */

export interface SecurityPattern {
  id: string;
  type: 'SQL_INJECTION' | 'XSS' | 'COMMAND_INJECTION';
  pattern: RegExp;
  contextRequired: boolean;
  minimumConfidence: number;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface ValidationContext {
  contentType: 'STRUCTURED' | 'FREE_TEXT' | 'URL' | 'FILE_PATH' | 'MAYOR_MESSAGE';
  userRole?: string | undefined;
  endpoint?: string | undefined;
  fieldName?: string | undefined;
}

export interface SecurityValidationResult {
  isValid: boolean;
  threatLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
  violations: SecurityViolation[];
  confidence: number;
  context: ValidationContext;
}

export interface SecurityViolation {
  patternId: string;
  type: 'SQL_INJECTION' | 'XSS' | 'COMMAND_INJECTION';
  matchedText: string;
  position: number;
  confidence: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
}

/**
 * Enhanced SQL Injection Patterns
 * These patterns are more specific and require context analysis
 */
export const ENHANCED_SQL_PATTERNS: SecurityPattern[] = [
  // High-confidence patterns that rarely have false positives
  {
    id: 'sql_union_attack',
    type: 'SQL_INJECTION',
    pattern: /\b(union\s+(all\s+)?select)\b/gi,
    contextRequired: false,
    minimumConfidence: 0.95,
    description: 'UNION-based SQL injection attack',
    severity: 'CRITICAL'
  },
  {
    id: 'sql_comment_injection',
    type: 'SQL_INJECTION',
    pattern: /(['"])\s*;\s*(--|\#|\/\*)/gi,
    contextRequired: false,
    minimumConfidence: 0.9,
    description: 'SQL comment injection with statement termination',
    severity: 'HIGH'
  },
  {
    id: 'sql_time_attack',
    type: 'SQL_INJECTION',
    pattern: /\b(waitfor\s+delay|sleep\s*\(|benchmark\s*\()/gi,
    contextRequired: false,
    minimumConfidence: 0.95,
    description: 'Time-based SQL injection attack',
    severity: 'HIGH'
  },
  {
    id: 'sql_stacked_queries',
    type: 'SQL_INJECTION',
    pattern: /;\s*(drop|delete|insert|update|create|alter)\s+/gi,
    contextRequired: false,
    minimumConfidence: 0.9,
    description: 'Stacked query SQL injection',
    severity: 'CRITICAL'
  },
  
  // Medium-confidence patterns that require context analysis
  {
    id: 'sql_boolean_classic',
    type: 'SQL_INJECTION',
    pattern: /(['"]?\s*(or|and)\s+['"]?\d+['"]?\s*[=<>!]+\s*['"]?\d+['"]?)/gi,
    contextRequired: true,
    minimumConfidence: 0.8,
    description: 'Classic boolean-based SQL injection',
    severity: 'HIGH'
  },
  {
    id: 'sql_boolean_tautology',
    type: 'SQL_INJECTION',
    pattern: /\b(or|and)\s+['"]?1['"]?\s*=\s*['"]?1['"]?/gi,
    contextRequired: true,
    minimumConfidence: 0.85,
    description: 'Boolean tautology SQL injection (1=1)',
    severity: 'HIGH'
  },
  {
    id: 'sql_quote_manipulation',
    type: 'SQL_INJECTION',
    pattern: /['"][^'"]*['"]?\s*(or|and)\s+['"][^'"]*['"]?\s*[=<>]/gi,
    contextRequired: true,
    minimumConfidence: 0.7,
    description: 'Quote manipulation SQL injection',
    severity: 'MEDIUM'
  },
  
  // Low-confidence patterns that need multiple indicators
  {
    id: 'sql_commands_suspicious',
    type: 'SQL_INJECTION',
    pattern: /\b(select|insert|update|delete|drop|create|alter)\b.*\b(from|into|table|where)\b/gi,
    contextRequired: true,
    minimumConfidence: 0.6,
    description: 'Suspicious SQL command structure',
    severity: 'MEDIUM'
  }
];

/**
 * Context Analysis Functions
 */
export class ContextAnalyzer {
  /**
   * Analyzes if SQL keywords appear in natural language context
   */
  static isNaturalLanguageContext(text: string, matchPosition: number, matchLength: number): boolean {
    const beforeText = text.substring(Math.max(0, matchPosition - 50), matchPosition);
    const afterText = text.substring(matchPosition + matchLength, Math.min(text.length, matchPosition + matchLength + 50));
    
    // Natural language indicators
    const naturalIndicators = [
      /\b(the|a|an|this|that|these|those|my|our|your|their)\s*$/i,
      /^(ing|ed|er|est|ly)\b/i,
      /\b(and|or|but|so|because|since|while|when|where|how|why)\s*$/i,
      /^(s|es|ies|ied|ing|ed|er|est|ly)\b/i
    ];
    
    // Check if surrounded by natural language patterns
    const hasNaturalBefore = naturalIndicators.some(pattern => pattern.test(beforeText));
    const hasNaturalAfter = naturalIndicators.some(pattern => pattern.test(afterText));
    
    // Check for sentence structure
    const hasSentenceStructure = /[.!?]\s*[A-Z]/.test(beforeText) || /[.!?]/.test(afterText);
    
    return hasNaturalBefore || hasNaturalAfter || hasSentenceStructure;
  }
  
  /**
   * Checks if content appears to be structured data vs free text
   */
  static isStructuredData(text: string): boolean {
    // JSON-like patterns
    if (/^\s*[\{\[]/.test(text) && /[\}\]]\s*$/.test(text)) {
      return true;
    }
    
    // Form data patterns
    if (/^[a-zA-Z_][a-zA-Z0-9_]*\s*=/.test(text)) {
      return true;
    }
    
    // Query parameter patterns
    if (/^[?&]?[a-zA-Z_][a-zA-Z0-9_]*=[^&]*(&[a-zA-Z_][a-zA-Z0-9_]*=[^&]*)*$/.test(text)) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Analyzes the overall context of the content
   */
  static analyzeContentContext(text: string, context: ValidationContext): number {
    let contextScore = 0;
    
    // Content type adjustments
    switch (context.contentType) {
      case 'FREE_TEXT':
      case 'MAYOR_MESSAGE':
        contextScore += 0.3; // More lenient for free text
        break;
      case 'STRUCTURED':
        contextScore -= 0.2; // More strict for structured data
        break;
      case 'URL':
      case 'FILE_PATH':
        contextScore += 0.1; // Slightly more lenient for paths
        break;
    }
    
    // Length-based adjustments (longer text more likely to be natural)
    if (text.length > 100) {
      contextScore += 0.1;
    }
    if (text.length > 500) {
      contextScore += 0.1;
    }
    
    // Natural language indicators
    const sentences = text.split(/[.!?]+/).length;
    if (sentences > 2) {
      contextScore += 0.2;
    }
    
    // Common words that indicate natural language
    const naturalWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const wordCount = text.toLowerCase().split(/\s+/).length;
    const naturalWordCount = naturalWords.reduce((count, word) => {
      return count + (text.toLowerCase().split(word).length - 1);
    }, 0);
    
    if (wordCount > 0 && naturalWordCount / wordCount > 0.1) {
      contextScore += 0.2;
    }
    
    return Math.max(0, Math.min(1, contextScore));
  }
}

/**
 * Enhanced SQL Injection Detection Engine
 */
export class EnhancedSQLDetector {
  private patterns: SecurityPattern[];
  
  constructor(patterns: SecurityPattern[] = ENHANCED_SQL_PATTERNS) {
    this.patterns = patterns;
  }
  
  /**
   * Validates content for SQL injection with context awareness
   */
  validateContent(content: string, context: ValidationContext): SecurityValidationResult {
    const violations: SecurityViolation[] = [];
    let maxThreatLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' = 'NONE';
    let totalConfidence = 0;
    
    // Analyze each pattern
    for (const pattern of this.patterns) {
      const matches = this.findPatternMatches(content, pattern);
      
      for (const match of matches) {
        let confidence = pattern.minimumConfidence;
        
        // Apply context analysis if required
        if (pattern.contextRequired) {
          const contextScore = ContextAnalyzer.analyzeContentContext(content, context);
          const naturalLanguage = ContextAnalyzer.isNaturalLanguageContext(
            content, 
            match.index, 
            match.matchedText.length
          );
          
          // Reduce confidence for natural language context
          if (naturalLanguage) {
            confidence *= 0.5;
          }
          
          // Apply context score
          confidence *= (1 - contextScore);
        }
        
        // Only report violations above minimum confidence
        if (confidence >= 0.5) {
          violations.push({
            patternId: pattern.id,
            type: pattern.type,
            matchedText: match.matchedText,
            position: match.index,
            confidence,
            severity: pattern.severity,
            description: pattern.description
          });
          
          // Update threat level
          if (confidence >= 0.9 && maxThreatLevel !== 'HIGH') {
            maxThreatLevel = 'HIGH';
          } else if (confidence >= 0.7 && maxThreatLevel === 'NONE') {
            maxThreatLevel = 'MEDIUM';
          } else if (confidence >= 0.5 && maxThreatLevel === 'NONE') {
            maxThreatLevel = 'LOW';
          }
          
          totalConfidence = Math.max(totalConfidence, confidence);
        }
      }
    }
    
    // Determine if content is valid (no high-confidence violations)
    const highConfidenceViolations = violations.filter(v => v.confidence >= 0.8);
    const isValid = highConfidenceViolations.length === 0;
    
    return {
      isValid,
      threatLevel: isValid ? 'NONE' : maxThreatLevel,
      violations,
      confidence: totalConfidence,
      context
    };
  }
  
  /**
   * Finds all matches for a specific pattern
   */
  private findPatternMatches(content: string, pattern: SecurityPattern): Array<{index: number, matchedText: string}> {
    const matches: Array<{index: number, matchedText: string}> = [];
    let match;
    
    // Reset regex state
    pattern.pattern.lastIndex = 0;
    
    while ((match = pattern.pattern.exec(content)) !== null) {
      matches.push({
        index: match.index,
        matchedText: match[0]
      });
      
      // Prevent infinite loop for global patterns
      if (!pattern.pattern.global) {
        break;
      }
    }
    
    return matches;
  }
  
  /**
   * Quick validation for simple cases
   */
  isContentSafe(content: string, context: ValidationContext): boolean {
    const result = this.validateContent(content, context);
    return result.isValid;
  }
}

/**
 * Default detector instance
 */
export const defaultSQLDetector = new EnhancedSQLDetector();