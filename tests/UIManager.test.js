/**
 * Tests for UIManager class
 */

import UIManager from '../src/UIManager.js';

// Mock dependencies
const mockAnatomyManager = {
    getAvailableSystems: jest.fn(() => [
        { id: 'musculoskeletal', name: 'Sistema Musculoesquelético' },
        { id: 'cardiovascular', name: 'Sistema Cardiovascular' },
        { id: 'nervous', name: 'Sistema Nervioso' }
    ]),
    loadSystem: jest.fn(),
    searchStructure: jest.fn(() => [
        { id: 'biceps', name: 'Bíceps Braquial', system: 'musculoskeletal' },
        { id: 'heart', name: 'Corazón', system: 'cardiovascular' }
    ]),
    getStructureInfo: jest.fn(() => ({
        id: 'biceps',
        name: 'Bíceps Braquial',
        system: 'musculoskeletal',
        metadata: {
            description: 'Músculo flexor del brazo',
            origin: 'Escápula',
            insertion: 'Radio'
        }
    }))
};

const mockRenderer = {
    highlightStructure: jest.fn(),
    isolateStructure: jest.fn(),
    hideStructure: jest.fn(),
    resetCamera: jest.fn()
};

// Mock DOM methods
Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1024,
});

Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 768,
});

// Mock document methods
document.createElement = jest.fn((tagName) => {
    const element = {
        tagName: tagName.toUpperCase(),
        id: '',
        className: '',
        innerHTML: '',
        textContent: '',
        style: {},
        dataset: {},
        appendChild: jest.fn(),
        addEventListener: jest.fn(),
        remove: jest.fn(),
        classList: {
            add: jest.fn(),
            remove: jest.fn(),
            toggle: jest.fn(),
            contains: jest.fn()
        }
    };
    return element;
});

document.getElementById = jest.fn((id) => {
    if (id === 'ui-container') {
        return {
            appendChild: jest.fn(),
            className: '',
            classList: {
                add: jest.fn(),
                remove: jest.fn(),
                toggle: jest.fn()
            }
        };
    }
    return null;
});

document.body = {
    appendChild: jest.fn()
};

document.querySelector = jest.fn();
document.querySelectorAll = jest.fn(() => []);
document.addEventListener = jest.fn();

// Mock window methods
window.addEventListener = jest.fn();

