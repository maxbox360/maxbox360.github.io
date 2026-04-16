// Mega Man II Style Intro Animation
(function() {
  const INTRO_SHOWN_KEY = 'introShown';

  // Check if intro should be shown
  function shouldShowIntro() {
    return !localStorage.getItem(INTRO_SHOWN_KEY);
  }

  // Mark intro as shown
  function markIntroShown() {
    localStorage.setItem(INTRO_SHOWN_KEY, 'true');
  }

  // Create and run the intro
  function createIntro() {
    const overlay = document.createElement('div');
    overlay.id = 'intro-overlay';

    // Show "Press Start" screen first to get user interaction
    overlay.innerHTML = `
      <div id="press-start-screen">
        <p class="intro-text visible" style="position: static; transform: none;">PRESS START</p>
      </div>
    `;

    document.body.prepend(overlay);

    const pressStartScreen = document.getElementById('press-start-screen');

    // Wait for user click to start (bypasses autoplay restrictions)
    pressStartScreen.addEventListener('click', () => {
      startIntroAnimation(overlay);
    });

    // Also allow keyboard
    document.addEventListener('keydown', function onKeyPress(e) {
      if (e.code === 'Enter' || e.code === 'Space') {
        document.removeEventListener('keydown', onKeyPress);
        startIntroAnimation(overlay);
      }
    });
  }

  function startIntroAnimation(overlay) {
    overlay.innerHTML = `
      <canvas id="intro-canvas"></canvas>
      <div id="intro-text" class="intro-text"></div>
      <button id="skip-intro">PRESS START TO SKIP</button>
      <button id="mute-intro">🔊</button>
    `;

    const canvas = document.getElementById('intro-canvas');
    const ctx = canvas.getContext('2d');
    const textEl = document.getElementById('intro-text');
    const skipBtn = document.getElementById('skip-intro');
    const muteBtn = document.getElementById('mute-intro');

    // Audio setup
    const openingAudio = new Audio('media/audio/opening.mp3');
    const titleAudio = new Audio('media/audio/title_screen.mp3');
    openingAudio.volume = 0.5;
    titleAudio.volume = 0.5;

    let audioMuted = false;

    // Try to play opening audio (may be blocked by browser autoplay policy)
    openingAudio.play().catch(() => {
      console.log('Audio autoplay blocked - click anywhere to start music');
    });

    // Mute toggle
    muteBtn.addEventListener('click', () => {
      audioMuted = !audioMuted;
      openingAudio.muted = audioMuted;
      titleAudio.muted = audioMuted;
      muteBtn.textContent = audioMuted ? '🔇' : '🔊';
    });

    // Set canvas size
    canvas.width = 512;
    canvas.height = 480;

    // Colors (NES palette inspired)
    const colors = {
      sky: '#0f0f23',
      skyGradient: '#1a1a3e',
      building: '#2d2d44',
      buildingLight: '#4a4a6a',
      buildingDark: '#1a1a2e',
      window: '#ffeb3b',
      windowOff: '#333',
      ground: '#1a1a2e',
      accent: '#00bcd4'
    };

    // Story text sequence
    const storyTexts = [
      "In the year 20XX...",
      "A developer emerged\nfrom the Ozarks",
      "Armed with Python and Django\nhe builds backends\nthat power the future",
      "From the halls of\nthe University of Arkansas",
      "To the digital frontiers\nof enterprise security",
      "This is his story..."
    ];

    // Animation state
    let scrollY = 0;
    let currentTextIndex = 0;
    let textTimer = 0;
    let phase = 'wait'; // 'wait', 'scroll', 'reveal', 'done'
    let stars = [];
    let buildings = [];
    let mountains = [];
    let animationFrame;
    let startTime = null;

    // Timing: Wait 26 seconds, then scroll for 15 seconds (41 - 26 = 15)
    const waitDuration = 26000; // 26 seconds in ms
    const scrollDuration = 15000; // 15 seconds of scrolling
    const maxScroll = 900;

    // Generate stars
    for (let i = 0; i < 50; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.4,
        size: Math.random() > 0.7 ? 2 : 1,
        twinkle: Math.random() * Math.PI * 2
      });
    }

    // Generate mountains (Ozark hills) - rounded, rolling hills
    mountains.push({ x: -40, width: 250, height: 60, color: '#252540' });
    mountains.push({ x: 120, width: 300, height: 80, color: '#222238' });
    mountains.push({ x: 350, width: 220, height: 55, color: '#252540' });
    mountains.push({ x: 30, width: 200, height: 45, color: '#2a2a48' });
    mountains.push({ x: 220, width: 280, height: 70, color: '#202035' });
    mountains.push({ x: 450, width: 180, height: 50, color: '#2a2a48' });

    // Generate buildings at various distances and sizes (Ozark town feel)
    // Far background buildings (small, distant - bunched together like a city)
    const farBuildings = [
      // City cluster left
      { x: 10, width: 12, height: 28, depth: 0.08, elevation: 175 },
      { x: 20, width: 15, height: 35, depth: 0.07, elevation: 180 },
      { x: 32, width: 10, height: 25, depth: 0.09, elevation: 172 },
      { x: 40, width: 18, height: 40, depth: 0.08, elevation: 185 },
      { x: 55, width: 12, height: 30, depth: 0.07, elevation: 178 },
      { x: 65, width: 14, height: 32, depth: 0.09, elevation: 182 },
      { x: 77, width: 10, height: 22, depth: 0.08, elevation: 170 },
      { x: 85, width: 16, height: 38, depth: 0.07, elevation: 188 },
      // City cluster center
      { x: 120, width: 14, height: 32, depth: 0.08, elevation: 180 },
      { x: 132, width: 18, height: 42, depth: 0.07, elevation: 190 },
      { x: 148, width: 12, height: 28, depth: 0.09, elevation: 175 },
      { x: 158, width: 20, height: 45, depth: 0.08, elevation: 195 },
      { x: 175, width: 14, height: 30, depth: 0.07, elevation: 178 },
      { x: 187, width: 16, height: 36, depth: 0.09, elevation: 185 },
      { x: 200, width: 12, height: 26, depth: 0.08, elevation: 172 },
      { x: 210, width: 18, height: 40, depth: 0.07, elevation: 188 },
      { x: 225, width: 14, height: 34, depth: 0.08, elevation: 182 },
      // City cluster right
      { x: 280, width: 16, height: 38, depth: 0.08, elevation: 185 },
      { x: 294, width: 12, height: 28, depth: 0.07, elevation: 178 },
      { x: 304, width: 20, height: 44, depth: 0.09, elevation: 192 },
      { x: 322, width: 14, height: 32, depth: 0.08, elevation: 180 },
      { x: 334, width: 10, height: 24, depth: 0.07, elevation: 170 },
      { x: 342, width: 16, height: 36, depth: 0.09, elevation: 186 },
      { x: 356, width: 12, height: 30, depth: 0.08, elevation: 175 },
      // Scattered outliers
      { x: 400, width: 14, height: 28, depth: 0.07, elevation: 165 },
      { x: 440, width: 18, height: 35, depth: 0.08, elevation: 170 },
      { x: 475, width: 12, height: 25, depth: 0.09, elevation: 160 }
    ];

    // Mid-ground buildings (houses, small businesses - on hillsides)
    const midBuildings = [
      { x: -25, width: 35, height: 60, depth: 0.15, elevation: 100 },
      { x: 15, width: 28, height: 48, depth: 0.18, elevation: 85 },
      { x: 50, width: 32, height: 55, depth: 0.16, elevation: 95 },
      { x: 90, width: 40, height: 70, depth: 0.14, elevation: 110 },
      { x: 135, width: 30, height: 52, depth: 0.17, elevation: 88 },
      { x: 170, width: 36, height: 62, depth: 0.15, elevation: 102 },
      { x: 210, width: 28, height: 45, depth: 0.18, elevation: 80 },
      { x: 245, width: 42, height: 75, depth: 0.14, elevation: 115 },
      { x: 290, width: 32, height: 58, depth: 0.16, elevation: 92 },
      { x: 330, width: 38, height: 65, depth: 0.15, elevation: 105 },
      { x: 375, width: 30, height: 50, depth: 0.17, elevation: 85 },
      { x: 410, width: 35, height: 60, depth: 0.14, elevation: 98 },
      { x: 450, width: 40, height: 68, depth: 0.16, elevation: 108 },
      { x: 495, width: 32, height: 55, depth: 0.18, elevation: 82 }
    ];

    // Foreground buildings (closer, taller downtown buildings - at ground level)
    const nearBuildings = [
      { x: -30, width: 50, height: 140, depth: 0.25, elevation: 0 },
      { x: 45, width: 42, height: 110, depth: 0.28, elevation: 0 },
      { x: 110, width: 55, height: 170, depth: 0.24, elevation: 0 },
      { x: 185, width: 48, height: 130, depth: 0.27, elevation: 0 },
      { x: 255, width: 60, height: 160, depth: 0.25, elevation: 0 }
    ];

    // Combine all building configs
    const allBuildingConfigs = [
      ...farBuildings.map(b => ({ ...b, layer: 'far' })),
      ...midBuildings.map(b => ({ ...b, layer: 'mid' })),
      ...nearBuildings.map(b => ({ ...b, layer: 'near' }))
    ];

    for (let i = 0; i < allBuildingConfigs.length; i++) {
      const config = allBuildingConfigs[i];
      const windowRows = Math.floor(config.height / (config.layer === 'far' ? 8 : config.layer === 'mid' ? 12 : 18));
      const windowCols = Math.floor((config.width - 6) / (config.layer === 'far' ? 5 : config.layer === 'mid' ? 8 : 11));
      const windowStates = [];

      // Pre-generate which windows are lit
      for (let r = 0; r < windowRows; r++) {
        windowStates[r] = [];
        for (let c = 0; c < windowCols; c++) {
          windowStates[r][c] = Math.random() > 0.3;
        }
      }

      buildings.push({
        x: config.x,
        width: config.width,
        height: config.height,
        depth: config.depth,
        elevation: config.elevation || 0,
        layer: config.layer,
        windowCols: windowCols,
        windowStates: windowStates
      });
    }

    // Sort buildings by depth so far ones render first (painter's algorithm)
    buildings.sort((a, b) => a.depth - b.depth);

    // Pre-generate foreground building window states
    const fgWindowStates = [];
    for (let row = 0; row < 40; row++) {
      fgWindowStates[row] = [];
      for (let col = 0; col < 8; col++) {
        fgWindowStates[row][col] = Math.random() > 0.4;
      }
    }

    // Draw pixel art character (Mega Man style)
    function drawCharacter(x, y, scale = 2) {
      const sprite = [
        "   1111   ",
        "  111111  ",
        " 11111111 ",
        " 11222211 ",
        " 12222221 ",
        " 12233221 ",
        " 12222221 ",
        " 11222211 ",
        "  111111  ",
        "   3333   ",
        "  333333  ",
        " 33333333 ",
        " 33344333 ",
        " 33344333 ",
        " 33344333 ",
        "  33  33  ",
        "  33  33  ",
        "  44  44  ",
        " 444  444 "
      ];

      const palette = {
        '1': '#00bcd4', // Cyan (helmet)
        '2': '#ffcc99', // Skin
        '3': '#0097a7', // Dark cyan (body)
        '4': '#004d40'  // Boots
      };

      sprite.forEach((row, rowIdx) => {
        [...row].forEach((pixel, colIdx) => {
          if (pixel !== ' ') {
            ctx.fillStyle = palette[pixel];
            ctx.fillRect(
              x + colIdx * scale,
              y + rowIdx * scale,
              scale,
              scale
            );
          }
        });
      });
    }

    // Draw Mega Man style text (big, bold, colorful)
    function drawMegaManText(text, x, y) {
      const fontSize = 48;

      // Draw shadow/outline first (gives depth like Mega Man titles)
      ctx.font = `bold ${fontSize}px "Press Start 2P", monospace`;
      ctx.fillStyle = '#000080'; // Dark blue shadow
      ctx.fillText(text, x + 3, y + 3);

      // Draw main gradient text
      const gradient = ctx.createLinearGradient(x, y - fontSize, x, y);
      gradient.addColorStop(0, '#00ffff'); // Cyan top
      gradient.addColorStop(0.5, '#ffffff'); // White middle
      gradient.addColorStop(1, '#00bfff'); // Light blue bottom

      ctx.fillStyle = gradient;
      ctx.fillText(text, x, y);

      // Draw highlight on top edge
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillText(text, x + 1, y - 1);
    }

    // Draw a building
    function drawBuilding(b, offsetY) {
      // Elevation positions buildings higher up in the hills
      // Higher elevation = starts higher up (below horizon), revealed as we scroll
      const elevationOffset = b.elevation || 0;
      const baseY = canvas.height - b.height - elevationOffset + offsetY * b.depth;

      // Skip if building is completely below canvas (not visible yet)
      if (baseY > canvas.height) return;

      // Skip if building is completely above canvas
      if (baseY + b.height < 0) return;

      // Main building
      ctx.fillStyle = b.layer === 'far' ? '#1f1f35' : b.layer === 'mid' ? '#252540' : colors.building;
      ctx.fillRect(b.x, baseY, b.width, b.height);

      // Building edge highlight (skip for far buildings - too small)
      if (b.layer !== 'far') {
        ctx.fillStyle = colors.buildingLight;
        ctx.fillRect(b.x, baseY, b.layer === 'mid' ? 2 : 3, b.height);

        // Building edge shadow
        ctx.fillStyle = colors.buildingDark;
        ctx.fillRect(b.x + b.width - (b.layer === 'mid' ? 2 : 3), baseY, b.layer === 'mid' ? 2 : 3, b.height);
      }

      // Windows (using pre-generated states - no flickering)
      const windowSize = b.layer === 'far' ? 2 : b.layer === 'mid' ? 3 : 5;
      const windowGap = b.layer === 'far' ? 5 : b.layer === 'mid' ? 8 : 10;

      for (let row = 0; row < b.windowStates.length; row++) {
        for (let col = 0; col < b.windowCols; col++) {
          if (b.windowStates[row] && b.windowStates[row][col] !== undefined) {
            const wx = b.x + 3 + col * windowGap;
            const wy = baseY + 4 + row * windowGap;

            // Only draw if window is within building bounds and visible on screen
            if (wx + windowSize < b.x + b.width - 2 && wy > baseY && wy > 0 && wy + windowSize < baseY + b.height - 2) {
              ctx.fillStyle = b.windowStates[row][col] ? colors.window : colors.windowOff;
              ctx.fillRect(wx, wy, windowSize, windowSize);
            }
          }
        }
      }
    }

    // Draw mountains (Ozark hills) - rounded with gentle peaks
    function drawMountains(offsetY) {
      const horizonY = canvas.height * 0.5; // Horizon line
      mountains.forEach(m => {
        ctx.fillStyle = m.color;
        ctx.beginPath();

        // Draw hill with gentle peak using bezier curves
        const startX = m.x;
        const endX = m.x + m.width;
        const peakX = startX + m.width * 0.5;
        const peakY = horizonY - m.height + offsetY * 0.03;
        const baseY = horizonY + offsetY * 0.03;

        ctx.moveTo(startX, baseY);
        // Left slope - curves up to a gentle point
        ctx.bezierCurveTo(
          startX + m.width * 0.15, baseY,           // control point 1 (near base)
          startX + m.width * 0.35, peakY + m.height * 0.2,  // control point 2 (curves toward peak)
          peakX, peakY                               // end at peak
        );
        // Right slope - curves down from the gentle point
        ctx.bezierCurveTo(
          startX + m.width * 0.65, peakY + m.height * 0.2,  // control point 1 (curves from peak)
          endX - m.width * 0.15, baseY,             // control point 2 (near base)
          endX, baseY                                // end at base
        );
        ctx.closePath();
        ctx.fill();
      });
    }

    // Draw foreground building (main focus - takes up 1/3 of screen)
    function drawForegroundBuilding(offsetY) {
      const buildingWidth = Math.floor(canvas.width / 3); // 1/3 of screen width
      const buildingHeight = 1200;
      const x = canvas.width - buildingWidth - 10;
      const baseY = canvas.height - buildingHeight + offsetY;

      // Main structure
      ctx.fillStyle = colors.buildingDark;
      ctx.fillRect(x, baseY, buildingWidth, buildingHeight);

      // Left edge highlight
      ctx.fillStyle = colors.building;
      ctx.fillRect(x, baseY, 10, buildingHeight);

      // Windows grid (using pre-generated states - no flickering)
      const windowSize = 12;
      const windowGap = 24;

      for (let row = 0; row < fgWindowStates.length; row++) {
        for (let col = 0; col < fgWindowStates[row].length; col++) {
          const wx = x + 20 + col * windowGap;
          const wy = baseY + 30 + row * windowGap;

          if (wy > 0 && wy < canvas.height) {
            ctx.fillStyle = fgWindowStates[row][col] ? colors.window : colors.windowOff;
            ctx.fillRect(wx, wy, windowSize, windowSize);
          }
        }
      }

      // Rooftop details
      if (baseY < canvas.height) {
        ctx.fillStyle = colors.accent;
        ctx.fillRect(x + buildingWidth/2 - 20, baseY - 40, 40, 40);
        ctx.fillRect(x + buildingWidth/2 - 10, baseY - 70, 20, 30);
      }
    }

    // Main render loop
    function render(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      // Clear canvas
      ctx.fillStyle = colors.sky;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw gradient sky
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.6);
      gradient.addColorStop(0, colors.sky);
      gradient.addColorStop(1, colors.skyGradient);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height * 0.6);

      // Draw stars
      stars.forEach(star => {
        star.twinkle += 0.05;
        const alpha = 0.5 + Math.sin(star.twinkle) * 0.5;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fillRect(star.x, star.y, star.size, star.size);
      });

      // Draw mountains in background
      drawMountains(scrollY);

      // Draw background buildings (each with its own depth)
      buildings.forEach(b => drawBuilding(b, scrollY));

      // Draw foreground building
      drawForegroundBuilding(scrollY);

      // Always draw character on rooftop (visible during scroll and reveal)
      const buildingWidth = Math.floor(canvas.width / 3);
      const buildingHeight = 1200;
      const buildingX = canvas.width - buildingWidth - 10;
      const rooftopY = canvas.height - buildingHeight + scrollY - 38; // Feet touching roof
      const characterX = buildingX + 5; // Very left edge of building

      // Only draw if rooftop is visible on screen
      if (rooftopY > -50 && rooftopY < canvas.height) {
        drawCharacter(characterX, rooftopY, 2);
      }

      // Ground
      ctx.fillStyle = colors.ground;
      ctx.fillRect(0, canvas.height - 20, canvas.width, 20);

      // Animation phases
      if (phase === 'wait') {
        // Show story text during wait phase
        const waitProgress = elapsed / waitDuration;
        const textIndex = Math.floor(waitProgress * storyTexts.length);

        if (textIndex !== currentTextIndex && textIndex < storyTexts.length) {
          currentTextIndex = textIndex;
          textEl.classList.remove('visible');
          setTimeout(() => {
            textEl.textContent = storyTexts[currentTextIndex];
            textEl.classList.add('visible');
          }, 300);
        }

        // After 26 seconds, start scrolling
        if (elapsed >= waitDuration) {
          phase = 'scroll';
          textEl.classList.remove('visible');
        }
      } else if (phase === 'scroll') {
        const scrollElapsed = elapsed - waitDuration;
        const scrollProgress = scrollElapsed / scrollDuration;
        scrollY = scrollProgress * maxScroll;

        if (scrollElapsed >= scrollDuration) {
          // Stop opening music, start title music
          openingAudio.pause();
          titleAudio.play().catch(() => {});

          phase = 'reveal';
          textTimer = timestamp;
          textEl.classList.remove('visible');
          scrollY = maxScroll;
        }
      } else if (phase === 'reveal') {

        // Draw "MAX SANDERLIN" in big Mega Man style letters on the left
        drawMegaManText("MAX", 30, canvas.height / 2 - 60);
        drawMegaManText("SANDERLIN", 30, canvas.height / 2 + 20);

        // Hide the regular text element since we're drawing on canvas
        textEl.classList.remove('visible');

        const elapsed = timestamp - textTimer;
        if (elapsed > 43000) { // Hold for 43 seconds (duration of title_screen.mp3)
          phase = 'done';
          endIntro();
          return;
        }
      }

      animationFrame = requestAnimationFrame(render);
    }

    // End intro and show main content
    function endIntro() {
      cancelAnimationFrame(animationFrame);
      markIntroShown();

      // Fade out audio
      const fadeAudio = setInterval(() => {
        if (openingAudio.volume > 0.1) openingAudio.volume -= 0.1;
        if (titleAudio.volume > 0.1) titleAudio.volume -= 0.1;

        if (openingAudio.volume <= 0.1 && titleAudio.volume <= 0.1) {
          openingAudio.pause();
          titleAudio.pause();
          clearInterval(fadeAudio);
        }
      }, 100);

      overlay.style.transition = 'opacity 1s ease-out';
      overlay.style.opacity = '0';

      setTimeout(() => {
        overlay.classList.add('hidden');
        overlay.remove();
      }, 1000);
    }

    // Skip button
    skipBtn.addEventListener('click', endIntro);

    // Start animation
    animationFrame = requestAnimationFrame(render);
  }

  // Replay intro function (exposed globally)
  window.replayIntro = function() {
    localStorage.removeItem(INTRO_SHOWN_KEY);
    location.reload();
  };

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', function() {
    // Load the font first
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);

    if (shouldShowIntro()) {
      // Small delay to ensure font is loaded
      setTimeout(createIntro, 100);
    }
  });
})();




