/* ==========================================================================
   SoundScape Studio - Pomodoro Focus Session Controller
   Manages session timers, SVG progress, state changes, and synthesised chime notifications.
   ========================================================================== */

/** Single controlled place for icon swaps in this file */
function setIcon(element, svgMarkup) {
  if (element) element.innerHTML = svgMarkup;
}

class SoundScapeTimer {
  constructor() {
    // Mode durations in seconds
    this.durations = {
      focus: 25 * 60,
      short: 5 * 60,
      long: 15 * 60
    };

    this.currentMode = 'focus'; // 'focus', 'short', 'long'
    this.timeRemaining = this.durations.focus;
    this.totalDuration = this.durations.focus;
    this.isRunning = false;
    this.timerId = null;
    
    // Streak stats
    this.completedSessions = 0;

    // Circle circumference (2 * PI * r = 2 * PI * 90 = 565.48)
    this.circleCircumference = 565.48;

    // DOM bindings
    this.displayElement = null;
    this.stateLabelElement = null;
    this.circleElement = null;
    this.playPauseBtn = null;
    this.resetBtn = null;
    this.sessionsCounterElement = null;
    this.modeTabs = [];
  }

  // --- Initialize Timer Elements ---
  init() {
    this.displayElement = document.getElementById('timerDisplay');
    this.stateLabelElement = document.getElementById('timerStateLabel');
    this.circleElement = document.getElementById('timerProgressCircle');
    this.playPauseBtn = document.getElementById('timerPlayPauseBtn');
    this.resetBtn = document.getElementById('timerResetBtn');
    this.sessionsCounterElement = document.getElementById('completedSessions');
    this.modeTabs = document.querySelectorAll('.mode-tab');

    // Register event listeners
    this.playPauseBtn.addEventListener('click', () => this.toggle());
    this.resetBtn.addEventListener('click', () => this.reset());

    this.modeTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const mode = e.target.getAttribute('data-mode');
        this.switchMode(mode);
      });
    });

    // Keyboard Shortcuts Listener
    document.addEventListener('keydown', (e) => {
      // 1. Space to Play/Pause (disabled if typing in inputs/notepad)
      if (e.code === 'Space') {
        const activeEl = document.activeElement;
        if (activeEl.tagName !== 'TEXTAREA' && activeEl.tagName !== 'INPUT') {
          e.preventDefault();
          this.toggle();
        }
      }
    });

    // Initial renders
    this.loadCompletedSessions();
    this.reset();
  }

  // --- Timer Actions ---
  toggle() {
    if (this.isRunning) {
      this.pause();
    } else {
      this.start();
    }
  }

  start() {
    if (this.isRunning) return;

    // Request audio engines to initialize (safely unlocks AudioContext on touch/click)
    if (window.audioEngine) {
      window.audioEngine.init();
    }

    this.isRunning = true;
    this.timerId = setInterval(() => this.tick(), 1000);
    
    // Update play button visual state
    this.playPauseBtn.classList.remove('btn-primary');
    this.playPauseBtn.classList.add('btn-secondary');
    this.playPauseBtn.querySelector('span').textContent = 'Pause';
    setIcon(this.playPauseBtn.querySelector('svg'), `
      <rect x="6" y="4" width="4" height="16" fill="currentColor"/>
      <rect x="14" y="4" width="4" height="16" fill="currentColor"/>
    `);
    
    // Set active neon state
    document.getElementById('timerCard').classList.add('timer-running');
    this.stateLabelElement.textContent = this.currentMode === 'focus' ? 'FLOW TIME' : 'REST TIME';
  }

  pause() {
    if (!this.isRunning) return;

    this.isRunning = false;
    clearInterval(this.timerId);
    
    // Update play button visual state
    this.playPauseBtn.classList.remove('btn-secondary');
    this.playPauseBtn.classList.add('btn-primary');
    this.playPauseBtn.querySelector('span').textContent = 'Resume';
    setIcon(this.playPauseBtn.querySelector('svg'), `
      <polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/>
    `);

    document.getElementById('timerCard').classList.remove('timer-running');
    this.stateLabelElement.textContent = 'PAUSED';
  }

  reset() {
    this.pause();
    this.timeRemaining = this.durations[this.currentMode];
    this.totalDuration = this.durations[this.currentMode];
    
    // Reset play button back to "Start"
    this.playPauseBtn.querySelector('span').textContent = 'Start';
    setIcon(this.playPauseBtn.querySelector('svg'), `
      <polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/>
    `);

    this.stateLabelElement.textContent = this.currentMode === 'focus' ? 'GET READY' : 'TAKE BREATH';
    this.updateDisplay();
    this.updateProgressCircle();
  }

  tick() {
    if (this.timeRemaining <= 0) {
      this.completeSession();
      return;
    }

    this.timeRemaining--;
    this.updateDisplay();
    this.updateProgressCircle();
  }

  // --- Switch Timer Intervals ---
  switchMode(mode) {
    if (!this.durations[mode]) return;

    this.currentMode = mode;
    
    // Update Active Tab styles
    this.modeTabs.forEach(tab => {
      if (tab.getAttribute('data-mode') === mode) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    this.reset();
  }

  // --- Complete & Auto-advance ---
  completeSession() {
    this.pause();
    
    // Trigger gorgeous synthesized arpeggiated chime!
    if (window.audioEngine) {
      window.audioEngine.synthesizeTimerChime();
    }

    // Spawn a particle splash on screen (CSS effect)
    this.triggerCompletedVfx();

    if (this.currentMode === 'focus') {
      this.completedSessions++;
      this.saveCompletedSessions();
      this.sessionsCounterElement.textContent = `Sessions: ${this.completedSessions}`;
      
      // Auto-advance: Switch to Short Break or Long Break
      const isLongBreakDue = this.completedSessions % 4 === 0;
      const nextMode = isLongBreakDue ? 'long' : 'short';
      const breakLabel = nextMode === 'long' ? '15 min long' : '5 min short';
      
      setTimeout(() => {
        this.showSessionNotification(`Focus session complete. Time for a ${breakLabel} break.`);
        this.switchMode(nextMode);
      }, 600);
    } else {
      // Break completed, switch back to focus
      setTimeout(() => {
        this.showSessionNotification('Break over. Ready to focus again?');
        this.switchMode('focus');
      }, 600);
    }
  }

  // Non-blocking, nice in-page notification (replaces alert())
  showSessionNotification(message) {
    const timerCard = document.getElementById('timerCard');
    if (!timerCard) {
      // Fallback (shouldn't happen)
      console.log(message);
      return;
    }

    // Remove any existing notification
    const existing = timerCard.querySelector('.session-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'session-toast';
    toast.style.cssText = `
      position: absolute;
      bottom: 12px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.85);
      color: #fff;
      padding: 10px 16px;
      border-radius: 8px;
      font-size: 13px;
      white-space: nowrap;
      z-index: 100;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      border: 1px solid rgba(255,255,255,0.1);
    `;
    toast.textContent = message;

    // Make timer card a positioning context if it isn't already
    if (getComputedStyle(timerCard).position === 'static') {
      timerCard.style.position = 'relative';
    }

    timerCard.appendChild(toast);

    // Auto dismiss
    setTimeout(() => {
      if (toast && toast.parentNode) toast.parentNode.removeChild(toast);
    }, 4200);
  }

  // --- UI Renders & Dash Offset Calculations ---
  updateDisplay() {
    const mins = Math.floor(this.timeRemaining / 60);
    const secs = this.timeRemaining % 60;
    
    const formattedTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    this.displayElement.textContent = formattedTime;

    // Update document title dynamically to show focus remaining!
    document.title = `(${formattedTime}) SoundScape Studio`;
  }

  updateProgressCircle() {
    if (!this.circleElement) return;

    const progressFraction = this.timeRemaining / this.totalDuration;
    // Calculate new offset: as fraction drops from 1 to 0, offset rises from 0 to 565.48
    const offset = this.circleCircumference - (progressFraction * this.circleCircumference);
    
    this.circleElement.style.strokeDashoffset = offset;
  }

  // --- Streak Storage ---
  async saveCompletedSessions() {
    await focusStorage.set('soundscape_completed_sessions', this.completedSessions);
  }

  async loadCompletedSessions() {
    const saved = await focusStorage.get('soundscape_completed_sessions');
    if (saved) {
      this.completedSessions = parseInt(saved, 10);
      this.sessionsCounterElement.textContent = `Sessions: ${this.completedSessions}`;
    }
  }

  // --- Visual celebratory shockwave ---
  triggerCompletedVfx() {
    const timerCard = document.getElementById('timerCard');
    timerCard.classList.add('session-completed-flash');
    
    setTimeout(() => {
      timerCard.classList.remove('session-completed-flash');
    }, 1500);
  }
}

// Export single instance
window.timerInstance = new SoundScapeTimer();
