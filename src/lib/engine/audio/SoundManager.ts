/**
 * Sound manager configuration.
 */
export interface SoundConfig {
	/** Base path for sound files */
	soundsPath?: string;
	/** Default volume (0-1) */
	defaultVolume?: number;
	/** File extension for sounds */
	extension?: string;
}

/**
 * Sound manager interface for game audio.
 */
export interface SoundManager {
	/** Play a sound effect */
	play(id: string, volume?: number): void;
	/** Play background music */
	playMusic(id: string, loop?: boolean): void;
	/** Stop background music */
	stopMusic(): void;
	/** Pause background music */
	pauseMusic(): void;
	/** Resume background music */
	resumeMusic(): void;
	/** Stop a specific sound */
	stop(id: string): void;
	/** Stop all sounds */
	stopAll(): void;
	/** Check if a sound is playing */
	isPlaying(id: string): boolean;
	/** Preload sounds for immediate playback */
	preload(ids: string[]): Promise<void>;
	/** Set master volume */
	setVolume(volume: number): void;
	/** Get current volume */
	getVolume(): number;
	/** Set muted state */
	setMuted(muted: boolean): void;
	/** Check if muted */
	isMuted(): boolean;
	/** Toggle mute */
	toggleMute(): void;
	/** Unlock audio context (required on mobile) */
	unlock(): Promise<void>;
	/** Subscribe to volume changes */
	onVolumeChange(callback: (volume: number) => void): () => void;
	/** Subscribe to mute changes */
	onMuteChange(callback: (muted: boolean) => void): () => void;
}

const defaultConfig: Required<SoundConfig> = {
	soundsPath: '/sounds/',
	defaultVolume: 1,
	extension: 'mp3'
};

/**
 * Create a sound manager for game audio.
 *
 * @param config - Configuration options
 * @returns Sound manager instance
 */
export function createSoundManager(config: SoundConfig = {}): SoundManager {
	const cfg = { ...defaultConfig, ...config };

	let volume = cfg.defaultVolume;
	let muted = false;
	let audioContext: AudioContext | null = null;
	let musicAudio: HTMLAudioElement | null = null;
	const audioCache = new Map<string, AudioBuffer>();
	const playingSounds = new Map<string, AudioBufferSourceNode>();

	const volumeCallbacks = new Set<(volume: number) => void>();
	const muteCallbacks = new Set<(muted: boolean) => void>();

	function getAudioContext(): AudioContext {
		if (!audioContext) {
			audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
		}
		return audioContext;
	}

	function getSoundPath(id: string): string {
		return `${cfg.soundsPath}${id}.${cfg.extension}`;
	}

	function getEffectiveVolume(baseVolume: number = volume): number {
		return muted ? 0 : baseVolume;
	}

	async function loadSound(id: string): Promise<AudioBuffer | null> {
		if (audioCache.has(id)) {
			return audioCache.get(id)!;
		}

		try {
			const response = await fetch(getSoundPath(id));
			const arrayBuffer = await response.arrayBuffer();
			const audioBuffer = await getAudioContext().decodeAudioData(arrayBuffer);
			audioCache.set(id, audioBuffer);
			return audioBuffer;
		} catch {
			console.warn(`Failed to load sound: ${id}`);
			return null;
		}
	}

	return {
		play(id: string, soundVolume: number = volume): void {
			const ctx = getAudioContext();

			loadSound(id).then((buffer) => {
				if (!buffer) return;

				const source = ctx.createBufferSource();
				const gainNode = ctx.createGain();

				source.buffer = buffer;
				source.connect(gainNode);
				gainNode.connect(ctx.destination);
				gainNode.gain.value = getEffectiveVolume(soundVolume);

				source.start(0);
				playingSounds.set(id, source);

				source.onended = () => {
					playingSounds.delete(id);
				};
			});
		},

		playMusic(id: string, loop: boolean = true): void {
			this.stopMusic();

			musicAudio = new Audio(getSoundPath(id));
			musicAudio.loop = loop;
			musicAudio.volume = getEffectiveVolume();

			// Handle environments where play() may not return a promise (e.g., jsdom)
			try {
				const playPromise = musicAudio.play();
				if (playPromise && typeof playPromise.catch === 'function') {
					playPromise.catch(() => {
						// Autoplay blocked - will need user interaction
					});
				}
			} catch {
				// Play not supported in this environment
			}
		},

		stopMusic(): void {
			if (musicAudio) {
				musicAudio.pause();
				musicAudio.currentTime = 0;
				musicAudio = null;
			}
		},

		pauseMusic(): void {
			musicAudio?.pause();
		},

		resumeMusic(): void {
			if (!musicAudio) return;
			try {
				const playPromise = musicAudio.play();
				if (playPromise && typeof playPromise.catch === 'function') {
					playPromise.catch(() => {});
				}
			} catch {
				// Play not supported
			}
		},

		stop(id: string): void {
			const source = playingSounds.get(id);
			if (source) {
				try {
					source.stop();
				} catch {
					// Already stopped
				}
				playingSounds.delete(id);
			}
		},

		stopAll(): void {
			playingSounds.forEach((source) => {
				try {
					source.stop();
				} catch {
					// Already stopped
				}
			});
			playingSounds.clear();
			this.stopMusic();
		},

		isPlaying(id: string): boolean {
			return playingSounds.has(id);
		},

		async preload(ids: string[]): Promise<void> {
			await Promise.all(ids.map((id) => loadSound(id)));
		},

		setVolume(newVolume: number): void {
			volume = Math.max(0, Math.min(1, newVolume));

			if (musicAudio) {
				musicAudio.volume = getEffectiveVolume();
			}

			volumeCallbacks.forEach((cb) => cb(volume));
		},

		getVolume(): number {
			return volume;
		},

		setMuted(newMuted: boolean): void {
			muted = newMuted;

			if (musicAudio) {
				musicAudio.volume = getEffectiveVolume();
			}

			muteCallbacks.forEach((cb) => cb(muted));
		},

		isMuted(): boolean {
			return muted;
		},

		toggleMute(): void {
			this.setMuted(!muted);
		},

		async unlock(): Promise<void> {
			const ctx = getAudioContext();
			if (ctx.state === 'suspended') {
				await ctx.resume();
			}
		},

		onVolumeChange(callback: (volume: number) => void): () => void {
			volumeCallbacks.add(callback);
			return () => volumeCallbacks.delete(callback);
		},

		onMuteChange(callback: (muted: boolean) => void): () => void {
			muteCallbacks.add(callback);
			return () => muteCallbacks.delete(callback);
		}
	};
}
