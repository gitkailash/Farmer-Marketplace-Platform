// Manual test file to verify review data processor functionality
// This can be run in the browser console or Node.js environment

import {
  extractUserId,
  extractUserName,
  processReviewDate,
  validateRating,
  validateComment,
  processSingleReview,
  processReviewArray,
  calculateReviewSummary,
  handleMalformedReviewData,
  canDisplayReview,
  getDisplaySafeReviews
} from './reviewDataProcessor';

// Test data with various malformed structures
const testReviewData = [
  // Valid review
  {
    _id: 'review1',
    orderId: 'order1',
    reviewerId: 'user1',
    revieweeId: 'farmer1',
    reviewerType: 'BUYER',
    rating: 5,
    comment: 'Excellent service!',
    isApproved: true,
    createdAt: '2023-12-01T10:00:00Z'
  },
  // Review with object references
  {
    _id: 'review2',
    orderId: 'order2',
    reviewerId: {
      _id: 'user2',
      profile: { name: 'John Doe' }
    },
    revieweeId: {
      _id: 'farmer2',
      profile: { name: 'Jane Farm' }
    },
    reviewerType: 'BUYER',
    rating: 4,
    comment: 'Good quality products',
    isApproved: false,
    createdAt: '2023-11-15T14:30:00Z'
  },
  // Review with missing data
  {
    _id: 'review3',
    orderId: 'order3',
    reviewerId: 'user3',
    revieweeId: 'farmer3',
    rating: 'invalid-rating',
    comment: '',
    isApproved: true,
    createdAt: 'invalid-date'
  },
  // Review with malformed date
  {
    _id: 'review4',
    orderId: 'order4',
    reviewerId: { _id: 'user4' }, // Missing profile
    revieweeId: 'farmer4',
    reviewerType: 'BUYER',
    rating: 3.7, // Should round to 4
    comment: '  Good but could be better  ', // Should trim
    isApproved: true,
    createdAt: '1900-01-01T00:00:00Z' // Unreasonable date
  },
  // Invalid review (missing ID)
  {
    orderId: 'order5',
    reviewerId: 'user5',
    revieweeId: 'farmer5',
    rating: 2,
    comment: 'Not satisfied',
    isApproved: true,
    createdAt: '2023-10-01T09:00:00Z'
  }
];

// Test various malformed data structures
const malformedDataTests = [
  // Direct array
  testReviewData,
  // Nested in data.reviews
  { data: { reviews: testReviewData } },
  // Nested in data
  { data: testReviewData },
  // Response format
  { reviews: testReviewData },
  // Invalid formats
  'invalid-string',
  null,
  undefined,
  { someOtherProperty: 'value' }
];

console.log('=== Review Data Processor Manual Tests ===\n');

// Test 1: Extract User ID
console.log('1. Testing extractUserId:');
console.log('  String ID:', extractUserId('user123'));
console.log('  Object with _id:', extractUserId({ _id: 'user123' }));
console.log('  Object with id:', extractUserId({ id: 'user123' }));
console.log('  Invalid input:', extractUserId(null));
console.log('');

// Test 2: Extract User Name
console.log('2. Testing extractUserName:');
console.log('  Profile name:', extractUserName({ profile: { name: 'John Doe' } }));
console.log('  Direct name:', extractUserName({ name: 'Jane Smith' }));
console.log('  Email fallback:', extractUserName({ email: 'test@example.com' }));
console.log('  Fallback:', extractUserName(null));
console.log('');

// Test 3: Process Review Date
console.log('3. Testing processReviewDate:');
console.log('  Valid date:', processReviewDate('2023-12-01T10:00:00Z'));
console.log('  Invalid date:', processReviewDate('invalid-date'));
console.log('  Missing date:', processReviewDate(null));
console.log('  Old date:', processReviewDate('1900-01-01T00:00:00Z'));
console.log('');

// Test 4: Validate Rating
console.log('4. Testing validateRating:');
console.log('  Valid rating (5):', validateRating(5));
console.log('  Valid rating (3.7):', validateRating(3.7));
console.log('  Invalid rating (0):', validateRating(0));
console.log('  Invalid rating (string):', validateRating('invalid'));
console.log('');

// Test 5: Validate Comment
console.log('5. Testing validateComment:');
console.log('  Valid comment:', validateComment('Great service!'));
console.log('  Whitespace comment:', validateComment('  Good  '));
console.log('  Empty comment:', validateComment(''));
console.log('  Null comment:', validateComment(null));
console.log('');

// Test 6: Process Single Review
console.log('6. Testing processSingleReview:');
testReviewData.forEach((review, index) => {
  const processed = processSingleReview(review);
  console.log(`  Review ${index + 1}:`, processed ? 'Processed successfully' : 'Failed to process');
  if (processed) {
    console.log(`    - ID: ${processed._id}`);
    console.log(`    - Reviewer: ${processed.reviewerName}`);
    console.log(`    - Valid rating: ${processed.hasValidRating}`);
    console.log(`    - Valid comment: ${processed.hasValidComment}`);
    console.log(`    - Valid date: ${processed.isValidDate}`);
    console.log(`    - Can display: ${canDisplayReview(processed)}`);
  }
});
console.log('');

// Test 7: Handle Malformed Data
console.log('7. Testing handleMalformedReviewData:');
malformedDataTests.forEach((data, index) => {
  const result = handleMalformedReviewData(data);
  console.log(`  Test ${index + 1}:`, {
    reviewsFound: result.reviews.length,
    errorsFound: result.errors.length,
    errors: result.errors
  });
});
console.log('');

// Test 8: Process Review Array and Calculate Summary
console.log('8. Testing processReviewArray and calculateReviewSummary:');
const processedReviews = processReviewArray(testReviewData);
const summary = calculateReviewSummary(processedReviews);
console.log('  Processed reviews:', processedReviews.length);
console.log('  Summary:', summary);
console.log('');

// Test 9: Display Safe Reviews
console.log('9. Testing getDisplaySafeReviews:');
const displaySafeReviews = getDisplaySafeReviews(processedReviews);
console.log('  Total processed:', processedReviews.length);
console.log('  Display safe:', displaySafeReviews.length);
console.log('  Display safe IDs:', displaySafeReviews.map(r => r._id));
console.log('');

console.log('=== Manual Tests Complete ===');

// Export for potential use in browser console
if (typeof window !== 'undefined') {
  (window as any).reviewDataProcessorTests = {
    testData: testReviewData,
    malformedTests: malformedDataTests,
    processedReviews,
    summary,
    displaySafeReviews
  };
  console.log('Test data exported to window.reviewDataProcessorTests');
}