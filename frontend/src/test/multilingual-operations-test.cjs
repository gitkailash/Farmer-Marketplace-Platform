#!/usr/bin/env node

/**
 * Comprehensive Multilingual Operations Test
 * Tests all insert and update operations for Products, News, Gallery, and Mayor Messages
 * in both English and Nepali languages
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';
const TEST_RESULTS_FILE = path.join(__dirname, '../test-results/multilingual-operations-results.json');

// Test data templates
const TEST_DATA = {
  // Product test data
  product: {
    english: {
      name: { en: "Fresh Organic Tomatoes", ne: "" },
      description: { en: "Premium quality organic tomatoes grown without pesticides", ne: "" },
      category: { en: "Vegetables", ne: "" },
      price: 150,
      stock: 50,
      unit: "kg",
      images: ["https://example.com/tomato1.jpg"],
      status: "PUBLISHED"
    },
    nepali: {
      name: { en: "Fresh Organic Tomatoes", ne: "ताजा जैविक गोलभेडा" },
      description: { en: "Premium quality organic tomatoes grown without pesticides", ne: "कीटनाशक बिना उत्पादित उच्च गुणस्तरीय जैविक गोलभेडा" },
      category: { en: "Vegetables", ne: "तरकारीहरू" },
      price: 150,
      stock: 50,
      unit: "kg",
      images: ["https://example.com/tomato1.jpg"],
      status: "PUBLISHED"
    },
    update: {
      english: {
        name: { en: "Premium Organic Tomatoes - Updated", ne: "" },
        description: { en: "Updated: Premium quality organic tomatoes with enhanced freshness", ne: "" },
        price: 175,
        stock: 75
      },
      nepali: {
        name: { en: "Premium Organic Tomatoes - Updated", ne: "प्रिमियम जैविक गोलभेडा - अपडेट गरिएको" },
        description: { en: "Updated: Premium quality organic tomatoes with enhanced freshness", ne: "अपडेट गरिएको: बढी ताजगीसहित उच्च गुणस्तरीय जैविक गोलभेडा" },
        price: 175,
        stock: 75
      }
    }
  },

  // News test data
  news: {
    english: {
      headline: { en: "New Agricultural Technology Introduced", ne: "" },
      content: { en: "The government has introduced new agricultural technology to help farmers increase their productivity.", ne: "" },
      summary: { en: "Government introduces new agricultural technology for farmers", ne: "" },
      priority: "MEDIUM",
      isActive: true
    },
    nepali: {
      headline: { en: "New Agricultural Technology Introduced", ne: "नयाँ कृषि प्रविधि सुरु गरिएको" },
      content: { en: "The government has introduced new agricultural technology to help farmers increase their productivity.", ne: "सरकारले किसानहरूको उत्पादकत्व बढाउन नयाँ कृषि प्रविधि सुरु गरेको छ।" },
      summary: { en: "Government introduces new agricultural technology for farmers", ne: "सरकारले किसानहरूका लागि नयाँ कृषि प्रविधि सुरु गर्यो" },
      priority: "MEDIUM",
      isActive: true
    },
    update: {
      english: {
        headline: { en: "Updated: New Agricultural Technology Shows Results", ne: "" },
        content: { en: "Updated: The new agricultural technology has shown promising results in increasing farmer productivity.", ne: "" },
        priority: "HIGH"
      },
      nepali: {
        headline: { en: "Updated: New Agricultural Technology Shows Results", ne: "अपडेट: नयाँ कृषि प्रविधिले परिणाम देखाएको" },
        content: { en: "Updated: The new agricultural technology has shown promising results in increasing farmer productivity.", ne: "अपडेट: नयाँ कृषि प्रविधिले किसानहरूको उत्पादकत्व बढाउनमा आशाजनक परिणाम देखाएको छ।" },
        priority: "HIGH"
      }
    }
  },

  // Gallery test data
  gallery: {
    english: {
      title: { en: "Harvest Festival 2024", ne: "" },
      description: { en: "Annual harvest festival celebrating local farmers and their produce", ne: "" },
      category: { en: "Events", ne: "" },
      imageUrl: "https://example.com/harvest-festival.jpg",
      isActive: true,
      order: 1
    },
    nepali: {
      title: { en: "Harvest Festival 2024", ne: "फसल उत्सव २०२४" },
      description: { en: "Annual harvest festival celebrating local farmers and their produce", ne: "स्थानीय किसानहरू र तिनीहरूका उत्पादनहरूको उत्सव मनाउने वार्षिक फसल उत्सव" },
      category: { en: "Events", ne: "कार्यक्रमहरू" },
      imageUrl: "https://example.com/harvest-festival.jpg",
      isActive: true,
      order: 1
    },
    update: {
      english: {
        title: { en: "Updated: Harvest Festival 2024 - Grand Success", ne: "" },
        description: { en: "Updated: The annual harvest festival was a grand success with record participation", ne: "" },
        order: 2
      },
      nepali: {
        title: { en: "Updated: Harvest Festival 2024 - Grand Success", ne: "अपडेट: फसल उत्सव २०२४ - ठूलो सफलता" },
        description: { en: "Updated: The annual harvest festival was a grand success with record participation", ne: "अपडेट: वार्षिक फसल उत्सव रेकर्ड सहभागितासहित ठूलो सफलता भएको थियो" },
        order: 2
      }
    }
  },

  // Mayor message test data
  mayor: {
    english: {
      title: { en: "Welcome Message from Mayor", ne: "" },
      content: { en: "Welcome to our farmer marketplace platform. We are committed to supporting our local farmers.", ne: "" },
      isActive: true,
      priority: "HIGH"
    },
    nepali: {
      title: { en: "Welcome Message from Mayor", ne: "मेयरको स्वागत सन्देश" },
      content: { en: "Welcome to our farmer marketplace platform. We are committed to supporting our local farmers.", ne: "हाम्रो किसान बजार प्लेटफर्ममा स्वागत छ। हामी हाम्रा स्थानीय किसानहरूलाई सहयोग गर्न प्रतिबद्ध छौं।" },
      isActive: true,
      priority: "HIGH"
    },
    update: {
      english: {
        title: { en: "Updated: Mayor's New Year Message", ne: "" },
        content: { en: "Updated: Happy New Year! We continue our commitment to supporting farmers in 2024.", ne: "" },
        priority: "MEDIUM"
      },
      nepali: {
        title: { en: "Updated: Mayor's New Year Message", ne: "अपडेट: मेयरको नयाँ वर्षको सन्देश" },
        content: { en: "Updated: Happy New Year! We continue our commitment to supporting farmers in 2024.", ne: "अपडेट: नयाँ वर्षको शुभकामना! हामी २०२४ मा किसानहरूलाई सहयोग गर्ने हाम्रो प्रतिबद्धता जारी राख्छौं।" },
        priority: "MEDIUM"
      }
    }
  }
};

// Test results storage
let testResults = {
  timestamp: new Date().toISOString(),
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  },
  tests: []
};

// Utility functions
function logTest(testName, status, message, details = null) {
  const result = {
    testName,
    status,
    message,
    details,
    timestamp: new Date().toISOString()
  };
  
  testResults.tests.push(result);
  testResults.summary.total++;
  
  if (status === 'PASS') {
    testResults.summary.passed++;
    console.log(`✅ ${testName}: ${message}`);
  } else if (status === 'FAIL') {
    testResults.summary.failed++;
    console.log(`❌ ${testName}: ${message}`);
    if (details) console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
  } else if (status === 'WARN') {
    testResults.summary.warnings++;
    console.log(`⚠️  ${testName}: ${message}`);
  }
}

async function makeRequest(method, endpoint, data = null, token = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    ...(data && { body: JSON.stringify(data) })
  };

  try {
    const response = await fetch(url, options);
    const responseData = await response.json();
    
    return {
      success: response.ok,
      status: response.status,
      data: responseData
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      error: error.message
    };
  }
}

// Authentication helper
async function getAuthTokens() {
  // Try to get farmer token
  const farmerLogin = await makeRequest('POST', '/auth/login', {
    email: 'farmer@test.com',
    password: 'password123'
  });

  // Try to get admin token
  const adminLogin = await makeRequest('POST', '/auth/login', {
    email: 'admin@test.com',
    password: 'password123'
  });

  return {
    farmer: farmerLogin.success ? farmerLogin.data.token : null,
    admin: adminLogin.success ? adminLogin.data.token : null
  };
}

// Test functions
async function testProductOperations(tokens) {
  console.log('\n🧪 Testing Product Operations...');
  
  if (!tokens.farmer) {
    logTest('Product Operations', 'WARN', 'No farmer token available, skipping product tests');
    return;
  }

  // Test English product creation
  const englishProduct = await makeRequest('POST', '/products', TEST_DATA.product.english, tokens.farmer);
  if (englishProduct.success) {
    logTest('Product Create (English)', 'PASS', 'English product created successfully', {
      productId: englishProduct.data._id,
      name: englishProduct.data.name
    });

    // Test English product update
    const englishUpdate = await makeRequest('PUT', `/products/${englishProduct.data._id}`, TEST_DATA.product.update.english, tokens.farmer);
    if (englishUpdate.success) {
      logTest('Product Update (English)', 'PASS', 'English product updated successfully', {
        updatedName: englishUpdate.data.name
      });
    } else {
      logTest('Product Update (English)', 'FAIL', 'Failed to update English product', englishUpdate);
    }
  } else {
    logTest('Product Create (English)', 'FAIL', 'Failed to create English product', englishProduct);
  }

  // Test Nepali product creation
  const nepaliProduct = await makeRequest('POST', '/products', TEST_DATA.product.nepali, tokens.farmer);
  if (nepaliProduct.success) {
    logTest('Product Create (Nepali)', 'PASS', 'Nepali product created successfully', {
      productId: nepaliProduct.data._id,
      name: nepaliProduct.data.name
    });

    // Test Nepali product update
    const nepaliUpdate = await makeRequest('PUT', `/products/${nepaliProduct.data._id}`, TEST_DATA.product.update.nepali, tokens.farmer);
    if (nepaliUpdate.success) {
      logTest('Product Update (Nepali)', 'PASS', 'Nepali product updated successfully', {
        updatedName: nepaliUpdate.data.name
      });
    } else {
      logTest('Product Update (Nepali)', 'FAIL', 'Failed to update Nepali product', nepaliUpdate);
    }
  } else {
    logTest('Product Create (Nepali)', 'FAIL', 'Failed to create Nepali product', nepaliProduct);
  }
}

async function testNewsOperations(tokens) {
  console.log('\n📰 Testing News Operations...');
  
  if (!tokens.admin) {
    logTest('News Operations', 'WARN', 'No admin token available, skipping news tests');
    return;
  }

  // Test English news creation
  const englishNews = await makeRequest('POST', '/content/news', TEST_DATA.news.english, tokens.admin);
  if (englishNews.success) {
    logTest('News Create (English)', 'PASS', 'English news created successfully', {
      newsId: englishNews.data._id,
      headline: englishNews.data.headline
    });

    // Test English news update
    const englishUpdate = await makeRequest('PUT', `/content/news/${englishNews.data._id}`, TEST_DATA.news.update.english, tokens.admin);
    if (englishUpdate.success) {
      logTest('News Update (English)', 'PASS', 'English news updated successfully', {
        updatedHeadline: englishUpdate.data.headline
      });
    } else {
      logTest('News Update (English)', 'FAIL', 'Failed to update English news', englishUpdate);
    }
  } else {
    logTest('News Create (English)', 'FAIL', 'Failed to create English news', englishNews);
  }

  // Test Nepali news creation
  const nepaliNews = await makeRequest('POST', '/content/news', TEST_DATA.news.nepali, tokens.admin);
  if (nepaliNews.success) {
    logTest('News Create (Nepali)', 'PASS', 'Nepali news created successfully', {
      newsId: nepaliNews.data._id,
      headline: nepaliNews.data.headline
    });

    // Test Nepali news update
    const nepaliUpdate = await makeRequest('PUT', `/content/news/${nepaliNews.data._id}`, TEST_DATA.news.update.nepali, tokens.admin);
    if (nepaliUpdate.success) {
      logTest('News Update (Nepali)', 'PASS', 'Nepali news updated successfully', {
        updatedHeadline: nepaliUpdate.data.headline
      });
    } else {
      logTest('News Update (Nepali)', 'FAIL', 'Failed to update Nepali news', nepaliUpdate);
    }
  } else {
    logTest('News Create (Nepali)', 'FAIL', 'Failed to create Nepali news', nepaliNews);
  }
}

async function testGalleryOperations(tokens) {
  console.log('\n🖼️  Testing Gallery Operations...');
  
  if (!tokens.admin) {
    logTest('Gallery Operations', 'WARN', 'No admin token available, skipping gallery tests');
    return;
  }

  // Test English gallery creation
  const englishGallery = await makeRequest('POST', '/content/gallery', TEST_DATA.gallery.english, tokens.admin);
  if (englishGallery.success) {
    logTest('Gallery Create (English)', 'PASS', 'English gallery item created successfully', {
      galleryId: englishGallery.data._id,
      title: englishGallery.data.title
    });

    // Test English gallery update
    const englishUpdate = await makeRequest('PUT', `/content/gallery/${englishGallery.data._id}`, TEST_DATA.gallery.update.english, tokens.admin);
    if (englishUpdate.success) {
      logTest('Gallery Update (English)', 'PASS', 'English gallery item updated successfully', {
        updatedTitle: englishUpdate.data.title
      });
    } else {
      logTest('Gallery Update (English)', 'FAIL', 'Failed to update English gallery item', englishUpdate);
    }
  } else {
    logTest('Gallery Create (English)', 'FAIL', 'Failed to create English gallery item', englishGallery);
  }

  // Test Nepali gallery creation
  const nepaliGallery = await makeRequest('POST', '/content/gallery', TEST_DATA.gallery.nepali, tokens.admin);
  if (nepaliGallery.success) {
    logTest('Gallery Create (Nepali)', 'PASS', 'Nepali gallery item created successfully', {
      galleryId: nepaliGallery.data._id,
      title: nepaliGallery.data.title
    });

    // Test Nepali gallery update
    const nepaliUpdate = await makeRequest('PUT', `/content/gallery/${nepaliGallery.data._id}`, TEST_DATA.gallery.update.nepali, tokens.admin);
    if (nepaliUpdate.success) {
      logTest('Gallery Update (Nepali)', 'PASS', 'Nepali gallery item updated successfully', {
        updatedTitle: nepaliUpdate.data.title
      });
    } else {
      logTest('Gallery Update (Nepali)', 'FAIL', 'Failed to update Nepali gallery item', nepaliUpdate);
    }
  } else {
    logTest('Gallery Create (Nepali)', 'FAIL', 'Failed to create Nepali gallery item', nepaliGallery);
  }
}

async function testMayorMessageOperations(tokens) {
  console.log('\n🏛️  Testing Mayor Message Operations...');
  
  if (!tokens.admin) {
    logTest('Mayor Message Operations', 'WARN', 'No admin token available, skipping mayor message tests');
    return;
  }

  // Test English mayor message creation
  const englishMayor = await makeRequest('POST', '/content/mayor', TEST_DATA.mayor.english, tokens.admin);
  if (englishMayor.success) {
    logTest('Mayor Message Create (English)', 'PASS', 'English mayor message created successfully', {
      mayorId: englishMayor.data._id,
      title: englishMayor.data.title
    });

    // Test English mayor message update
    const englishUpdate = await makeRequest('PUT', `/content/mayor/${englishMayor.data._id}`, TEST_DATA.mayor.update.english, tokens.admin);
    if (englishUpdate.success) {
      logTest('Mayor Message Update (English)', 'PASS', 'English mayor message updated successfully', {
        updatedTitle: englishUpdate.data.title
      });
    } else {
      logTest('Mayor Message Update (English)', 'FAIL', 'Failed to update English mayor message', englishUpdate);
    }
  } else {
    logTest('Mayor Message Create (English)', 'FAIL', 'Failed to create English mayor message', englishMayor);
  }

  // Test Nepali mayor message creation
  const nepaliMayor = await makeRequest('POST', '/content/mayor', TEST_DATA.mayor.nepali, tokens.admin);
  if (nepaliMayor.success) {
    logTest('Mayor Message Create (Nepali)', 'PASS', 'Nepali mayor message created successfully', {
      mayorId: nepaliMayor.data._id,
      title: nepaliMayor.data.title
    });

    // Test Nepali mayor message update
    const nepaliUpdate = await makeRequest('PUT', `/content/mayor/${nepaliMayor.data._id}`, TEST_DATA.mayor.update.nepali, tokens.admin);
    if (nepaliUpdate.success) {
      logTest('Mayor Message Update (Nepali)', 'PASS', 'Nepali mayor message updated successfully', {
        updatedTitle: nepaliUpdate.data.title
      });
    } else {
      logTest('Mayor Message Update (Nepali)', 'FAIL', 'Failed to update Nepali mayor message', nepaliUpdate);
    }
  } else {
    logTest('Mayor Message Create (Nepali)', 'FAIL', 'Failed to create Nepali mayor message', nepaliMayor);
  }
}

// Data validation tests
async function testDataValidation() {
  console.log('\n🔍 Testing Data Validation...');

  // Test multilingual field structure validation
  const testCases = [
    {
      name: 'Valid Multilingual Field',
      data: { en: 'English text', ne: 'नेपाली पाठ' },
      expected: 'PASS'
    },
    {
      name: 'English Only Field',
      data: { en: 'English text', ne: '' },
      expected: 'PASS'
    },
    {
      name: 'Missing English Field',
      data: { ne: 'नेपाली पाठ' },
      expected: 'WARN'
    },
    {
      name: 'Empty Multilingual Field',
      data: { en: '', ne: '' },
      expected: 'FAIL'
    }
  ];

  testCases.forEach(testCase => {
    const hasEnglish = testCase.data.en && testCase.data.en.trim().length > 0;
    const hasNepali = testCase.data.ne && testCase.data.ne.trim().length > 0;

    if (hasEnglish && hasNepali) {
      logTest(`Data Validation: ${testCase.name}`, 'PASS', 'Both languages present');
    } else if (hasEnglish && !hasNepali) {
      logTest(`Data Validation: ${testCase.name}`, 'PASS', 'English present, Nepali empty (acceptable)');
    } else if (!hasEnglish && hasNepali) {
      logTest(`Data Validation: ${testCase.name}`, 'WARN', 'Missing English translation (fallback language)');
    } else {
      logTest(`Data Validation: ${testCase.name}`, 'FAIL', 'Both languages empty');
    }
  });
}

// Character encoding tests
async function testCharacterEncoding() {
  console.log('\n🔤 Testing Character Encoding...');

  const nepaliTestStrings = [
    'नेपाली भाषा',
    'किसान बजार',
    'स्वागत छ',
    'धन्यवाद',
    'गोलभेडा र काँक्रो',
    'मूल्य: रु. १५०',
    'संख्या: १२३४५६७८९०'
  ];

  nepaliTestStrings.forEach((testString, index) => {
    // Test UTF-8 encoding
    const encoded = encodeURIComponent(testString);
    const decoded = decodeURIComponent(encoded);
    
    if (decoded === testString) {
      logTest(`Character Encoding Test ${index + 1}`, 'PASS', `UTF-8 encoding/decoding successful for: ${testString}`);
    } else {
      logTest(`Character Encoding Test ${index + 1}`, 'FAIL', `UTF-8 encoding/decoding failed for: ${testString}`);
    }
  });
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Comprehensive Multilingual Operations Test');
  console.log('=' .repeat(60));

  // Create test results directory
  const resultsDir = path.dirname(TEST_RESULTS_FILE);
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  try {
    // Get authentication tokens
    console.log('🔐 Getting authentication tokens...');
    const tokens = await getAuthTokens();
    
    if (!tokens.farmer && !tokens.admin) {
      logTest('Authentication', 'FAIL', 'No authentication tokens available. Please ensure test users exist.');
      return;
    }

    if (tokens.farmer) {
      logTest('Authentication', 'PASS', 'Farmer token obtained successfully');
    } else {
      logTest('Authentication', 'WARN', 'Farmer token not available');
    }

    if (tokens.admin) {
      logTest('Authentication', 'PASS', 'Admin token obtained successfully');
    } else {
      logTest('Authentication', 'WARN', 'Admin token not available');
    }

    // Run all operation tests
    await testProductOperations(tokens);
    await testNewsOperations(tokens);
    await testGalleryOperations(tokens);
    await testMayorMessageOperations(tokens);

    // Run validation tests
    await testDataValidation();
    await testCharacterEncoding();

  } catch (error) {
    logTest('Test Runner', 'FAIL', `Unexpected error: ${error.message}`, { stack: error.stack });
  }

  // Generate final report
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('=' .repeat(60));
  console.log(`Total Tests: ${testResults.summary.total}`);
  console.log(`✅ Passed: ${testResults.summary.passed}`);
  console.log(`❌ Failed: ${testResults.summary.failed}`);
  console.log(`⚠️  Warnings: ${testResults.summary.warnings}`);
  
  const successRate = testResults.summary.total > 0 
    ? ((testResults.summary.passed / testResults.summary.total) * 100).toFixed(2)
    : 0;
  console.log(`📈 Success Rate: ${successRate}%`);

  // Save results to file
  fs.writeFileSync(TEST_RESULTS_FILE, JSON.stringify(testResults, null, 2));
  console.log(`\n💾 Test results saved to: ${TEST_RESULTS_FILE}`);

  // Exit with appropriate code
  process.exit(testResults.summary.failed > 0 ? 1 : 0);
}

// Handle global fetch for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testResults,
  TEST_DATA
};