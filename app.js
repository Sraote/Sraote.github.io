/**
 * PIP-BOY 3000 ROBCO OS CONTROLLER
 * Handles Boot Sequence, Web Audio Synthesizer & Pip-Boy Tab Navigation
 * Designed for Sanjiv Raote Portfolio
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. WEB AUDIO API SYNTHESIZER (No external audio files needed!)
  // =========================================================================
  class PipBoyAudio {
    constructor() {
      this.ctx = null;
      this.enabled = true;
      this.tabBuffer = null;
      
      // Pool of pre-instantiated Audio elements (100% reliable in Firefox & Chrome)
      this.poolSize = 6;
      this.poolIndex = 0;
      this.audioPool = [];

      for (let i = 0; i < this.poolSize; i++) {
        const audio = new Audio('tab.wav');
        audio.preload = 'auto';
        audio.volume = 0.85;
        this.audioPool.push(audio);
      }

      // Load preference from localStorage
      const saved = localStorage.getItem('pipboy_sfx_enabled');
      if (saved !== null) {
        this.enabled = saved === 'true';
      }

      this.loadTabBuffer();
    }

    loadTabBuffer() {
      fetch('tab.wav')
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (AudioContext && !this.ctx) {
            this.ctx = new AudioContext();
          }
          if (this.ctx) {
            this.ctx.decodeAudioData(arrayBuffer, (decoded) => {
              this.tabBuffer = decoded;
            }, () => {});
          }
        })
        .catch(() => {});
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
          if (!this.tabBuffer) this.loadTabBuffer();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    }

    toggle() {
      this.enabled = !this.enabled;
      localStorage.setItem('pipboy_sfx_enabled', this.enabled);
      if (this.enabled) {
        this.playTabClick();
      }
      return this.enabled;
    }

    // Play user custom tab.wav sound effect (Guaranteed in Firefox & Chrome)
    playTabClick() {
      if (!this.enabled) return;

      // 1. If Web Audio Context is active and running, use buffer source
      if (this.ctx && this.ctx.state === 'running' && this.tabBuffer) {
        try {
          const source = this.ctx.createBufferSource();
          source.buffer = this.tabBuffer;
          const gainNode = this.ctx.createGain();
          gainNode.gain.setValueAtTime(0.85, this.ctx.currentTime);
          source.connect(gainNode);
          gainNode.connect(this.ctx.destination);
          source.start(0);
          return;
        } catch (e) {}
      }

      // 2. Primary preloaded Audio Pool (Directly allowed by Firefox user gesture)
      try {
        const audio = this.audioPool[this.poolIndex];
        this.poolIndex = (this.poolIndex + 1) % this.poolSize;
        audio.currentTime = 0;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            this.init();
          });
        }
      } catch (err) {
        this.init();
      }
    }

    // Fast keystroke blip for boot terminal
    playKeystroke() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1400 + Math.random() * 200, now);

        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.025);
      } catch (e) {
        // Fallback
      }
    }

    // Authentic dual-tone Pip-Boy boot completion chime
    playBootCompleteChime() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      try {
        const now = this.ctx.currentTime;
        
        // Note 1
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, now); // D5
        gain1.gain.setValueAtTime(0.06, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc1.connect(gain1);
        gain1.connect(this.ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.15);

        // Note 2
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, now + 0.1); // A5
        gain2.gain.setValueAtTime(0.08, now + 0.1);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        osc2.start(now + 0.1);
        osc2.stop(now + 0.35);
      } catch (e) {
        // Fallback
      }
    }
  }

  const sfx = new PipBoyAudio();

  // =========================================================================
  // 2. VIDEO BOOT & ROBCO BOOT CONTROLLER
  // =========================================================================
  const videoBootOverlay = document.getElementById('videoBootOverlay');
  const pipboyBootVideo = document.getElementById('pipboyBootVideo');
  const videoAudioBtn = document.getElementById('videoAudioBtn');
  const skipVideoBtn = document.getElementById('skipVideoBtn');

  const bootOverlay = document.getElementById('bootOverlay');
  const bootTerminalLog = document.getElementById('bootTerminalLog');
  const skipBootBtn = document.getElementById('skipBootBtn');
  let bootFinished = false;

  function updateVideoAudioBtnUI() {
    if (!videoAudioBtn || !pipboyBootVideo) return;
    if (pipboyBootVideo.muted) {
      videoAudioBtn.textContent = '[ 🔇 UNMUTE AUDIO ]';
      videoAudioBtn.style.color = '#ffb347';
      videoAudioBtn.style.borderColor = '#ffb347';
    } else {
      videoAudioBtn.textContent = '[ 🔊 MUTE AUDIO ]';
      videoAudioBtn.style.color = 'var(--pip-green)';
      videoAudioBtn.style.borderColor = 'var(--pip-green)';
    }
  }

  function finishAllBootSequences() {
    if (bootFinished) return;
    bootFinished = true;

    // Pause & stop video if running
    if (pipboyBootVideo) {
      try {
        pipboyBootVideo.pause();
      } catch (e) {}
    }

    // Fade out fullscreen video
    if (videoBootOverlay) {
      videoBootOverlay.classList.add('hidden');
      setTimeout(() => {
        videoBootOverlay.style.display = 'none';
      }, 800);
    }

    // Fade out terminal overlay if active
    if (bootOverlay) {
      bootOverlay.classList.add('fade-out');
      setTimeout(() => {
        bootOverlay.style.display = 'none';
      }, 600);
    }

    sfx.playBootCompleteChime();
  }

  // Handle Video Boot
  const videoStartPrompt = document.getElementById('videoStartPrompt');
  const videoStartBtn = document.getElementById('videoStartBtn');

  function initVideoBoot() {
    if (!pipboyBootVideo || !videoBootOverlay) {
      runFallbackTerminalBoot();
      return;
    }

    let isStarting = false;

    function safePlay(unmuted = true) {
      if (bootFinished) return;
      if (isStarting) return;
      if (!pipboyBootVideo.paused && (!unmuted || !pipboyBootVideo.muted)) {
        if (videoStartPrompt) videoStartPrompt.style.display = 'none';
        return;
      }

      isStarting = true;
      pipboyBootVideo.muted = !unmuted;
      pipboyBootVideo.volume = 1.0;

      const playPromise = pipboyBootVideo.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            isStarting = false;
            if (videoStartPrompt) videoStartPrompt.style.display = 'none';
            updateVideoAudioBtnUI();
          })
          .catch((err) => {
            isStarting = false;
            console.log('Playback requires user gesture on this browser:', err);
            if (videoStartPrompt) {
              videoStartPrompt.style.display = 'block';
            }
          });
      } else {
        isStarting = false;
      }
    }

    // Video Audio Button Toggle
    if (videoAudioBtn) {
      videoAudioBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        pipboyBootVideo.muted = !pipboyBootVideo.muted;
        updateVideoAudioBtnUI();
        if (!pipboyBootVideo.muted && pipboyBootVideo.paused) {
          safePlay(true);
        }
      });
    }

    // Skip video button
    if (skipVideoBtn) {
      skipVideoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        finishAllBootSequences();
      });
    }

    // Single unified interaction handler for starting playback with audio
    function triggerUserActivation(e) {
      if (bootFinished) return;
      if (e && (e.target === skipVideoBtn || (skipVideoBtn && skipVideoBtn.contains(e.target)))) {
        return;
      }
      if (e && (e.target === videoAudioBtn || (videoAudioBtn && videoAudioBtn.contains(e.target)))) {
        return;
      }
      safePlay(true);
    }

    if (videoStartBtn) {
      videoStartBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        triggerUserActivation(e);
      });
    }

    videoBootOverlay.addEventListener('click', triggerUserActivation);

    // When video ends naturally, transition smoothly to Pip-Boy
    pipboyBootVideo.addEventListener('ended', () => {
      finishAllBootSequences();
    });

    // If video file fails to load
    pipboyBootVideo.addEventListener('error', () => {
      console.warn('Boot video could not be loaded. Falling back to terminal boot.');
      if (videoBootOverlay) {
        videoBootOverlay.style.display = 'none';
      }
      runFallbackTerminalBoot();
    });

    // Auto-initiate playback on page load
    let autoAttempted = false;
    const initialAutoPlay = () => {
      if (autoAttempted) return;
      autoAttempted = true;
      safePlay(true);
    };

    if (pipboyBootVideo.readyState >= 1) {
      initialAutoPlay();
    } else {
      pipboyBootVideo.addEventListener('loadedmetadata', initialAutoPlay, { once: true });
      pipboyBootVideo.addEventListener('canplay', initialAutoPlay, { once: true });
    }
  }

  // =========================================================================
  // 3. FALLBACK ROBCO TERMINAL BOOT
  // =========================================================================
  const bootLines = [
    { text: "ROBCO INDUSTRIES UNIFIED OPERATING SYSTEM", delay: 180 },
    { text: "COPYRIGHT 2077 ROBCO INDUSTRIES", delay: 140 },
    { text: "LOADER V1.1.4", delay: 140 },
    { text: "CHECKING MEMORY INTEGRITY... 640KB OK", delay: 160, className: "success" },
    { text: "INITIALIZING CRT PHOSPHOR MATRIX (50Hz)... OK", delay: 160, className: "success" },
    { text: "CONNECTING TO VAULT-TEC COMM NETWORK (CORAL GABLES / 305)...", delay: 240 },
    { text: "VAULT LINK ESTABLISHED: SIGNAL STRENGTH 100%", delay: 180, className: "success" },
    { text: "DETECTING HARDWARE: PIP-BOY 3000 WRIST INTERFACE... READY", delay: 190, className: "success" },
    { text: "--------------------------------------------------------", delay: 100 },
    { text: "MOUNTING USER PROFILE: SANJIV RAOTE", delay: 220, className: "highlight" },
    { text: "AFFILIATION: UNIVERSITY OF MIAMI [DATA SCIENCE & AI]", delay: 200 },
    { text: "DOUBLE MINORS: COMPUTER SCIENCE & PSYCHOLOGY", delay: 200 },
    { text: "OPERATIONAL ROLES: AI TRAINER @ HANDSHAKE // CLOUD INTERN @ REARC", delay: 240 },
    { text: "CORE MOTTO: TRANSFORMING CHALLENGES INTO ACHIEVEMENTS", delay: 220, className: "highlight" },
    { text: "SYSTEM STATUS: 100% OPERATIONAL. ALL MODULES NOMINAL.", delay: 200, className: "success" },
    { text: "WELCOME, OPERATIVE RAOTE.", delay: 300, className: "highlight" }
  ];

  async function runFallbackTerminalBoot() {
    if (bootFinished) return;

    // Check if terminal elements exist
    if (!bootTerminalLog || !bootOverlay) {
      finishAllBootSequences();
      return;
    }

    for (let i = 0; i < bootLines.length; i++) {
      if (bootFinished) break;
      const item = bootLines[i];
      
      const lineElem = document.createElement('div');
      lineElem.className = `terminal-line ${item.className || ''}`;
      lineElem.textContent = `> ${item.text}`;
      bootTerminalLog.appendChild(lineElem);
      bootTerminalLog.scrollTop = bootTerminalLog.scrollHeight;
      
      sfx.playKeystroke();
      await new Promise(r => setTimeout(r, item.delay));
    }

    if (!bootFinished) {
      await new Promise(r => setTimeout(r, 600));
      finishAllBootSequences();
    }
  }

  // Skip boot button for terminal
  if (skipBootBtn) {
    skipBootBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      finishAllBootSequences();
    });
  }

  // Keyboard shortcut to skip any boot (Space / Enter / Escape)
  window.addEventListener('keydown', (e) => {
    if (!bootFinished && (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape')) {
      e.preventDefault();
      finishAllBootSequences();
    }
  });

  // Clicking terminal overlay also skips
  if (bootOverlay) {
    bootOverlay.addEventListener('click', () => {
      if (!bootFinished) {
        finishAllBootSequences();
      }
    });
  }

  // =========================================================================
  // 3. PIP-BOY TAB NAVIGATION CONTROLLER
  // =========================================================================
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');
  const tabList = ['stat', 'exp', 'perks', 'data', 'radio'];

  function switchTab(targetTabId) {
    let found = false;

    tabButtons.forEach(btn => {
      const isMatch = btn.getAttribute('data-tab') === targetTabId;
      btn.classList.toggle('active', isMatch);
      btn.setAttribute('aria-selected', isMatch ? 'true' : 'false');
      if (isMatch) found = true;
    });

    tabPanels.forEach(panel => {
      panel.classList.toggle('active', panel.id === `tab-${targetTabId}`);
    });

    if (found) {
      sfx.playTabClick();
      // Scroll to top of content smoothly
      const content = document.getElementById('pipContent');
      if (content) content.scrollTop = 0;
    }
  }

  // Click handler for top navigation tabs
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab');
      switchTab(target);
    });
  });

  // Inter-tab links (e.g. "Transmit Message" button on STAT page)
  document.querySelectorAll('.switch-tab-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.getAttribute('data-target');
      if (target) switchTab(target);
    });
  });

  // Keyboard navigation for tabs (Fallout style: 1-5 keys or Arrow keys)
  window.addEventListener('keydown', (e) => {
    if (!bootFinished) return;

    // Ignore if typing inside input or textarea
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

    const currentActive = document.querySelector('.tab-btn.active');
    const currentTab = currentActive ? currentActive.getAttribute('data-tab') : 'stat';
    let currentIndex = tabList.indexOf(currentTab);

    if (e.key >= '1' && e.key <= '5') {
      const idx = parseInt(e.key, 10) - 1;
      if (tabList[idx]) switchTab(tabList[idx]);
    } else if (e.key === 'ArrowRight') {
      currentIndex = (currentIndex + 1) % tabList.length;
      switchTab(tabList[currentIndex]);
    } else if (e.key === 'ArrowLeft') {
      currentIndex = (currentIndex - 1 + tabList.length) % tabList.length;
      switchTab(tabList[currentIndex]);
    }
  });

  // =========================================================================
  // 4. AUDIO TOGGLE BUTTON
  // =========================================================================
  const audioToggleBtn = document.getElementById('audioToggleBtn');
  const audioStateText = document.getElementById('audioStateText');

  function updateAudioButtonUI() {
    if (audioStateText) {
      audioStateText.textContent = sfx.enabled ? 'ON' : 'OFF';
    }
    if (audioToggleBtn) {
      audioToggleBtn.title = `SFX is ${sfx.enabled ? 'Enabled' : 'Muted'} (Click to toggle)`;
      audioToggleBtn.classList.toggle('active', sfx.enabled);
    }
  }

  if (audioToggleBtn) {
    updateAudioButtonUI();
    audioToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sfx.toggle();
      updateAudioButtonUI();
    });
  }

  // =========================================================================
  // 5. INITIALIZE ON LOAD
  // =========================================================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVideoBoot);
  } else {
    initVideoBoot();
  }

})();

