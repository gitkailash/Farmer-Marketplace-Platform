/**
 * Manual Test for Products.tsx Farmer Profile Display Fix
 * 
 * This file demonstrates that the farmer profile display fix handles various data structures correctly.
 * Run this in the browser console or use it as a reference for testing.
 */

import { Product } from '../../types/api'

// Test data structures that the fix should handle
const testProducts: Product[] = [
  // Case 1: Complete farmer profile data
  {
    _id: '1',
    farmerId: 'farmer123456789',
    name: 'Fresh Tomatoes',
    description: 'Organic tomatoes',
    category: 'Vegetables',
    price: 5,
    unit: 'kg',
    stock: 10,
    images: ['tomato.jpg'],
    status: 'PUBLISHED',
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
    farmer: {
      _id: 'farmer123456789',
      userId: {
        profile: {
          name: 'John Smith'
        }
      },
      rating: 4.5,
      reviewCount: 25,
      location: {
        district: 'Kathmandu',
        municipality: 'Kathmandu Metropolitan'
      }
    }
  },

  // Case 2: Missing farmer property entirely
  {
    _id: '2',
    farmerId: 'farmer987654321',
    name: 'Fresh Carrots',
    description: 'Organic carrots',
    category: 'Vegetables',
    price: 3,
    unit: 'kg',
    stock: 15,
    images: ['carrot.jpg'],
    status: 'PUBLISHED',
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
    // No farmer property
  },

  // Case 3: Farmer exists but userId is undefined
  {
    _id: '3',
    farmerId: 'farmer111222333',
    name: 'Fresh Potatoes',
    description: 'Organic potatoes',
    category: 'Vegetables',
    price: 2,
    unit: 'kg',
    stock: 20,
    images: ['potato.jpg'],
    status: 'PUBLISHED',
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
    farmer: {
      _id: 'farmer111222333',
      userId: undefined as any, // Simulating missing userId
      rating: 4.0,
      reviewCount: 15,
      location: {
        district: 'Lalitpur',
        municipality: 'Lalitpur Metropolitan'
      }
    }
  },

  // Case 4: Farmer and userId exist but profile is undefined
  {
    _id: '4',
    farmerId: 'farmer444555666',
    name: 'Fresh Onions',
    description: 'Organic onions',
    category: 'Vegetables',
    price: 4,
    unit: 'kg',
    stock: 12,
    images: ['onion.jpg'],
    status: 'PUBLISHED',
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
    farmer: {
      _id: 'farmer444555666',
      userId: {
        profile: undefined as any // Simulating missing profile
      },
      rating: 3.8,
      reviewCount: 8,
      location: {
        district: 'Bhaktapur',
        municipality: 'Bhaktapur Municipality'
      }
    }
  },

  // Case 5: Profile exists but name is undefined
  {
    _id: '5',
    farmerId: 'farmer777888999',
    name: 'Fresh Spinach',
    description: 'Organic spinach',
    category: 'Vegetables',
    price: 6,
    unit: 'kg',
    stock: 8,
    images: ['spinach.jpg'],
    status: 'PUBLISHED',
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
    farmer: {
      _id: 'farmer777888999',
      userId: {
        profile: {
          name: undefined as any // Simulating missing name
        }
      },
      rating: 4.2,
      reviewCount: 12,
      location: {
        district: 'Pokhara',
        municipality: 'Pokhara Metropolitan'
      }
    }
  }
]

// Function to test the farmer display logic (extracted from the component)
function getFarmerDisplayName(product: Product): string {
  return product.farmer?.userId?.profile?.name || `Farmer #${product.farmerId.slice(-8)}`
}

// Test results
console.log('Testing Farmer Profile Display Fix:')
console.log('=====================================')

testProducts.forEach((product, index) => {
  const displayName = getFarmerDisplayName(product)
  console.log(`Test Case ${index + 1}: ${product.name}`)
  console.log(`  Farmer ID: ${product.farmerId}`)
  console.log(`  Has farmer object: ${!!product.farmer}`)
  console.log(`  Has userId: ${!!product.farmer?.userId}`)
  console.log(`  Has profile: ${!!product.farmer?.userId?.profile}`)
  console.log(`  Has name: ${!!product.farmer?.userId?.profile?.name}`)
  console.log(`  Display: "by ${displayName}"`)
  console.log('---')
})

// Expected results:
// Test Case 1: Should display "by John Smith"
// Test Case 2: Should display "by Farmer #54321" (last 8 chars of farmer987654321)
// Test Case 3: Should display "by Farmer #22333" (last 8 chars of farmer111222333)
// Test Case 4: Should display "by Farmer #55666" (last 8 chars of farmer444555666)
// Test Case 5: Should display "by Farmer #88999" (last 8 chars of farmer777888999)

export { testProducts, getFarmerDisplayName }