/* ==========================================================================
   SoundScape Studio - Master Application Coordinator
   Orchestrates UI interactions, Notepad, Tasks, Theme switches, and PRO checkout.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Core Modules
  initLiveClock();
  initNotepad();
  initChecklist();
  initAudioMixer();
  initThemes();
  initZenMode();
  initSaaSCheckout();

  // Initialize Pomodoro Timer
  if (window.timerInstance) {
    window.timerInstance.init();
  }

  // Load Pro Status
  checkProStatus();
});

// ==========================================================================
// Safe DOM Helpers (reduces innerHTML surface area)
// ==========================================================================

/**
 * Safely set an SVG icon on an element.
 * This is the single controlled place we use innerHTML for icon swaps.
 * Never pass user-controlled strings here.
 */
function setIcon(element, svgMarkup) {
  if (element) {
    element.innerHTML = svgMarkup;
  }
}

/**
 * Create a safe task list item DOM node (no innerHTML with user data).
 * Does NOT attach event listeners — caller is responsible (keeps scope clean).
 */
function createTaskElement(task) {
  const li = document.createElement('li');
  li.className = `task-item ${task.completed ? 'completed' : ''}`;
  li.setAttribute('data-id', task.id);

  const label = document.createElement('label');
  label.className = 'task-checkbox-label';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = task.completed;

  const customCheckbox = document.createElement('span');
  customCheckbox.className = 'custom-checkbox';
  customCheckbox.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  `;

  const textSpan = document.createElement('span');
  textSpan.className = 'task-text';
  textSpan.textContent = task.text; // Safe — never innerHTML with user data

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-task-btn';
  deleteBtn.title = 'Delete Quest';
  deleteBtn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  `;

  label.appendChild(checkbox);
  label.appendChild(customCheckbox);
  label.appendChild(textSpan);

  li.appendChild(label);
  li.appendChild(deleteBtn);

  return li;
}

// ==========================================================================
// 1. Live Clock Widget
// ==========================================================================
function initLiveClock() {
  const clockEl = document.getElementById('liveClock');
  
  function updateClock() {
    const now = new Date();
    const hrs = now.getHours().toString().padStart(2, '0');
    const mins = now.getMinutes().toString().padStart(2, '0');
    const secs = now.getSeconds().toString().padStart(2, '0');
    clockEl.textContent = `${hrs}:${mins}:${secs}`;
  }

  updateClock();
  setInterval(updateClock, 1000);
}

