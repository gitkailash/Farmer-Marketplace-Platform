import axios from 'axios';
import { config } from '../config/environment';

// Security testing script
class SecurityTester {
  private baseUrl: string;
  private testResults: Array<{ test: string; passed: boolean; details?: string }> = [];

  constructor(baseUrl: string = `http://localhost:${config.PORT}`) {
    this.baseUrl = baseUrl;
  }

  private logResult(test: string, passed: boolean, details?: string): void {
    const result: { test: string; passed: boolean; details?: string } = { test, passed };
    if (details !== undefined) {
      result.details = details;
    }
    this.testResults.push(result);
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${test}${details ? ` - ${details}` : ''}`);
  }

  async testRateLimiting(): Promise<void> {
    console.log('\n🔒 Testing Rate Limiting...');
    
    try {
      const requests = Array.from({ length: 10 }, () => 
        axios.get(`${this.baseUrl}/api/products`, { timeout: 5000 })
      );
      
      const responses = await Promise.allSettled(requests);
      const rateLimited = responses.some(result => 
        result.status === 'rejected' && 
        result.reason?.response?.status === 429
      );
      
      this.logResult(
        'Rate limiting active', 
        rateLimited, 
        rateLimited ? 'Rate limiting is working' : 'No rate limiting detected'
      );
    } catch (error) {
      this.logResult('Rate limiting test', false, 'Test failed to execute');
    }
  }

  async testSQLInjection(): Promise<void> {
    console.log('\n🛡️ Testing SQL Injection Protection...');
    
    const sqlPayloads = [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "1' UNION SELECT * FROM users --",
      "admin'--",
      "' OR 1=1#"
    ];

    for (const payload of sqlPayloads) {
      try {
        const response = await axios.get(`${this.baseUrl}/api/products`, {
          params: { search: payload },
          timeout: 5000
        });
        
        // If we get a 400 status, the protection is working
        const isBlocked = response.status === 400;
        this.logResult(
          `SQL injection protection (${payload.substring(0, 20)}...)`,
          isBlocked,
          isBlocked ? 'Blocked' : 'Not blocked'
        );
      } catch (error: any) {
        const isBlocked = error.response?.status === 400;
        this.logResult(
          `SQL injection protection (${payload.substring(0, 20)}...)`,
          isBlocked,
          isBlocked ? 'Blocked' : 'Request failed'
        );
      }
    }
  }

  async testXSSProtection(): Promise<void> {
    console.log('\n🚫 Testing XSS Protection...');
    
    const xssPayloads = [
      '<script>alert("xss")</script>',
      'javascript:alert("xss")',
      '<img src="x" onerror="alert(1)">',
      '<iframe src="javascript:alert(1)"></iframe>'
    ];

    for (const payload of xssPayloads) {
      try {
        const response = await axios.post(`${this.baseUrl}/api/auth/register`, {
          email: 'test@example.com',
          password: 'password123',
          role: 'BUYER',
          profile: {
            name: payload
          }
        }, { timeout: 5000 });
        
        // Check if the payload was sanitized
        const sanitized = !response.data?.data?.profile?.name?.includes('<script>');
        this.logResult(
          `XSS protection (${payload.substring(0, 20)}...)`,
          sanitized,
          sanitized ? 'Sanitized' : 'Not sanitized'
        );
      } catch (error: any) {
        const blocked = error.response?.status === 400;
        this.logResult(
          `XSS protection (${payload.substring(0, 20)}...)`,
          blocked,
          blocked ? 'Blocked' : 'Request failed'
        );
      }
    }
  }

  async testSecurityHeaders(): Promise<void> {
    console.log('\n🔐 Testing Security Headers...');
    
    try {
      const response = await axios.get(`${this.baseUrl}/health`, { timeout: 5000 });
      const headers = response.headers;
      
      const requiredHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection',
        'referrer-policy'
      ];

      for (const header of requiredHeaders) {
        const present = !!headers[header];
        this.logResult(
          `Security header: ${header}`,
          present,
          present ? `Value: ${headers[header]}` : 'Missing'
        );
      }

      // Check for server information leakage
      const serverHidden = !headers['server'] && !headers['x-powered-by'];
      this.logResult(
        'Server information hidden',
        serverHidden,
        serverHidden ? 'No server info leaked' : 'Server info exposed'
      );
      
    } catch (error) {
      this.logResult('Security headers test', false, 'Test failed to execute');
    }
  }

  async testCORSConfiguration(): Promise<void> {
    console.log('\n🌐 Testing CORS Configuration...');
    
    try {
      // Test with allowed origin
      const allowedResponse = await axios.options(`${this.baseUrl}/api/products`, {
        headers: {
          'Origin': config.CORS_ORIGIN,
          'Access-Control-Request-Method': 'GET'
        },
        timeout: 5000
      });
      
      const corsAllowed = allowedResponse.headers['access-control-allow-origin'];
      this.logResult(
        'CORS allowed origin',
        !!corsAllowed,
        corsAllowed ? `Origin: ${corsAllowed}` : 'No CORS headers'
      );

      // Test with disallowed origin
      try {
        const disallowedResponse = await axios.options(`${this.baseUrl}/api/products`, {
          headers: {
            'Origin': 'https://malicious-site.com',
            'Access-Control-Request-Method': 'GET'
          },
          timeout: 5000
        });
        
        const corsBlocked = !disallowedResponse.headers['access-control-allow-origin'];
        this.logResult(
          'CORS blocks unauthorized origins',
          corsBlocked,
          corsBlocked ? 'Unauthorized origin blocked' : 'Unauthorized origin allowed'
        );
      } catch (error: any) {
        this.logResult(
          'CORS blocks unauthorized origins',
          true,
          'Unauthorized origin blocked'
        );
      }
      
    } catch (error) {
      this.logResult('CORS configuration test', false, 'Test failed to execute');
    }
  }

  async testAuthenticationSecurity(): Promise<void> {
    console.log('\n🔑 Testing Authentication Security...');
    
    try {
      // Test accessing protected endpoint without token
      try {
        await axios.get(`${this.baseUrl}/api/orders`, { timeout: 5000 });
        this.logResult('Protected endpoint without auth', false, 'Access allowed without token');
      } catch (error: any) {
        const blocked = error.response?.status === 401;
        this.logResult(
          'Protected endpoint without auth',
          blocked,
          blocked ? 'Access denied' : 'Unexpected error'
        );
      }

      // Test with invalid token
      try {
        await axios.get(`${this.baseUrl}/api/orders`, {
          headers: { Authorization: 'Bearer invalid-token' },
          timeout: 5000
        });
        this.logResult('Invalid token handling', false, 'Invalid token accepted');
      } catch (error: any) {
        const blocked = error.response?.status === 401;
        this.logResult(
          'Invalid token handling',
          blocked,
          blocked ? 'Invalid token rejected' : 'Unexpected error'
        );
      }

    } catch (error) {
      this.logResult('Authentication security test', false, 'Test failed to execute');
    }
  }

  async testInputValidation(): Promise<void> {
    console.log('\n✅ Testing Input Validation...');
    
    const invalidInputs = [
      { field: 'email', value: 'invalid-email', endpoint: '/api/auth/register' },
      { field: 'price', value: -100, endpoint: '/api/products' },
      { field: 'stock', value: 'not-a-number', endpoint: '/api/products' }
    ];

    for (const input of invalidInputs) {
      try {
        const payload: any = {
          email: 'test@example.com',
          password: 'password123',
          role: 'FARMER',
          profile: { name: 'Test User' }
        };
        
        payload[input.field] = input.value;
        
        await axios.post(`${this.baseUrl}${input.endpoint}`, payload, { timeout: 5000 });
        this.logResult(
          `Input validation: ${input.field}`,
          false,
          'Invalid input accepted'
        );
      } catch (error: any) {
        const validated = error.response?.status === 400;
        this.logResult(
          `Input validation: ${input.field}`,
          validated,
          validated ? 'Invalid input rejected' : 'Unexpected error'
        );
      }
    }
  }

  async runAllTests(): Promise<void> {
    console.log('🔍 Starting Security Tests...\n');
    
    await this.testSecurityHeaders();
    await this.testCORSConfiguration();
    await this.testRateLimiting();
    await this.testSQLInjection();
    await this.testXSSProtection();
    await this.testAuthenticationSecurity();
    await this.testInputValidation();
    
    this.generateReport();
  }

  private generateReport(): void {
    console.log('\n📊 Security Test Report');
    console.log('========================');
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
    
    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(r => !r.passed)
        .forEach(r => console.log(`  - ${r.test}: ${r.details || 'No details'}`));
    }
    
    console.log('\n🔒 Security Recommendations:');
    if (failedTests === 0) {
      console.log('  ✅ All security tests passed! Your application appears secure.');
    } else {
      console.log('  ⚠️  Some security tests failed. Review the failed tests above.');
      console.log('  🔧 Consider implementing additional security measures.');
    }
  }
}

// Run security tests if this file is executed directly
async function runSecurityTests(): Promise<void> {
  const tester = new SecurityTester();
  
  try {
    await tester.runAllTests();
  } catch (error) {
    console.error('❌ Security testing failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runSecurityTests();
}

export { SecurityTester, runSecurityTests };