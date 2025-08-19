# Comprehensive Testing Suite for Anatomical 3D Viewer

This directory contains a complete testing infrastructure for the Anatomical 3D Viewer application, covering all aspects from unit tests to end-to-end user workflows.

## 📋 Test Suite Overview

### Test Categories

1. **Unit Tests** - Individual component testing
2. **Integration Tests** - Component interaction testing
3. **Performance Tests** - FPS, memory, and optimization testing
4. **Cross-Browser Tests** - Compatibility across different browsers
5. **End-to-End Tests** - Complete user workflow testing

## 🚀 Quick Start

### Run All Tests
```bash
npm run test:coverage          # Run all tests with coverage report
npm run test:ci               # Run CI test suite
node tests/run-all-tests.js   # Run comprehensive test suite
```

### Run Specific Test Categories
```bash
npm run test:unit             # Unit tests only
npm run test:integration      # Integration tests only
npm run test:performance      # Performance tests only
npm run test:cross-browser    # Cross-browser tests only
npm run test:e2e             # End-to-end tests only
```

### Development Testing
```bash
npm run test:watch           # Watch mode for development
npm test                     # Basic test run
```

## 📁 Directory Structure

```
tests/
├── README.md                           # This file
├── setup.js                           # Jest setup and mocks
├── verify-test-setup.js               # Setup verification script
├── run-all-tests.js                   # Comprehensive test runner
│
├── integration/                       # Integration tests
│   ├── full-workflow.test.js         # Complete user workflows
│   └── api-integration.test.js        # API and external services
│
├── performance/                       # Performance tests
│   ├── rendering-performance.test.js  # 3D rendering performance
│   └── memory-usage.test.js          # Memory leak detection
│
├── cross-browser/                     # Cross-browser tests
│   ├── browser-compatibility.test.js  # Browser compatibility
│   └── run-tests.js                  # Cross-browser test runner
│
├── e2e/                              # End-to-end tests
│   └── user-workflows.test.js        # Complete user scenarios
│
├── utils/                            # Test utilities
│   ├── test-helpers.js               # Testing helper functions
│   └── mock-data.js                  # Mock data for tests
│
└── [component].test.js               # Individual unit tests
```

## 🧪 Test Categories Explained

### Unit Tests
- **Purpose**: Test individual components in isolation
- **Coverage**: All major classes and functions
- **Location**: `tests/*.test.js`
- **Examples**: AnatomicalRenderer, AnatomyManager, UIManager

### Integration Tests
- **Purpose**: Test component interactions and data flow
- **Coverage**: API integration, component communication, error handling
- **Location**: `tests/integration/`
- **Key Tests**:
  - Full workflow from model loading to manipulation
  - API failure and cache fallback scenarios
  - Cross-component communication

### Performance Tests
- **Purpose**: Ensure application meets performance requirements
- **Coverage**: FPS, memory usage, load times, optimization
- **Location**: `tests/performance/`
- **Metrics Tested**:
  - 60 FPS on desktop, 30 FPS on mobile
  - Memory usage under 200MB
  - Model loading under 5 seconds
  - No memory leaks during operation

### Cross-Browser Tests
- **Purpose**: Verify compatibility across different browsers
- **Coverage**: Chrome, Firefox, Safari (WebKit)
- **Location**: `tests/cross-browser/`
- **Features Tested**:
  - WebGL support and fallbacks
  - Touch interactions on mobile
  - Responsive design adaptation
  - Performance consistency

### End-to-End Tests
- **Purpose**: Test complete user workflows
- **Coverage**: Real user scenarios from start to finish
- **Location**: `tests/e2e/`
- **Scenarios**:
  - Medical student learning workflow
  - Educator teaching preparation
  - Researcher analysis workflow
  - Error recovery scenarios

## 🛠️ Test Utilities

### TestHelpers Class
Located in `tests/utils/test-helpers.js`, provides:
- Mock WebGL context creation
- Test model generation
- User interaction simulation
- Performance measurement tools
- Cleanup utilities

### Mock Data
Located in `tests/utils/mock-data.js`, includes:
- Anatomical system data
- 3D model metadata
- API response mocks
- Performance benchmarks
- User interaction patterns

## 📊 Coverage Requirements

The test suite enforces minimum coverage thresholds:
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

## 🔧 Configuration Files

### Jest Configuration
Defined in `package.json`:
```json
{
  "jest": {
    "testEnvironment": "jsdom",
    "setupFilesAfterEnv": ["<rootDir>/tests/setup.js"],
    "collectCoverageFrom": ["src/**/*.js"],
    "coverageThreshold": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```

