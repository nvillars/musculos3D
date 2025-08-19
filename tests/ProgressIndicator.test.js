import ProgressIndicator from '../src/ProgressIndicator.js';

// Mock DOM methods
Object.defineProperty(document, 'getElementById', {
    value: jest.fn(),
    writable: true
});

Object.defineProperty(document, 'createElement', {
    value: jest.fn(),
    writable: true
});

Object.defineProperty(document.body, 'appendChild', {
    value: jest.fn(),
    writable: true
});

Object.defineProperty(document.head, 'appendChild', {
    value: jest.fn(),
    writable: true
});

// Mock setTimeout and clearTimeout
global.setTimeout = jest.fn((fn) => {
    fn();
    return 123;
});

global.clearTimeout = jest.fn();

describe('ProgressIndicator', () => {
    let progressIndicator;
    let mockContainer;
    let mockProgressBar;
    let mockProgressText;
    let mockLabelText;

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();

        // Setup mock DOM elements
        mockContainer = {
            id: 'progress-container',
            className: '',
            innerHTML: '',
            style: {},
            classList: {
                add: jest.fn(),
                remove: jest.fn()
            },
            appendChild: jest.fn(),
            parentNode: {
                removeChild: jest.fn()
            }
        };

        mockProgressBar = {
            className: '',
            style: {}
        };

        mockProgressText = {
            className: '',
            textContent: ''
        };

        mockLabelText = {
            className: '',
            textContent: '',
            style: {}
        };

        // Mock createElement to return appropriate elements
        document.createElement.mockImplementation((tagName) => {
            if (tagName === 'div') {
                return {
                    className: '',
                    textContent: '',
                    innerHTML: '',
                    style: {},
                    appendChild: jest.fn()
                };
            } else if (tagName === 'style') {
                return {
                    id: '',
                    textContent: '',
                    remove: jest.fn()
                };
            }
            return {};
        });

        // Mock getElementById to return null initially (no existing container)
        document.getElementById.mockReturnValue(null);
    });

    afterEach(() => {
        if (progressIndicator) {
            progressIndicator.dispose();
            progressIndicator = null;
        }
    });

    describe('Constructor and Initialization', () => {
        test('should initialize with default options', () => {
            progressIndicator = new ProgressIndicator();

            expect(progressIndicator.options.containerId).toBe('progress-container');
            expect(progressIndicator.options.className).toBe('anatomical-progress');
            expect(progressIndicator.options.showPercentage).toBe(true);
            expect(progressIndicator.options.showLabel).toBe(true);
            expect(progressIndicator.options.animated).toBe(true);
            expect(progressIndicator.options.barColor).toBe('#4CAF50');
            expect(progressIndicator.options.height).toBe('20px');
        });

        test('should initialize with custom options', () => {
            const customOptions = {
                containerId: 'custom-progress',
                className: 'custom-progress-class',
                showPercentage: false,
                showLabel: false,
                barColor: '#FF5722',
                height: '30px'
            };

            progressIndicator = new ProgressIndicator(customOptions);

            expect(progressIndicator.options.containerId).toBe('custom-progress');
            expect(progressIndicator.options.className).toBe('custom-progress-class');
            expect(progressIndicator.options.showPercentage).toBe(false);
            expect(progressIndicator.options.showLabel).toBe(false);
            expect(progressIndicator.options.barColor).toBe('#FF5722');
            expect(progressIndicator.options.height).toBe('30px');
        });

        test('should create container when none exists', () => {
            document.getElementById.mockReturnValue(null);

            progressIndicator = new ProgressIndicator();

            expect(document.createElement).toHaveBeenCalledWith('div');
            expect(document.body.appendChild).toHaveBeenCalled();
        });

        test('should use existing container if found', () => {
            document.getElementById.mockReturnValue(mockContainer);

            progressIndicator = new ProgressIndicator();

            expect(progressIndicator.container).toBe(mockContainer);
            expect(document.body.appendChild).not.toHaveBeenCalled();
        });

        test('should start hidden', () => {
            progressIndicator = new ProgressIndicator();

            expect(progressIndicator.isVisible).toBe(false);
        });
    });

    describe('Progress Bar Creation', () => {
        beforeEach(() => {
            progressIndicator = new ProgressIndicator();
        });

        test('should create progress bar elements', () => {
            expect(document.createElement).toHaveBeenCalledWith('div');
            expect(progressIndicator.container).toBeDefined();
        });

        test('should create label when enabled', () => {
            progressIndicator = new ProgressIndicator({ showLabel: true });

            // Should create multiple div elements including label
            expect(document.createElement).toHaveBeenCalledWith('div');
        });

        test('should not create label when disabled', () => {
            progressIndicator = new ProgressIndicator({ showLabel: false });

            expect(progressIndicator.labelText).toBeNull();
        });

        test('should create percentage text when enabled', () => {
            progressIndicator = new ProgressIndicator({ showPercentage: true });

            // Should create elements including percentage text
            expect(document.createElement).toHaveBeenCalledWith('div');
        });

        test('should not create percentage text when disabled', () => {
            progressIndicator = new ProgressIndicator({ showPercentage: false });

            expect(progressIndicator.progressText).toBeNull();
        });
    });

    describe('Style Creation', () => {
        beforeEach(() => {
            progressIndicator = new ProgressIndicator();
        });

        test('should create CSS styles', () => {
            expect(document.createElement).toHaveBeenCalledWith('style');
            expect(document.head.appendChild).toHaveBeenCalled();
        });

        test('should remove existing styles before creating new ones', () => {
            const mockExistingStyle = { remove: jest.fn() };
            document.getElementById.mockReturnValueOnce(mockExistingStyle);

            progressIndicator = new ProgressIndicator();

            expect(mockExistingStyle.remove).toHaveBeenCalled();
        });

        test('should include custom colors in styles', () => {
            const customOptions = {
                barColor: '#FF5722',
                backgroundColor: '#E0E0E0',
                textColor: '#212121'
            };

            progressIndicator = new ProgressIndicator(customOptions);

            // Verify that createElement was called for style
            expect(document.createElement).toHaveBeenCalledWith('style');
        });
    });

    describe('Color Adjustment', () => {
        beforeEach(() => {
            progressIndicator = new ProgressIndicator();
        });

        test('should adjust color brightness correctly', () => {
            const originalColor = '#4CAF50';
            const adjustedColor = progressIndicator.adjustColor(originalColor, 20);

            expect(adjustedColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
            expect(adjustedColor).not.toBe(originalColor);
        });

        test('should handle colors without # prefix', () => {
            const originalColor = '4CAF50';
            const adjustedColor = progressIndicator.adjustColor(originalColor, 20);

            expect(adjustedColor).toMatch(/^[0-9A-Fa-f]{6}$/);
            expect(adjustedColor).not.toStartWith('#');
        });

        test('should clamp color values to valid range', () => {
            const whiteColor = '#FFFFFF';
            const blackColor = '#000000';

            const brighterWhite = progressIndicator.adjustColor(whiteColor, 50);
            const darkerBlack = progressIndicator.adjustColor(blackColor, -50);

            expect(brighterWhite).toBe('#ffffff');
            expect(darkerBlack).toBe('#000000');
        });
    });

    describe('Show and Hide', () => {
        beforeEach(() => {
            progressIndicator = new ProgressIndicator();
            progressIndicator.container = mockContainer;
        });

        test('should show progress indicator', () => {
            progressIndicator.show();

            expect(mockContainer.classList.remove).toHaveBeenCalledWith('anatomical-progress--hidden');
            expect(mockContainer.classList.add).toHaveBeenCalledWith('anatomical-progress--visible');
            expect(progressIndicator.isVisible).toBe(true);
        });

        test('should show with custom label', () => {
            progressIndicator.labelText = mockLabelText;
            progressIndicator.show('Loading custom model...');

            expect(mockLabelText.textContent).toBe('Loading custom model...');
            expect(progressIndicator.isVisible).toBe(true);
        });

        test('should hide progress indicator', () => {
            progressIndicator.hide();

            expect(mockContainer.classList.remove).toHaveBeenCalledWith('anatomical-progress--visible');
            expect(mockContainer.classList.add).toHaveBeenCalledWith('anatomical-progress--hidden');
            expect(progressIndicator.isVisible).toBe(false);
        });
    });

    describe('Progress Updates', () => {
        beforeEach(() => {
            progressIndicator = new ProgressIndicator();
            progressIndicator.progressBar = mockProgressBar;
            progressIndicator.progressText = mockProgressText;
            progressIndicator.labelText = mockLabelText;
        });

        test('should update progress correctly', () => {
            progressIndicator.updateProgress(50);

            expect(mockProgressBar.style.width).toBe('50%');
            expect(mockProgressText.textContent).toBe('50%');
            expect(progressIndicator.currentProgress).toBe(50);
        });

        test('should clamp progress to valid range', () => {
            progressIndicator.updateProgress(-10);
            expect(progressIndicator.currentProgress).toBe(0);

            progressIndicator.updateProgress(150);
            expect(progressIndicator.currentProgress).toBe(100);
        });

        test('should update label when provided', () => {
            progressIndicator.updateProgress(75, 'Almost done...');

            expect(mockLabelText.textContent).toBe('Almost done...');
        });

        test('should auto-hide when progress reaches 100%', () => {
            const hideSpy = jest.spyOn(progressIndicator, 'hide');
            
            progressIndicator.updateProgress(100);

            expect(global.setTimeout).toHaveBeenCalledWith(expect.any(Function), 1000);
            expect(hideSpy).toHaveBeenCalled();
        });

        test('should not update text when showPercentage is false', () => {
            progressIndicator.options.showPercentage = false;
            progressIndicator.progressText = null;

            progressIndicator.updateProgress(50);

            expect(mockProgressBar.style.width).toBe('50%');
            // progressText should not be updated since it's null
        });
    });

    describe('Label Management', () => {
        beforeEach(() => {
            progressIndicator = new ProgressIndicator();
            progressIndicator.labelText = mockLabelText;
        });

        test('should set label text', () => {
            progressIndicator.setLabel('New label text');

            expect(mockLabelText.textContent).toBe('New label text');
        });

        test('should handle null labelText gracefully', () => {
            progressIndicator.labelText = null;

            expect(() => {
                progressIndicator.setLabel('Test label');
            }).not.toThrow();
        });
    });

    describe('Error State', () => {
        beforeEach(() => {
            progressIndicator = new ProgressIndicator();
            progressIndicator.labelText = mockLabelText;
            progressIndicator.progressBar = mockProgressBar;
        });

        test('should set error state with custom message', () => {
            progressIndicator.setError('Custom error message');

            expect(mockLabelText.textContent).toBe('Custom error message');
            expect(mockLabelText.style.color).toBe('#f44336');
            expect(mockProgressBar.style.background).toBe('#f44336');
        });

        test('should set error state with default message', () => {
            progressIndicator.setError();

            expect(mockLabelText.textContent).toBe('Error al cargar el modelo');
        });

        test('should auto-hide after error', () => {
            const hideSpy = jest.spyOn(progressIndicator, 'hide');
            
            progressIndicator.setError('Error occurred');

            expect(global.setTimeout).toHaveBeenCalledWith(expect.any(Function), 3000);
            expect(hideSpy).toHaveBeenCalled();
        });
    });

    describe('Reset Functionality', () => {
        beforeEach(() => {
            progressIndicator = new ProgressIndicator();
            progressIndicator.progressBar = mockProgressBar;
            progressIndicator.progressText = mockProgressText;
            progressIndicator.labelText = mockLabelText;
        });

        test('should reset to initial state', () => {
            // Set some progress first
            progressIndicator.updateProgress(75);

            // Reset
            progressIndicator.reset();

            expect(progressIndicator.currentProgress).toBe(0);
            expect(mockProgressBar.style.width).toBe('0%');
            expect(mockProgressText.textContent).toBe('0%');
            expect(mockLabelText.textContent).toBe('Cargando modelo...');
            expect(mockLabelText.style.color).toBe(progressIndicator.options.textColor);
        });

        test('should restore original bar color after error', () => {
            // Set error state
            progressIndicator.setError('Error');

            // Reset
            progressIndicator.reset();

            expect(mockProgressBar.style.background).toContain(progressIndicator.options.barColor);
        });
    });

    describe('State Queries', () => {
        beforeEach(() => {
            progressIndicator = new ProgressIndicator();
        });

        test('should report visibility state correctly', () => {
            expect(progressIndicator.isShowing()).toBe(false);

            progressIndicator.show();
            expect(progressIndicator.isShowing()).toBe(true);

            progressIndicator.hide();
            expect(progressIndicator.isShowing()).toBe(false);
        });

        test('should report current progress correctly', () => {
            expect(progressIndicator.getProgress()).toBe(0);

            progressIndicator.updateProgress(42);
            expect(progressIndicator.getProgress()).toBe(42);
        });
    });

    describe('Disposal', () => {
        beforeEach(() => {
            progressIndicator = new ProgressIndicator();
            progressIndicator.container = mockContainer;
        });

        test('should remove styles on disposal', () => {
            const mockStyle = { remove: jest.fn() };
            document.getElementById.mockReturnValue(mockStyle);

            progressIndicator.dispose();

            expect(mockStyle.remove).toHaveBeenCalled();
        });

        test('should remove container on disposal', () => {
            progressIndicator.dispose();

            expect(mockContainer.parentNode.removeChild).toHaveBeenCalledWith(mockContainer);
        });

        test('should clear all references on disposal', () => {
            progressIndicator.dispose();

            expect(progressIndicator.container).toBeNull();
            expect(progressIndicator.progressBar).toBeNull();
            expect(progressIndicator.progressText).toBeNull();
            expect(progressIndicator.labelText).toBeNull();
        });

        test('should handle disposal when container has no parent', () => {
            progressIndicator.container = { parentNode: null };

            expect(() => {
                progressIndicator.dispose();
            }).not.toThrow();
        });

        test('should handle disposal when style element not found', () => {
            document.getElementById.mockReturnValue(null);

            expect(() => {
                progressIndicator.dispose();
            }).not.toThrow();
        });
    });

    describe('Edge Cases', () => {
        test('should handle missing DOM elements gracefully', () => {
            // Mock createElement to return null
            document.createElement.mockReturnValue(null);

            expect(() => {
                progressIndicator = new ProgressIndicator();
            }).not.toThrow();
        });

        test('should handle progress updates with null elements', () => {
            progressIndicator = new ProgressIndicator();
            progressIndicator.progressBar = null;
            progressIndicator.progressText = null;
            progressIndicator.labelText = null;

            expect(() => {
                progressIndicator.updateProgress(50, 'Test label');
            }).not.toThrow();
        });

        test('should handle show/hide with null container', () => {
            progressIndicator = new ProgressIndicator();
            progressIndicator.container = null;

            expect(() => {
                progressIndicator.show();
                progressIndicator.hide();
            }).not.toThrow();
        });
    });
});