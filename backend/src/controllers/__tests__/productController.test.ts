import { Request, Response } from 'express';
import { createProduct } from '../productController';

// Simple test to verify the controller can be imported
describe('Product Controller', () => {
  it('should export createProduct function', () => {
    expect(typeof createProduct).toBe('function');
  });
});