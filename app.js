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
      
      // Load preference from localStorage
      const saved = localStorage.getItem('pipboy_sfx_enabled');
      if (saved !== null) {
        this.enabled = saved === 'true';
      }
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggle() {
      this.enabled = !this.enabled;
      localStorage.setItem('pipboy_sfx_enabled', this.enabled);
      if (this.enabled) {
        this.init();
        this.playTabClick();
      }
      return this.enabled;
    }

    // High mechanical click for tab changes
    playTabClick() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(880, now); // A5
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.04);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.045);
      } catch (e) {
        // Audio error fallback
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

    // Set unmuted by default
    pipboyBootVideo.muted = false;
    pipboyBootVideo.volume = 1.0;

    // Video Audio Button Toggle
    if (videoAudioBtn) {
      videoAudioBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        pipboyBootVideo.muted = !pipboyBootVideo.muted;
        updateVideoAudioBtnUI();
        if (!pipboyBootVideo.muted) {
          pipboyBootVideo.play().catch(() => {});
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

    // Clicking anywhere on the video overlay unmutes audio (does NOT skip prematurely)
    videoBootOverlay.addEventListener('click', (e) => {
      if (e.target === skipVideoBtn || (skipVideoBtn && skipVideoBtn.contains(e.target))) {
        return;
      }
      if (pipboyBootVideo.muted) {
        pipboyBootVideo.muted = false;
        pipboyBootVideo.play().catch(() => {});
        updateVideoAudioBtnUI();
      } else if (pipboyBootVideo.paused) {
        pipboyBootVideo.play().catch(() => {});
      }
    });

    // Start button for strict autoplay environments (e.g. Firefox strict privacy)
    if (videoStartBtn) {
      videoStartBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (videoStartPrompt) videoStartPrompt.style.display = 'none';
        pipboyBootVideo.muted = false;
        pipboyBootVideo.volume = 1.0;
        pipboyBootVideo.play().then(() => {
          updateVideoAudioBtnUI();
        }).catch(() => {
          finishAllBootSequences();
        });
      });
    }

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

    // Start playback routine
    const attemptPlay = () => {
      // First attempt: UNMUTED playback
      pipboyBootVideo.muted = false;
      pipboyBootVideo.volume = 1.0;
      const playPromise = pipboyBootVideo.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Succeeded with unmuted audio!
            if (videoStartPrompt) videoStartPrompt.style.display = 'none';
            updateVideoAudioBtnUI();
          })
          .catch((err) => {
            console.log('Unmuted autoplay prevented by browser policy, attempting muted fallback:', err);
            // Second attempt: Muted playback with click-to-unmute prompt
            pipboyBootVideo.muted = true;
            pipboyBootVideo.play()
              .then(() => {
                updateVideoAudioBtnUI();
                // Add one-time window listener to unmute on first click or touch
                const unmuteOnInteraction = () => {
                  pipboyBootVideo.muted = false;
                  updateVideoAudioBtnUI();
                  window.removeEventListener('click', unmuteOnInteraction);
                  window.removeEventListener('touchstart', unmuteOnInteraction);
                  window.removeEventListener('keydown', unmuteOnInteraction);
                };
                window.addEventListener('click', unmuteOnInteraction, { once: true });
                window.addEventListener('touchstart', unmuteOnInteraction, { once: true });
                window.addEventListener('keydown', unmuteOnInteraction, { once: true });
              })
              .catch((err2) => {
                console.log('Autoplay fully restricted by browser:', err2);
                // If both unmuted and muted autoplay are blocked by browser (e.g. strict Firefox):
                if (videoStartPrompt) {
                  videoStartPrompt.style.display = 'block';
                } else {
                  finishAllBootSequences();
                }
              });
          });
      }
    };

    // Trigger playback as soon as data or metadata is ready
    if (pipboyBootVideo.readyState >= 1) {
      attemptPlay();
    } else {
      pipboyBootVideo.addEventListener('loadedmetadata', attemptPlay, { once: true });
      pipboyBootVideo.addEventListener('canplay', attemptPlay, { once: true });
      pipboyBootVideo.load();
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
  window.addEventListener('DOMContentLoaded', () => {
    initVideoBoot();
  });

})();

