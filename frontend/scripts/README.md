# Translation Tools

This directory contains tools for managing translations in the Farmer Marketplace Platform.

## Available Scripts

### `npm run i18n:check`
Quick validation of translation completeness. Compares all language files against the English reference and reports missing keys.

```bash
npm run i18n:check
```

### `npm run i18n:extract` (Advanced)
Extracts translation keys from source code and generates comprehensive reports. Requires `tsx` and `glob` packages.

```bash
npm run i18n:extract
```

This will:
- Scan all TypeScript/React files for translation usage
- Extract translation keys with context
- Generate HTML and JSON reports
- Identify unused translation keys
- Calculate translation completeness statistics

## Files

### `validate-translations.js`
Simple validation script that:
- Compares translation files against English reference
- Reports missing keys by language and namespace
- Calculates completion percentages
- Exits with error code if translations are incomplete

### `translation-tools.ts`
Advanced extraction and analysis tool that:
- Uses regex patterns to find translation usage in code
- Supports multiple translation patterns (`t()`, `useTranslation().t()`, etc.)
- Generates detailed HTML reports with statistics
- Identifies unused translation keys
- Provides file-by-file breakdown of translation usage

## Translation File Structure

```
src/i18n/locales/
├── en/
│   ├── common.json     # Common UI elements, buttons, labels
│   ├── auth.json       # Authentication related text
│   ├── products.json   # Product and marketplace text
│   └── admin.json      # Admin interface text
└── ne/
    ├── common.json     # Nepali translations
    ├── auth.json
    ├── products.json
    └── admin.json
```

## Usage in Components

```typescript
import { useAppTranslation } from '../contexts/I18nProvider';

function MyComponent() {
  const { t } = useAppTranslation('common');
  
  return (
    <button>{t('buttons.save')}</button>
  );
}
```

## Adding New Translations

1. Add the English text to the appropriate namespace file in `src/i18n/locales/en/`
2. Add the Nepali translation to the corresponding file in `src/i18n/locales/ne/`
3. Update the TypeScript types in `src/i18n/types.ts` if needed
4. Run `npm run i18n:check` to validate completeness

## CI/CD Integration

Add the validation script to your build process:

```json
{
  "scripts": {
    "prebuild": "npm run i18n:check && npm run type-check"
  }
}
```

This ensures that builds fail if translations are incomplete.