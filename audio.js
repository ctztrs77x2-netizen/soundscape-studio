/* ==========================================================================
   SoundScape Studio - Web Audio Mixing & Synthesizer Engine
   Dual-engine: High-Quality streaming loops + pure mathematical real-time synths
   ========================================================================== */

class SoundScapeAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.analyser = null;
    this.channels = new Map();
    this.initialized = false;
    this.visualizerAnimationId = null;
    
    // All nature/ambient sounds are now fully local (no more Google dependency).
    this.streamUrls = {
      rain: './audio/nature/light_rain.ogg',          // Now local
      thunder: './audio/nature/distant_thunder.ogg',  // Now local
      ocean: './audio/nature/ocean_waves.ogg',        // Now local
      cafe: './audio/nature/coffee_shop_atmosphere.ogg', // Now local
      campfire: './audio/nature/fire_crackle.ogg',    // Local
      birds: './audio/nature/birds_chirping_morning.ogg', // Local
      lofi: 'https://raw.githubusercontent.com/btahir/open-lofi/main/assets/2-am-debug-loop.mp3'
    };

    // Premium public domain CC0 lofi tracks from btahir/open-lofi (Local Files)
    this.lofiPlaylist = [
      { title: "2 AM Debug Loop", url: "./audio/lofi/2-am-debug-loop.mp3" },
      { title: "Almost Floating", url: "./audio/lofi/almost-floating.mp3" },
      { title: "Amber Sidewalks", url: "./audio/lofi/amber-sidewalks.mp3" },
      { title: "Basement Groove '86", url: "./audio/lofi/basement-groove-86.mp3" },
      { title: "Bloom Between Showers", url: "./audio/lofi/bloom-between-showers.mp3" },
      { title: "Breezy Afternoon Terrace", url: "./audio/lofi/breezy-afternoon-terrace.mp3" },
      { title: "Cassette Pastel Nights", url: "./audio/lofi/cassette-pastel-nights.mp3" },
      { title: "Deep Space Loop", url: "./audio/lofi/deep-space-loop.mp3" },
      { title: "Dog Eared Pages", url: "./audio/lofi/dog-eared-pages.mp3" },
      { title: "Dust on the Needle", url: "./audio/lofi/dust-on-the-needle.mp3" },
      { title: "First Coffee Thoughts", url: "./audio/lofi/first-coffee-thoughts.mp3" },
      { title: "Graphite Mornings", url: "./audio/lofi/graphite-mornings.mp3" },
      { title: "Last Train Home", url: "./audio/lofi/last-train-home.mp3" },
      { title: "Mat and Morning Light", url: "./audio/lofi/mat-and-morning-light.mp3" },
      { title: "Misty Steam Quiet Dreams", url: "./audio/lofi/misty-steam-quiet-dreams.mp3" },
      { title: "Rain Off the Neon Signs", url: "./audio/lofi/rain-off-the-neon-signs.mp3" },
      { title: "Summer Curbside Glow", url: "./audio/lofi/summer-curbside-glow.mp3" }
    ];
    this.currentLofiIndex = Math.floor(Math.random() * this.lofiPlaylist.length); // Play random track on load

    // Master settings
    this.masterVolume = 0.8;
  }

  // --- Initialize Audio Context ---
  init() {
    if (this.initialized) return;

    try {
      // Create context with browser-compatibility checks
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();
      
      // Master nodes setup
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.masterVolume;
      
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      
      // Connect: Master Gain -> Analyser -> Output
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      this.setupSoundChannels();
      this.initialized = true;
      console.log('SoundScape Audio Engine initialized successfully.');
    } catch (e) {
      console.error('Failed to initialize Web Audio API Context:', e);
    }
  }

  // --- Sound Channel Setup ---
  setupSoundChannels() {
    // 1. Streaming Nature/Environmental channels
    const streamIds = ['rain', 'thunder', 'ocean', 'cafe', 'campfire', 'birds', 'lofi'];
    streamIds.forEach(id => {
      const gainNode = this.ctx.createGain();
      gainNode.gain.value = 0; // Starts muted
      gainNode.connect(this.masterGain);

      this.channels.set(id, {
        id: id,
        type: 'stream',
        url: id === 'lofi' ? this.lofiPlaylist[this.currentLofiIndex].url : this.streamUrls[id],
        gainNode: gainNode,
        audioElement: null,
        mediaSource: null,
        isPlaying: false,
        volume: 0.5, // Default volume
        nodes: [] // Initialize empty nodes array to prevent undefined errors on fallback synths
      });
    });

    // 3. Pure synthesized channels (no downloads required!)
    this.setupSynthChannels();
  }

  // --- Synthesizer Channels Definitions ---
  setupSynthChannels() {
    // Brown Noise Synth Channel
    const brownNoiseGain = this.ctx.createGain();
    brownNoiseGain.gain.value = 0;
    brownNoiseGain.connect(this.masterGain);

    this.channels.set('brownnoise', {
      id: 'brownnoise',
      type: 'synth',
      gainNode: brownNoiseGain,
      nodes: [], // Active audio nodes
      isPlaying: false,
      volume: 0.6,
      start: () => this.startBrownNoiseSynth('brownnoise'),
      stop: () => this.stopSynth('brownnoise')
    });

    // Deep Space Pad Synth Channel
    const spacePadGain = this.ctx.createGain();
    spacePadGain.gain.value = 0;
    spacePadGain.connect(this.masterGain);

    this.channels.set('spacepad', {
      id: 'spacepad',
      type: 'synth',
      gainNode: spacePadGain,
      nodes: [],
      isPlaying: false,
      volume: 0.5,
      start: () => this.startSpacePadSynth('spacepad'),
      stop: () => this.stopSynth('spacepad')
    });

    // Alpha Focus Binaural Beat Channel
    const alphaGain = this.ctx.createGain();
    alphaGain.gain.value = 0;
    alphaGain.connect(this.masterGain);

    this.channels.set('alpha', {
      id: 'alpha',
      type: 'synth',
      gainNode: alphaGain,
      nodes: [],
      isPlaying: false,
      volume: 0.35,
      start: () => this.startBinauralSynth('alpha', 180, 10), // 180Hz Base + 10Hz Alpha sweep
      stop: () => this.stopSynth('alpha')
    });

    // Theta Meditation Binaural Beat Channel
    const thetaGain = this.ctx.createGain();
    thetaGain.gain.value = 0;
    thetaGain.connect(this.masterGain);

    this.channels.set('theta', {
      id: 'theta',
      type: 'synth',
      gainNode: thetaGain,
      nodes: [],
      isPlaying: false,
      volume: 0.35,
      start: () => this.startBinauralSynth('theta', 140, 6), // 140Hz Base + 6Hz Theta sweep
      stop: () => this.stopSynth('theta')
    });

    // Delta Sleep Binaural Beat Channel
    const deltaGain = this.ctx.createGain();
    deltaGain.gain.value = 0;
    deltaGain.connect(this.masterGain);

    this.channels.set('delta', {
      id: 'delta',
      type: 'synth',
      gainNode: deltaGain,
      nodes: [],
      isPlaying: false,
      volume: 0.35,
      start: () => this.startBinauralSynth('delta', 90, 2.5), // 90Hz Base + 2.5Hz Delta sweep
      stop: () => this.stopSynth('delta')
    });
  }

  // --- Play / Stop Controls ---
  toggleSound(id, checked) {
    this.init(); // Auto-unlocks context
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const channel = this.channels.get(id);
    if (!channel) return;

    if (checked) {
      this.playSound(channel);
    } else {
      this.stopSound(channel);
    }
  }

  playSound(channel) {
    if (channel.isPlaying) return;

    // Set playing state early so synchronous procedural generators and their timeouts
    // can check channel.isPlaying and start playing immediately
    channel.isPlaying = true;
    const fadeTime = 0.8; // Smooth fade in (seconds)
    const targetVolume = channel.volume;

    if (channel.type === 'stream') {
      // Lazy load HTML audio elements
      if (!channel.audioElement) {
        channel.audioElement = new Audio();
        
        if (channel.id === 'lofi') {
          const track = this.lofiPlaylist[this.currentLofiIndex];
          channel.audioElement.src = track.url;
          channel.audioElement.loop = false;
          channel.audioElement.addEventListener('ended', () => {
            this.playNextLofiTrack();
          });
        } else {
          channel.audioElement.src = channel.url;
          channel.audioElement.loop = true;
        }
        
        channel.audioElement.crossOrigin = 'anonymous';

        try {
          // Connect HTML audio element output to its channel Gain Node
          channel.mediaSource = this.ctx.createMediaElementSource(channel.audioElement);
          channel.mediaSource.connect(channel.gainNode);
          channel.webAudioMode = true;
        } catch (e) {
          console.warn(`Web Audio routing failed for ${channel.id}. Playing directly via HTML5 Audio.`, e);
          channel.webAudioMode = false;
        }
      } else if (channel.id === 'lofi') {
        const track = this.lofiPlaylist[this.currentLofiIndex];
        if (channel.audioElement.src && !channel.audioElement.src.includes(encodeURI(track.url))) {
          channel.audioElement.src = track.url;
        }
      }

      // Try playing the stream
      channel.audioElement.play()
        .then(() => {
          if (channel.webAudioMode === false) {
            channel.audioElement.volume = channel.volume * this.masterVolume;
          }
        })
        .catch(() => {
          // Google’s public sound library often blocks CORS from extensions.
          // This is expected — we gracefully fall back to local synthesis.
          console.debug(`[Audio] Streaming unavailable for ${channel.id}, using synthesized fallback`);
          
          try {
            // Direct playback bypasses Web Audio completely (removes crossorigin restriction)
            channel.audioElement.pause();
            channel.audioElement.removeAttribute('crossorigin');
            channel.audioElement.crossOrigin = null;
            channel.webAudioMode = false;
            
            // Reload source to clear CORS state
            const currentSrc = channel.audioElement.src;
            channel.audioElement.src = currentSrc;
            
            channel.audioElement.play()
              .then(() => {
                channel.audioElement.volume = channel.volume * this.masterVolume;
              })
              .catch(() => {
                this.triggerSynthFallback(channel.id);
              });
          } catch {
            this.triggerSynthFallback(channel.id);
          }
        });

      if (channel.id === 'lofi') {
        this.updateLofiUiTitle();
      }
    } else if (channel.type === 'synth') {
      channel.start();
    }

    // Fade in volume smoothly via the Web Audio gain node.
    // Always do this for synth channels (they always use gain nodes).
    // For streams, only do it when routed through Web Audio (webAudioMode === true).
    if (channel.type === 'synth' || channel.webAudioMode === true) {
      channel.gainNode.gain.cancelScheduledValues(this.ctx.currentTime);
      channel.gainNode.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      channel.gainNode.gain.linearRampToValueAtTime(targetVolume, this.ctx.currentTime + fadeTime);
    }
  }

  stopSound(channel) {
    if (!channel.isPlaying) return;

    const fadeTime = 0.6; // Smooth fade out

    if (channel.webAudioMode !== false || channel.type === 'synth') {
      // Fade out volume smoothly
      channel.gainNode.gain.cancelScheduledValues(this.ctx.currentTime);
      channel.gainNode.gain.setValueAtTime(channel.gainNode.gain.value, this.ctx.currentTime);
      channel.gainNode.gain.linearRampToValueAtTime(0, this.ctx.currentTime + fadeTime);
    } else if (channel.audioElement) {
      // Manual volume fade for direct HTML5 audio
      const initialVol = channel.audioElement.volume;
      const steps = 10;
      const stepTime = (fadeTime * 1000) / steps;
      let currentStep = 0;
      const fadeInterval = setInterval(() => {
        currentStep++;
        if (channel.audioElement) {
          channel.audioElement.volume = Math.max(0, initialVol * (1 - currentStep / steps));
        }
        if (currentStep >= steps) {
          clearInterval(fadeInterval);
        }
      }, stepTime);
    }

    // Stop streams/synths after the fade completes
    setTimeout(() => {
      // Ensure the channel wasn't re-toggled back on during the timeout
      if (!channel.isPlaying) {
        if (channel.type === 'stream' && channel.audioElement) {
          channel.audioElement.pause();
          
          if (channel.id === 'lofi') {
            // Reset UI title to original 'Streaming' state
            window.dispatchEvent(new CustomEvent('lofi-track-changed', {
              detail: {
                title: 'Streaming',
                isPlaying: false
              }
            }));
          }
        } else if (channel.type === 'synth') {
          channel.stop();
        }
      }
    }, fadeTime * 1000);

    channel.isPlaying = false;
  }

  // --- Lofi Playlist Helpers ---
  playNextLofiTrack() {
    const channel = this.channels.get('lofi');
    if (!channel) return;

    if (channel.type === 'synth') {
      console.log("Skipping to next procedural synth progression...");
      channel.stop();
      channel.start();
      return;
    }

    if (!channel.audioElement) return;

    // Advance index
    this.currentLofiIndex = (this.currentLofiIndex + 1) % this.lofiPlaylist.length;
    const track = this.lofiPlaylist[this.currentLofiIndex];

    console.log(`Skipping to next lofi track: ${track.title}`);

    // Change source
    channel.audioElement.pause();
    channel.audioElement.src = track.url;
    channel.audioElement.load();

    // If channel is playing, play immediately
    if (channel.isPlaying) {
      channel.audioElement.play().catch(err => {
        console.warn("Failed to play next lofi track:", err);
      });
    }

    this.updateLofiUiTitle();
  }

  skipLofiTrack() {
    const channel = this.channels.get('lofi');
    if (!channel) return;

    // Ensure Audio Context is active
    this.init();
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (!channel.isPlaying) {
      // If not active, advance index first, then turn it on!
      this.currentLofiIndex = (this.currentLofiIndex + 1) % this.lofiPlaylist.length;
      
      const toggleCheckbox = document.querySelector('.sound-card[data-sound-id="lofi"] .sound-toggle');
      if (toggleCheckbox) {
        toggleCheckbox.click(); // Trigger UI click so it handles active states/visualizers
      }
    } else {
      // If already playing, skip track
      this.playNextLofiTrack();
    }
  }

  updateLofiUiTitle() {
    const track = this.lofiPlaylist[this.currentLofiIndex];
    window.dispatchEvent(new CustomEvent('lofi-track-changed', {
      detail: {
        title: track.title,
        isPlaying: this.channels.get('lofi').isPlaying
      }
    }));
  }

  // --- Dynamic fallback if network loop fails ---
  triggerSynthFallback(id) {
    const channel = this.channels.get(id);
    if (!channel || channel.type === 'synth') return;

    console.log(`[AudioEngine] Falling back to synthetic engine for channel: ${id}`);
    
    // Modify channel mapping on the fly to synth-mode for this session
    channel.type = 'synth';
    channel.nodes = []; // Ensure empty nodes array for safety
    
    if (id === 'rain' || id === 'ocean' || id === 'thunder') {
      channel.start = () => this.startFallbackNoiseSynth(id);
      channel.stop = () => this.stopSynth(id);
    } else if (id === 'campfire') {
      channel.start = () => this.startCampfireSynth(id);
      channel.stop = () => this.stopSynth(id);
    } else if (id === 'birds') {
      channel.start = () => this.startBirdsSynth(id);
      channel.stop = () => this.stopSynth(id);
    } else if (id === 'cafe') {
      channel.start = () => this.startCafeSynth(id);
      channel.stop = () => this.stopSynth(id);
    } else if (id === 'lofi') {
      channel.start = () => this.startLofiSynth(id);
      channel.stop = () => this.stopSynth(id);
    } else {
      channel.start = () => this.startSpacePadSynth(id);
      channel.stop = () => this.stopSynth(id);
    }

    if (channel.isPlaying) {
      // Use setTimeout to escape the Promise rejection chain.
      // This lets the AudioContext stabilize before we schedule new synth nodes.
      channel.isPlaying = false;
      setTimeout(() => {
        this.playSound(channel);
      }, 50);
    }
  }

  // --- Volume Settings ---
  setChannelVolume(id, volumePct) {
    const volume = volumePct / 100;
    const channel = this.channels.get(id);
    if (!channel) return;

    channel.volume = volume;
    
    if (channel.isPlaying) {
      if (channel.webAudioMode !== false && this.ctx) {
        channel.gainNode.gain.cancelScheduledValues(this.ctx.currentTime);
        channel.gainNode.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 0.1);
      } else if (channel.audioElement) {
        // Direct HTML5 volume control (multiplying channel volume by master volume)
        channel.audioElement.volume = volume * this.masterVolume;
      }
    }
  }

  setMasterVolume(volumePct) {
    const volume = volumePct / 100;
    this.masterVolume = volume;

    if (this.masterGain && this.ctx) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 0.15);
    }

    // Proactively update any direct HTML5 audio playback volumes
    this.channels.forEach(channel => {
      if (channel.isPlaying && channel.type === 'stream' && channel.webAudioMode === false && channel.audioElement) {
        channel.audioElement.volume = channel.volume * volume;
      }
    });
  }

  stopAllChannels() {
    this.channels.forEach(channel => {
      if (channel.isPlaying) {
        this.stopSound(channel);
      }
    });
  }

  // ==========================================================================
  // --- SYNTHESIZERS MATHEMATICAL DSP ---
  // ==========================================================================

  // Helper: Create a Brown/Pink noise buffer node
  createNoiseBufferNode(color = 'brown') {
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    let lastOut = 0.0;
    
    // Brown noise generators integrate white noise with a decay multiplier
    if (color === 'brown') {
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5; // Gain compensation
      }
    } 
    // Pink noise generators use multiple poles to filter white noise
    else if (color === 'pink') {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        b6 = white * 0.115926;
        output[i] *= 0.11; // Gain compensation
      }
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;
    return noiseSource;
  }

  // Binaural Beat Stereo Synthesizer
  startBinauralSynth(id, baseFreq, diffFreq) {
    const channel = this.channels.get(id);
    if (!channel) return;

    // Create left channel oscillator (Sine wave at baseFreq)
    const leftOsc = this.ctx.createOscillator();
    leftOsc.type = 'sine';
    leftOsc.frequency.value = baseFreq;

    // Create right channel oscillator (Sine wave at baseFreq + diffFreq)
    const rightOsc = this.ctx.createOscillator();
    rightOsc.type = 'sine';
    rightOsc.frequency.value = baseFreq + diffFreq;

    // Create panner nodes to separate left and right ear signals
    const leftPanner = this.ctx.createStereoPanner();
    leftPanner.pan.value = -1.0; // Hard pan left

    const rightPanner = this.ctx.createStereoPanner();
    rightPanner.pan.value = 1.0; // Hard pan right

    // Connect: Left osc -> Left panner -> main channel Gain
    leftOsc.connect(leftPanner);
    leftPanner.connect(channel.gainNode);

    // Connect: Right osc -> Right panner -> main channel Gain
    rightOsc.connect(rightPanner);
    rightPanner.connect(channel.gainNode);

    // Add ultra-soft warm brownian noise backing for auditory comfort
    const backingNoise = this.createNoiseBufferNode('brown');
    const backingFilter = this.ctx.createBiquadFilter();
    backingFilter.type = 'lowpass';
    backingFilter.frequency.value = 150; // Very deep warm low-end rumble
    
    const backingGain = this.ctx.createGain();
    backingGain.gain.value = 0.08; // Very soft, almost subliminal

    backingNoise.connect(backingFilter);
    backingFilter.connect(backingGain);
    backingGain.connect(channel.gainNode);

    // Start oscillators & noise
    leftOsc.start(0);
    rightOsc.start(0);
    backingNoise.start(0);

    // Save node references for safe teardown
    channel.nodes = [leftOsc, rightOsc, leftPanner, rightPanner, backingNoise, backingFilter, backingGain];
  }

  // 1. Brown Noise Synthesizer (Ideal for Deep Masking)
  startBrownNoiseSynth(id) {
    const channel = this.channels.get(id);
    if (!channel) return;

    const noise = this.createNoiseBufferNode('brown');
    
    // Filter out top frequencies to make it even warmer
    const filterNode = this.ctx.createBiquadFilter();
    filterNode.type = 'lowpass';
    filterNode.frequency.value = 400; // Low hum

    // Connect: noise -> filter -> individual gain
    noise.connect(filterNode);
    filterNode.connect(channel.gainNode);
    
    noise.start(0);

    channel.nodes = [noise, filterNode];
  }

  // 2. Cosmic Space Pad Synthesizer
  // Generates a rich, slowly modulating minor 9th focus chord:
  // C3 (130Hz) + G3 (196Hz) + D4 (293Hz) + E4 (329Hz)
  startSpacePadSynth(id) {
    const channel = this.channels.get(id);
    if (!channel) return;

    const baseFreqs = [130.81, 196.00, 293.66, 329.63]; // C minor 9ish warm stack
    const oscillators = [];
    
    // Setup a lowpass filter with slow LFO modulation
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 650;
    filter.Q.value = 2.0;

    // Connect filter to main channel gain
    filter.connect(channel.gainNode);

    // Create 4 detuned warm triangle oscillators
    baseFreqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq + (Math.random() * 0.6 - 0.3); // Detuned chorus effect

      const oscGain = this.ctx.createGain();
      oscGain.gain.value = 0.25; // Balanced volumes

      osc.connect(oscGain);
      oscGain.connect(filter);
      
      osc.start(0);
      oscillators.push(osc);
      oscillators.push(oscGain);
    });

    // Create a slow modulation LFO for filter sweep
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.08; // Very slow (12.5 seconds per cycle)

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 350; // Modulate filter cutoff range by +-350Hz

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    
    lfo.start(0);

    // Store references to shut down later
    channel.nodes = [...oscillators, filter, lfo, lfoGain];
  }

  // 3. Fallback Synthesizer for Weather / Water
  startFallbackNoiseSynth(id) {
    const channel = this.channels.get(id);
    if (!channel) return;

    // Create primary sound generator (pink or brown noise)
    const noise = this.createNoiseBufferNode(id === 'rain' ? 'pink' : 'brown');
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';

    if (id === 'rain') {
      filter.frequency.value = 1000;
      filter.Q.value = 1.0;
    } else if (id === 'ocean') {
      // Ocean uses a slow LFO to simulate periodic waves breaking
      filter.frequency.value = 400;
      filter.Q.value = 0.5;

      const swellLfo = this.ctx.createOscillator();
      swellLfo.type = 'sine';
      swellLfo.frequency.value = 0.12; // ~8.3 second cycles

      const swellGain = this.ctx.createGain();
      swellGain.gain.value = 250;

      swellLfo.connect(swellGain);
      swellGain.connect(filter.frequency);
      swellLfo.start(0);
      channel.nodes.push(swellLfo, swellGain);
    } else if (id === 'thunder') {
      // Distant rolling thunder simulation
      filter.frequency.value = 60;
      filter.Q.value = 4.0;
    }

    noise.connect(filter);
    filter.connect(channel.gainNode);
    noise.start(0);

    channel.nodes.push(noise, filter);

    // Occasional crackles for rain fallback
    if (id === 'rain') {
      this.runRaindropSynthesizer(channel.gainNode);
    }
  }

  // Recursive synthesized raindrop crackle impulses
  runRaindropSynthesizer(outputGainNode) {
    if (!this.initialized || !outputGainNode) return;
    
    // Check if rain channel is still active
    const rainChan = this.channels.get('rain');
    if (!rainChan || !rainChan.isPlaying) return;

    // Schedule next droplet click
    const delay = Math.random() * 400 + 100; // 100ms - 500ms intervals
    
    setTimeout(() => {
      if (rainChan.isPlaying && this.ctx) {
        this.synthesizeSingleRaindrop(outputGainNode);
        this.runRaindropSynthesizer(outputGainNode);
      }
    }, delay);
  }

  synthesizeSingleRaindrop(outputGainNode) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    // Frequency sweeps down rapidly (water droplet "plink")
    osc.frequency.setValueAtTime(Math.random() * 800 + 1200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.04);
    
    gain.gain.setValueAtTime(0.015 * Math.random() + 0.0001, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(outputGainNode);
    
    osc.start(0);
    osc.stop(this.ctx.currentTime + 0.05);
  }

  // --- Campfire Synthesizer fallback ---
  startCampfireSynth(id) {
    const channel = this.channels.get(id);
    if (!channel) return;

    const baseNoise = this.createNoiseBufferNode('brown');
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 150; // Cozy low-end fire rumble
    
    const roarGain = this.ctx.createGain();
    roarGain.gain.value = 0.5;

    baseNoise.connect(filter);
    filter.connect(roarGain);
    roarGain.connect(channel.gainNode);
    baseNoise.start(0);

    // Procedural wood-crackle impulses
    const crackleGainNode = this.ctx.createGain();
    crackleGainNode.gain.value = 0.45;
    crackleGainNode.connect(channel.gainNode);

    const state = { isPlaying: true, timerId: null };
    const triggerCrackle = () => {
      if (!state.isPlaying || !this.ctx || !channel.isPlaying) return;
      
      const osc = this.ctx.createOscillator();
      const snapGain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2000 + Math.random() * 3000, this.ctx.currentTime);
      
      snapGain.gain.setValueAtTime(0.015 * Math.random() + 0.0001, this.ctx.currentTime);
      snapGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.015);

      const bufferSize = 0.02 * this.ctx.sampleRate;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = 1500;
      noiseFilter.Q.value = 2.0;

      noise.connect(noiseFilter);
      noiseFilter.connect(snapGain);
      
      osc.connect(snapGain);
      snapGain.connect(crackleGainNode);
      
      osc.start(0);
      osc.stop(this.ctx.currentTime + 0.02);
      noise.start(0);

      state.timerId = setTimeout(triggerCrackle, Math.random() * 250 + 40);
    };
    
    triggerCrackle();

    channel.nodes = [baseNoise, filter, roarGain, crackleGainNode, {
      stop: () => {
        state.isPlaying = false;
        clearTimeout(state.timerId);
      },
      disconnect: () => {}
    }];
  }

  // --- Birds Chirping Synthesizer fallback ---
  startBirdsSynth(id) {
    const channel = this.channels.get(id);
    if (!channel) return;

    const state = { isPlaying: true, timerId: null };
    
    const triggerChirp = () => {
      if (!state.isPlaying || !this.ctx || !channel.isPlaying) return;

      const now = this.ctx.currentTime;
      const duration = 0.1 + Math.random() * 0.15; // 100ms - 250ms chirps
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const startFreq = 2800 + Math.random() * 800;
      const endFreq = startFreq + (Math.random() * 1200 - 600); // Whistle sweep

      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.05, now + 0.02); // Quick fade in
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(channel.gainNode);
      
      osc.start(now);
      osc.stop(now + duration + 0.05);

      const nextDelay = Math.random() < 0.35 ? (duration * 1000 + 100) : (Math.random() * 3000 + 1000);
      state.timerId = setTimeout(triggerChirp, nextDelay);
    };

    triggerChirp();

    channel.nodes = [{
      stop: () => {
        state.isPlaying = false;
        clearTimeout(state.timerId);
      },
      disconnect: () => {}
    }];
  }

  // --- Café Atmosphere Synthesizer fallback ---
  startCafeSynth(id) {
    const channel = this.channels.get(id);
    if (!channel) return;

    // 1. Muffled chatter floor (bandpassed pink/brown noise modulated by low LFOs)
    const noise = this.createNoiseBufferNode('pink');
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 350; // Speech vocal range
    filter.Q.value = 1.0;

    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.15; // Slow volume sweeps

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.08;

    lfo.connect(lfoGain);
    
    const chatterGain = this.ctx.createGain();
    chatterGain.gain.value = 0.15;

    noise.connect(filter);
    filter.connect(chatterGain);
    chatterGain.connect(channel.gainNode);
    noise.start(0);

    // 2. Procedural cup clinks scheduler
    const state = { isPlaying: true, timerId: null };
    const triggerClink = () => {
      if (!state.isPlaying || !this.ctx || !channel.isPlaying) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(2500 + Math.random() * 2000, now);
      
      gain.gain.setValueAtTime(0.015 * Math.random() + 0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      osc.connect(gain);
      gain.connect(channel.gainNode);
      
      osc.start(now);
      osc.stop(now + 0.15);

      state.timerId = setTimeout(triggerClink, Math.random() * 4500 + 800); // Occasional clinks
    };

    triggerClink();

    channel.nodes = [noise, filter, chatterGain, lfo, lfoGain, {
      stop: () => {
        state.isPlaying = false;
        clearTimeout(state.timerId);
      },
      disconnect: () => {}
    }];
  }

  // --- Mathematical Lofi Synthesizer fallback ---
  startLofiSynth(id) {
    const channel = this.channels.get(id);
    if (!channel) return;

    console.log("[AudioEngine] Starting mathematical Lofi Synthesizer!");
    
    // Choose a random progression & title to make synthesis feel alive and premium
    const progressions = [
      {
        name: "Neo-Jazz Focus",
        bpm: 72,
        style: 'jazz',
        chords: [
          [146.83, 174.61, 220.00, 261.63, 329.63], // Dmin9 (D3, F3, A3, C4, E4)
          [97.99, 246.94, 349.23, 440.00, 659.25],  // G13 (G2, B3, F4, A4, E5)
          [130.81, 164.81, 196.00, 246.94, 293.66], // Cmaj9 (C3, E3, G3, B3, D4)
          [110.00, 130.81, 164.81, 196.00, 261.63]  // Amin7 (A2, C3, E3, G3, C4)
        ],
        roots: [73.42, 97.99, 65.41, 55.00]
      },
      {
        name: "Cozy Lounge",
        bpm: 68,
        style: 'bossa',
        chords: [
          [116.54, 146.83, 174.61, 220.00, 261.63], // Bbmaj9
          [130.81, 164.81, 196.00, 233.08, 293.66], // C9
          [110.00, 130.81, 164.81, 196.00, 246.94], // Amin9
          [146.83, 174.61, 220.00, 261.63, 329.63]  // Dmin9
        ],
        roots: [58.27, 65.41, 55.00, 73.42]
      },
      {
        name: "Late Night Chill",
        bpm: 62,
        style: 'chillhop',
        chords: [
          [130.81, 155.56, 196.00, 233.08, 293.66], // Cmin9
          [174.61, 220.00, 261.63, 293.66, 349.23], // F9
          [116.54, 146.83, 174.61, 220.00, 261.63], // Bbmaj9
          [103.83, 130.81, 155.56, 196.00, 233.08]  // Abmaj9
        ],
        roots: [65.41, 87.31, 58.27, 51.91]
      }
    ];

    const selectedIdx = Math.floor(Math.random() * progressions.length);
    const prog = progressions[selectedIdx];

    window.dispatchEvent(new CustomEvent('lofi-track-changed', {
      detail: {
        title: `Lofi (${prog.name}) ☕️`,
        isPlaying: true
      }
    }));

    const state = {
      bpm: prog.bpm,
      step: 0,
      isPlaying: true,
      timerId: null
    };

    const secondsPerBeat = 60 / state.bpm;
    const stepDuration = secondsPerBeat / 2; // Eighth notes

    const progression = prog.chords;
    const roots = prog.roots;

    // Custom vinyl crackle generator
    const crackleNode = this.ctx.createGain();
    crackleNode.gain.value = 0.05;
    crackleNode.connect(channel.gainNode);
    this.runVinylCrackle(crackleNode);

    const scheduleNextSteps = () => {
      if (!state.isPlaying || !channel.isPlaying) return;

      const now = this.ctx.currentTime;
      const stepTime = now + 0.05;

      const beat = Math.floor(state.step / 2) % 4;
      const isEighth = (state.step % 2) !== 0;
      const measure = Math.floor(state.step / 8) % 4;

      // 1. Chord / Instrument Trigger
      if (state.step % 8 === 0) {
        if (prog.style === 'ambient') {
          this.synthesizeLofiSpacePad(progression[measure], stepTime, stepDuration * 7.9, channel.gainNode);
        } else if (prog.style === 'bossa') {
          // Play syncopated nylon guitar chord plucks
          this.synthesizeLofiPluck(progression[measure][0], stepTime, stepDuration * 1.5, channel.gainNode);
          this.synthesizeLofiPluck(progression[measure][1], stepTime + stepDuration * 0.5, stepDuration * 1.5, channel.gainNode);
          this.synthesizeLofiPluck(progression[measure][2], stepTime + stepDuration * 1.0, stepDuration * 2.0, channel.gainNode);
          this.synthesizeLofiPluck(progression[measure][3], stepTime + stepDuration * 3.0, stepDuration * 1.5, channel.gainNode);
        } else if (prog.style === 'chillhop') {
          // Chillhop chords
          progression[measure].forEach(note => {
            this.synthesizeLofiPluck(note * 0.5, stepTime, stepDuration * 0.8, channel.gainNode); // Lower pluck
          });
        } else {
          // Classic rhodes
          this.synthesizeLofiRhodes(progression[measure], stepTime, stepDuration * 7.5, channel.gainNode);
        }
      }

      // Cozy Chillhop Lead melody generator (plays random chord-tones on eighth steps)
      if (prog.style === 'chillhop' && state.step % 8 !== 0) {
        const chordNotes = progression[measure];
        if (Math.random() < 0.35) {
          const randomNote = chordNotes[Math.floor(Math.random() * chordNotes.length)] * 2; // Up an octave
          this.synthesizeLofiMelody(randomNote, stepTime, stepDuration * 0.8, channel.gainNode);
        }
      }

      // 2. Bassline Triggers
      if (prog.style === 'bossa') {
        // Classic Bossa Nova bassline (Root on 0, Fifth on 3, Root on 4, Fifth on 7)
        if (state.step % 8 === 0) {
          this.synthesizeLofiBass(roots[measure], stepTime, stepDuration * 2.5, channel.gainNode);
        } else if (state.step % 8 === 3) {
          this.synthesizeLofiBass(roots[measure] * 1.5, stepTime, stepDuration * 0.9, channel.gainNode);
        } else if (state.step % 8 === 4) {
          this.synthesizeLofiBass(roots[measure], stepTime, stepDuration * 2.5, channel.gainNode);
        } else if (state.step % 8 === 7) {
          this.synthesizeLofiBass(roots[measure] * 1.5, stepTime, stepDuration * 0.9, channel.gainNode);
        }
      } else if (prog.style === 'ambient') {
        // Very slow ambient bassline sweeps
        if (state.step % 8 === 0) {
          this.synthesizeLofiBass(roots[measure] * 0.5, stepTime, stepDuration * 7.5, channel.gainNode);
        }
      } else if (prog.style === 'chillhop') {
        // Walking/groove bassline
        if (state.step % 8 === 0) {
          this.synthesizeLofiBass(roots[measure], stepTime, stepDuration * 1.8, channel.gainNode);
        } else if (state.step % 8 === 2) {
          this.synthesizeLofiBass(roots[measure] * 1.2, stepTime, stepDuration * 0.8, channel.gainNode);
        } else if (state.step % 8 === 4) {
          this.synthesizeLofiBass(roots[measure] * 1.5, stepTime, stepDuration * 1.8, channel.gainNode);
        } else if (state.step % 8 === 6) {
          this.synthesizeLofiBass(roots[measure] * 0.8, stepTime, stepDuration * 0.8, channel.gainNode);
        }
      } else {
        // Default Neo-Jazz Bass
        if (state.step % 4 === 0) {
          this.synthesizeLofiBass(roots[measure], stepTime, stepDuration * 2.8, channel.gainNode);
        } else if (state.step % 8 === 6) {
          this.synthesizeLofiBass(roots[measure] * 1.5, stepTime, stepDuration * 0.9, channel.gainNode);
        }
      }

      // 3. Drums Triggers based on style
      if (prog.style === 'ambient') {
        // Heartbeat pulse kick
        if (state.step % 8 === 0) {
          this.synthesizeLofiKick(stepTime, 0.15, channel.gainNode);
        } else if (state.step % 8 === 4) {
          this.synthesizeLofiKick(stepTime, 0.1, channel.gainNode);
        }
      } else if (prog.style === 'bossa') {
        // Shaker hats (Dynamic shaker volume swing)
        const shakerVol = state.step % 2 === 0 ? 0.025 : 0.012;
        this.synthesizeLofiHat(stepTime, shakerVol, channel.gainNode);

        // Kick on 0, 4
        if (state.step % 8 === 0) {
          this.synthesizeLofiKick(stepTime, 0.35, channel.gainNode);
        } else if (state.step % 8 === 4) {
          this.synthesizeLofiKick(stepTime, 0.3, channel.gainNode);
        }

        // Rimshot woodblock on steps 2, 5, 7
        if (state.step % 8 === 2 || state.step % 8 === 5 || state.step % 8 === 7) {
          this.synthesizeBossaRimshot(stepTime, 0.08, channel.gainNode);
        }
      } else if (prog.style === 'chillhop') {
        // Gritty Chillhop / Boombap swing drums
        const hatVol = isEighth ? 0.012 : 0.04;
        this.synthesizeLofiHat(stepTime, hatVol, channel.gainNode);

        // Heavy Kick on 0, 3 (syncopated), 4
        if (state.step % 8 === 0) {
          this.synthesizeLofiKick(stepTime, 0.5, channel.gainNode);
        } else if (state.step % 8 === 3) {
          this.synthesizeLofiKick(stepTime - 0.03, 0.35, channel.gainNode);
        } else if (state.step % 8 === 4) {
          this.synthesizeLofiKick(stepTime, 0.4, channel.gainNode);
        }

        // Snappy Snare on 2 and 6
        if (state.step % 8 === 2 || state.step % 8 === 6) {
          this.synthesizeLofiSnare(stepTime, 0.22, channel.gainNode);
        }
      } else {
        // Default Neo-Jazz Drums
        const hatVolume = isEighth ? 0.015 : 0.03;
        this.synthesizeLofiHat(stepTime, hatVolume, channel.gainNode);

        if (state.step % 8 === 0) {
          this.synthesizeLofiKick(stepTime, 0.45, channel.gainNode);
        } else if (state.step % 8 === 3) {
          this.synthesizeLofiKick(stepTime, 0.35, channel.gainNode);
        } else if (state.step % 8 === 5) {
          this.synthesizeLofiKick(stepTime, 0.25, channel.gainNode);
        }

        if (state.step % 8 === 2 || state.step % 8 === 6) {
          this.synthesizeLofiSnare(stepTime, 0.18, channel.gainNode);
        }
      }

      state.step++;
      state.timerId = setTimeout(scheduleNextSteps, stepDuration * 1000);
    };

    scheduleNextSteps();

    channel.nodes = [{
      stop: () => {
        state.isPlaying = false;
        clearTimeout(state.timerId);
      },
      disconnect: () => {}
    }, crackleNode];
  }

  synthesizeLofiPluck(freq, time, duration, outputNode) {
    const now = time;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.06, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.linearRampToValueAtTime(600, now + duration);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(outputNode);
    
    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  synthesizeLofiSpacePad(freqs, time, duration, outputNode) {
    const now = time;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 1.0;
    filter.frequency.setValueAtTime(300, now);
    filter.frequency.linearRampToValueAtTime(500, now + duration * 0.4);
    filter.frequency.exponentialRampToValueAtTime(250, now + duration);
    filter.connect(outputNode);

    freqs.forEach(freq => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq + (Math.random() * 0.4 - 0.2), now);

      const noteGain = this.ctx.createGain();
      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.linearRampToValueAtTime(0.02, now + duration * 0.3);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(noteGain);
      noteGain.connect(filter);

      osc.start(now);
      osc.stop(now + duration);
    });
  }

  synthesizeLofiMelody(freq, time, duration, outputNode) {
    const now = time;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, now);
    
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.02, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(400, now + duration);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(outputNode);
    
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  synthesizeBossaRimshot(time, volume, outputNode) {
    const now = time;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(980, now);
    
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 980;
    filter.Q.value = 5.0;
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(outputNode);
    
    osc.start(now);
    osc.stop(now + 0.05);
  }

  synthesizeLofiRhodes(freqs, time, duration, outputNode) {
    const now = time;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);
    filter.frequency.exponentialRampToValueAtTime(320, now + duration);
    filter.connect(outputNode);

    const notes = [];
    freqs.forEach(freq => {
      const osc1 = this.ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, now);
      
      const warble = this.ctx.createOscillator();
      warble.type = 'sine';
      warble.frequency.setValueAtTime(4 + Math.random() * 2, now);
      const warbleGain = this.ctx.createGain();
      warbleGain.gain.setValueAtTime(0.8, now);
      warble.connect(warbleGain);
      warbleGain.connect(osc1.frequency);
      warble.start(now);
      notes.push(warble, warbleGain);

      const osc2 = this.ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2, now);
      
      const noteGain = this.ctx.createGain();
      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.linearRampToValueAtTime(0.04, now + 0.1);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc1.connect(noteGain);
      osc2.connect(noteGain);
      noteGain.connect(filter);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + duration);
      osc2.stop(now + duration);
      notes.push(osc1, osc2, noteGain);
    });
  }

  synthesizeLofiBass(freq, time, duration, outputNode) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(0.12, time + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(100, time);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(outputNode);

    osc.start(time);
    osc.stop(time + duration);
  }

  synthesizeLofiKick(time, volume, outputNode) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.12);

    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.15);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(150, time);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(outputNode);

    osc.start(time);
    osc.stop(time + 0.16);
  }

  synthesizeLofiSnare(time, volume, outputNode) {
    const now = time;
    const bufferSize = 0.15 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      noiseData[i] = Math.random() * 2 - 1;
    }
    
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1000, now);
    noiseFilter.Q.value = 1.5;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(volume, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(outputNode);

    const toneOsc = this.ctx.createOscillator();
    const toneGain = this.ctx.createGain();
    
    toneOsc.type = 'triangle';
    toneOsc.frequency.setValueAtTime(180, now);
    toneOsc.frequency.exponentialRampToValueAtTime(100, now + 0.08);

    toneGain.gain.setValueAtTime(volume * 0.4, now);
    toneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

    toneOsc.connect(toneGain);
    toneGain.connect(outputNode);

    noiseSource.start(now);
    toneOsc.start(now);
    toneOsc.stop(now + 0.1);
  }

  synthesizeLofiHat(time, volume, outputNode) {
    const bufferSize = 0.04 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      noiseData[i] = Math.random() * 2 - 1;
    }
    
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.03);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(outputNode);

    noiseSource.start(time);
  }

  runVinylCrackle(outputNode) {
    const rainChan = this.channels.get('lofi');
    if (!rainChan || !rainChan.isPlaying) return;

    const delay = Math.random() * 800 + 100;
    setTimeout(() => {
      if (rainChan.isPlaying && this.ctx) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(8000 + Math.random() * 4000, this.ctx.currentTime);
        
        gain.gain.setValueAtTime(0.004 * Math.random() + 0.0001, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.008);

        osc.connect(gain);
        gain.connect(outputNode);
        
        osc.start(0);
        osc.stop(this.ctx.currentTime + 0.01);
        this.runVinylCrackle(outputNode);
      }
    }, delay);
  }

  stopSynth(id) {
    const channel = this.channels.get(id);
    if (!channel || !channel.nodes) return;

    channel.nodes.forEach(node => {
      try {
        node.stop();
      } catch (e) {
        // Safe to ignore since only OscillatorNode/AudioBufferSourceNode support stop()
      }
      try {
        node.disconnect();
      } catch (e) {
        // Node disconnection
      }
    });

    channel.nodes = [];
  }

  // --- Keyboard typing ASMR clicks ---
  // Pure synthesized mechanical keyboard click (works 100% locally and offline)
  synthesizeKeyboardClick() {
    if (!this.initialized) this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const now = this.ctx.currentTime;
    
    // 1. High frequency mechanical "click" transient (sinewave pitch drop)
    const clickOsc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    
    clickOsc.type = 'sine';
    clickOsc.frequency.setValueAtTime(1600 + Math.random() * 400, now);
    clickOsc.frequency.exponentialRampToValueAtTime(300, now + 0.015);
    
    clickGain.gain.setValueAtTime(0.035, now);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);
    
    clickOsc.connect(clickGain);
    clickGain.connect(this.masterGain);
    
    clickOsc.start(now);
    clickOsc.stop(now + 0.02);

    // 2. Mid frequency plastic "clack" (filtered bandpass noise transient)
    const bufferSize = 0.02 * this.ctx.sampleRate; // Extremely short (20ms)
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      noiseData[i] = Math.random() * 2 - 1;
    }
    
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 900 + Math.random() * 200; // Key hollow volume resonance
    noiseFilter.Q.value = 3.0;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.025, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noiseSource.start(now);
  }

  // --- Circular completion chime synthesizer ---
  synthesizeTimerChime() {
    if (!this.initialized) this.init();
    const now = this.ctx.currentTime;

    // Harmonic bell synth sweep: E5, A5, C#6
    const freqs = [659.25, 880.00, 1109.73];
    
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.15); // Arpeggiated sequence

      gain.gain.setValueAtTime(0.12, now + idx * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.15 + 1.2);

      // Connect simple lowpass for bell warmth
      const lowpass = this.ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 1200;

      osc.connect(lowpass);
      lowpass.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + idx * 0.15);
      osc.stop(now + idx * 0.15 + 1.3);
    });
  }

  // ==========================================================================
  // --- FREQUENCY SPECTRUM CANVAS VISUALIZER ---
  // ==========================================================================
  startVisualizer(canvasElement) {
    if (!canvasElement || !this.initialized) return;
    
    const ctx = canvasElement.getContext('2d');
    const width = canvasElement.width = canvasElement.clientWidth;
    const height = canvasElement.height = canvasElement.clientHeight;
    
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      this.visualizerAnimationId = requestAnimationFrame(draw);
      
      this.analyser.getByteFrequencyData(dataArray);
      
      ctx.clearRect(0, 0, width, height);
      
      // Visualizer draw configurations
      const barWidth = (width / bufferLength) * 2.0;
      let barHeight;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2.5; // Scale height
        
        // Elegant Nordic Minimalist visualizer bars (Sage Green with soft clay overlay)
        ctx.fillStyle = `rgba(107, 123, 107, ${barHeight / 90 + 0.15})`; // Sage green with height-driven opacity
        ctx.fillRect(x, height - barHeight, barWidth - 2.0, barHeight);
        
        // Soft Slate Blue cap line
        if (barHeight > 0) {
          ctx.fillStyle = `rgba(90, 109, 122, 0.45)`;
          ctx.fillRect(x, height - barHeight - 1, barWidth - 2.0, 1.0);
        }

        x += barWidth;
      }
    };

    draw();
  }

  stopVisualizer() {
    if (this.visualizerAnimationId) {
      cancelAnimationFrame(this.visualizerAnimationId);
    }
  }
}

// Export single audio engine instance
window.audioEngine = new SoundScapeAudioEngine();