describe('UIManager', () => {
    let uiManager;

    beforeEach(() => {
        jest.clearAllMocks();
        // Reset window size to desktop
        window.innerWidth = 1024;
        window.innerHeight = 768;
    });

    afterEach(() => {
        if (uiManager) {
            // Cleanup if needed
        }
    });

    describe('Constructor and Initialization', () => {
        test('should initialize with anatomy manager and renderer', () => {
            uiManager = new UIManager(mockAnatomyManager, mockRenderer);
            
            expect(uiManager.anatomyManager).toBe(mockAnatomyManager);
            expect(uiManager.renderer).toBe(mockRenderer);
            expect(uiManager.currentSystem).toBeNull();
            expect(uiManager.selectedStructure).toBeNull();
        });

        test('should detect desktop device correctly', () => {
            window.innerWidth = 1024;
            uiManager = new UIManager(mockAnatomyManager, mockRenderer);
            
            expect(uiManager.isMobile).toBe(false);
        });

        test('should detect mobile device correctly', () => {
            window.innerWidth = 600;
            uiManager = new UIManager(mockAnatomyManager, mockRenderer);
            
            expect(uiManager.isMobile).toBe(true);
        });

        test('should create main UI container', () => {
            uiManager = new UIManager(mockAnatomyManager, mockRenderer);
            
            expect(document.createElement).toHaveBeenCalledWith('div');
            expect(document.body.appendChild).toHaveBeenCalled();
        });
    });

    describe('System Selector', () => {
        beforeEach(() => {
            uiManager = new UIManager(mockAnatomyManager, mockRenderer);
        });

        test('should create system selector with available systems', () => {
            expect(mockAnatomyManager.getAvailableSystems).toHaveBeenCalled();
            expect(document.createElement).toHaveBeenCalledWith('div');
            expect(document.createElement).toHaveBeenCalledWith('button');
        });

        test('should select system when button is clicked', () => {
            uiManager.selectSystem('musculoskeletal');
            
            expect(uiManager.currentSystem).toBe('musculoskeletal');
            expect(mockAnatomyManager.loadSystem).toHaveBeenCalledWith('musculoskeletal');
        });

        test('should get correct system icon', () => {
            const musculoskeletalIcon = uiManager.getSystemIcon('musculoskeletal');
            const cardiovascularIcon = uiManager.getSystemIcon('cardiovascular');
            
            expect(musculoskeletalIcon).toContain('svg');
            expect(cardiovascularIcon).toContain('svg');
            expect(musculoskeletalIcon).not.toBe(cardiovascularIcon);
        });
    });

    describe('Search Interface', () => {
        beforeEach(() => {
            uiManager = new UIManager(mockAnatomyManager, mockRenderer);
        });

        test('should handle search with valid query', () => {
            uiManager.handleSearch('biceps');
            
            expect(mockAnatomyManager.searchStructure).toHaveBeenCalledWith('biceps');
            expect(uiManager.searchResults).toHaveLength(2);
        });

        test('should not search with short query', () => {
            uiManager.handleSearch('b');
            
            expect(mockAnatomyManager.searchStructure).not.toHaveBeenCalled();
        });

        test('should clear suggestions for empty query', () => {
            uiManager.clearSearchSuggestions();
            
            expect(document.getElementById).toHaveBeenCalledWith('search-suggestions');
        });

        test('should display search suggestions', () => {
            const mockResults = [
                { id: 'biceps', name: 'Bíceps Braquial', system: 'musculoskeletal' }
            ];
            
            uiManager.displaySearchSuggestions(mockResults);
            
            expect(document.createElement).toHaveBeenCalledWith('div');
        });
    });

    describe('Structure Information', () => {
        beforeEach(() => {
            uiManager = new UIManager(mockAnatomyManager, mockRenderer);
        });

        test('should select structure and update info', () => {
            uiManager.selectStructure('biceps');
            
            expect(uiManager.selectedStructure).toBe('biceps');
            expect(mockAnatomyManager.getStructureInfo).toHaveBeenCalledWith('biceps');
            expect(mockRenderer.highlightStructure).toHaveBeenCalledWith('biceps');
        });

        test('should update structure info with valid data', () => {
            const mockStructure = {
                id: 'biceps',
                name: 'Bíceps Braquial',
                system: 'musculoskeletal',
                metadata: {
                    description: 'Músculo flexor del brazo'
                }
            };
            
            uiManager.updateStructureInfo(mockStructure);
            
            expect(document.querySelector).toHaveBeenCalledWith('.structure-content');
        });

        test('should show no selection message when structure is null', () => {
            uiManager.updateStructureInfo(null);
            
            expect(document.querySelector).toHaveBeenCalledWith('.structure-content');
        });
    });

    describe('Mobile Controls', () => {
        test('should create mobile controls on mobile device', () => {
            window.innerWidth = 600;
            uiManager = new UIManager(mockAnatomyManager, mockRenderer);
            
            expect(uiManager.isMobile).toBe(true);
            expect(document.createElement).toHaveBeenCalledWith('button');
        });

        test('should not create mobile controls on desktop', () => {
            window.innerWidth = 1024;
            uiManager = new UIManager(mockAnatomyManager, mockRenderer);
            
            expect(uiManager.isMobile).toBe(false);
        });

        test('should toggle mobile menu', () => {
            window.innerWidth = 600;
            uiManager = new UIManager(mockAnatomyManager, mockRenderer);
            
            uiManager.toggleMobileMenu();
            
            expect(document.getElementById).toHaveBeenCalledWith('ui-container');
        });

        test('should reset view when button is clicked', () => {
            window.innerWidth = 600;
            uiManager = new UIManager(mockAnatomyManager, mockRenderer);
            
            uiManager.resetView();
            
            expect(mockRenderer.resetCamera).toHaveBeenCalled();
        });
    });

    describe('Responsive Layout', () => {
        beforeEach(() => {
            uiManager = new UIManager(mockAnatomyManager, mockRenderer);
        });

        test('should update layout when window resizes', () => {
            const originalIsMobile = uiManager.isMobile;
            window.innerWidth = 600;
            
            uiManager.updateResponsiveLayout();
            
            expect(uiManager.isMobile).toBe(true);
            expect(uiManager.isMobile).not.toBe(originalIsMobile);
        });

        test('should adjust panel sizes for small screens', () => {
            window.innerHeight = 500;
            
            uiManager.adjustPanelSizes();
            
            expect(document.querySelectorAll).toHaveBeenCalledWith('.panel');
        });

        test('should detect mobile device by user agent', () => {
            // Mock mobile user agent
            Object.defineProperty(navigator, 'userAgent', {
                writable: true,
                value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
            });
            
            const isMobile = uiManager.detectMobileDevice();
            expect(isMobile).toBe(true);
        });
    });

    describe('Structure Actions', () => {
        beforeEach(() => {
            uiManager = new UIManager(mockAnatomyManager, mockRenderer);
        });

        test('should isolate structure', () => {
            uiManager.isolateStructure('biceps');
            
            expect(mockRenderer.isolateStructure).toHaveBeenCalledWith('biceps');
        });

        test('should hide structure', () => {
            uiManager.hideStructure('biceps');
            
            expect(mockRenderer.hideStructure).toHaveBeenCalledWith('biceps');
        });

        test('should handle missing renderer methods gracefully', () => {
            const rendererWithoutMethods = {};
            uiManager.renderer = rendererWithoutMethods;
            
            expect(() => {
                uiManager.isolateStructure('biceps');
                uiManager.hideStructure('biceps');
                uiManager.resetView();
            }).not.toThrow();
        });
    });

    describe('Event Handling', () => {
        beforeEach(() => {
            uiManager = new UIManager(mockAnatomyManager, mockRenderer);
        });

        test('should setup event listeners', () => {
            expect(document.addEventListener).toHaveBeenCalledWith('structureSelected', expect.any(Function));
            expect(document.addEventListener).toHaveBeenCalledWith('systemChanged', expect.any(Function));
            expect(window.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
        });
    });

    describe('Fullscreen Functionality', () => {
        beforeEach(() => {
            uiManager = new UIManager(mockAnatomyManager, mockRenderer);
        });

        test('should request fullscreen when not in fullscreen', () => {
            document.fullscreenElement = null;
            document.documentElement.requestFullscreen = jest.fn();
            
            uiManager.toggleFullscreen();
            
            expect(document.documentElement.requestFullscreen).toHaveBeenCalled();
        });

        test('should exit fullscreen when in fullscreen', () => {
            document.fullscreenElement = document.documentElement;
            document.exitFullscreen = jest.fn();
            
            uiManager.toggleFullscreen();
            
            expect(document.exitFullscreen).toHaveBeenCalled();
        });
    });
});