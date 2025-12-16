import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createSoundManager, type SoundManager, type SoundConfig } from '$engine/audio/SoundManager';

describe('SoundManager', () => {
	let manager: SoundManager;

	beforeEach(() => {
		vi.clearAllMocks();
		manager = createSoundManager();
	});

	describe('createSoundManager', () => {
		it('should create a sound manager instance', () => {
			expect(manager).toBeDefined();
			expect(typeof manager.play).toBe('function');
			expect(typeof manager.playMusic).toBe('function');
			expect(typeof manager.stopMusic).toBe('function');
		});

		it('should accept custom config', () => {
			const config: SoundConfig = {
				soundsPath: '/custom/sounds/',
				defaultVolume: 0.5
			};

			const customManager = createSoundManager(config);
			expect(customManager).toBeDefined();
		});
	});

	describe('volume control', () => {
		it('should set and get volume', () => {
			manager.setVolume(0.5);
			expect(manager.getVolume()).toBe(0.5);
		});

		it('should clamp volume between 0 and 1', () => {
			manager.setVolume(-0.5);
			expect(manager.getVolume()).toBe(0);

			manager.setVolume(1.5);
			expect(manager.getVolume()).toBe(1);
		});

		it('should default to volume 1', () => {
			expect(manager.getVolume()).toBe(1);
		});
	});

	describe('mute control', () => {
		it('should set and get muted state', () => {
			expect(manager.isMuted()).toBe(false);

			manager.setMuted(true);
			expect(manager.isMuted()).toBe(true);

			manager.setMuted(false);
			expect(manager.isMuted()).toBe(false);
		});

		it('should toggle mute', () => {
			expect(manager.isMuted()).toBe(false);

			manager.toggleMute();
			expect(manager.isMuted()).toBe(true);

			manager.toggleMute();
			expect(manager.isMuted()).toBe(false);
		});
	});

	describe('play', () => {
		it('should attempt to play a sound effect', () => {
			// Just verify it doesn't throw
			expect(() => manager.play('click')).not.toThrow();
		});

		it('should accept volume parameter', () => {
			expect(() => manager.play('click', 0.5)).not.toThrow();
		});
	});

	describe('playMusic', () => {
		it('should attempt to play background music', () => {
			expect(() => manager.playMusic('theme')).not.toThrow();
		});

		it('should accept loop parameter', () => {
			expect(() => manager.playMusic('theme', true)).not.toThrow();
			expect(() => manager.playMusic('theme', false)).not.toThrow();
		});
	});

	describe('stopMusic', () => {
		it('should stop music without error', () => {
			manager.playMusic('theme');
			expect(() => manager.stopMusic()).not.toThrow();
		});
	});

	describe('pauseMusic / resumeMusic', () => {
		it('should pause and resume without error', () => {
			manager.playMusic('theme');
			expect(() => manager.pauseMusic()).not.toThrow();
			expect(() => manager.resumeMusic()).not.toThrow();
		});
	});

	describe('preload', () => {
		it('should return a promise', async () => {
			const result = manager.preload(['click', 'success']);
			expect(result).toBeInstanceOf(Promise);
		});

		it('should resolve without error', async () => {
			await expect(manager.preload(['click'])).resolves.not.toThrow();
		});
	});

	describe('stop', () => {
		it('should stop a specific sound', () => {
			expect(() => manager.stop('click')).not.toThrow();
		});
	});

	describe('stopAll', () => {
		it('should stop all sounds', () => {
			manager.play('click');
			manager.play('success');
			expect(() => manager.stopAll()).not.toThrow();
		});
	});

	describe('isPlaying', () => {
		it('should return false for sounds not played', () => {
			expect(manager.isPlaying('click')).toBe(false);
		});
	});

	describe('unlock (for mobile)', () => {
		it('should attempt to unlock audio context', async () => {
			await expect(manager.unlock()).resolves.not.toThrow();
		});
	});

	describe('onVolumeChange / onMuteChange', () => {
		it('should notify on volume change', () => {
			const callback = vi.fn();
			manager.onVolumeChange(callback);

			manager.setVolume(0.5);

			expect(callback).toHaveBeenCalledWith(0.5);
		});

		it('should notify on mute change', () => {
			const callback = vi.fn();
			manager.onMuteChange(callback);

			manager.setMuted(true);

			expect(callback).toHaveBeenCalledWith(true);
		});

		it('should return unsubscribe function', () => {
			const callback = vi.fn();
			const unsubscribe = manager.onVolumeChange(callback);

			unsubscribe();
			manager.setVolume(0.3);

			expect(callback).not.toHaveBeenCalled();
		});
	});
});