// ==========================================================================
// 2. Persistent Notepad Widget
// ==========================================================================
async function initNotepad() {
  const notepad = document.getElementById('focusNotepad');
  const charCount = document.getElementById('charCount');
  const wordCount = document.getElementById('wordCount');
  const exportBtn = document.getElementById('exportNotesBtn');
  const clearBtn = document.getElementById('clearNotesBtn');
  const fullScreenBtn = document.getElementById('fullScreenNotesBtn');
  const notepadCard = document.getElementById('notepadCard');

  // Load saved notes
  const savedNotes = await focusStorage.get('soundscape_notepad_notes');
  if (savedNotes) {
    notepad.value = savedNotes;
    updateCounts(savedNotes);
  }

  // Input listener (auto-save & ASMR sound click!)
  notepad.addEventListener('input', async (e) => {
    const text = e.target.value;
    await focusStorage.set('soundscape_notepad_notes', text);
    updateCounts(text);

    // Play tactile mechanical click on key press!
    if (window.audioEngine) {
      window.audioEngine.synthesizeKeyboardClick();
    }
  });

  // Calculate character & word metrics
  function updateCounts(text) {
    const chars = text.length;
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    
    charCount.textContent = `${chars} character${chars !== 1 ? 's' : ''}`;
    wordCount.textContent = `${words} word${words !== 1 ? 's' : ''}`;
  }

  // Export as TXT file
  exportBtn.addEventListener('click', () => {
    const text = notepad.value;
    if (text.trim() === '') {
      alert("Notepad is empty. Write something before exporting!");
      return;
    }

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = `SoundScape_Focus_Notes_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });

  // Clear text action
  clearBtn.addEventListener('click', async () => {
    if (notepad.value.trim() === '') return;
    
    if (confirm("Are you sure you want to permanently clear your focus notes?")) {
      notepad.value = '';
      await focusStorage.set('soundscape_notepad_notes', '');
      updateCounts('');
    }
  });

  // Toggle Zen Full Screen notepad
  fullScreenBtn.addEventListener('click', () => {
    notepadCard.classList.toggle('fullscreen-notepad');
    
    const fsSvg = fullScreenBtn.querySelector('svg');
    if (notepadCard.classList.contains('fullscreen-notepad')) {
      setIcon(fsSvg, `
        <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      `);
      // Put focus directly on textarea
      notepad.focus();
    } else {
      setIcon(fsSvg, `
        <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      `);
    }
  });

  // Escape exits full screen notepad
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && notepadCard.classList.contains('fullscreen-notepad')) {
      notepadCard.classList.remove('fullscreen-notepad');
      const fsSvg = fullScreenBtn.querySelector('svg');
      setIcon(fsSvg, `
        <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      `);
    }
  });
}

// ==========================================================================
// 3. Task Checklist Widget
// ==========================================================================
async function initChecklist() {
  const form = document.getElementById('addTaskForm');
  const input = document.getElementById('taskInput');
  const list = document.getElementById('taskList');
  const clearCompletedBtn = document.getElementById('clearCompletedTasksBtn');

  let tasks = [];

  // Load from storage
  const savedTasks = await focusStorage.get('soundscape_checklist_tasks');
  if (savedTasks) {
    tasks = savedTasks;
    renderTasks();
  }

  // Form submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const taskText = input.value.trim();
    if (taskText === '') return;

    const newTask = {
      id: Date.now().toString(),
      text: taskText,
      completed: false
    };

    tasks.push(newTask);
    await saveTasks();
    renderTasks();
    input.value = '';

    // Play double key clack on addition
    if (window.audioEngine) {
      window.audioEngine.synthesizeKeyboardClick();
      setTimeout(() => window.audioEngine.synthesizeKeyboardClick(), 70);
    }
  });

  // Render task list using safe DOM creation
  function renderTasks() {
    list.innerHTML = '';
    
    if (tasks.length === 0) {
      const emptyLi = document.createElement('li');
      emptyLi.className = 'task-item';
      emptyLi.style.border = 'none';
      emptyLi.style.justifyContent = 'center';
      emptyLi.style.color = 'var(--color-text-darker)';
      emptyLi.style.fontSize = '12px';
      emptyLi.style.opacity = '0.6';
      emptyLi.textContent = 'No focus quests added for today';
      list.appendChild(emptyLi);
      return;
    }

    tasks.forEach(task => {
      const li = createTaskElement(task);

      // Attach listeners (same pattern as before)
      const checkbox = li.querySelector('input');
      checkbox.addEventListener('change', () => toggleTaskCompletion(task.id, checkbox.checked));

      const deleteBtn = li.querySelector('.delete-task-btn');
      deleteBtn.addEventListener('click', () => deleteTask(task.id));

      list.appendChild(li);
    });
  }

  async function toggleTaskCompletion(id, completed) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    task.completed = completed;
    await saveTasks();
    renderTasks();

    // Satisfying sound effects!
    if (window.audioEngine) {
      if (completed) {
        // High frequency double chime on check!
        window.audioEngine.synthesizeKeyboardClick();
        setTimeout(() => {
          const osc = window.audioEngine.ctx.createOscillator();
          const gain = window.audioEngine.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(880, window.audioEngine.ctx.currentTime); // A5 note
          gain.gain.setValueAtTime(0.05, window.audioEngine.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, window.audioEngine.ctx.currentTime + 0.15);
          osc.connect(gain);
          gain.connect(window.audioEngine.masterGain);
          osc.start(0);
          osc.stop(window.audioEngine.ctx.currentTime + 0.2);
        }, 50);
      } else {
        window.audioEngine.synthesizeKeyboardClick();
      }
    }
  }

  async function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    await saveTasks();
    renderTasks();

    if (window.audioEngine) {
      window.audioEngine.synthesizeKeyboardClick();
    }
  }

  clearCompletedBtn.addEventListener('click', async () => {
    const hasCompleted = tasks.some(t => t.completed);
    if (!hasCompleted) return;

    tasks = tasks.filter(t => !t.completed);
    await saveTasks();
    renderTasks();

    if (window.audioEngine) {
      window.audioEngine.synthesizeKeyboardClick();
    }
  });

  async function saveTasks() {
    await focusStorage.set('soundscape_checklist_tasks', tasks);
  }

  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

// ==========================================================================
// 4. Audio Mixer Controller Binding
// ==========================================================================
function initAudioMixer() {
  const masterVolumeSlider = document.getElementById('masterVolumeSlider');
  const masterVolumePct = document.getElementById('masterVolumePct');
  const stopAllAudioBtn = document.getElementById('stopAllAudioBtn');
  const activeSoundsCount = document.getElementById('activeSoundsCount');
  const soundCards = document.querySelectorAll('.sound-card');
  const visualizerCanvas = document.getElementById('audioVisualizer');
  const presetPills = document.querySelectorAll('.preset-pill');

  let activeCount = 0;

  // Master Volume Change
  masterVolumeSlider.addEventListener('input', (e) => {
    const value = e.target.value;
    masterVolumePct.textContent = `${value}%`;
    
    if (window.audioEngine) {
      window.audioEngine.setMasterVolume(value);
    }
  });

  // Sound Card control hookups
  soundCards.forEach(card => {
    const id = card.getAttribute('data-sound-id');
    const toggle = card.querySelector('.sound-toggle');
    const volumeSlider = card.querySelector('.sound-volume-slider');

    // Toggle on/off channel
    toggle.addEventListener('change', async (e) => {
      const checked = e.target.checked;
      
      if (checked) {
        // PRO Lock protection for synthesisers
        const pro = await isProUser();
        if (card.querySelector('.pro-badge') && !pro) {
          toggle.checked = false;
          openProUpgradeModal();
          return;
        }

        card.classList.add('active');
        volumeSlider.removeAttribute('disabled');
        activeCount++;
      } else {
        card.classList.remove('active');
        volumeSlider.setAttribute('disabled', 'true');
        activeCount = Math.max(0, activeCount - 1);
      }

      // Update counters & master triggers
      updateActiveSoundsIndicator();

      if (window.audioEngine) {
        window.audioEngine.toggleSound(id, checked);
        
        // Start or stop canvas visualizer accordingly
        if (activeCount > 0) {
          window.audioEngine.startVisualizer(visualizerCanvas);
        } else {
          window.audioEngine.stopVisualizer();
          clearVisualizerCanvas();
        }
      }
    });

    // Slider Volume change
    volumeSlider.addEventListener('input', (e) => {
      const value = e.target.value;
      if (window.audioEngine) {
        window.audioEngine.setChannelVolume(id, value);
      }
    });
  });

  // Lofi playlist manager UI hooks
  const lofiSkipBtn = document.getElementById('lofiSkipBtn');
  if (lofiSkipBtn) {
    lofiSkipBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (window.audioEngine) {
        window.audioEngine.skipLofiTrack();
      }
    });
  }

  window.addEventListener('lofi-track-changed', (e) => {
    const { title, isPlaying } = e.detail;
    const lofiTitleEl = document.getElementById('lofiTrackTitle');
    const skipBtn = document.getElementById('lofiSkipBtn');
    
    if (lofiTitleEl) {
      lofiTitleEl.textContent = title;
      lofiTitleEl.title = `Now Playing: ${title}`;
    }
    
    if (skipBtn) {
      skipBtn.style.display = isPlaying ? 'inline-flex' : 'none';
    }
  });

  // Global stop trigger
  stopAllAudioBtn.addEventListener('click', () => {
    if (window.audioEngine) {
      window.audioEngine.stopAllChannels();
    }

    soundCards.forEach(card => {
      card.classList.remove('active');
      card.querySelector('.sound-toggle').checked = false;
      card.querySelector('.sound-volume-slider').setAttribute('disabled', 'true');
    });

    presetPills.forEach(pill => pill.classList.remove('active'));

    activeCount = 0;
    updateActiveSoundsIndicator();
    clearVisualizerCanvas();
  });

  // Presets activations
  presetPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const presetName = pill.getAttribute('data-preset');
      
      presetPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      applyAudioPreset(presetName);
    });
  });

  function updateActiveSoundsIndicator() {
    if (activeCount === 0) {
      activeSoundsCount.textContent = 'All sounds off';
      activeSoundsCount.style.color = 'var(--color-pink)';
      stopAllAudioBtn.setAttribute('disabled', 'true');
    } else {
      activeSoundsCount.textContent = `${activeCount} active channel${activeCount !== 1 ? 's' : ''}`;
      activeSoundsCount.style.color = 'var(--color-emerald)';
      stopAllAudioBtn.removeAttribute('disabled');
    }
  }

  function clearVisualizerCanvas() {
    if (visualizerCanvas) {
      const ctx = visualizerCanvas.getContext('2d');
      ctx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
    }
  }

  // Presets matrix configurations
  async function applyAudioPreset(preset) {
    // 1. Mute all active sounds first
    stopAllAudioBtn.click();
    
    // Safety check for UI trigger
    setTimeout(async () => {
      if (preset === 'clear') return;

      const mappings = {
        'focus': [
          { id: 'brownnoise', vol: 50 },
          { id: 'spacepad', vol: 35 }
        ],
        'rainy-cafe': [
          { id: 'rain', vol: 70 },
          { id: 'cafe', vol: 40 }
        ],
        'cosmic-sleep': [
          { id: 'spacepad', vol: 60 },
          { id: 'ocean', vol: 40 },
          { id: 'thunder', vol: 30 }
        ]
      };

      const presetData = mappings[preset];
      if (!presetData) return;

      // Check if any preset channel is PRO locked
      let isLocked = false;
      const pro = await isProUser();
      if (!pro) {
        isLocked = presetData.some(sound => {
          const card = document.querySelector(`.sound-card[data-sound-id="${sound.id}"]`);
          return card && card.querySelector('.pro-badge');
        });
      }

      if (isLocked) {
        presetPills.forEach(p => p.classList.remove('active'));
        openProUpgradeModal();
        return;
      }

      presetData.forEach(sound => {
        const card = document.querySelector(`.sound-card[data-sound-id="${sound.id}"]`);
        if (!card) return;

        const toggle = card.querySelector('.sound-toggle');
        const slider = card.querySelector('.sound-volume-slider');

        // Set controls on screen
        toggle.checked = true;
        card.classList.add('active');
        slider.removeAttribute('disabled');
        slider.value = sound.vol;
        activeCount++;

        // Trigger Audio Context
        if (window.audioEngine) {
          window.audioEngine.setChannelVolume(sound.id, sound.vol);
          window.audioEngine.toggleSound(sound.id, true);
        }
      });

      updateActiveSoundsIndicator();
      if (window.audioEngine && activeCount > 0) {
        window.audioEngine.startVisualizer(visualizerCanvas);
      }
    }, 400); // Wait for transition fade-outs
  }

  // Trigger keyboard stop all channels
  document.addEventListener('keydown', (e) => {
    if (e.altKey && e.code === 'KeyS') {
      stopAllAudioBtn.click();
    }
    if (e.altKey && e.code === 'KeyN') {
      document.getElementById('focusNotepad').focus();
    }
  });
}

// ==========================================================================
// 5. Workspace Theme Switcher
// ==========================================================================
async function initThemes() {
  const themeBtn = document.getElementById('themeBtn');
  const backdrop = document.getElementById('themeModalBackdrop');
  const closeBtn = document.getElementById('closeThemeModalBtn');
  const themeCards = document.querySelectorAll('.theme-option-card');

  // Load saved theme
  const savedTheme = await focusStorage.get('soundscape_workspace_theme');
  if (savedTheme) {
    applyThemeClass(savedTheme);
    themeCards.forEach(card => {
      if (card.getAttribute('data-theme') === savedTheme) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });
  }

  themeBtn.addEventListener('click', () => {
    backdrop.classList.add('active');
  });

  closeBtn.addEventListener('click', () => {
    backdrop.classList.remove('active');
  });

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) backdrop.classList.remove('active');
  });

  themeCards.forEach(card => {
    card.addEventListener('click', async () => {
      const theme = card.getAttribute('data-theme');
      
      themeCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');

      applyThemeClass(theme);
      await focusStorage.set('soundscape_workspace_theme', theme);
      
      setTimeout(() => backdrop.classList.remove('active'), 250);
    });
  });

  function applyThemeClass(theme) {
    // Strip body class list of themes
    document.body.classList.remove('theme-aurora', 'theme-cyberpunk', 'theme-forest', 'theme-midnight');
    
    // Dynamic overlay adjustments
    const existingStars = document.querySelector('.stars-overlay');
    if (existingStars) existingStars.remove();

    if (theme === 'aurora') {
      // Default styles apply
    } else {
      document.body.classList.add(`theme-${theme}`);
    }

    if (theme === 'midnight') {
      const stars = document.createElement('div');
      stars.className = 'stars-overlay';
      document.body.appendChild(stars);
    }
  }
}

// ==========================================================================
// 6. Zen Mode (Focus Isolation)
// ==========================================================================
function initZenMode() {
  const toggleUiBtn = document.getElementById('toggleUiBtn');
  const wrapper = document.getElementById('dashboardWrapper');

  toggleUiBtn.addEventListener('click', () => {
    wrapper.classList.toggle('zen-mode');
    
    const zenSvg = toggleUiBtn.querySelector('svg');
    if (wrapper.classList.contains('zen-mode')) {
      toggleUiBtn.querySelector('span').textContent = 'Reveal UI';
      setIcon(zenSvg, `
        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
        <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
        <line x1="2" y1="2" x2="22" y2="22"/>
      `);
    } else {
      toggleUiBtn.querySelector('span').textContent = 'Zen Mode';
      setIcon(zenSvg, `
        <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5Z" />
      `);
    }
  });

  // Hotkey Alt + Z to toggle Zen
  document.addEventListener('keydown', (e) => {
    if (e.altKey && e.code === 'KeyZ') {
      toggleUiBtn.click();
    }
  });
}

/// ==========================================================================
// 7. Monetization via Lemon Squeezy
// ==========================================================================

function initSaaSCheckout() {
  const unlockBtn = document.getElementById('unlockProBtn');
  const premiumModal = document.getElementById('premiumModal');
  const closePremiumModal = document.getElementById('closePremiumModal');
  const upgradeBtn = document.getElementById('upgradeBtn');
  const verifyLicenseBtn = document.getElementById('verifyLicenseBtn');
  const licenseKeyInput = document.getElementById('licenseKeyInput');
  const licenseMessage = document.getElementById('licenseMessage');

  // Add click listeners to open the modal
  if (unlockBtn) {
    unlockBtn.addEventListener('click', () => {
      openProUpgradeModal();
    });
  }

  // Intercept play buttons on premium sounds if not PRO
  document.querySelectorAll('.sound-card').forEach(card => {
    const isPremium = card.querySelector('.pro-badge');
    if (isPremium) {
      const toggle = card.querySelector('.toggle-sound');
      const volume = card.querySelector('.volume-slider');
      
      const intercept = async (e) => {
        const isPro = await isProUser();
        if (!isPro) {
          e.preventDefault();
          e.stopPropagation();
          openProUpgradeModal();
        }
      };

      if (toggle) toggle.addEventListener('click', intercept, true);
      if (volume) volume.addEventListener('mousedown', intercept, true);
    }
  });

  if (closePremiumModal && premiumModal) {
    closePremiumModal.addEventListener('click', () => {
      premiumModal.classList.remove('active');
      if (licenseMessage) licenseMessage.textContent = '';
    });
    premiumModal.addEventListener('click', (e) => {
      if (e.target === premiumModal) {
        premiumModal.classList.remove('active');
        if (licenseMessage) licenseMessage.textContent = '';
      }
    });
  }

  // Redirect to Lemon Squeezy Checkout
  if (upgradeBtn) {
    upgradeBtn.addEventListener('click', () => {
      window.open('https://soundscapestudio.lemonsqueezy.com/checkout/buy/e9d18e00-41a8-4850-a0dc-2d8d52a1dab6', '_blank');
    });
  }

  // License Key Validation
  if (verifyLicenseBtn && licenseKeyInput && licenseMessage) {
    verifyLicenseBtn.addEventListener('click', async () => {
      const key = licenseKeyInput.value.trim();
      if (!key) {
        licenseMessage.textContent = "Please enter a valid license key.";
        licenseMessage.className = "license-message error";
        return;
      }

      verifyLicenseBtn.disabled = true;
      verifyLicenseBtn.textContent = "Verifying...";
      licenseMessage.textContent = "";
      licenseMessage.className = "license-message";

      try {
        const response = await fetch('https://api.lemonsqueezy.com/v1/licenses/validate', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            license_key: key
          })
        });

        const data = await response.json();

        if (data.valid) {
          licenseMessage.textContent = "License activated successfully!";
          licenseMessage.className = "license-message success";
          
          await setProUser(true, key);
          
          setTimeout(() => {
            if (premiumModal) premiumModal.classList.remove('active');
            checkProStatus();
            
            // Non-blocking thank you
            const thanks = document.createElement('div');
            thanks.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#111;color:#0f0;padding:8px 16px;border-radius:6px;font-size:13px;z-index:9999;';
            thanks.textContent = 'Thank you for upgrading to SoundScape Premium!';
            document.body.appendChild(thanks);
            setTimeout(() => thanks.remove(), 2800);
          }, 1000);
        } else {
          licenseMessage.textContent = data.error || "Invalid or expired license key.";
          licenseMessage.className = "license-message error";
        }
      } catch (err) {
        console.error("License validation error:", err);
        licenseMessage.textContent = "Network error. Please try again later.";
        licenseMessage.className = "license-message error";
      } finally {
        verifyLicenseBtn.disabled = false;
        verifyLicenseBtn.textContent = "Verify";
      }
    });
  }
}

// Global functions for PRO checks
function openProUpgradeModal() {
  const modal = document.getElementById('premiumModal');
  if (modal) modal.classList.add('active');
}

/**
 * PRO status helpers — slightly hardened client-side only.
 * Still bypassable by determined users, but no longer trivial "just set a key to true".
 */
const PRO_STORAGE_KEY = 'ss_pro_v2';
const PRO_LICENSE_KEY = 'ss_lic_v2';

async function isProUser() {
  const data = await focusStorage.get(PRO_STORAGE_KEY);
  if (!data || typeof data !== 'object') return false;
  return data.activated === true && data.ts > 0;
}

async function setProUser(activated, licenseKey = null) {
  const payload = {
    activated: !!activated,
    ts: activated ? Date.now() : 0,
    v: 2
  };
  await focusStorage.set(PRO_STORAGE_KEY, payload);

  if (activated && licenseKey) {
    await focusStorage.set(PRO_LICENSE_KEY, licenseKey);
  }
}

async function checkProStatus() {
  const footerCallout = document.querySelector('.premium-callout');
  const unlockBtn = document.getElementById('unlockProBtn');

  const pro = await isProUser();
  if (pro) {
    // Strip "pro" locked visual boundaries
    document.querySelectorAll('.sound-card').forEach(card => {
      const badge = card.querySelector('.pro-badge');
      if (badge) {
        badge.textContent = 'PRO Active';
        badge.style.color = 'var(--color-emerald)';
        badge.style.background = 'rgba(107, 123, 107, 0.08)';
      }
    });

    if (footerCallout) {
      footerCallout.innerHTML = ''; // clear safely
      const strong = document.createElement('strong');
      strong.style.color = 'var(--color-emerald)';
      strong.textContent = 'PRO MODE';
      footerCallout.textContent = 'Running in ';
      footerCallout.appendChild(strong);
      footerCallout.appendChild(document.createTextNode('. Thank you for supporting our focus workspace.'));
    }
    
    if (unlockBtn) {
      unlockBtn.innerHTML = `
        <svg class="icon" viewBox="0 24 24" fill="currentColor" style="color:var(--color-emerald)">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span style="color:var(--color-emerald);font-weight:700;">PRO Unlocked</span>
      `;
      unlockBtn.style.background = 'rgba(107, 123, 107, 0.1)';
      unlockBtn.style.borderColor = 'var(--color-emerald)';
      unlockBtn.style.boxShadow = 'none';
      unlockBtn.onclick = (e) => {
        e.stopPropagation();
        // Replaced alert with non-blocking message
        const msg = document.createElement('div');
        msg.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#111;color:#0f0;padding:8px 16px;border-radius:6px;font-size:13px;z-index:9999;';
        msg.textContent = 'PRO status active. All synthesizers unlocked.';
        document.body.appendChild(msg);
        setTimeout(() => msg.remove(), 2600);
      };
    }
  }
}
