import React, { useEffect, useRef } from 'react';

export const NetworkBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initStars();
    };
    window.addEventListener('resize', handleResize);

    // Mouse state for parallax
    let mouseX = width / 2;
    let mouseY = height / 2;
    // Target mouse position for smoothing
    let targetMouseX = width / 2;
    let targetMouseY = height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // --- Configuration ---
    const STAR_COUNT = 300; // Increased count
    const CONNECTION_DISTANCE = 120;
    const DRIFT_SPEED = 0.05;

    interface Star {
      x: number;
      y: number;
      z: number; // Depth factor (0.1 = far, 2 = close)
      size: number;
      baseAlpha: number;
      currentAlpha: number;
      twinklePhase: number;
      twinkleSpeed: number;
      vx: number;
      vy: number;
    }

    const stars: Star[] = [];

    const initStars = () => {
      stars.length = 0;
      // Adjust count based on screen size (approx 1 star per 8000px^2)
      // Limit to STAR_COUNT to prevent performance issues on huge screens
      const count = Math.min(Math.floor(width * height / 8000), STAR_COUNT);

      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          z: Math.random() * 1.5 + 0.5, // 0.5 to 2.0
          size: Math.random() * 2,
          baseAlpha: Math.random() * 0.6 + 0.2, // 0.2 to 0.8
          currentAlpha: 0, // Calculated in animate
          twinklePhase: Math.random() * Math.PI * 2,
          twinkleSpeed: Math.random() * 0.02 + 0.005, // Varied speed
          vx: (Math.random() - 0.5) * DRIFT_SPEED,
          vy: (Math.random() - 0.5) * DRIFT_SPEED
        });
      }
    };
    initStars();

    let animationFrameId: number;

    const animate = () => {
      if (!ctx) return;

      // Smooth mouse movement
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      // Clear Canvas
      ctx.clearRect(0, 0, width, height);

      // --- Draw Nebulas (Parallax Background Layers) ---
      // Enhanced depth with multiple subtle layers moving at different rates
      const maxDim = Math.max(width, height);

      // Layer 1: Deep Slate (Base Atmosphere)
      const x1 = width * 0.3 + (mouseX - width / 2) * -0.01;
      const y1 = height * 0.4 + (mouseY - height / 2) * -0.01;
      const g1 = ctx.createRadialGradient(x1, y1, 0, x1, y1, maxDim * 0.9);
      g1.addColorStop(0, 'rgba(10, 15, 30, 0.4)'); // Slate-dark
      g1.addColorStop(0.5, 'rgba(3, 7, 18, 0.2)'); // Deep black/navy
      g1.addColorStop(1, 'transparent');
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, width, height);

      // Layer 2: Subtle Navy Glow
      const x2 = width * 0.7 + (mouseX - width / 2) * -0.015;
      const y2 = height * 0.2 + (mouseY - height / 2) * -0.015;
      const g2 = ctx.createRadialGradient(x2, y2, 0, x2, y2, maxDim * 0.7);
      g2.addColorStop(0, 'rgba(15, 23, 42, 0.15)'); // Slate-700 equivalent
      g2.addColorStop(0.6, 'transparent');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, width, height);

      // Layer 3: Minimal Brand Lime Hint
      const x3 = width * 0.85 + (mouseX - width / 2) * -0.02;
      const y3 = height * 0.85 + (mouseY - height / 2) * -0.02;
      const g3 = ctx.createRadialGradient(x3, y3, 0, x3, y3, maxDim * 0.6);
      g3.addColorStop(0, 'rgba(191, 253, 17, 0.015)'); // Brand Lime (extremely subtle)
      g3.addColorStop(0.5, 'transparent');
      ctx.fillStyle = g3;
      ctx.fillRect(0, 0, width, height);


      // --- Draw Stars & Connections ---

      // Update star positions and brightness
      stars.forEach(star => {
        star.x += star.vx;
        star.y += star.vy;

        // Update twinkling
        star.twinklePhase += star.twinkleSpeed;
        const twinkleVal = Math.sin(star.twinklePhase);
        // Base alpha +/- 0.2
        star.currentAlpha = Math.max(0.1, Math.min(1, star.baseAlpha + twinkleVal * 0.2));

        // Wrap around screen
        if (star.x < -100) star.x = width + 100;
        if (star.x > width + 100) star.x = -100;
        if (star.y < -100) star.y = height + 100;
        if (star.y > height + 100) star.y = -100;
      });

      // Draw connections first (so they are behind stars)
      ctx.lineWidth = 0.5;
      // To optimize, we loop through stars and check neighbors.
      for (let i = 0; i < stars.length; i++) {
        const star1 = stars[i];

        // Calculate parallax position
        const pX1 = star1.x + (mouseX - width / 2) * (0.05 * star1.z);
        const pY1 = star1.y + (mouseY - height / 2) * (0.05 * star1.z);

        // Only connect if visible on screen (plus margin)
        if (pX1 < -50 || pX1 > width + 50 || pY1 < -50 || pY1 > height + 50) continue;

        for (let j = i + 1; j < stars.length; j++) {
          const star2 = stars[j];

          // Optimization: Check raw distance first to avoid parallax calc if far
          const rawDx = star1.x - star2.x;
          const rawDy = star1.y - star2.y;
          if (Math.abs(rawDx) > CONNECTION_DISTANCE || Math.abs(rawDy) > CONNECTION_DISTANCE) continue;

          const pX2 = star2.x + (mouseX - width / 2) * (0.05 * star2.z);
          const pY2 = star2.y + (mouseY - height / 2) * (0.05 * star2.z);

          const dx = pX1 - pX2;
          const dy = pY1 - pY2;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONNECTION_DISTANCE) {
            // Combine alphas for connection opacity
            const combinedAlpha = Math.min(star1.currentAlpha, star2.currentAlpha);
            const opacity = (1 - dist / CONNECTION_DISTANCE) * 0.3 * combinedAlpha;

            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
            // Occasionally tint connection lime if very close
            if (dist < CONNECTION_DISTANCE * 0.3) {
              ctx.strokeStyle = `rgba(191, 253, 17, ${opacity * 1.5})`;
            }

            ctx.beginPath();
            ctx.moveTo(pX1, pY1);
            ctx.lineTo(pX2, pY2);
            ctx.stroke();
          }
        }
      }

      // Draw Stars
      stars.forEach(star => {
        const pX = star.x + (mouseX - width / 2) * (0.05 * star.z);
        const pY = star.y + (mouseY - height / 2) * (0.05 * star.z);

        // Skip if off screen
        if (pX < -50 || pX > width + 50 || pY < -50 || pY > height + 50) return;

        const size = star.size * star.z * 0.8; // Scale by depth

        ctx.beginPath();
        ctx.arc(pX, pY, size, 0, Math.PI * 2);

        // Star color - mostly white, some blueish, alpha varies
        ctx.fillStyle = `rgba(220, 230, 255, ${star.currentAlpha})`;
        ctx.fill();

        // Glow effect
        ctx.shadowBlur = size * 8;
        ctx.shadowColor = `rgba(255, 255, 255, ${star.currentAlpha * 0.8})`;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
    />
  );
}