### Lighthouse Configuration
Located in `lighthouserc.js` for performance auditing:
- Performance score > 80%
- Accessibility score > 90%
- Best practices score > 80%

### CI/CD Pipeline
Located in `.github/workflows/ci.yml`:
- Automated testing on push/PR
- Cross-browser testing with Playwright
- Performance auditing with Lighthouse
- Coverage reporting

## 🎯 Performance Benchmarks

### Desktop Targets
- **FPS**: 60 FPS minimum
- **Memory**: < 200MB for complex models
- **Load Time**: < 3 seconds for basic models
- **Interaction Response**: < 16ms per frame

### Mobile Targets
- **FPS**: 30 FPS minimum
- **Memory**: < 100MB for optimized models
- **Load Time**: < 5 seconds for basic models
- **Touch Response**: < 33ms per interaction

## 🐛 Error Scenarios Tested

1. **Network Failures**
   - API unavailability
   - Slow network conditions
   - Intermittent connectivity

2. **WebGL Issues**
   - Context loss and recovery
   - Insufficient GPU memory
   - Extension unavailability

3. **Memory Pressure**
   - Low memory conditions
   - Memory leak detection
   - Garbage collection monitoring

4. **Invalid Data**
   - Corrupted 3D models
   - Invalid API responses
   - Missing textures/assets

## 🚀 Running Tests in Different Environments

### Local Development
```bash
npm run test:watch    # Watch mode for active development
npm run test:coverage # Full coverage report
```

### CI/CD Environment
```bash
npm run test:ci       # Optimized for CI with no watch mode
```

### Production Validation
```bash
npm run test:e2e      # End-to-end validation
npm run test:cross-browser # Browser compatibility check
```

## 📈 Test Reporting

### Coverage Reports
- HTML report: `coverage/lcov-report/index.html`
- LCOV format: `coverage/lcov.info`
- JSON format: `coverage/coverage-final.json`

### Performance Reports
- FPS measurements and frame time analysis
- Memory usage tracking and leak detection
- Load time benchmarks across different models

### Cross-Browser Reports
- Compatibility matrix across browsers
- Feature support detection results
- Performance comparison between browsers

## 🔍 Debugging Tests

### Common Issues
1. **WebGL Mock Issues**: Check `tests/setup.js` for proper WebGL mocking
2. **Async Test Failures**: Ensure proper `await` usage and timeouts
3. **Memory Test Flakiness**: Use `global.gc()` for consistent memory measurements
4. **Browser Test Failures**: Verify Playwright browser installation

### Debug Commands
```bash
npm test -- --verbose           # Verbose output
npm test -- --detectOpenHandles # Detect async handle leaks
npm test -- --runInBand        # Run tests serially
```

## 📝 Adding New Tests

### Unit Test Template
```javascript
import { ComponentName } from '../src/ComponentName.js';
import { TestHelpers } from './utils/test-helpers.js';

describe('ComponentName', () => {
  let component;

  beforeEach(() => {
    component = new ComponentName();
  });

  afterEach(() => {
    TestHelpers.cleanup();
  });

  test('should do something', () => {
    // Test implementation
  });
});
```

### Integration Test Template
```javascript
describe('Integration: Feature Name', () => {
  let canvas, renderer, manager;

  beforeEach(async () => {
    canvas = TestHelpers.createTestCanvas();
    renderer = new AnatomicalRenderer(canvas);
    manager = new AnatomyManager(renderer);
    
    await renderer.loadModel('test-models/basic.glb');
  });

  test('should handle complete workflow', async () => {
    // Integration test implementation
  });
});
```

## 🎯 Test Quality Guidelines

1. **Test Independence**: Each test should be independent and not rely on others
2. **Clear Naming**: Test names should clearly describe what is being tested
3. **Proper Cleanup**: Always clean up resources in `afterEach` hooks
4. **Mock External Dependencies**: Use mocks for APIs, file system, etc.
5. **Performance Awareness**: Keep test execution time reasonable
6. **Error Testing**: Include both success and failure scenarios

## 📞 Support

For questions about the testing infrastructure:
1. Check this README for common scenarios
2. Review existing test files for patterns
3. Run `node tests/verify-test-setup.js` to check configuration
4. Consult the main project documentation

---

**Note**: This testing suite is designed to ensure the Anatomical 3D Viewer meets all requirements for performance, compatibility, and user experience across different devices and browsers.