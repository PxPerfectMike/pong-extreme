import '@testing-library/svelte/vitest';
import { vi } from 'vitest';

// Mock matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: vi.fn().mockImplementation((query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn()
	}))
});

// Mock ResizeObserver
globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn()
})) as unknown as typeof ResizeObserver;

// Mock localStorage
const localStorageMock = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	removeItem: vi.fn(),
	clear: vi.fn(),
	length: 0,
	key: vi.fn()
};
Object.defineProperty(window, 'localStorage', {
	value: localStorageMock
});

// Mock navigator.vibrate
Object.defineProperty(navigator, 'vibrate', {
	writable: true,
	value: vi.fn().mockReturnValue(true)
});

// Mock AudioContext
class MockAudioContext {
	state = 'running';
	createGain() {
		return {
			gain: { value: 1 },
			connect: vi.fn()
		};
	}
	createBufferSource() {
		return {
			buffer: null,
			connect: vi.fn(),
			start: vi.fn(),
			stop: vi.fn(),
			loop: false
		};
	}
	decodeAudioData = vi.fn().mockResolvedValue({});
	resume = vi.fn().mockResolvedValue(undefined);
	close = vi.fn().mockResolvedValue(undefined);
	destination = {};
}

globalThis.AudioContext = MockAudioContext as unknown as typeof AudioContext;
(globalThis as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext = MockAudioContext as unknown as typeof AudioContext;

// Mock requestAnimationFrame
let frameId = 0;
globalThis.requestAnimationFrame = vi.fn((_callback: FrameRequestCallback) => {
	return ++frameId;
});
globalThis.cancelAnimationFrame = vi.fn();
