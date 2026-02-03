import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { User, UserRole, Farmer } from '../models';
import { JWTUtils } from '../utils/jwt';

// Registration request interface
interface RegisterRequest {
  email: string;
  password: string;
  role: UserRole;
  profile: {
    name: string;
    phone?: string;
    address?: string;
  };
  // Language and locale preferences
  language?: 'en' | 'ne';
  localePreferences?: {
    dateFormat?: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'DD-MM-YYYY';
    timeFormat?: '12h' | '24h';
    numberFormat?: '1,234.56' | '1.234,56' | '1 234,56' | '1234.56';
    currency?: 'NPR' | 'USD' | 'EUR';
  };
  // Farmer-specific fields
  location?: {
    district: string;
    municipality: string;
    coordinates?: [number, number];
  };
}

// Login request interface
interface LoginRequest {
  email: string;
  password: string;
}

// Auth response interface
interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: string;
      email: string;
      role: UserRole;
      profile: {
        name: string;
        phone?: string;
        address?: string;
      };
      language?: 'en' | 'ne';
      localePreferences?: {
        dateFormat: string;
        timeFormat: string;
        numberFormat: string;
        currency: string;
      };
    };
    token: string;
    expiresIn: string;
  };
  errors?: any[];
}

/**
 * Register a new user
 */
export const register = async (req: Request<{}, AuthResponse, RegisterRequest>, res: Response<AuthResponse>): Promise<void> => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
      return;
    }

    const { email, password, role, profile, location, language, localePreferences } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
      return;
    }

    // Validate role-specific requirements
    if (role === UserRole.FARMER && !location) {
      res.status(400).json({
        success: false,
        message: 'Location information is required for farmer registration'
      });
      return;
    }

    // Set default language and locale preferences based on language
    const userLanguage = language || 'en';
    const defaultLocalePreferences = {
      dateFormat: 'DD/MM/YYYY' as const,
      timeFormat: '24h' as const,
      numberFormat: '1,234.56' as const,
      currency: 'NPR' as const
    };

    // Create user with language preferences
    const user = new User({
      email: email.toLowerCase(),
      password,
      role,
      profile,
      language: userLanguage,
      localePreferences: {
        ...defaultLocalePreferences,
        ...localePreferences
      }
    });

    const savedUser = await user.save();

    // Create farmer profile if role is FARMER
    if (role === UserRole.FARMER && location) {
      const farmer = new Farmer({
        userId: savedUser._id,
        location
      });
      await farmer.save();
    }

    // Generate JWT token
    const token = JWTUtils.generateToken({
      userId: savedUser._id.toString(),
      email: savedUser.email,
      role: savedUser.role
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: savedUser._id.toString(),
          email: savedUser.email,
          role: savedUser.role,
          profile: savedUser.profile,
          language: savedUser.language,
          localePreferences: savedUser.localePreferences
        },
        token,
        expiresIn: '7d'
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration'
    });
  }
};

/**
 * Login user
 */
export const login = async (req: Request<{}, AuthResponse, LoginRequest>, res: Response<AuthResponse>): Promise<void> => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
      return;
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
      return;
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
      return;
    }

    // Generate JWT token
    const token = JWTUtils.generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id.toString(),
          email: user.email,
          role: user.role,
          profile: user.profile,
          language: user.language,
          localePreferences: user.localePreferences
        },
        token,
        expiresIn: '7d'
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    });
  }
};

/**
 * Get current user profile
 */
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // Find user by ID
    const user = await User.findById(req.user.userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        user: {
          id: user._id.toString(),
          email: user.email,
          role: user.role,
          profile: user.profile,
          language: user.language,
          localePreferences: user.localePreferences,
          lastLanguageUpdate: user.lastLanguageUpdate
        }
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update user language and locale preferences
 */
export const updateLanguagePreferences = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const { language, localePreferences } = req.body;

    // Validate language
    if (language && !['en', 'ne'].includes(language)) {
      res.status(400).json({
        success: false,
        message: 'Invalid language. Must be "en" or "ne"'
      });
      return;
    }

    // Find and update user
    const user = await User.findById(req.user.userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Update language if provided
    if (language) {
      user.language = language;
    }

    // Update locale preferences if provided
    if (localePreferences) {
      user.localePreferences = {
        ...user.localePreferences,
        ...localePreferences
      };
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Language preferences updated successfully',
      data: {
        language: user.language,
        localePreferences: user.localePreferences
      }
    });

  } catch (error) {
    console.error('Update language preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update user profile including language preferences
 */
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const { profile, language, localePreferences } = req.body;

    // Find user
    const user = await User.findById(req.user.userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Update profile if provided
    if (profile) {
      user.profile = {
        ...user.profile,
        ...profile
      };
    }

    // Update language if provided
    if (language && ['en', 'ne'].includes(language)) {
      user.language = language;
    }

    // Update locale preferences if provided
    if (localePreferences) {
      user.localePreferences = {
        ...user.localePreferences,
        ...localePreferences
      };
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id.toString(),
          email: user.email,
          role: user.role,
          profile: user.profile,
          language: user.language,
          localePreferences: user.localePreferences,
          lastLanguageUpdate: user.lastLanguageUpdate
        }
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Refresh JWT token
 */
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // Add a small delay to ensure different iat timestamp
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate new token
    const newToken = JWTUtils.generateToken({
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role
    });

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken,
        expiresIn: '7d'
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during token refresh'
    });
  }
};