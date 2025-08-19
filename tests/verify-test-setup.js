/**
 * Verification script to check if all test components are properly set up
 */

const fs = require('fs');
const path = require('path');

class TestSetupVerifier {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.success = [];
  }

  verify() {
    console.log('🔍 Verifying test setup for Anatomical 3D Viewer...\n');

    this.checkPackageJson();
    this.checkTestDirectories();
    this.checkTestFiles();
    this.checkConfigFiles();
    this.checkMockData();
    this.checkCIConfig();

    this.generateReport();
  }

  checkPackageJson() {
    console.log('📦 Checking package.json configuration...');
    
    try {
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      // Check test scripts
      const requiredScripts = [
        'test', 'test:watch', 'test:coverage', 'test:integration',
        'test:unit', 'test:performance', 'test:e2e', 'test:ci', 'test:cross-browser'
      ];
      
      requiredScripts.forEach(script => {
        if (packageJson.scripts[script]) {
          this.success.push(`✅ Script '${script}' configured`);
        } else {
          this.errors.push(`❌ Missing script '${script}'`);
        }
      });
      
      // Check test dependencies
      const requiredDevDeps = [
        'jest', 'jest-environment-jsdom', 'puppeteer', 'playwright',
        '@jest/test-sequencer', 'lighthouse', 'chrome-launcher'
      ];
      
      requiredDevDeps.forEach(dep => {
        if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
          this.success.push(`✅ Dependency '${dep}' installed`);
        } else {
          this.warnings.push(`⚠️  Missing dev dependency '${dep}'`);
        }
      });
      
      // Check Jest configuration
      if (packageJson.jest) {
        this.success.push('✅ Jest configuration found');
        
        if (packageJson.jest.coverageThreshold) {
          this.success.push('✅ Coverage thresholds configured');
        } else {
          this.warnings.push('⚠️  No coverage thresholds set');
        }
      } else {
        this.errors.push('❌ No Jest configuration found');
      }
      
    } catch (error) {
      this.errors.push(`❌ Error reading package.json: ${error.message}`);
    }
  }

  checkTestDirectories() {
    console.log('\n📁 Checking test directory structure...');
    
    const requiredDirs = [
      'tests',
      'tests/integration',
      'tests/performance',
      'tests/cross-browser',
      'tests/e2e',
      'tests/utils'
    ];
    
    requiredDirs.forEach(dir => {
      const dirPath = path.join(process.cwd(), dir);
      if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
        this.success.push(`✅ Directory '${dir}' exists`);
      } else {
        this.errors.push(`❌ Missing directory '${dir}'`);
      }
    });
  }

  checkTestFiles() {
    console.log('\n📄 Checking test files...');
    
    const requiredTestFiles = [
      'tests/setup.js',
      'tests/integration/full-workflow.test.js',
      'tests/integration/api-integration.test.js',
      'tests/performance/rendering-performance.test.js',
      'tests/performance/memory-usage.test.js',
      'tests/cross-browser/browser-compatibility.test.js',
      'tests/cross-browser/run-tests.js',
      'tests/e2e/user-workflows.test.js',
      'tests/utils/test-helpers.js',
      'tests/utils/mock-data.js',
      'tests/run-all-tests.js',
      'tests/verify-test-setup.js'
    ];
    
    requiredTestFiles.forEach(file => {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        this.success.push(`✅ Test file '${file}' exists`);
        
        // Check file size to ensure it's not empty
        const stats = fs.statSync(filePath);
        if (stats.size < 100) {
          this.warnings.push(`⚠️  Test file '${file}' seems too small (${stats.size} bytes)`);
        }
      } else {
        this.errors.push(`❌ Missing test file '${file}'`);
      }
    });
    
    // Check existing unit test files
    const existingTestFiles = [
      'tests/AnatomicalRenderer.test.js',
      'tests/AnatomyManager.test.js',
      'tests/InteractionController.test.js',
      'tests/UIManager.test.js',
      'tests/APIManager.test.js',
      'tests/CacheManager.test.js',
      'tests/ModelLoader.test.js',
      'tests/PerformanceManager.test.js',
      'tests/ErrorHandler.test.js',
      'tests/ZoomManager.test.js',
      'tests/ProgressIndicator.test.js'
    ];
    
    let existingCount = 0;
    existingTestFiles.forEach(file => {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        existingCount++;
        this.success.push(`✅ Unit test '${file}' exists`);
      }
    });
    
    console.log(`   Found ${existingCount}/${existingTestFiles.length} existing unit test files`);
  }

  checkConfigFiles() {
    console.log('\n⚙️  Checking configuration files...');
    
    const configFiles = [
      { file: '.github/workflows/ci.yml', name: 'CI/CD pipeline' },
      { file: 'lighthouserc.js', name: 'Lighthouse configuration' }
    ];
    
    configFiles.forEach(({ file, name }) => {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        this.success.push(`✅ ${name} configured (${file})`);
      } else {
        this.warnings.push(`⚠️  Missing ${name} (${file})`);
      }
    });
  }

  checkMockData() {
    console.log('\n🎭 Checking mock data and test utilities...');
    
    try {
      const mockDataPath = path.join(process.cwd(), 'tests/utils/mock-data.js');
      if (fs.existsSync(mockDataPath)) {
        const mockData = fs.readFileSync(mockDataPath, 'utf8');
        
        const requiredExports = [
          'mockAnatomicalSystems',
          'mockModelData',
          'mockAPIResponses',
          'mockPerformanceData',
          'mockUserInteractions',
          'mockErrorScenarios'
        ];
        
        requiredExports.forEach(exportName => {
          if (mockData.includes(exportName)) {
            this.success.push(`✅ Mock data '${exportName}' available`);
          } else {
            this.warnings.push(`⚠️  Missing mock data '${exportName}'`);
          }
        });
      }
      
      const helpersPath = path.join(process.cwd(), 'tests/utils/test-helpers.js');
      if (fs.existsSync(helpersPath)) {
        const helpers = fs.readFileSync(helpersPath, 'utf8');
        
        if (helpers.includes('class TestHelpers')) {
          this.success.push('✅ TestHelpers class available');
        } else {
          this.errors.push('❌ TestHelpers class not found');
        }
      }
      
    } catch (error) {
      this.errors.push(`❌ Error checking mock data: ${error.message}`);
    }
  }

  checkCIConfig() {
    console.log('\n🔄 Checking CI/CD configuration...');
    
    const ciPath = path.join(process.cwd(), '.github/workflows/ci.yml');
    if (fs.existsSync(ciPath)) {
      const ciConfig = fs.readFileSync(ciPath, 'utf8');
      
      const requiredJobs = ['test', 'cross-browser-test', 'e2e-test', 'lighthouse-audit'];
      
      requiredJobs.forEach(job => {
        if (ciConfig.includes(`${job}:`)) {
          this.success.push(`✅ CI job '${job}' configured`);
        } else {
          this.warnings.push(`⚠️  Missing CI job '${job}'`);
        }
      });
      
      if (ciConfig.includes('npm run test:coverage')) {
        this.success.push('✅ Coverage reporting configured in CI');
      }
      
      if (ciConfig.includes('playwright install')) {
        this.success.push('✅ Playwright browser installation configured');
      }
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SETUP VERIFICATION REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n✅ Successful checks: ${this.success.length}`);
    console.log(`⚠️  Warnings: ${this.warnings.length}`);
    console.log(`❌ Errors: ${this.errors.length}`);
    
    if (this.success.length > 0) {
      console.log('\n✅ SUCCESSFUL CHECKS:');
      this.success.forEach(msg => console.log(`   ${msg}`));
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.forEach(msg => console.log(`   ${msg}`));
    }
    
    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.errors.forEach(msg => console.log(`   ${msg}`));
    }
    
    const totalChecks = this.success.length + this.warnings.length + this.errors.length;
    const successRate = ((this.success.length / totalChecks) * 100).toFixed(1);
    
    console.log('\n' + '='.repeat(60));
    console.log(`🎯 OVERALL STATUS: ${this.errors.length === 0 ? '✅ READY' : '❌ NEEDS ATTENTION'}`);
    console.log(`📈 Success Rate: ${this.success.length}/${totalChecks} (${successRate}%)`);
    console.log('='.repeat(60));
    
    if (this.errors.length === 0) {
      console.log('\n🚀 Test setup is complete! You can now run:');
      console.log('   npm run test:coverage    - Run all tests with coverage');
      console.log('   npm run test:ci          - Run CI test suite');
      console.log('   node tests/run-all-tests.js - Run comprehensive test suite');
    } else {
      console.log('\n🔧 Please fix the errors above before running tests.');
    }
  }
}

// Run verification
const verifier = new TestSetupVerifier();
verifier.verify();