import { body } from 'express-validator';
import { UserRole } from '../models/User';

/**
 * Validation rules for user registration
 */
export const validateRegister = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .toLowerCase(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('role')
    .isIn(Object.values(UserRole))
    .withMessage(`Role must be one of: ${Object.values(UserRole).join(', ')}`),
  
  body('profile.name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('profile.phone')
    .optional()
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Please provide a valid phone number'),
  
  body('profile.address')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Address cannot exceed 500 characters'),
  
  body('location.district')
    .if(body('role').equals(UserRole.FARMER))
    .notEmpty()
    .withMessage('District is required for farmer registration')
    .isLength({ max: 100 })
    .withMessage('District name cannot exceed 100 characters')
    .custom((district) => {
      // Common Nepal districts for validation
      const nepalDistricts = [
        'Kathmandu', 'Lalitpur', 'Bhaktapur', 'Chitwan', 'Kaski', 'Rupandehi', 
        'Morang', 'Jhapa', 'Sunsari', 'Dhanusha', 'Siraha', 'Saptari', 'Mahottari',
        'Bara', 'Parsa', 'Rautahat', 'Sarlahi', 'Sindhuli', 'Ramechhap', 'Dolakha',
        'Sindhupalchok', 'Kavrepalanchok', 'Nuwakot', 'Rasuwa', 'Dhading', 'Makwanpur',
        'Gorkha', 'Lamjung', 'Tanahun', 'Syangja', 'Parbat', 'Baglung', 'Myagdi',
        'Mustang', 'Manang', 'Nawalpur', 'Palpa', 'Gulmi', 'Arghakhanchi', 'Kapilvastu',
        'Dang', 'Banke', 'Bardiya', 'Surkhet', 'Dailekh', 'Jajarkot', 'Dolpa', 'Jumla',
        'Kalikot', 'Mugu', 'Humla', 'Bajura', 'Bajhang', 'Achham', 'Doti', 'Kailali',
        'Kanchanpur', 'Dadeldhura', 'Baitadi', 'Darchula'
      ];
      
      if (district && !nepalDistricts.includes(district)) {
        throw new Error('Please provide a valid Nepal district name');
      }
      return true;
    }),
  
  body('location.municipality')
    .if(body('role').equals(UserRole.FARMER))
    .notEmpty()
    .withMessage('Municipality is required for farmer registration')
    .isLength({ max: 100 })
    .withMessage('Municipality name cannot exceed 100 characters')
    .custom((municipality) => {
      // Allow various municipality types in Nepal
      const municipalityPattern = /(Metropolitan City|Sub-Metropolitan City|Municipality|Rural Municipality)$/i;
      if (municipality && !municipalityPattern.test(municipality)) {
        throw new Error('Municipality must end with "Metropolitan City", "Sub-Metropolitan City", "Municipality", or "Rural Municipality"');
      }
      return true;
    }),
  
  body('location.coordinates')
    .optional()
    .isArray({ min: 2, max: 2 })
    .withMessage('Coordinates must be an array of [longitude, latitude]')
    .custom((coords) => {
      if (coords && coords.length === 2) {
        const [lng, lat] = coords;
        if (typeof lng !== 'number' || typeof lat !== 'number') {
          throw new Error('Coordinates must be numbers');
        }
        if (lng < -180 || lng > 180) {
          throw new Error('Longitude must be between -180 and 180');
        }
        if (lat < -90 || lat > 90) {
          throw new Error('Latitude must be between -90 and 90');
        }
      }
      return true;
    })
];

/**
 * Validation rules for user login
 */
export const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .toLowerCase(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

/**
 * Validation rules for password change
 */
export const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    })
];

/**
 * Validation rules for profile update
 */
export const validateProfileUpdate = [
  body('profile.name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('profile.phone')
    .optional()
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Please provide a valid phone number'),
  
  body('profile.address')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Address cannot exceed 500 characters')
];