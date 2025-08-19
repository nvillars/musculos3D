#!/usr/bin/env node

/**
 * Comprehensive test runner for anatomical 3D viewer
 * Runs all test suites in sequence with proper reporting
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestRunner {
  constructor() {
    this.results = {
      unit: { status: 'pending', duration: 0, coverage: 0 },
      integration: { status: 'pending', duration: 0, coverage: 0 },
      performance: { status: 'pending', duration: 0, metrics: {} },
      crossBrowser: { status: 'pending', duration: 0, browsers: {} },
      e2e: { status: 'pending', duration: 0, scenarios: 0 }
    };
    
    this.startTime = Date.now();
  }

  async runAllTests() {
    console.log('🚀 Starting comprehensive test suite for Anatomical 3D Viewer\n');
    console.log('=' .repeat(60));

    try {
      // Run tests in sequence
      await this.runUnitTests();
      await this.runIntegrationTests();
      await this.runPerformanceTests();
      await this.runCrossBrowserTests();
      await this.runE2ETests();
      
      this.generateFinalReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      process.exit(1);
    }
  }

  async runUnitTests() {
    console.log('\n📋 Running Unit Tests...');
    console.log('-'.repeat(40));
    
    const startTime = Date.now();
    
    try {
      const result = await this.runCommand('npm', ['run', 'test:unit', '--', '--coverage']);
      
      this.results.unit.status = result.code === 0 ? 'passed' : 'failed';
      this.results.unit.duration = Date.now() - startTime;
      
      // Parse coverage from output
      const coverageMatch = result.output.match(/All files\s+\|\s+([\d.]+)/);
      if (coverageMatch) {
        this.results.unit.coverage = parseFloat(coverageMatch[1]);
      }
      
      console.log(`✅ Unit tests completed in ${this.results.unit.duration}ms`);
      console.log(`📊 Coverage: ${this.results.unit.coverage}%`);
      
    } catch (error) {
      this.results.unit.status = 'failed';
      this.results.unit.duration = Date.now() - startTime;
      console.log(`❌ Unit tests failed: ${error.message}`);
    }
  }

  async runIntegrationTests() {
    console.log('\n🔗 Running Integration Tests...');
    console.log('-'.repeat(40));
    
    const startTime = Date.now();
    
    try {
      const result = await this.runCommand('npm', ['run', 'test:integration']);
      
      this.results.integration.status = result.code === 0 ? 'passed' : 'failed';
      this.results.integration.duration = Date.now() - startTime;
      
      console.log(`✅ Integration tests completed in ${this.results.integration.duration}ms`);
      
    } catch (error) {
      this.results.integration.status = 'failed';
      this.results.integration.duration = Date.now() - startTime;
      console.log(`❌ Integration tests failed: ${error.message}`);
    }
  }

  async runPerformanceTests() {
    console.log('\n⚡ Running Performance Tests...');
    console.log('-'.repeat(40));
    
    const startTime = Date.now();
    
    try {
      const result = await this.runCommand('npm', ['run', 'test:performance']);
      
      this.results.performance.status = result.code === 0 ? 'passed' : 'failed';
      this.results.performance.duration = Date.now() - startTime;
      
      // Parse performance metrics from output
      const fpsMatch = result.output.match(/Average FPS: ([\d.]+)/);
      const memoryMatch = result.output.match(/Memory usage: ([\d.]+)MB/);
      
      if (fpsMatch) this.results.performance.metrics.fps = parseFloat(fpsMatch[1]);
      if (memoryMatch) this.results.performance.metrics.memory = parseFloat(memoryMatch[1]);
      
      console.log(`✅ Performance tests completed in ${this.results.performance.duration}ms`);
      if (this.results.performance.metrics.fps) {
        console.log(`📈 Average FPS: ${this.results.performance.metrics.fps}`);
      }
      
    } catch (error) {
      this.results.performance.status = 'failed';
      this.results.performance.duration = Date.now() - startTime;
      console.log(`❌ Performance tests failed: ${error.message}`);
    }
  }

  async runCrossBrowserTests() {
    console.log('\n🌐 Running Cross-Browser Tests...');
    console.log('-'.repeat(40));
    
    const startTime = Date.now();
    
    try {
      // Start development server
      console.log('Starting development server...');
      const server = spawn('npm', ['run', 'dev'], { detached: true });
      
      // Wait for server to start
      await this.waitForServer('http://localhost:8080', 30000);
      
      const result = await this.runCommand('npm', ['run', 'test:cross-browser']);
      
      this.results.crossBrowser.status = result.code === 0 ? 'passed' : 'failed';
      this.results.crossBrowser.duration = Date.now() - startTime;
      
      // Parse browser results
      const browserResults = this.parseBrowserResults(result.output);
      this.results.crossBrowser.browsers = browserResults;
      
      console.log(`✅ Cross-browser tests completed in ${this.results.crossBrowser.duration}ms`);
      
      // Kill server
      process.kill(-server.pid);
      
    } catch (error) {
      this.results.crossBrowser.status = 'failed';
      this.results.crossBrowser.duration = Date.now() - startTime;
      console.log(`❌ Cross-browser tests failed: ${error.message}`);
    }
  }

  async runE2ETests() {
    console.log('\n🎭 Running End-to-End Tests...');
    console.log('-'.repeat(40));
    
    const startTime = Date.now();
    
    try {
      // Start full application stack
      console.log('Starting application stack...');
      const server = spawn('npm', ['run', 'dev:full'], { detached: true });
      
      // Wait for application to be ready
      await this.waitForServer('http://localhost:8080', 30000);
      
      const result = await this.runCommand('npm', ['run', 'test:e2e']);
      
      this.results.e2e.status = result.code === 0 ? 'passed' : 'failed';
      this.results.e2e.duration = Date.now() - startTime;
      
      // Parse scenario count
      const scenarioMatch = result.output.match(/(\d+) scenarios? passed/);
      if (scenarioMatch) {
        this.results.e2e.scenarios = parseInt(scenarioMatch[1]);
      }
      
      console.log(`✅ E2E tests completed in ${this.results.e2e.duration}ms`);
      console.log(`🎯 Scenarios passed: ${this.results.e2e.scenarios}`);
      
      // Kill server
      process.kill(-server.pid);
      
    } catch (error) {
      this.results.e2e.status = 'failed';
      this.results.e2e.duration = Date.now() - startTime;
      console.log(`❌ E2E tests failed: ${error.message}`);
    }
  }

  async runCommand(command, args) {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args, { stdio: 'pipe' });
      let output = '';
      let error = '';
      
      process.stdout.on('data', (data) => {
        output += data.toString();
        console.log(data.toString().trim());
      });
      
      process.stderr.on('data', (data) => {
        error += data.toString();
        console.error(data.toString().trim());
      });
      
      process.on('close', (code) => {
        if (code === 0) {
          resolve({ code, output, error });
        } else {
          reject(new Error(`Command failed with code ${code}: ${error}`));
        }
      });
      
      process.on('error', (err) => {
        reject(err);
      });
    });
  }

  async waitForServer(url, timeout = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          console.log(`✅ Server ready at ${url}`);
          return;
        }
      } catch (error) {
        // Server not ready yet
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error(`Server not ready at ${url} within ${timeout}ms`);
  }

  parseBrowserResults(output) {
    const browsers = {};
    const lines = output.split('\n');
    
    let currentBrowser = null;
    
    for (const line of lines) {
      const browserMatch = line.match(/Testing (\w+)\.\.\./);
      if (browserMatch) {
        currentBrowser = browserMatch[1].toLowerCase();
        browsers[currentBrowser] = { passed: 0, failed: 0 };
      }
      
      if (currentBrowser) {
        if (line.includes('✅')) browsers[currentBrowser].passed++;
        if (line.includes('❌')) browsers[currentBrowser].failed++;
      }
    }
    
    return browsers;
  }

  generateFinalReport() {
    const totalDuration = Date.now() - this.startTime;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 COMPREHENSIVE TEST RESULTS');
    console.log('='.repeat(60));
    
    // Summary table
    console.log('\nTest Suite Summary:');
    console.log('-'.repeat(60));
    
    Object.entries(this.results).forEach(([suite, result]) => {
      const status = result.status === 'passed' ? '✅' : 
                    result.status === 'failed' ? '❌' : '⏳';
      const duration = `${(result.duration / 1000).toFixed(2)}s`;
      
      console.log(`${status} ${suite.padEnd(15)} | ${duration.padStart(8)} | ${result.status.toUpperCase()}`);
    });
    
    // Detailed results
    console.log('\nDetailed Results:');
    console.log('-'.repeat(60));
    
    if (this.results.unit.coverage) {
      console.log(`📋 Unit Tests: ${this.results.unit.coverage}% coverage`);
    }
    
    if (this.results.performance.metrics.fps) {
      console.log(`⚡ Performance: ${this.results.performance.metrics.fps} FPS average`);
    }
    
    if (Object.keys(this.results.crossBrowser.browsers).length > 0) {
      console.log('🌐 Cross-Browser Results:');
      Object.entries(this.results.crossBrowser.browsers).forEach(([browser, results]) => {
        console.log(`   ${browser}: ${results.passed} passed, ${results.failed} failed`);
      });
    }
    
    if (this.results.e2e.scenarios) {
      console.log(`🎭 E2E Tests: ${this.results.e2e.scenarios} scenarios completed`);
    }
    
    // Overall status
    const allPassed = Object.values(this.results).every(r => r.status === 'passed');
    const totalTests = Object.keys(this.results).length;
    const passedTests = Object.values(this.results).filter(r => r.status === 'passed').length;
    
    console.log('\n' + '='.repeat(60));
    console.log(`🎯 OVERALL RESULT: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    console.log(`📈 Success Rate: ${passedTests}/${totalTests} (${((passedTests/totalTests)*100).toFixed(1)}%)`);
    console.log(`⏱️  Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log('='.repeat(60));
    
    // Save detailed report
    const reportPath = path.join(__dirname, 'test-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      duration: totalDuration,
      results: this.results,
      summary: {
        totalTests,
        passedTests,
        successRate: (passedTests / totalTests) * 100,
        allPassed
      }
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    // Exit with appropriate code
    if (!allPassed) {
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const runner = new TestRunner();
  runner.runAllTests().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = TestRunner;