'use client';

import { useEffect, useRef } from 'react';

interface NeonBackgroundProps {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  animationSpeed?: number;
}

export default function NeonBackground({
  primaryColor = '#8b5cf6',
  secondaryColor = '#ec4899',
  accentColor = '#06b6d4',
  animationSpeed = 1,
}: NeonBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', handleResize);

    const blobs = [
      { x: width * 0.3, y: height * 0.3, r: 300, vx: 0.4, vy: 0.3, color: primaryColor },
      { x: width * 0.7, y: height * 0.6, r: 250, vx: -0.3, vy: 0.5, color: secondaryColor },
      { x: width * 0.5, y: height * 0.8, r: 200, vx: 0.5, vy: -0.4, color: accentColor },
      { x: width * 0.2, y: height * 0.7, r: 180, vx: -0.5, vy: -0.3, color: primaryColor },
      { x: width * 0.8, y: height * 0.2, r: 220, vx: 0.3, vy: 0.4, color: accentColor },
    ];

    let time = 0;
    const speed = animationSpeed * 0.005;

    const animate = () => {
      time += speed;
      ctx.fillStyle = 'rgba(10, 5, 20, 0.15)';
      ctx.fillRect(0, 0, width, height);

      for (const blob of blobs) {
        blob.x += Math.sin(time * blob.vx + blob.vy) * 1.5;
        blob.y += Math.cos(time * blob.vy + blob.vx) * 1.5;

        if (blob.x < -blob.r) blob.x = width + blob.r;
        if (blob.x > width + blob.r) blob.x = -blob.r;
        if (blob.y < -blob.r) blob.y = height + blob.r;
        if (blob.y > height + blob.r) blob.y = -blob.r;

        const gradient = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.r);
        gradient.addColorStop(0, blob.color + '40');
        gradient.addColorStop(0.5, blob.color + '15');
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(blob.x, blob.y, blob.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Ripple waves
      for (let i = 0; i < 3; i++) {
        const rippleTime = (time * 0.8 + i * 2.1) % 6.28;
        const rippleR = 100 + Math.sin(rippleTime) * 80 + i * 120;
        const cx = width * 0.5 + Math.cos(time * 0.3 + i) * 100;
        const cy = height * 0.5 + Math.sin(time * 0.4 + i) * 80;

        ctx.strokeStyle = blobs[i % blobs.length].color + '18';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, rippleR, 0, Math.PI * 2);
        ctx.stroke();
      }

      animRef.current = requestAnimationFrame(animate);
    };

    // Initial fill
    ctx.fillStyle = '#0a0514';
    ctx.fillRect(0, 0, width, height);
    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [primaryColor, secondaryColor, accentColor, animationSpeed]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10"
      style={{ background: '#0a0514' }}
    />
  );
}
