import { ApiResponse, ValidationError } from '../types/api';

// Extract error message from API response
export const getErrorMessage = (response: ApiResponse): string => {
  if (response.message) {
    return response.message;
  }
  
  if (response.errors && response.errors.length > 0) {
    return response.errors.map((error: ValidationError) => error.message).join(', ');
  }
  
  return 'An unexpected error occurred';
};

// Check if API response is successful
export const isApiSuccess = <T>(response: ApiResponse<T>): response is ApiResponse<T> & { success: true; data: T } => {
  return response.success === true && response.data !== undefined;
};

// Extract data from successful API response
export const getApiData = <T>(response: ApiResponse<T>): T | null => {
  return isApiSuccess(response) ? response.data : null;
};

// Format validation errors for display
export const formatValidationErrors = (errors: ValidationError[]): Record<string, string> => {
  const formattedErrors: Record<string, string> = {};
  
  errors.forEach((error) => {
    formattedErrors[error.field] = error.message;
  });
  
  return formattedErrors;
};

// Handle API response and extract data or throw error
export const handleApiResponse = <T>(response: ApiResponse<T>): T => {
  if (isApiSuccess(response)) {
    return response.data;
  }
  
  throw new Error(getErrorMessage(response));
};