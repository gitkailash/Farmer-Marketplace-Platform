/**
 * Test script for enhanced SQL detection
 * Run with: npx ts-node backend/src/security/test-enhanced-detection.ts
 */

import { EnhancedSQLDetector, ValidationContext } from './enhanced-sql-detection';

const detector = new EnhancedSQLDetector();

// Test cases
const testCases = [
  // Should PASS (legitimate content)
  {
    name: "Original Mayor Message",
    content: "Dear citizens,\nI am excited to announce a new initiative aimed at improving our city's infrastructure and creating more green spaces. This project will enhance our neighbourhoods, create jobs, and make our city a better place to live for everyone. Together, we can build a stronger, more sustainable future for our community. Thank you for your ongoing support and dedication to making our city thrive.",
    context: { contentType: 'MAYOR_MESSAGE' as const },
    shouldPass: true
  },
  {
    name: "Product Description",
    content: "Fresh organic vegetables and 5 different varieties available daily",
    context: { contentType: 'FREE_TEXT' as const },
    shouldPass: true
  },
  {
    name: "Review Content",
    content: "Excellent service and 10 out of 10 rating! Highly recommend this farmer.",
    context: { contentType: 'FREE_TEXT' as const },
    shouldPass: true
  },
  {
    name: "Technical Documentation",
    content: "This API supports version 2 and 3 with backward compatibility",
    context: { contentType: 'FREE_TEXT' as const },
    shouldPass: true
  },
  
  // Should FAIL (actual attacks)
  {
    name: "Boolean SQL Injection",
    content: "1 AND 1=1",
    context: { contentType: 'STRUCTURED' as const },
    shouldPass: false
  },
  {
    name: "Union Attack",
    content: "UNION SELECT * FROM users",
    context: { contentType: 'STRUCTURED' as const },
    shouldPass: false
  },
  {
    name: "Comment Injection",
    content: "'; DROP TABLE users; --",
    context: { contentType: 'STRUCTURED' as const },
    shouldPass: false
  },
  {
    name: "Time-based Attack",
    content: "'; WAITFOR DELAY '00:00:05'; --",
    context: { contentType: 'STRUCTURED' as const },
    shouldPass: false
  }
];

console.log("=".repeat(80));
console.log("ENHANCED SQL DETECTION TEST RESULTS");
console.log("=".repeat(80));

let totalTests = 0;
let correctResults = 0;
let falsePositives = 0;
let falseNegatives = 0;

testCases.forEach(testCase => {
  totalTests++;
  
  const result = detector.validateContent(testCase.content, testCase.context);
  const passed = result.isValid;
  const correct = (testCase.shouldPass && passed) || (!testCase.shouldPass && !passed);
  
  if (correct) {
    correctResults++;
  } else if (!testCase.shouldPass && passed) {
    falseNegatives++;
  } else if (testCase.shouldPass && !passed) {
    falsePositives++;
  }
  
  const icon = correct ? "✅" : "❌";
  const status = passed ? "ALLOWED" : "BLOCKED";
  const expected = testCase.shouldPass ? "SHOULD PASS" : "SHOULD FAIL";
  
  console.log(`${icon} ${testCase.name}`);
  console.log(`   Content: "${testCase.content.substring(0, 60)}${testCase.content.length > 60 ? '...' : ''}"`);
  console.log(`   Expected: ${expected} | Actual: ${status}`);
  console.log(`   Threat Level: ${result.threatLevel} | Confidence: ${result.confidence.toFixed(2)}`);
  
  if (result.violations.length > 0) {
    console.log(`   Violations: ${result.violations.length}`);
    result.violations.forEach(violation => {
      console.log(`     - ${violation.description} (confidence: ${violation.confidence.toFixed(2)})`);
    });
  }
  
  if (!correct) {
    console.log(`   Issue: ${!testCase.shouldPass && passed ? "FALSE NEGATIVE" : "FALSE POSITIVE"}`);
  }
  
  console.log("");
});

console.log("=".repeat(80));
console.log("SUMMARY:");
console.log(`Total Tests: ${totalTests}`);
console.log(`Correct Results: ${correctResults}/${totalTests} (${Math.round(correctResults/totalTests*100)}%)`);
console.log(`False Positives: ${falsePositives} (blocking legitimate content)`);
console.log(`False Negatives: ${falseNegatives} (missing actual attacks)`);

if (falsePositives === 0) {
  console.log("✅ No false positives detected! Legitimate content is allowed.");
} else {
  console.log(`❌ ${falsePositives} false positive(s) detected - needs improvement.`);
}

if (falseNegatives === 0) {
  console.log("✅ No false negatives detected! All attacks are caught.");
} else {
  console.log(`❌ ${falseNegatives} false negative(s) detected - security risk!`);
}

console.log("=".repeat(80));