/**
 * Cross-browser test runner script
 */

const { chromium, firefox, webkit } = require('playwright');
const path = require('path');
const fs = require('fs');

class CrossBrowserTestRunner {
  constructor() {
    this.results = {
      chromium: { passed: 0, failed: 0, errors: [] },
      firefox: { passed: 0, failed: 0, errors: [] },
      webkit: { passed: 0, failed: 0, errors: [] }
    };
  }

  async runAllTests() {
    console.log('🚀 Starting cross-browser compatibility tests...\n');

    const browsers = [
      { name: 'chromium', launcher: chromium },
      { name: 'firefox', launcher: firefox },
      { name: 'webkit', launcher: webkit }
    ];

    for (const { name, launcher } of browsers) {
      console.log(`\n📱 Testing ${name.toUpperCase()}...`);
      await this.runBrowserTests(name, launcher);
    }

    this.generateReport();
  }

  async runBrowserTests(browserName, launcher) {
    let browser, context, page;

    try {
      browser = await launcher.launch({
        headless: true,
        args: ['--enable-webgl', '--use-gl=swiftshader']
      });

      context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
      });

      page = await context.newPage();

      // Run individual tests
      await this.testBasicLoading(browserName, page);
      await this.testWebGLSupport(browserName, page);
      await this.testModelLoading(browserName, page);
      await this.testResponsiveDesign(browserName, page);
      await this.testPerformance(browserName, page);
      await this.testErrorHandling(browserName, page);

    } catch (error) {
      this.results[browserName].errors.push(`Browser setup failed: ${error.message}`);
      this.results[browserName].failed++;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  async testBasicLoading(browserName, page) {
    try {
      console.log(`  ✓ Testing basic application loading...`);
      
      await page.goto('http://localhost:8080', { timeout: 10000 });
      await page.waitForSelector('canvas', { timeout: 5000 });
      
      const title = await page.title();
      if (title.includes('Anatomical 3D Viewer')) {
        this.results[browserName].passed++;
        console.log(`    ✅ Basic loading: PASSED`);
      } else {
        throw new Error('Application title not found');
      }
    } catch (error) {
      this.results[browserName].failed++;
      this.results[browserName].errors.push(`Basic loading: ${error.message}`);
      console.log(`    ❌ Basic loading: FAILED - ${error.message}`);
    }
  }

  async testWebGLSupport(browserName, page) {
    try {
      console.log(`  ✓ Testing WebGL support...`);
      
      const webglSupported = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        return !!gl;
      });

      if (webglSupported) {
        this.results[browserName].passed++;
        console.log(`    ✅ WebGL support: PASSED`);
      } else {
        throw new Error('WebGL not supported');
      }
    } catch (error) {
      this.results[browserName].failed++;
      this.results[browserName].errors.push(`WebGL support: ${error.message}`);
      console.log(`    ❌ WebGL support: FAILED - ${error.message}`);
    }
  }

  async testModelLoading(browserName, page) {
    try {
      console.log(`  ✓ Testing 3D model loading...`);
      
      await page.evaluate(() => {
        if (window.anatomicalViewer) {
          return window.anatomicalViewer.loadModel('test-models/basic-test.glb');
        }
        throw new Error('Anatomical viewer not initialized');
      });

      // Wait for model to load
      await page.waitForFunction(() => {
        return window.anatomicalViewer && window.anatomicalViewer.isModelLoaded();
      }, { timeout: 10000 });

      this.results[browserName].passed++;
      console.log(`    ✅ Model loading: PASSED`);
    } catch (error) {
      this.results[browserName].failed++;
      this.results[browserName].errors.push(`Model loading: ${error.message}`);
      console.log(`    ❌ Model loading: FAILED - ${error.message}`);
    }
  }

  async testResponsiveDesign(browserName, page) {
    try {
      console.log(`  ✓ Testing responsive design...`);
      
      const viewports = [
        { width: 1920, height: 1080, name: 'Desktop' },
        { width: 768, height: 1024, name: 'Tablet' },
        { width: 375, height: 667, name: 'Mobile' }
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(500); // Allow layout to adjust

        const canvasVisible = await page.isVisible('canvas');
        if (!canvasVisible) {
          throw new Error(`Canvas not visible on ${viewport.name}`);
        }
      }

      this.results[browserName].passed++;
      console.log(`    ✅ Responsive design: PASSED`);
    } catch (error) {
      this.results[browserName].failed++;
      this.results[browserName].errors.push(`Responsive design: ${error.message}`);
      console.log(`    ❌ Responsive design: FAILED - ${error.message}`);
    }
  }

  async testPerformance(browserName, page) {
    try {
      console.log(`  ✓ Testing performance...`);
      
      const performanceMetrics = await page.evaluate(async () => {
        const start = performance.now();
        
        // Simulate rendering operations
        for (let i = 0; i < 30; i++) {
          if (window.anatomicalViewer) {
            window.anatomicalViewer.render();
          }
          await new Promise(resolve => setTimeout(resolve, 16));
        }
        
        const end = performance.now();
        return {
          totalTime: end - start,
          avgFrameTime: (end - start) / 30
        };
      });

      if (performanceMetrics.avgFrameTime < 50) { // 20fps minimum
        this.results[browserName].passed++;
        console.log(`    ✅ Performance: PASSED (${performanceMetrics.avgFrameTime.toFixed(2)}ms/frame)`);
      } else {
        throw new Error(`Poor performance: ${performanceMetrics.avgFrameTime.toFixed(2)}ms/frame`);
      }
    } catch (error) {
      this.results[browserName].failed++;
      this.results[browserName].errors.push(`Performance: ${error.message}`);
      console.log(`    ❌ Performance: FAILED - ${error.message}`);
    }
  }

  async testErrorHandling(browserName, page) {
    try {
      console.log(`  ✓ Testing error handling...`);
      
      // Test loading invalid model
      const errorHandled = await page.evaluate(async () => {
        try {
          if (window.anatomicalViewer) {
            await window.anatomicalViewer.loadModel('invalid-model.glb');
          }
          return false; // Should have thrown an error
        } catch (error) {
          return true; // Error was properly caught
        }
      });

      if (errorHandled) {
        this.results[browserName].passed++;
        console.log(`    ✅ Error handling: PASSED`);
      } else {
        throw new Error('Errors not properly handled');
      }
    } catch (error) {
      this.results[browserName].failed++;
      this.results[browserName].errors.push(`Error handling: ${error.message}`);
      console.log(`    ❌ Error handling: FAILED - ${error.message}`);
    }
  }

  generateReport() {
    console.log('\n📊 CROSS-BROWSER TEST RESULTS');
    console.log('================================\n');

    let totalPassed = 0;
    let totalFailed = 0;

    Object.entries(this.results).forEach(([browser, results]) => {
      const total = results.passed + results.failed;
      const passRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : '0.0';
      
      console.log(`${browser.toUpperCase()}:`);
      console.log(`  ✅ Passed: ${results.passed}`);
      console.log(`  ❌ Failed: ${results.failed}`);
      console.log(`  📈 Pass Rate: ${passRate}%`);
      
      if (results.errors.length > 0) {
        console.log(`  🐛 Errors:`);
        results.errors.forEach(error => {
          console.log(`    - ${error}`);
        });
      }
      console.log('');

      totalPassed += results.passed;
      totalFailed += results.failed;
    });

    const overallTotal = totalPassed + totalFailed;
    const overallPassRate = overallTotal > 0 ? ((totalPassed / overallTotal) * 100).toFixed(1) : '0.0';

    console.log('OVERALL RESULTS:');
    console.log(`✅ Total Passed: ${totalPassed}`);
    console.log(`❌ Total Failed: ${totalFailed}`);
    console.log(`📈 Overall Pass Rate: ${overallPassRate}%\n`);

    // Save results to file
    const reportPath = path.join(__dirname, 'test-results.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      results: this.results,
      summary: {
        totalPassed,
        totalFailed,
        overallPassRate: parseFloat(overallPassRate)
      }
    }, null, 2));

    console.log(`📄 Detailed results saved to: ${reportPath}`);

    // Exit with error code if tests failed
    if (totalFailed > 0) {
      process.exit(1);
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const runner = new CrossBrowserTestRunner();
  runner.runAllTests().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = CrossBrowserTestRunner;