/**
 * Test cases to reproduce current security validation issues
 * Run with: node backend/src/analysis/security-test-cases.js
 */

// Import the current security middleware
const path = require('path');
const fs = require('fs');

// Mock the security patterns from the current middleware
const sqlPatterns = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
  /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
  /(--|\/\*|\*\/|;)/g,
  /(\b(WAITFOR|DELAY)\b)/gi
];

const checkForSQLInjection = (obj) => {
  if (typeof obj === 'string') {
    return sqlPatterns.some(pattern => pattern.test(obj));
  }
  
  if (typeof obj === 'object' && obj !== null) {
    return Object.values(obj).some(value => checkForSQLInjection(value));
  }
  
  return false;
};

// Test cases that should PASS but currently FAIL (False Positives)
const falsePositiveCases = [
  {
    name: "Original Mayor Message",
    content: "Dear citizens,\nI am excited to announce a new initiative aimed at improving our city's infrastructure and creating more green spaces. This project will enhance our neighbourhoods, create jobs, and make our city a better place to live for everyone. Together, we can build a stronger, more sustainable future for our community. Thank you for your ongoing support and dedication to making our city thrive.",
    expected: "SHOULD PASS",
    type: "Mayor Message"
  },
  {
    name: "Product Description with Numbers",
    content: "Fresh organic vegetables and 5 different varieties available daily",
    expected: "SHOULD PASS", 
    type: "Product Description"
  },
  {
    name: "Review with Rating",
    content: "Excellent service and 10 out of 10 rating! Highly recommend this farmer.",
    expected: "SHOULD PASS",
    type: "Review Content"
  },
  {
    name: "Technical Documentation",
    content: "This API supports version 2 and 3 with backward compatibility",
    expected: "SHOULD PASS",
    type: "Technical Content"
  },
  {
    name: "News Headline",
    content: "City budget increases by 15% and 20 new projects approved",
    expected: "SHOULD PASS",
    type: "News Content"
  },
  {
    name: "URL with Dashes",
    content: "Visit our website at https://example.com/farmer-marketplace-platform",
    expected: "SHOULD PASS",
    type: "URL Content"
  }
];

// Test cases that should FAIL and currently DO (True Positives)
const truePositiveCases = [
  {
    name: "Boolean SQL Injection",
    content: "1 AND 1=1",
    expected: "SHOULD FAIL",
    type: "SQL Injection"
  },
  {
    name: "Union Attack",
    content: "UNION SELECT * FROM users",
    expected: "SHOULD FAIL", 
    type: "SQL Injection"
  },
  {
    name: "Comment Injection",
    content: "'; DROP TABLE users; --",
    expected: "SHOULD FAIL",
    type: "SQL Injection"
  },
  {
    name: "Time-based Attack",
    content: "'; WAITFOR DELAY '00:00:05'; --",
    expected: "SHOULD FAIL",
    type: "SQL Injection"
  },
  {
    name: "OR-based Injection",
    content: "admin' OR 1=1 --",
    expected: "SHOULD FAIL",
    type: "SQL Injection"
  }
];

// Function to test a single case
const testCase = (testCase) => {
  const result = checkForSQLInjection(testCase.content);
  const status = result ? "BLOCKED" : "ALLOWED";
  const correct = (testCase.expected === "SHOULD FAIL" && result) || 
                  (testCase.expected === "SHOULD PASS" && !result);
  
  return {
    ...testCase,
    result: status,
    correct: correct,
    issue: !correct ? (result ? "FALSE POSITIVE" : "FALSE NEGATIVE") : "OK"
  };
};

// Run all tests
console.log("=".repeat(80));
console.log("SECURITY VALIDATION TEST RESULTS");
console.log("=".repeat(80));

console.log("\n📋 FALSE POSITIVE CASES (Should pass but may fail):");
console.log("-".repeat(60));

const falsePositiveResults = falsePositiveCases.map(testCase);
falsePositiveResults.forEach(result => {
  const icon = result.correct ? "✅" : "❌";
  console.log(`${icon} ${result.name}`);
  console.log(`   Content: "${result.content.substring(0, 60)}${result.content.length > 60 ? '...' : ''}"`);
  console.log(`   Expected: ${result.expected} | Actual: ${result.result} | Issue: ${result.issue}`);
  console.log("");
});

console.log("\n🔒 TRUE POSITIVE CASES (Should fail and do fail):");
console.log("-".repeat(60));

const truePositiveResults = truePositiveCases.map(testCase);
truePositiveResults.forEach(result => {
  const icon = result.correct ? "✅" : "❌";
  console.log(`${icon} ${result.name}`);
  console.log(`   Content: "${result.content}"`);
  console.log(`   Expected: ${result.expected} | Actual: ${result.result} | Issue: ${result.issue}`);
  console.log("");
});

// Summary
const totalTests = falsePositiveResults.length + truePositiveResults.length;
const correctResults = [...falsePositiveResults, ...truePositiveResults].filter(r => r.correct).length;
const falsePositives = falsePositiveResults.filter(r => !r.correct).length;
const falseNegatives = truePositiveResults.filter(r => !r.correct).length;

console.log("\n📊 SUMMARY:");
console.log("-".repeat(40));
console.log(`Total Tests: ${totalTests}`);
console.log(`Correct Results: ${correctResults}/${totalTests} (${Math.round(correctResults/totalTests*100)}%)`);
console.log(`False Positives: ${falsePositives} (blocking legitimate content)`);
console.log(`False Negatives: ${falseNegatives} (missing actual attacks)`);

if (falsePositives > 0) {
  console.log(`\n⚠️  CRITICAL ISSUE: ${falsePositives} false positive(s) detected!`);
  console.log("   This means legitimate content is being blocked.");
  console.log("   The security patterns need to be improved.");
}

if (falseNegatives > 0) {
  console.log(`\n🚨 SECURITY RISK: ${falseNegatives} false negative(s) detected!`);
  console.log("   This means actual attacks are not being caught.");
  console.log("   The security patterns need to be strengthened.");
}

console.log("\n" + "=".repeat(80));

// Export results for further analysis
module.exports = {
  falsePositiveResults,
  truePositiveResults,
  summary: {
    totalTests,
    correctResults,
    falsePositives,
    falseNegatives,
    accuracy: Math.round(correctResults/totalTests*100)
  }
};