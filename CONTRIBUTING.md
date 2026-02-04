# 🤝 Contributing to Farmer Marketplace Platform

[![Contributors Welcome](https://img.shields.io/badge/Contributors-Welcome-brightgreen)](CONTRIBUTING.md)
[![Code of Conduct](https://img.shields.io/badge/Code%20of%20Conduct-Enforced-blue)](CONTRIBUTING.md#code-of-conduct)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![ESLint](https://img.shields.io/badge/ESLint-Configured-4B32C3?logo=eslint&logoColor=white)](https://eslint.org/)
[![Prettier](https://img.shields.io/badge/Prettier-Formatted-F7B93E?logo=prettier&logoColor=black)](https://prettier.io/)
[![Jest](https://img.shields.io/badge/Jest-Testing-C21325?logo=jest&logoColor=white)](https://jestjs.io/)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-FE5196?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org/)
[![GitHub](https://img.shields.io/badge/GitHub-Workflow-181717?logo=github&logoColor=white)](https://github.com/features/actions)

Thank you for your interest in contributing to the Farmer Marketplace Platform! This document provides guidelines and information for contributors.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Translation Contributions](#translation-contributions)
- [Reporting Issues](#reporting-issues)

## 📜 Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

**Positive behavior includes:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behavior includes:**
- Harassment, trolling, or discriminatory comments
- Publishing others' private information without permission
- Other conduct which could reasonably be considered inappropriate

### Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported by contacting the project team at conduct@your-domain.com. All complaints will be reviewed and investigated promptly and fairly.

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have:
- [Node.js 18+](https://nodejs.org/) installed
- [MongoDB 5.0+](https://www.mongodb.com/try/download/community) running locally
- [Git](https://git-scm.com/) for version control
- [Docker](https://www.docker.com/get-started) (optional but recommended)
- Basic knowledge of TypeScript, React, and Node.js

### Ways to Contribute

You can contribute in several ways:
- **Code contributions**: Bug fixes, new features, performance improvements
- **Documentation**: Improving guides, API docs, code comments
- **Translations**: Adding or improving language translations
- **Testing**: Writing tests, reporting bugs, testing new features
- **Design**: UI/UX improvements, accessibility enhancements
- **Community**: Helping other users, answering questions

## 💻 Development Setup

### 1. Fork and Clone Repository

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/your-username/farmer-marketplace-platform.git
cd farmer-marketplace-platform

# Add upstream remote
git remote add upstream https://github.com/original-owner/farmer-marketplace-platform.git
```

### 2. Environment Setup

**Backend Setup:**
```bash
cd backend
cp .env.example .env
# Edit .env with your local configuration
npm install
npm run dev
```

**Frontend Setup:**
```bash
cd frontend
cp .env.example .env
# Edit .env with your local configuration
npm install
npm run dev
```

**Docker Setup (Alternative):**
```bash
# Start all services with Docker
docker-compose up -d

# View logs
docker-compose logs -f
```

### 3. Database Setup

```bash
# Start MongoDB (if not using Docker)
mongod

# Run database migrations
cd backend
npm run migrate

# Import sample data (optional)
npm run seed
```

### 4. Verify Setup

- Backend: http://localhost:5000/health
- Frontend: http://localhost:3000
- API Docs: http://localhost:5000/api/docs/ui

## 📝 Contributing Guidelines

### Branch Naming Convention

Use descriptive branch names with prefixes:
- `feature/` - New features
- `bugfix/` - Bug fixes
- `hotfix/` - Critical fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/improvements

**Examples:**
```bash
feature/user-profile-enhancement
bugfix/order-status-update-issue
docs/api-documentation-update
```

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(auth): add two-factor authentication
fix(orders): resolve order status update issue
docs(api): update authentication endpoints documentation
test(products): add unit tests for product validation
```

### Issue Linking

Link commits and PRs to issues:
```bash
fix(orders): resolve duplicate order creation

Fixes #123
Closes #456
```

## 🔄 Pull Request Process

### 1. Before Creating PR

- Ensure your branch is up to date with main
- Run all tests and ensure they pass
- Update documentation if needed
- Add/update tests for new functionality

```bash
# Update your branch
git checkout main
git pull upstream main
git checkout your-feature-branch
git rebase main

# Run tests
cd backend && npm test
cd frontend && npm test

# Run linting
cd backend && npm run lint
cd frontend && npm run lint
```

### 2. Creating Pull Request

1. Push your branch to your fork
2. Create PR from your fork to the main repository
3. Use the PR template (auto-populated)
4. Provide clear description of changes
5. Link related issues
6. Add screenshots for UI changes

### 3. PR Template

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots for UI changes.

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Code is commented where necessary
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] No breaking changes (or clearly documented)

## Related Issues
Fixes #(issue number)
```

### 4. Review Process

- All PRs require at least one review
- Address reviewer feedback promptly
- Keep discussions constructive and professional
- Update PR based on feedback
- Maintainers will merge approved PRs

## 🎨 Coding Standards

### TypeScript/JavaScript

**General Rules:**
- Use TypeScript for all new code
- Follow ESLint configuration
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Prefer `const` over `let`, avoid `var`

**Example:**
```typescript
/**
 * Creates a new user account
 * @param userData - User registration data
 * @returns Promise resolving to created user
 */
export const createUser = async (userData: CreateUserRequest): Promise<User> => {
  // Validate input data
  const validatedData = validateUserData(userData);
  
  // Create user in database
  const user = await User.create(validatedData);
  
  return user;
};
```

### React Components

**Component Structure:**
```typescript
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onAddToCart 
}) => {
  const { t } = useTranslation('products');
  const [isLoading, setIsLoading] = useState(false);

  const handleAddToCart = async () => {
    setIsLoading(true);
    try {
      await onAddToCart(product.id);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="product-card">
      {/* Component JSX */}
    </div>
  );
};

export default ProductCard;
```

### CSS/Styling

**Tailwind CSS Guidelines:**
- Use Tailwind utility classes
- Create custom components for repeated patterns
- Use semantic class names for custom CSS
- Follow mobile-first responsive design

**Example:**
```typescript
// Good: Utility classes with responsive design
<div className="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:p-8">
  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
    Product Title
  </h2>
</div>

// Custom component for repeated patterns
const Button = ({ variant = 'primary', children, ...props }) => {
  const baseClasses = 'px-4 py-2 rounded-md font-medium transition-colors';
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300'
  };
  
  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]}`}
      {...props}
    >
      {children}
    </button>
  );
};
```

### API Design

**RESTful API Guidelines:**
- Use proper HTTP methods (GET, POST, PUT, DELETE)
- Follow consistent URL patterns
- Use appropriate HTTP status codes
- Include proper error handling
- Add input validation

**Example:**
```typescript
// Good API endpoint structure
router.get('/api/products', validateQuery, async (req, res) => {
  try {
    const { page = 1, limit = 20, category } = req.query;
    
    const products = await Product.find(
      category ? { category } : {}
    )
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: await Product.countDocuments()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
});
```

## 🧪 Testing Guidelines

### Backend Testing

**Unit Tests:**
```typescript
// Example: Product service test
describe('ProductService', () => {
  describe('createProduct', () => {
    it('should create a new product successfully', async () => {
      const productData = {
        name: { en: 'Test Product', ne: 'परीक्षण उत्पादन' },
        price: 100,
        category: 'Vegetables'
      };

      const result = await ProductService.createProduct(productData);

      expect(result).toBeDefined();
      expect(result.name.en).toBe('Test Product');
      expect(result.price).toBe(100);
    });

    it('should throw error for invalid product data', async () => {
      const invalidData = { name: '' };

      await expect(
        ProductService.createProduct(invalidData)
      ).rejects.toThrow('Invalid product data');
    });
  });
});
```

**Integration Tests:**
```typescript
// Example: API endpoint test
describe('POST /api/products', () => {
  it('should create product for authenticated farmer', async () => {
    const token = await getAuthToken('farmer');
    const productData = {
      name: { en: 'Fresh Tomatoes', ne: 'ताजा टमाटर' },
      price: 120,
      category: 'Vegetables'
    };

    const response = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send(productData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.name.en).toBe('Fresh Tomatoes');
  });
});
```

### Frontend Testing

**Component Tests:**
```typescript
// Example: Component test
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from './ProductCard';

describe('ProductCard', () => {
  const mockProduct = {
    id: '1',
    name: { en: 'Test Product', ne: 'परीक्षण उत्पादन' },
    price: 100,
    category: 'Vegetables'
  };

  it('renders product information correctly', () => {
    render(
      <ProductCard 
        product={mockProduct} 
        onAddToCart={jest.fn()} 
      />
    );

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$100')).toBeInTheDocument();
  });

  it('calls onAddToCart when button is clicked', () => {
    const mockAddToCart = jest.fn();
    
    render(
      <ProductCard 
        product={mockProduct} 
        onAddToCart={mockAddToCart} 
      />
    );

    fireEvent.click(screen.getByText('Add to Cart'));
    expect(mockAddToCart).toHaveBeenCalledWith('1');
  });
});
```

### Test Coverage

Maintain minimum test coverage:
- **Unit Tests**: 80% coverage
- **Integration Tests**: Key user flows
- **E2E Tests**: Critical business processes

```bash
# Run tests with coverage
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html
```

## 📚 Documentation

### Code Documentation

**JSDoc Comments:**
```typescript
/**
 * Calculates the total price including tax and delivery
 * @param items - Array of cart items
 * @param deliveryAddress - Delivery address for calculating shipping
 * @param taxRate - Tax rate as decimal (e.g., 0.1 for 10%)
 * @returns Object containing subtotal, tax, delivery fee, and total
 * @example
 * ```typescript
 * const total = calculateOrderTotal(
 *   [{ price: 100, quantity: 2 }],
 *   { city: 'Kathmandu' },
 *   0.13
 * );
 * console.log(total.grandTotal); // 239
 * ```
 */
export const calculateOrderTotal = (
  items: CartItem[],
  deliveryAddress: Address,
  taxRate: number = 0.13
): OrderTotal => {
  // Implementation
};
```

### README Updates

When adding new features:
1. Update main README.md
2. Add feature to feature list
3. Update installation/setup instructions if needed
4. Add usage examples

### API Documentation

Update Swagger/OpenAPI documentation:
```typescript
/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProductRequest'
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductResponse'
 */
```

## 🌐 Translation Contributions

### Adding New Languages

1. Create language directories:
```bash
mkdir -p frontend/src/i18n/locales/[language-code]
```

2. Copy English files and translate:
```bash
cp frontend/src/i18n/locales/en/* frontend/src/i18n/locales/[language-code]/
```

3. Update i18n configuration:
```typescript
// Add to supported languages
supportedLngs: ['en', 'ne', 'your-language-code']
```

### Translation Guidelines

**Best Practices:**
- Maintain consistent terminology
- Consider cultural context
- Keep translations concise
- Test translations in UI context
- Use appropriate formality level

**Translation Keys:**
```json
{
  "buttons": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete"
  },
  "messages": {
    "success": "Operation completed successfully",
    "error": "An error occurred. Please try again."
  }
}
```

### Updating Existing Translations

1. Edit translation files in `frontend/src/i18n/locales/`
2. Test changes in development environment
3. Submit PR with translation updates

## 🐛 Reporting Issues

### Before Reporting

1. Search existing issues to avoid duplicates
2. Check if issue exists in latest version
3. Gather relevant information:
   - Browser/device information
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots/error messages

### Issue Template

```markdown
**Bug Description**
A clear description of the bug.

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected Behavior**
What you expected to happen.

**Actual Behavior**
What actually happened.

**Screenshots**
Add screenshots if applicable.

**Environment**
- OS: [e.g., Windows 10, macOS 12.0]
- Browser: [e.g., Chrome 96, Firefox 95]
- Device: [e.g., Desktop, iPhone 12]
- Version: [e.g., 1.2.0]

**Additional Context**
Any other context about the problem.
```

### Feature Requests

Use the feature request template:
```markdown
**Feature Description**
Clear description of the feature you'd like to see.

**Problem Statement**
What problem does this feature solve?

**Proposed Solution**
How would you like this feature to work?

**Alternatives Considered**
Other solutions you've considered.

**Additional Context**
Screenshots, mockups, or examples.
```

## 🏆 Recognition

### Contributors

All contributors are recognized in:
- README.md contributors section
- Release notes
- Annual contributor report

### Contribution Types

We recognize various contribution types:
- 💻 Code contributions
- 📖 Documentation
- 🌐 Translations
- 🐛 Bug reports
- 💡 Ideas and suggestions
- 🎨 Design contributions
- 📢 Community support

## 📞 Getting Help

### Development Questions

- **GitHub Discussions**: For general questions
- **Discord**: Real-time chat with maintainers
- **Email**: dev@your-domain.com

### Mentorship

New contributors can request mentorship:
- Pair programming sessions
- Code review guidance
- Architecture discussions
- Career advice

## 📄 License

By contributing to this project, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

**Thank you for contributing to the Farmer Marketplace Platform! 🌾**

Your contributions help connect farmers with buyers and support sustainable agriculture in Nepal.