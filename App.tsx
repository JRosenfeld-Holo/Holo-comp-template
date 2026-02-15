import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  Menu, X, Globe, Users, Server,
  ShieldCheck, Zap, Cpu, LayoutDashboard,
  CheckCircle2, Plus, ArrowRight, MessageSquare, Check,
  ChevronLeft, ChevronRight, Search, Settings, FileText, BarChart3, Signal, Truck,
  Play
} from 'lucide-react';
import { Button } from './components/Button';
import { Section } from './components/Section';

// --- Animated Counter Component ---

const AnimatedCounter = ({ end, suffix = '', decimals = 0, duration = 2000 }: {
  end: number; suffix?: string; decimals?: number; duration?: number;
}) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const startTime = performance.now();
          const step = (now: number) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(eased * end);
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration]);

  return <span ref={ref}>{decimals > 0 ? count.toFixed(decimals) : Math.floor(count)}{suffix}</span>;
};

// --- Grid Globe Component ---

const connectionArcs = [
  { from: { lat: 40, lon: -74 }, to: { lat: 51, lon: 0 } },
  { from: { lat: 51, lon: 0 }, to: { lat: 35, lon: 139 } },
  { from: { lat: 35, lon: 139 }, to: { lat: -33, lon: 151 } },
  { from: { lat: 40, lon: -74 }, to: { lat: -23, lon: -43 } },
  { from: { lat: 51, lon: 0 }, to: { lat: 1, lon: 103 } },
  { from: { lat: 1, lon: 103 }, to: { lat: -1, lon: 37 } },
  { from: { lat: -1, lon: 37 }, to: { lat: 55, lon: 37 } },
  { from: { lat: 40, lon: -74 }, to: { lat: 19, lon: -99 } },
];

const hotspotCities = [
  { lat: 40, lon: -74, label: 'NYC' },
  { lat: 51, lon: 0, label: 'LON' },
  { lat: 35, lon: 139, label: 'TKY' },
  { lat: -33, lon: 151, label: 'SYD' },
  { lat: 1, lon: 103, label: 'SIN' },
  { lat: -23, lon: -43, label: 'RIO' },
  { lat: 55, lon: 37, label: 'MOW' },
  { lat: -1, lon: 37, label: 'NBO' },
];

// Pre-compute land points once outside the component to avoid regeneration
const generateLandPoints = () => {
  const points: { lat: number, lon: number }[] = [];
  const continents = [
    { lat: 45, lon: -100, spread: 25, density: 1500 },
    { lat: -10, lon: -60, spread: 20, density: 1200 },
    { lat: 50, lon: 10, spread: 15, density: 1000 },
    { lat: 0, lon: 20, spread: 22, density: 1400 },
    { lat: 45, lon: 90, spread: 30, density: 1800 },
    { lat: -25, lon: 135, spread: 12, density: 600 },
    { lat: -75, lon: 0, spread: 15, density: 400 },
  ];

  continents.forEach(cont => {
    for (let i = 0; i < cont.density; i++) {
      const u = Math.random();
      const v = Math.random();
      const r = cont.spread * Math.sqrt(-2.0 * Math.log(u));
      const theta = 2.0 * Math.PI * v;
      const dLat = r * Math.cos(theta);
      const dLon = (r * Math.sin(theta)) / Math.cos(cont.lat * (Math.PI / 180));
      points.push({
        lat: (cont.lat + dLat) * (Math.PI / 180),
        lon: (cont.lon + dLon) * (Math.PI / 180)
      });
    }
  });

  for (let i = 0; i < 500; i++) {
    points.push({
      lat: (Math.random() * 180 - 90) * (Math.PI / 180),
      lon: (Math.random() * 360 - 180) * (Math.PI / 180)
    });
  }

  return points;
};

const precomputedLandPoints = generateLandPoints();

const GridGlobe = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landPoints = useMemo(() => precomputedLandPoints, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = 700;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    let isVisible = true;
    const visibilityObserver = new IntersectionObserver(
      ([entry]) => { isVisible = entry.isIntersecting; },
      { threshold: 0 }
    );
    visibilityObserver.observe(canvas);

    const cx = size / 2;
    const cy = size / 2;
    const radius = size * 0.38;

    let rotationX = 0.4;
    let rotationY = 0;

    const project = (latDeg: number, lonDeg: number) => {
      const phi = latDeg * (Math.PI / 180);
      const theta = lonDeg * (Math.PI / 180) + rotationY;
      const x = radius * Math.cos(phi) * Math.sin(theta);
      const y = -radius * Math.sin(phi);
      const z = radius * Math.cos(phi) * Math.cos(theta);
      const rx = x;
      const ry = y * Math.cos(rotationX) - z * Math.sin(rotationX);
      const rz = z * Math.cos(rotationX) + y * Math.sin(rotationX);
      const perspective = 800;
      const scale = perspective / (perspective + rz);
      return { x: cx + rx * scale, y: cy + ry * scale, z: rz, scale, visible: rz > -radius * 0.15 };
    };

    const projectRad = (lat: number, lon: number) => {
      const phi = lat;
      const theta = lon + rotationY;
      const x = radius * Math.cos(phi) * Math.sin(theta);
      const y = -radius * Math.sin(phi);
      const z = radius * Math.cos(phi) * Math.cos(theta);
      const rx = x;
      const ry = y * Math.cos(rotationX) - z * Math.sin(rotationX);
      const rz = z * Math.cos(rotationX) + y * Math.sin(rotationX);
      const perspective = 800;
      const scale = perspective / (perspective + rz);
      return { x: cx + rx * scale, y: cy + ry * scale, z: rz, scale, visible: rz > 0 };
    };

    const drawArc = (from: { lat: number, lon: number }, to: { lat: number, lon: number }, time: number) => {
      const steps = 40;
      const points = [];
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const lat = from.lat + (to.lat - from.lat) * t;
        const lon = from.lon + (to.lon - from.lon) * t;
        const altitude = 1 + Math.sin(t * Math.PI) * 0.15;
        const phi = lat * (Math.PI / 180);
        const theta = lon * (Math.PI / 180) + rotationY;
        const r = radius * altitude;
        const x = r * Math.cos(phi) * Math.sin(theta);
        const y = -r * Math.sin(phi);
        const z = r * Math.cos(phi) * Math.cos(theta);
        const rx = x;
        const ry = y * Math.cos(rotationX) - z * Math.sin(rotationX);
        const rz = z * Math.cos(rotationX) + y * Math.sin(rotationX);
        const perspective = 800;
        const scale = perspective / (perspective + rz);
        points.push({ x: cx + rx * scale, y: cy + ry * scale, z: rz, visible: rz > -radius * 0.1 });
      }

      // Draw arc trail
      const pulse = (Math.sin(time * 2) + 1) / 2;
      for (let i = 1; i < points.length; i++) {
        if (!points[i].visible && !points[i - 1].visible) continue;
        const alpha = Math.max(0, Math.min(0.6, (points[i].z / radius + 0.5))) * (0.3 + pulse * 0.4);
        ctx.beginPath();
        ctx.moveTo(points[i - 1].x, points[i - 1].y);
        ctx.lineTo(points[i].x, points[i].y);
        ctx.strokeStyle = `rgba(191, 253, 17, ${alpha})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Traveling pulse dot
      const pulsePos = ((time * 0.4) % 1);
      const pulseIdx = Math.floor(pulsePos * (points.length - 1));
      const pp = points[pulseIdx];
      if (pp && pp.visible) {
        const a = Math.max(0, Math.min(1, (pp.z / radius + 0.3)));
        ctx.beginPath();
        ctx.arc(pp.x, pp.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(191, 253, 17, ${a})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(pp.x, pp.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(191, 253, 17, ${a * 0.2})`;
        ctx.fill();
      }
    };

    const animate = () => {
      if (!isVisible) { requestAnimationFrame(animate); return; }
      ctx.clearRect(0, 0, size, size);
      rotationY += 0.002;
      rotationX = 0.4 + Math.sin(Date.now() * 0.0005) * 0.05;
      const time = Date.now() * 0.001;

      // Atmospheric glow
      const glowGrad = ctx.createRadialGradient(cx, cy, radius * 0.85, cx, cy, radius * 1.4);
      glowGrad.addColorStop(0, 'rgba(191, 253, 17, 0)');
      glowGrad.addColorStop(0.5, 'rgba(191, 253, 17, 0.02)');
      glowGrad.addColorStop(0.8, 'rgba(191, 253, 17, 0.04)');
      glowGrad.addColorStop(1, 'rgba(191, 253, 17, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.4, 0, Math.PI * 2);
      ctx.fill();

      // Inner fill
      const innerGrad = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.3, 0, cx, cy, radius);
      innerGrad.addColorStop(0, 'rgba(191, 253, 17, 0.03)');
      innerGrad.addColorStop(0.5, 'rgba(11, 13, 19, 0.02)');
      innerGrad.addColorStop(1, 'rgba(11, 13, 19, 0)');
      ctx.fillStyle = innerGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      // Grid lines
      ctx.lineWidth = 0.5;
      const latCount = 9;
      for (let i = 1; i < latCount; i++) {
        const lat = -90 + (i * 180 / latCount);
        ctx.beginPath();
        for (let lon = 0; lon <= 361; lon += 5) {
          const p = project(lat, lon);
          if (lon === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.stroke();
      }

      const lonCount = 12;
      for (let i = 0; i < lonCount; i++) {
        const fixedLon = (i / lonCount) * 360;
        ctx.beginPath();
        for (let lat = -90; lat <= 90; lat += 5) {
          const p = project(lat, fixedLon);
          if (lat === -90) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.stroke();
      }

      // Outline
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(191, 253, 17, 0.08)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Land masses
      if (landPoints.length > 0) {
        landPoints.forEach(pt => {
          const p = projectRad(pt.lat, pt.lon);
          if (p.visible) {
            const alpha = Math.max(0, Math.min(1, p.z / radius));
            ctx.globalAlpha = alpha * 0.9;
            ctx.fillStyle = `rgba(191, 253, 17, ${0.5 + alpha * 0.5})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 1.2 * p.scale, 0, Math.PI * 2);
            ctx.fill();
          }
        });
        ctx.globalAlpha = 1.0;
      }

      // Connection arcs
      connectionArcs.forEach((arc, i) => {
        drawArc(arc.from, arc.to, time + i * 1.3);
      });

      // Hotspot cities with pulse rings
      hotspotCities.forEach(city => {
        const p = project(city.lat, city.lon);
        if (p.visible && p.z > 0) {
          const a = Math.max(0, Math.min(1, p.z / radius));

          // Pulse ring
          const pulsePhase = (time * 1.5 + city.lat * 0.05) % 1;
          const ringRadius = 4 + pulsePhase * 12;
          const ringAlpha = (1 - pulsePhase) * a * 0.5;
          ctx.beginPath();
          ctx.arc(p.x, p.y, ringRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(191, 253, 17, ${ringAlpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();

          // Core dot
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3 * p.scale, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(191, 253, 17, ${a})`;
          ctx.fill();

          // Glow
          ctx.beginPath();
          ctx.arc(p.x, p.y, 8 * p.scale, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(191, 253, 17, ${a * 0.15})`;
          ctx.fill();
        }
      });

      requestAnimationFrame(animate);
    }

    const animId = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(animId); visibilityObserver.disconnect(); };
  }, [landPoints]);

  return <canvas ref={canvasRef} role="img" aria-label="Interactive 3D globe showing Hologram's global network coverage across 190+ countries with animated connection arcs between major cities" className="w-full max-w-[700px] aspect-square" />;
};

const DashboardMockup = () => {
  return (
    <div className="w-full h-full bg-brand-slate flex overflow-hidden rounded-xl text-white text-left select-none">
      {/* Sidebar */}
      <div className="w-56 bg-brand-deep border-r border-white/5 flex flex-col shrink-0 hidden md:flex font-sans">
        <div className="p-4 flex items-center gap-2 text-white font-bold text-sm mb-4 border-b border-white/5">
          <div className="h-5 flex items-center">
            <img src="/Logo Lime@2x.png" alt="Hologram" className="h-full w-auto" />
          </div>
        </div>
        <div className="px-2 space-y-0.5">
          <div className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 hover:text-white rounded-md cursor-pointer transition-colors text-xs font-medium">
            <LayoutDashboard className="w-3.5 h-3.5 opacity-70" /> Home
          </div>
          <div className="flex items-center gap-3 px-3 py-2 bg-brand-lime text-black rounded-md cursor-pointer text-xs font-bold shadow-lg shadow-brand-lime/10">
            <Signal className="w-3.5 h-3.5" /> SIMs
          </div>
          <div className="pl-10 text-[10px] py-1.5 text-brand-lime font-bold uppercase tracking-wider">Active</div>
          <div className="pl-10 text-[10px] py-1.5 hover:text-white cursor-pointer uppercase tracking-wider text-gray-500">Inventory</div>
          <div className="pl-10 text-[10px] py-1.5 hover:text-white cursor-pointer uppercase tracking-wider text-gray-500">Activity</div>
          <div className="h-4" />
          <div className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 hover:text-white rounded-md cursor-pointer transition-colors text-xs font-medium">
            <BarChart3 className="w-3.5 h-3.5 opacity-70" /> Usage
          </div>
          <div className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 hover:text-white rounded-md cursor-pointer transition-colors text-xs font-medium">
            <FileText className="w-3.5 h-3.5 opacity-70" /> Billing
          </div>
          <div className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 hover:text-white rounded-md cursor-pointer transition-colors text-xs font-medium">
            <Settings className="w-3.5 h-3.5 opacity-70" /> Settings
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-brand-slate">
        <div className="h-14 border-b border-white/5 flex items-center justify-between px-4 md:px-6 shrink-0 bg-brand-slate z-10">
          <div className="flex items-center gap-4 text-sm font-medium text-gray-400">
            <div className="flex items-center gap-1 cursor-pointer hover:text-white shrink-0">
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Active SIMs</span>
            </div>
            <div className="h-4 w-px bg-white/10 mx-1 hidden sm:block"></div>
            <div className="hidden md:flex items-center gap-2 text-gray-500 font-normal bg-white/5 px-2 py-1.5 rounded-md w-64 border border-transparent hover:border-white/10 transition-colors">
              <Search className="w-3.5 h-3.5" />
              <span className="text-xs">Search SIMs by name, ICCID...</span>
              <span className="ml-auto text-[10px] border border-white/20 rounded px-1">&#8984;K</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-sm font-medium text-gray-400 cursor-pointer hover:text-white">
              Support <ChevronLeft className="w-3 h-3 -rotate-90" />
            </div>
            <div className="w-8 h-8 bg-brand-lime text-black font-bold rounded-full flex items-center justify-center text-xs border border-white/10">AC</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-8 bg-brand-slate/50">
          <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">Name</div>
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-2xl font-bold text-white font-display">Monitoring A99402</h1>
              </div>
              <div className="flex gap-2 flex-wrap">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-gray-500 font-medium">Tags</span>
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-xs font-medium text-gray-300">US Customer 5</span>
                    <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-xs font-medium text-gray-300">Hardware v2</span>
                  </div>
                </div>
              </div>
            </div>
            <button className="bg-brand-lime text-black pl-4 pr-3 py-2 rounded-md font-bold text-sm flex items-center gap-2 hover:bg-brand-lime/90 shadow-lg shadow-brand-lime/10 transition-all mt-2 md:mt-0 font-display">
              Manage SIM <ChevronLeft className="w-4 h-4 -rotate-90" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-8 text-sm pb-8 border-b border-white/5">
            <div className="col-span-1">
              <div className="text-gray-500 text-xs font-medium mb-1.5">SIM status</div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-lime text-black rounded-sm font-bold text-xs shadow-sm">
                <Signal className="w-3 h-3" /> Connected
              </div>
            </div>
            <div className="col-span-2 md:col-span-1">
              <div className="text-gray-500 text-xs font-medium mb-1.5">Enabled profile and ICCID</div>
              <div className="font-medium text-brand-lime underline cursor-pointer decoration-brand-lime/30 uppercase tracking-tight text-xs">Global-3</div>
              <div className="text-[10px] text-gray-500 mt-0.5 font-mono">89131300001234567890</div>
            </div>
            <div className="col-span-1">
              <div className="text-gray-500 text-xs font-medium mb-1.5">Data usage</div>
              <div className="font-bold text-white">1,209.32 MB</div>
            </div>
            <div className="col-span-1">
              <div className="text-gray-500 text-xs font-medium mb-1.5">Included data</div>
              <div className="font-medium text-white">Pay as you go <span className="text-gray-500 font-normal">(no limit)</span></div>
            </div>
            <div className="col-span-1 hidden md:block">
              <div className="text-gray-500 text-xs font-medium mb-1.5">Last known IMEI</div>
              <div className="font-mono text-[10px] text-gray-500">123456789012345</div>
            </div>
          </div>

          <div className="flex gap-8 border-b border-white/5 mb-8 text-sm overflow-x-auto">
            <div className="pb-3 border-b-2 border-brand-lime font-bold text-brand-lime">Status</div>
            <div className="pb-3 text-gray-500 font-medium hover:text-white cursor-pointer whitespace-nowrap">SIM and device</div>
            <div className="pb-3 text-gray-500 font-medium hover:text-white cursor-pointer whitespace-nowrap">Profiles</div>
            <div className="pb-3 text-gray-500 font-medium hover:text-white cursor-pointer whitespace-nowrap">Recent sessions</div>
            <div className="pb-3 text-gray-500 font-medium hover:text-white cursor-pointer whitespace-nowrap">Data usage</div>
            <div className="pb-3 text-gray-500 font-medium hover:text-white cursor-pointer whitespace-nowrap">Coverage</div>
            <div className="pb-3 text-gray-500 font-medium hover:text-white cursor-pointer whitespace-nowrap">Pricing</div>
            <div className="pb-3 text-gray-500 font-medium hover:text-white cursor-pointer whitespace-nowrap">Webhook</div>
          </div>

          <div className="space-y-6 max-w-5xl text-white">
            <div className="bg-brand-deep/50 border border-white/5 rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                <h3 className="font-bold text-white font-display">Status</h3>
              </div>
              <div className="p-6">
                <div className="bg-brand-lime/10 border border-brand-lime/20 rounded-lg p-4 mb-8 flex gap-4 items-start backdrop-blur-sm">
                  <div className="mt-1 font-bold text-black text-[10px] bg-brand-lime p-1 rounded uppercase tracking-wider shadow-[0_0_15px_rgba(191,253,17,0.3)]"><Signal className="w-3.5 h-3.5" /></div>
                  <div className="text-sm text-gray-800">
                    <span className="font-bold mr-2">Connected</span>
                    <span className="opacity-80">This SIM is currently connected to our network, or has connected recently to our network and has an open data session. Real-time session info varies by carrier.</span>
                  </div>
                </div>

                <div className="flex items-center justify-between px-4 md:px-12 py-6 relative">
                  <div className="absolute top-1/2 left-12 right-12 h-0.5 bg-white/5 -z-10 rounded-full"></div>
                  <div className="absolute top-1/2 left-12 right-[20%] h-0.5 bg-brand-lime -z-10 rounded-full shadow-[0_0_10px_rgba(191,253,17,0.3)]"></div>

                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-lime flex items-center justify-center text-black shadow-lg border-2 border-brand-deep z-10"><Cpu className="w-5 h-5" /></div>
                    <div className="text-center">
                      <div className="text-xs font-bold text-white">Your device</div>
                      <div className="text-[10px] text-gray-500 font-mono">ID_1234567</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-lime flex items-center justify-center text-black shadow-lg border-2 border-brand-deep z-10"><Server className="w-5 h-5" /></div>
                    <div className="text-center">
                      <div className="text-xs font-bold text-white">Hyper SIM</div>
                      <div className="text-[10px] text-gray-500 font-mono">SIM_7654321</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-lime flex items-center justify-center text-black shadow-lg border-2 border-brand-deep z-10"><Globe className="w-5 h-5" /></div>
                    <div className="text-center">
                      <div className="text-xs font-bold text-white">Mobile core</div>
                      <div className="text-[10px] text-gray-500">Global-3</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-lime flex items-center justify-center text-black shadow-lg border-2 border-brand-deep z-10"><Signal className="w-5 h-5" /></div>
                    <div className="text-center">
                      <div className="text-xs font-bold text-white">Connected</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-lime flex items-center justify-center text-black shadow-lg border-2 border-brand-deep z-10"><Globe className="w-5 h-5" /></div>
                    <div className="text-center">
                      <div className="text-xs font-bold text-white">Internet</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-brand-deep/50 border border-white/5 rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                <h3 className="font-semibold text-white font-display">Last connection</h3>
                <div className="text-brand-lime text-xs font-bold flex items-center gap-1 cursor-pointer hover:underline">
                  Session history <ArrowRight className="w-3 h-3" />
                </div>
              </div>
              <div className="p-6 flex flex-col lg:flex-row gap-8">
                <div className="flex-1 relative pl-4 border-l-2 border-dotted border-white/10 space-y-8">
                  <div className="relative">
                    <div className="absolute -left-[25px] top-0 w-5 h-5 rounded-full bg-brand-lime border-2 border-brand-deep shadow-lg shadow-brand-lime/20 flex items-center justify-center text-[10px] text-black"><Check className="w-3 h-3 stroke-[4px]" /></div>
                    <div className="grid grid-cols-[120px,1fr] gap-4">
                      <div className="font-bold text-white text-sm">Connected</div>
                      <div>
                        <div className="grid grid-cols-[100px,1fr] gap-1 text-sm mb-1">
                          <div className="text-gray-500">Session opened</div>
                          <div className="font-medium text-gray-300">14 minutes, 2 seconds ago</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[25px] top-0 w-5 h-5 rounded-full bg-brand-lime border-2 border-brand-deep shadow-lg shadow-brand-lime/20 flex items-center justify-center text-[10px] text-black"><Signal className="w-3 h-3" /></div>
                    <div className="grid grid-cols-[120px,1fr] gap-4">
                      <div className="font-bold text-white text-sm">Last session</div>
                      <div>
                        <div className="grid grid-cols-[100px,1fr] gap-y-1 text-sm">
                          <div className="text-gray-500">Data usage</div>
                          <div className="font-medium text-gray-300">128.44 MB</div>
                          <div className="text-gray-500">Start time</div>
                          <div className="font-medium text-gray-300">12-31-2023 12:00 PM UTC</div>
                          <div className="text-gray-500">End time</div>
                          <div className="font-medium text-gray-500">Connected</div>
                          <div className="text-gray-500">Duration</div>
                          <div className="font-medium text-gray-300">14 minutes, 2 seconds</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[25px] top-0 w-5 h-5 rounded-full bg-brand-lime border-2 border-brand-deep shadow-lg shadow-brand-lime/20 flex items-center justify-center text-[10px] text-black"><Signal className="w-3 h-3" /></div>
                    <div className="grid grid-cols-[120px,1fr] gap-4">
                      <div className="font-bold text-white text-sm">Local tower</div>
                      <div>
                        <div className="grid grid-cols-[100px,1fr] gap-y-1 text-sm">
                          <div className="text-gray-500">Country</div>
                          <div className="font-medium text-gray-500">Available after session close</div>
                          <div className="text-gray-500">Approx. lat/long</div>
                          <div className="font-medium text-brand-lime underline cursor-pointer decoration-brand-lime/30">33.333333, -44.444444</div>
                          <div className="text-gray-500">Cell tower ID</div>
                          <div className="font-medium text-gray-300">44983</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[25px] top-0 w-5 h-5 rounded-full bg-brand-lime border-2 border-brand-deep shadow-lg shadow-brand-lime/20 flex items-center justify-center text-[10px] text-black"><Signal className="w-3 h-3" /></div>
                    <div className="grid grid-cols-[120px,1fr] gap-4">
                      <div className="font-bold text-white text-sm">Network</div>
                      <div>
                        <div className="grid grid-cols-[100px,1fr] gap-y-1 text-sm">
                          <div className="text-gray-500">Network</div>
                          <div className="font-medium text-gray-300">T-Mobile, Inc.</div>
                          <div className="text-gray-500">RAT</div>
                          <div className="font-medium text-gray-300">LTE</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-64 shrink-0 hidden xl:block">
                  <div className="w-full h-48 bg-brand-deep/50 rounded-lg border border-white/10 relative overflow-hidden group cursor-pointer">
                    <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')] bg-cover bg-center opacity-15 grayscale contrast-125 invert"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <span className="relative flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-lime opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-brand-lime border-2 border-brand-deep shadow-sm"></span>
                      </span>
                    </div>
                    <div className="absolute top-1/2 left-1/2 mt-4 -translate-x-1/2 text-[10px] font-bold text-brand-lime bg-brand-deep/90 px-2 py-0.5 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      33.33, -44.44
                    </div>
                    <div className="absolute bottom-1 right-1 text-[8px] text-gray-600">&copy; OpenStreetMap contributors</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Custom Scroll Helper
const scrollToSection = (id: string) => {
  const element = document.getElementById(id);
  if (element) {
    const offset = 80;
    const bodyRect = document.body.getBoundingClientRect().top;
    const elementRect = element.getBoundingClientRect().top;
    const elementPosition = elementRect - bodyRect;
    const offsetPosition = elementPosition - offset;
    window.scrollTo({ top: offsetPosition, behavior: "smooth" });
  }
};

// --- Navbar (Floating Glass Pill) ---

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const links = ['Compare', 'Platform', 'Customers', 'Pricing'];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleLinkClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    scrollToSection(id);
    setIsOpen(false);
  };

  return (
    <nav className="fixed top-4 md:top-5 left-4 md:left-6 right-4 md:right-6 z-50">
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`max-w-5xl mx-auto px-4 md:px-8 h-14 md:h-16 flex items-center justify-between rounded-2xl border transition-all duration-500 ${scrolled
          ? 'nav-glass border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
          : 'bg-transparent border-transparent'
          }`}
      >
        <div className="flex items-center cursor-pointer z-50 h-7" onClick={(e) => {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}>
          <img src="/logo-lime.png" alt="Hologram" className="h-full w-auto" />
        </div>

        <div className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase()}`}
              className="text-sm font-medium text-gray-400 hover:text-brand-lime transition-colors px-4 py-2 rounded-xl hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime focus-visible:ring-offset-2 focus-visible:ring-offset-brand-deep"
              onClick={(e) => handleLinkClick(e, link.toLowerCase())}
            >
              {link}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <a href="https://store.hologram.io" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gray-300 hover:text-brand-lime transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime px-2 py-1">Get free SIM</a>
          <Button variant="primary" className="text-sm px-5 py-2" href="https://www.hologram.io/contact-sales/">Talk to an Expert</Button>
        </div>

        <button className="md:hidden text-white z-50 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime p-1" aria-label={isOpen ? 'Close menu' : 'Open menu'} onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X /> : <Menu />}
        </button>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: '100vh' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden fixed top-0 left-0 w-full bg-brand-deep pt-24 px-6 z-40"
          >
            <div className="flex flex-col gap-6">
              {links.map((link) => (
                <a
                  key={link}
                  href={`#${link.toLowerCase()}`}
                  className="text-2xl font-medium text-gray-300 font-display"
                  onClick={(e) => handleLinkClick(e, link.toLowerCase())}
                >
                  {link}
                </a>
              ))}
              <div className="h-px bg-white/10 my-4" />
              <a href="https://store.hologram.io" target="_blank" rel="noopener noreferrer" className="text-xl font-medium text-white">Get free SIM</a>
              <Button variant="primary" className="w-full justify-center py-4 text-lg" href="https://www.hologram.io/contact-sales/">Talk to an Expert</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

// --- Hero (Cinematic with Aurora + Gradient Text) ---

const Hero = () => {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 600], [1, 0]);
  const y = useTransform(scrollY, [0, 600], [0, 100]);

  const [reveal, setReveal] = useState(false);

  useEffect(() => {
    setReveal(true);
  }, []);

  const heroStats = [
    { value: '50%', label: 'Cost savings vs. carriers' },
    { value: '550+', label: 'Global networks' },
    { value: '190+', label: 'Countries covered' },
  ];

  return (
    <section className="relative min-h-[85vh] md:min-h-screen flex flex-col items-center justify-center pt-28 md:pt-36 pb-16 md:pb-24 overflow-visible">

      {/* Layered cinematic aurora */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[1400px] h-[900px] aurora-glow rounded-full blur-[200px] opacity-40" />
        <div className="absolute top-[10%] right-[-15%] w-[600px] h-[600px] bg-brand-lime/[0.07] rounded-full blur-[150px]" />
        <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/[0.05] rounded-full blur-[130px]" />
        <div className="absolute top-[60%] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-lime/[0.03] rounded-full blur-[180px]" />
        {/* Radial grid lines for depth */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(191,253,17,0.03)_0%,transparent_70%)]" />
      </div>

      <motion.div
        style={{ y, opacity }}
        className="w-full max-w-5xl mx-auto text-center z-20 flex flex-col items-center px-4"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="shimmer-border inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-brand-lime/[0.06] text-brand-lime text-xs font-semibold mb-10 backdrop-blur-md border border-brand-lime/10"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-lime opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-lime"></span>
          </span>
          Trusted by 6,000+ IoT Companies Worldwide
        </motion.div>

        {/* Headline */}
        <div className="reveal-container mb-6 w-full">
          <h1 className={`reveal-text text-[2.5rem] md:text-7xl lg:text-[5.5rem] xl:text-[6.5rem] font-bold leading-[1.05] tracking-tight font-display pb-2 ${reveal ? 'active' : ''}`}>
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/60">Outages Are</span>
            <br />
            <span className="text-shimmer">Obsolete.</span>
          </h1>
        </div>

        {/* Subtitle */}
        <div className="reveal-container mb-10 w-full flex justify-center">
          <p
            className={`reveal-text text-base md:text-xl text-gray-400 leading-relaxed max-w-2xl font-light ${reveal ? 'active' : ''}`}
            style={{ transitionDelay: '0.15s' }}
          >
            Stop losing revenue to dead zones and carrier lock-in. Hologram's <strong className="text-white font-medium">Hyper SIM</strong> gives every device instant access to 550+ networks with automatic failover — so your fleet never goes dark.
          </p>
        </div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, type: "spring", stiffness: 200 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8"
        >
          <Button
            variant="primary"
            className="px-10 py-4 text-lg font-display shadow-[0_0_40px_rgba(191,253,17,0.3)]"
            href="#compare"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('compare');
            }}
          >
            See the Difference
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <Button variant="outline" className="px-10 py-4 text-lg" href="https://www.hologram.io/contact-sales/">Talk to Sales</Button>
        </motion.div>

        {/* Stat strip — social proof above the fold */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="flex items-center justify-center gap-6 md:gap-12 mt-4"
        >
          {heroStats.map((stat, i) => (
            <div key={i} className="flex flex-col items-center">
              <span className="text-xl md:text-2xl font-bold text-white font-display">{stat.value}</span>
              <span className="text-[10px] md:text-xs text-gray-500 mt-0.5">{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>

    </section>
  );
};

// --- Comparison Table (Premium Visual Treatment) ---

const ComparisonTable = () => {
  const rows = [
    {
      feature: "Network Redundancy",
      us: "Dual-Core Dynamic Fallback (Zero MNC Lock)",
      them: "Single Profile / Fixed Carrier Lock"
    },
    {
      feature: "SIM Intelligence",
      us: "eUICC / Hyper SIM (Field-Programmable)",
      them: "Static UICC (Manual Swap Required)"
    },
    {
      feature: "Connectivity Lifecycle",
      us: "Instant OTA Provisioning & Porting",
      them: "Fragile Roaming / Hardware Recalls"
    },
    {
      feature: "Security Framework",
      us: "1-Click Private APN & IPsec VPN",
      them: "Complex Hardware/IT Protocol Setup"
    },
    {
      feature: "Operational DX",
      us: "Unified REST API & Real-time Webhooks",
      them: "Legacy SOAP / FTP / Manual Portals"
    },
    {
      feature: "Live Diagnostics",
      us: "Streamed Packet Logs & Connection Traces",
      them: "Delayed CDRs & Black-box Errors"
    },
    {
      feature: "Scale Logistics",
      us: "Single SKU for 550+ Global Networks",
      them: "Fragmented SKU Management (Local vs Int'l)"
    },
  ];

  return (
    <Section id="compare" className="py-24">
      <div className="text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-brand-lime text-sm font-semibold uppercase tracking-widest mb-4 font-display">The Comparison</p>
          <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight font-display">Why smart teams switch</h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">See how Hologram stacks up against traditional connectivity providers.</p>
        </motion.div>
      </div>
      <div className="max-w-5xl mx-auto overflow-hidden">
        <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
          <div className="min-w-[640px] md:min-w-0 shimmer-border rounded-3xl overflow-hidden">
            <table className="w-full bg-white/[0.02] border border-white/[0.06] rounded-3xl backdrop-blur-sm shadow-2xl border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-gradient-to-r from-brand-lime/[0.08] via-brand-lime/[0.02] to-transparent">
                  <th scope="col" className="p-4 md:p-8 text-left text-gray-400 font-medium text-xs md:text-base font-display w-1/3">Feature</th>
                  <th scope="col" className="p-4 md:p-8 text-left w-1/3">
                    <div className="flex items-center h-5 md:h-7 px-2">
                      <img src="/logo-lime.png" alt="Hologram" className="h-full w-auto object-contain" />
                    </div>
                  </th>
                  <th scope="col" className="p-4 md:p-8 text-right md:text-left text-gray-500 font-medium text-xs md:text-2xl font-display w-1/3">Legacy Carriers</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-all duration-300 group"
                  >
                    <th scope="row" className="p-4 md:p-8 font-medium text-white text-left pr-2 md:pr-4 font-display text-xs md:text-base align-middle">{row.feature}</th>
                    <td className="p-4 md:p-8 text-white align-middle">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-brand-lime/20 flex items-center justify-center text-brand-lime shrink-0 group-hover:bg-brand-lime group-hover:text-black transition-colors duration-300">
                          <Check className="w-3 h-3 md:w-4 md:h-4" strokeWidth={3} />
                        </div>
                        <span className="text-[10px] md:text-sm line-clamp-2">{row.us}</span>
                      </div>
                    </td>
                    <td className="p-4 md:p-8 text-gray-500 align-middle">
                      <div className="flex items-center gap-2 md:gap-3 justify-end md:justify-start">
                        <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 shrink-0">
                          <X className="w-3 h-3 md:w-4 md:h-4" strokeWidth={3} />
                        </div>
                        <span className="text-[10px] md:text-sm line-clamp-2">{row.them}</span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Section>
  )
}

const LogoCloud = () => {
  const logos = [
    { name: "Metropolis", src: "/logos/metropolis.png" },
    { name: "SUZOHAPP", src: "/logos/suzohapp.png" },
    { name: "Everactive", src: "/logos/everactive.png" },
    { name: "Verkada", src: "/logos/verkada.png" },
    { name: "Sunday Power", src: "/logos/sunday.png" },
    { name: "Fieldin", src: "/logos/fieldin.png" }
  ];

  const scrollLogos = [...logos, ...logos, ...logos];

  return (
    <div className="py-24 border-y border-white/5 bg-white/[0.01] overflow-hidden relative w-full">
      {/* Cinematic Edge Fades */}
      <div className="absolute inset-y-0 left-0 w-20 md:w-64 bg-gradient-to-r from-brand-deep via-brand-deep/80 to-transparent z-20 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-20 md:w-64 bg-gradient-to-l from-brand-deep via-brand-deep/80 to-transparent z-20 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
      >
        <p className="text-center text-xs md:text-sm font-semibold text-gray-400 mb-10 md:mb-16 uppercase tracking-[0.2em] md:tracking-[0.4em] opacity-60 font-display px-4">Trusting us over the competition</p>

        <div className="flex">
          <motion.div
            className="flex whitespace-nowrap gap-16 md:gap-32 items-center"
            animate={{
              x: ["0%", "-50%"]
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            {scrollLogos.map((logo, index) => (
              <div key={index} className="flex items-center justify-center group flex-shrink-0 px-4">
                <img
                  src={logo.src}
                  alt={logo.name}
                  loading="lazy"
                  className="h-8 md:h-10 w-auto object-contain opacity-40 grayscale group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-500 hover:scale-110"
                />
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

// --- Stats (Animated Counters + Bento Layout) ---

const Stats = () => {
  const stats = [
    { value: 50, suffix: '%', decimals: 0, label: "Average Cost Savings", desc: "Compared to legacy carrier contracts", icon: <Zap className="text-brand-lime w-6 h-6" />, wide: true },
    { value: 99.95, suffix: '%', decimals: 2, label: "Guaranteed Uptime", desc: "With intelligent network fallback", icon: <ShieldCheck className="text-brand-lime w-6 h-6" />, wide: false },
    { value: 550, suffix: '+', decimals: 0, label: "Global Networks", desc: "Native carrier connections worldwide", icon: <Globe className="text-brand-lime w-6 h-6" />, wide: false },
    { value: 190, suffix: '+', decimals: 0, label: "Countries Covered", desc: "Single SIM, worldwide reach", icon: <Users className="text-brand-lime w-6 h-6" />, wide: true },
  ];

  return (
    <Section>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, ease: "easeOut" }}
            className={`group p-8 md:p-10 rounded-3xl bg-white/[0.02] backdrop-blur-sm border border-white/[0.06] hover:border-brand-lime/30 hover:bg-white/[0.04] transition-all duration-500 cursor-pointer ${stat.wide ? 'md:col-span-2' : 'md:col-span-1'
              }`}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="bg-gradient-to-br from-brand-lime/20 to-transparent w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                {stat.icon}
              </div>
            </div>
            <h3 className="text-5xl md:text-6xl font-bold text-white mb-2 tracking-tight font-display">
              <AnimatedCounter end={stat.value} suffix={stat.suffix} decimals={stat.decimals} />
            </h3>
            <p className="text-white font-semibold text-lg mb-1 font-display">{stat.label}</p>
            <p className="text-gray-400 text-sm">{stat.desc}</p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
};

// --- Feature Grid (Asymmetric Bento Showcase) ---

const FeatureGrid = () => {
  const features = [
    {
      title: "Transparent Pricing",
      desc: "Legacy carriers hide fees in complex contracts. We offer clear, usage-based pricing so you only pay for what you use.",
      icon: <LayoutDashboard className="w-6 h-6" />,
      span: "md:col-span-2"
    },
    {
      title: "Hyper SIM Technology",
      desc: "Stop swapping SIMs. Our eUICC-enabled Hyper SIMs allow you to remotely switch carrier profiles over-the-air as your fleet moves globally.",
      icon: <Server className="w-6 h-6" />,
      span: "md:col-span-1"
    },
    {
      title: "Modern Developer API",
      desc: "Stop wrestling with archaic portals. Manage your entire fleet programmatically with our developer-friendly REST API.",
      icon: <Cpu className="w-6 h-6" />,
      span: "md:col-span-1"
    },
    {
      title: "Secure by Default",
      desc: "Enterprise-grade security without the enterprise-grade headache. Private APNs and IMEI locking come standard.",
      icon: <ShieldCheck className="w-6 h-6" />,
      span: "md:col-span-2"
    }
  ];

  return (
    <Section id="platform">
      <div className="text-center max-w-3xl mx-auto mb-20">
        <p className="text-brand-lime text-sm font-semibold uppercase tracking-widest mb-4 font-display">Platform</p>
        <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight font-display">Everything they can't offer</h2>
        <p className="text-gray-400 text-xl font-light">Hardware is hard enough. Don't let your connectivity provider make it harder.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {features.map((feature, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              delay: idx * 0.1,
              type: "spring",
              stiffness: 400,
              damping: 30
            }}
            className={`${feature.span} p-8 md:p-10 rounded-3xl bg-white/[0.02] backdrop-blur-md border border-white/[0.06] group hover:border-brand-lime/20 transition-all duration-500 cursor-pointer`}
          >
            <div className="w-14 h-14 rounded-2xl bg-brand-lime/10 flex items-center justify-center text-brand-lime mb-8 group-hover:scale-110 group-hover:bg-brand-lime group-hover:text-black transition-all duration-500 border border-brand-lime/20">
              {feature.icon}
            </div>
            <h3 className="text-xl md:text-2xl font-bold mb-4 font-display">{feature.title}</h3>
            <p className="text-gray-400 text-sm md:text-base leading-relaxed max-w-lg">{feature.desc}</p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
};

// --- Testimonial (Polished) ---

const Testimonial = () => {
  const testimonials = [
    {
      quote: "The ROI with Hologram has been exceptional. We were able to cut our IoT bills in half. It was an extremely smooth cutover with ZERO issues.",
      author: "Luke Saunders",
      role: "Founder & CEO",
      company: "Farmer's Fridge",
      initials: "LS",
      stats: [
        { label: "Cost Savings", value: "50%", sub: "IoT connectivity bills cut in half" },
        { label: "Locations", value: "2,000+", sub: "across 22 US markets serving 10M+ meals" }
      ]
    },
    {
      quote: "We have thousands of devices securing mission-critical locations. Hologram's Outage Protection SIMs deliver high reliability and exceptional performance — helping us avoid downtime despite AT&T and Verizon outages this year.",
      author: "Brandon Davito",
      role: "SVP of Product Management",
      company: "Verkada",
      initials: "BD",
      stats: [
        { label: "Devices", value: "28K+", sub: "powered by Hologram globally" },
        { label: "Countries", value: "85", sub: "served worldwide" }
      ]
    },
    {
      quote: "We tested Hologram in one of our problematic gap zones where other providers failed, and their devices worked flawlessly.",
      author: "Jean-François Marchand",
      role: "Marketing & Customer Success Director",
      company: "UgoWork",
      initials: "JM",
      stats: [
        { label: "Coverage", value: "100%", sub: "even in problematic gap zones" },
        { label: "Reliability", value: "Zero", sub: "connectivity failures in the field" }
      ]
    }
  ];

  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 8000);
    return () => clearInterval(timer);
  }, [current, isPaused]);

  const nextSlide = () => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % testimonials.length);
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const variants = {
    enter: (direction: number) => ({ x: direction > 0 ? 50 : -50, opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 50 : -50, opacity: 0 })
  };

  return (
    <Section id="customers" className="py-20 md:py-32 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-brand-lime/5 blur-[150px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 max-w-6xl mx-auto"
      >
        <p className="text-brand-lime text-sm font-semibold uppercase tracking-widest mb-6 text-center font-display">Customer Stories</p>

        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="bg-[#0b0d13] border border-white/10 rounded-[3rem] p-8 md:p-16 relative overflow-hidden group hover:border-brand-lime/20 transition-colors duration-500 min-h-[600px] flex flex-col justify-center animated-border">

          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none"></div>

          <div className="relative z-10 w-full">
            <AnimatePresence mode='wait' custom={direction}>
              <motion.div
                key={current}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="grid md:grid-cols-[1.5fr,1fr] gap-12 items-center"
              >
                <div className="flex flex-col justify-between h-full">
                  <div className="mb-8">
                    <div className="text-brand-lime mb-6">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H15.017C14.4647 8 14.017 8.44772 14.017 9V11C14.017 11.5523 13.5693 12 13.017 12H12.017V5H22.017V15C22.017 18.3137 19.3307 21 16.017 21H14.017ZM5.0166 21L5.0166 18C5.0166 16.8954 5.91203 16 7.0166 16H10.0166C10.5689 16 11.0166 15.5523 11.0166 15V9C11.0166 8.44772 10.5689 8 10.0166 8H6.0166C5.46432 8 5.0166 8.44772 5.0166 9V11C5.0166 11.5523 4.56889 12 4.0166 12H3.0166V5H13.0166V15C13.0166 18.3137 10.3303 21 7.0166 21H5.0166Z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl md:text-3xl lg:text-4xl font-medium leading-snug tracking-tight text-white min-h-[120px] font-display">
                      "{testimonials[current].quote}"
                    </h3>
                  </div>

                  <div className="flex items-center gap-4 pt-8 border-t border-white/5">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-lime/20 to-brand-lime/5 flex items-center justify-center font-bold text-brand-lime border border-brand-lime/20 shrink-0 font-display">
                      {testimonials[current].initials}
                    </div>
                    <div>
                      <div className="font-bold text-white font-display">{testimonials[current].author}</div>
                      <div className="text-sm text-gray-400">{testimonials[current].role}, {testimonials[current].company}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/[0.03] rounded-3xl p-8 border border-white/5 backdrop-blur-md">
                  <div className="space-y-8">
                    {testimonials[current].stats.map((stat, idx) => (
                      <div key={idx}>
                        {idx > 0 && <div className="w-full h-px bg-white/5 my-8" />}
                        <div>
                          <div className="text-gray-400 text-sm font-medium mb-2 uppercase tracking-wider font-display">{stat.label}</div>
                          <div className="text-4xl lg:text-5xl font-bold text-brand-lime tracking-tighter font-display">{stat.value}</div>
                          <div className="text-sm text-gray-400 mt-1">{stat.sub}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Controls + Progress Dots */}
          <div className="absolute bottom-8 left-8 right-8 flex items-center justify-between z-20">
            <div className="flex gap-2">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => { setDirection(idx > current ? 1 : -1); setCurrent(idx); }}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0d13] ${idx === current ? 'w-8 bg-brand-lime' : 'w-4 bg-white/20 hover:bg-white/40'
                    }`}
                  aria-label={`Go to testimonial ${idx + 1}`}
                />
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={prevSlide}
                className="w-11 h-11 rounded-full border border-white/10 bg-white/5 hover:bg-brand-lime hover:text-black hover:border-brand-lime flex items-center justify-center transition-all duration-300 backdrop-blur-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextSlide}
                className="w-11 h-11 rounded-full border border-white/10 bg-white/5 hover:bg-brand-lime hover:text-black hover:border-brand-lime flex items-center justify-center transition-all duration-300 backdrop-blur-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime"
                aria-label="Next testimonial"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

        </div>
      </motion.div>
    </Section>
  );
};

const IntegrationHub = () => {
  const globeStats = [
    { value: 550, suffix: '+', label: 'Networks', icon: <Signal className="w-4 h-4" /> },
    { value: 190, suffix: '+', label: 'Countries', icon: <Globe className="w-4 h-4" /> },
    { value: 99.95, suffix: '%', decimals: 2, label: 'Uptime', icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  return (
    <section className="relative py-32 md:py-44 overflow-hidden">
      {/* Layered aurora backgrounds */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-deep via-[#040812] to-brand-deep pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-brand-lime/[0.04] rounded-full blur-[200px] pointer-events-none" />
      <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-emerald-500/[0.03] rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-brand-lime/[0.03] rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full section-divider" />
      <div className="absolute bottom-0 left-0 w-full section-divider" />

      <div className="max-w-7xl mx-auto px-4 md:px-12 lg:px-24 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-center mb-8 md:mb-0"
        >
          <p className="text-brand-lime text-sm font-semibold uppercase tracking-widest mb-6 font-display">Global Network</p>
          <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight font-display leading-[1.05] mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/40">One SIM.</span>
            <br />
            <span className="gradient-text">Every network.</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg md:text-xl font-light leading-relaxed">
            Forget roaming agreements and regional SIM cards. Our Hyper SIM connects natively to <strong className="text-white font-medium">550+ carriers across 190+ countries</strong> — with intelligent fallback that keeps your fleet online.
          </p>
        </motion.div>

        {/* Globe + floating stats */}
        <div className="relative flex items-center justify-center -my-8 md:-my-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          >
            <GridGlobe />
          </motion.div>

          {/* Large ambient glow behind globe */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-brand-lime/[0.06] blur-[150px] rounded-full pointer-events-none" />

          {/* Floating stat pills — positioned around the globe */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="absolute left-0 md:left-[5%] top-[20%] hidden md:block"
          >
            <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-4 shadow-2xl">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 rounded-lg bg-brand-lime/20 flex items-center justify-center text-brand-lime"><Signal className="w-4 h-4" /></div>
                <span className="text-2xl font-bold text-white font-display"><AnimatedCounter end={550} suffix="+" /></span>
              </div>
              <p className="text-xs text-gray-400 pl-11">Carrier networks</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6, duration: 0.7 }}
            className="absolute right-0 md:right-[5%] top-[30%] hidden md:block"
          >
            <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-4 shadow-2xl">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 rounded-lg bg-brand-lime/20 flex items-center justify-center text-brand-lime"><Globe className="w-4 h-4" /></div>
                <span className="text-2xl font-bold text-white font-display"><AnimatedCounter end={190} suffix="+" /></span>
              </div>
              <p className="text-xs text-gray-400 pl-11">Countries covered</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8, duration: 0.7 }}
            className="absolute left-[10%] md:left-[15%] bottom-[15%] hidden md:block"
          >
            <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-4 shadow-2xl">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 rounded-lg bg-brand-lime/20 flex items-center justify-center text-brand-lime"><ShieldCheck className="w-4 h-4" /></div>
                <span className="text-2xl font-bold text-white font-display"><AnimatedCounter end={99.95} suffix="%" decimals={2} /></span>
              </div>
              <p className="text-xs text-gray-400 pl-11">Guaranteed uptime</p>
            </div>
          </motion.div>

          {/* Live activity indicator */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 1, duration: 0.7 }}
            className="absolute right-[8%] md:right-[12%] bottom-[20%] hidden lg:block"
          >
            <div className="bg-white/[0.04] backdrop-blur-xl border border-brand-lime/20 rounded-2xl px-5 py-4 shadow-2xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-lime opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-lime"></span>
                </span>
                <span className="text-xs font-semibold text-brand-lime font-display">LIVE</span>
              </div>
              <div className="text-[10px] text-gray-400 space-y-1">
                <div className="flex justify-between gap-6"><span>Devices online</span><span className="text-white font-medium">2.4M+</span></div>
                <div className="flex justify-between gap-6"><span>Data sessions</span><span className="text-white font-medium">847K</span></div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Mobile stat row (visible on small screens) */}
        <div className="grid grid-cols-3 gap-3 mt-8 md:hidden">
          {globeStats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/[0.04] backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center"
            >
              <div className="text-brand-lime mb-1 flex justify-center">{stat.icon}</div>
              <div className="text-lg font-bold text-white font-display">
                <AnimatedCounter end={stat.value} suffix={stat.suffix} decimals={stat.decimals || 0} />
              </div>
              <div className="text-[10px] text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- Process Steps (Polished with gradient line) ---

const ProcessSteps = () => {
  const steps = [
    { num: "01", title: "Ditch the contract", desc: "Sign up instantly without talking to a salesperson. No commitments required." },
    { num: "02", title: "Swap the SIM", desc: "Replace your legacy SIMs with our eUICC Hyper SIMs. It takes seconds." },
    { num: "03", title: "Take control", desc: "Use our dashboard to pause, resume, and monitor your entire fleet in real-time." },
  ];

  return (
    <Section id="how-it-works">
      <div className="grid lg:grid-cols-2 gap-20 items-center">
        <div>
          <p className="text-brand-lime text-sm font-semibold uppercase tracking-widest mb-4 font-display">How It Works</p>
          <h2 className="text-5xl lg:text-7xl font-bold mb-16 tracking-tight font-display">Switching is easier<br />than you think.</h2>
          <div className="space-y-12 relative">
            {/* Connecting gradient line */}
            <div className="absolute left-8 top-16 bottom-16 w-px bg-gradient-to-b from-brand-lime/40 via-brand-lime/10 to-transparent hidden md:block" />

            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="flex gap-8 group relative"
              >
                <div className="w-16 h-16 shrink-0 rounded-2xl bg-gradient-to-br from-brand-lime/20 to-transparent border border-brand-lime/20 flex items-center justify-center text-xl font-mono text-brand-lime/70 group-hover:border-brand-lime group-hover:text-brand-lime group-hover:from-brand-lime/30 transition-all duration-300 font-display relative z-10">
                  {step.num}
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-brand-lime transition-colors font-display">{step.title}</h3>
                  <p className="text-gray-400 max-w-sm text-lg leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="relative h-[700px] bg-white/[0.02] rounded-[3rem] border border-white/5 overflow-hidden hidden lg:block backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-brand-deep/90 z-10"></div>
          <img
            src="/iot-device.jpg"
            alt="IoT Device"
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-luminosity hover:mix-blend-normal transition-all duration-1000 transform hover:scale-105"
          />
          <div className="absolute bottom-12 left-12 z-20">
            <div className="text-brand-lime font-mono text-sm mb-2 font-display">CONNECTED</div>
            <div className="text-2xl font-bold font-display">Smart Logistics Tracker V2</div>
          </div>
        </div>
      </div>
    </Section>
  );
};

// --- Pricing (Polished with shimmer on featured) ---

const Pricing = () => {
  return (
    <Section id="pricing" className="bg-white/[0.01] border-t border-white/5">
      <div className="text-center mb-16 md:mb-20 px-4">
        <p className="text-brand-lime text-sm font-semibold uppercase tracking-widest mb-4 font-display">Pricing</p>
        <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight font-display">Pay for data, not contracts</h2>
        <p className="text-gray-400 text-lg md:text-xl font-light max-w-2xl mx-auto">Flexible pricing that scales with your fleet, not your negotiation skills.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
        <motion.div
          whileHover={{ y: -10 }}
          className="p-8 md:p-10 rounded-3xl bg-brand-deep border border-white/10 flex flex-col relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <h3 className="text-xl md:text-2xl font-bold mb-2 font-display">Maker</h3>
          <div className="text-4xl md:text-5xl font-bold mb-8 tracking-tighter font-display">$0.00 <span className="text-base font-medium text-gray-500 tracking-normal">/ mo</span></div>
          <p className="text-gray-400 text-sm md:text-base mb-10 leading-relaxed">For prototyping. Includes 1 SIM and free pilot data.</p>
          <ul className="space-y-5 mb-10 flex-1">
            {['No credit card required', 'Instant activation', 'Community Support'].map(f => (
              <li key={f} className="flex gap-4 text-gray-300"><CheckCircle2 className="w-5 h-5 text-brand-lime shrink-0" /> {f}</li>
            ))}
          </ul>
          <Button variant="outline" className="w-full py-4" href="https://dashboard.hologram.io/account/register">Start Free</Button>
        </motion.div>

        <motion.div
          whileHover={{ y: -10 }}
          className="p-8 md:p-10 rounded-3xl bg-brand-slate relative flex flex-col translate-y-0 md:-translate-y-4 shimmer-border animated-border"
        >
          <div className="absolute top-0 right-0 bg-brand-lime text-black text-[10px] font-bold px-4 py-1.5 rounded-bl-xl uppercase tracking-widest z-10 font-display">Selected</div>
          <h3 className="text-xl md:text-2xl font-bold mb-2 text-brand-lime font-display">Professional</h3>
          <div className="text-4xl md:text-5xl font-bold mb-8 tracking-tighter text-white font-display">Usage <span className="text-base font-medium text-gray-400 tracking-normal">Based</span></div>
          <p className="text-gray-300 text-sm md:text-base mb-10 leading-relaxed">Pay only for the data you use. No minimums, no hidden fees, and <strong className="text-white font-medium">no roaming surcharges</strong> in 190+ countries.</p>
          <ul className="space-y-5 mb-10 flex-1">
            {['Global roaming included', 'API Access', 'Standard Support', 'Team management'].map(f => (
              <li key={f} className="flex gap-4 text-white font-medium"><CheckCircle2 className="w-5 h-5 text-brand-lime shrink-0" /> {f}</li>
            ))}
          </ul>
          <Button variant="primary" className="w-full py-4 font-bold font-display" href="https://www.hologram.io/pricing/">See Rates</Button>
        </motion.div>

        <motion.div
          whileHover={{ y: -10 }}
          className="p-8 md:p-10 rounded-3xl bg-brand-deep border border-white/10 flex flex-col group relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <h3 className="text-xl md:text-2xl font-bold mb-2 font-display">Enterprise</h3>
          <div className="text-4xl md:text-5xl font-bold mb-8 tracking-tighter font-display">Volume</div>
          <p className="text-gray-400 text-sm md:text-base mb-10 leading-relaxed">Discounts for large fleets with predictable data usage.</p>
          <ul className="space-y-5 mb-10 flex-1">
            {['Volume discounts', 'Private APNs', 'SLA Support', 'Dedicated Success Manager'].map(f => (
              <li key={f} className="flex gap-4 text-gray-300"><CheckCircle2 className="w-5 h-5 text-brand-lime shrink-0" /> {f}</li>
            ))}
          </ul>
          <Button variant="outline" className="w-full py-4" href="https://www.hologram.io/contact-sales/">Contact Sales</Button>
        </motion.div>
      </div>
    </Section>
  );
};

// --- FAQ (Polished with lime accent) ---

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    { q: "How is Hologram different from AT&T or Verizon?", a: "Unlike legacy carriers that lock you into a single network, Hologram is a carrier-agnostic platform. Our Hyper SIM gives you native access to 550+ carriers globally. If one network goes down, our intelligent fallback automatically switches you to the strongest available signal." },
    { q: "What is eUICC and why does it matter?", a: "eUICC (Embedded Universal Integrated Circuit Card) allows you to store and move between multiple carrier profiles on a single SIM. This means you can update your fleet's connectivity over-the-air (OTA) without ever needing to physically touch the device." },
    { q: "Can I remotely access my devices in the field?", a: "Yes. Using our Spacebridge tool, you can create secure, authenticated tunnels to your devices from anywhere. This allows for remote debugging, SSH access, and configuration updates without needing a static public IP." },
    { q: "How does Hologram handle enterprise-grade security?", a: "We provide security at the network level. Every SIM can be locked to a specific IMEI to prevent theft, and we offer Private APNs to keep your device traffic off the public internet. Our Software-Defined Network (SDN) also includes multi-layer firewalls as standard." },
    { q: "What happens if a specific network goes down?", a: "Our Hyper SIMs are designed with Multi-Carrier Redundancy. If a carrier experiences an outage, the SIM will automatically scan for and connect to the next best available network in that area, ensuring your devices stay online." },
    { q: "Is it really one SIM for the whole world?", a: "Yes. Hologram offers a single SKU for global deployments. You don't need to manage different SIM cards or contracts for different regions. One SIM provides native-quality connectivity in 190+ countries across 550+ carriers." },
    { q: "How does the API help with scaling large fleets?", a: "Our modern REST API allows you to automate everything. You can programmatically activate SIMs, set data limits, change usage plans, and pull real-time diagnostic data. This eliminates the manual overhead typical of legacy carrier portals." },
    { q: "Do I need to sign a contract?", a: "No. Our standard plans are pay-as-you-go with no long-term commitments. Use our dashboard or API to pause, resume, or cancel SIMs instantly." },
    { q: "Does the pricing vary by country?", a: "We offer simplified zonal pricing. Most major regions are included in Zone 1 with flat, transparent rates and no hidden roaming fees. Full rate transparency is available in your dashboard." },
  ];

  return (
    <Section className="max-w-4xl mx-auto py-32">
      <p className="text-brand-lime text-sm font-semibold uppercase tracking-widest mb-4 text-center font-display">FAQ</p>
      <h2 className="text-4xl md:text-5xl font-bold mb-16 text-center font-display">Questions about switching?</h2>
      <div className="space-y-3">
        {faqs.map((item, i) => (
          <div
            key={i}
            className={`border rounded-2xl bg-white/[0.02] overflow-hidden transition-all duration-300 ${openIndex === i
              ? 'border-brand-lime/30 bg-brand-lime/[0.03] shadow-[0_0_30px_-10px_rgba(191,253,17,0.1)]'
              : 'border-white/10 hover:bg-white/[0.04]'
              }`}
          >
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              aria-expanded={openIndex === i}
              className="w-full flex items-center justify-between p-7 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime focus-visible:ring-inset rounded-2xl"
            >
              <span className="font-semibold text-lg pr-8 font-display">{item.q}</span>
              <motion.span
                animate={{ rotate: openIndex === i ? 45 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <Plus className={`transition-colors duration-300 ${openIndex === i ? 'text-brand-lime' : 'text-gray-500'}`} />
              </motion.span>
            </button>
            <AnimatePresence>
              {openIndex === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-7 pb-7 text-gray-400 leading-relaxed text-lg border-t border-white/5 pt-5">
                    {item.a}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </Section>
  );
};

// --- Dashboard Spotlight (with Demo Overlay) ---

const DashboardSpotlight = () => {
  const [showDemo, setShowDemo] = useState(false);

  // Lock body scroll when overlay is open
  useEffect(() => {
    document.body.style.overflow = showDemo ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showDemo]);

  const highlights = [
    {
      title: "360\u00B0 Fleet Visibility",
      desc: "Real-time analytics and predictive insights into device behavior before issues impact your customers.",
      icon: <LayoutDashboard className="w-5 h-5" />
    },
    {
      title: "Granular Cost Control",
      desc: "Change plans, set custom data caps, and pause SIMs instantly with total transparency.",
      icon: <Zap className="w-5 h-5" />
    },
    {
      title: "Collaborative Diagnostics",
      desc: "Developers, PMs, and ops collaborate on device-level logs with custom permission levels.",
      icon: <Users className="w-5 h-5" />
    },
    {
      title: "Automated Outage Protection",
      desc: "Dual-core network manages fallback behavior, ensuring mission-critical devices never go dark.",
      icon: <ShieldCheck className="w-5 h-5" />
    }
  ];

  return (
    <>
      <section id="dashboard-spotlight" className="relative py-24 md:py-32 overflow-hidden scroll-mt-24">
        {/* Ambient background */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-lime/5 blur-[150px] rounded-full -z-10 translate-x-1/3 -translate-y-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/[0.04] blur-[120px] rounded-full -z-10 -translate-x-1/3 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 md:px-12 lg:px-24">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12 md:mb-16"
          >
            <p className="text-brand-lime text-sm font-semibold uppercase tracking-widest mb-4 font-display">Dashboard</p>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight text-white leading-tight font-display">
              An operating system <br />
              <span className="gradient-text">for your IoT fleet.</span>
            </h2>
            <p className="text-gray-400 text-lg md:text-xl mb-4 font-light leading-relaxed max-w-2xl mx-auto">
              Legacy carrier portals feel like they were built in the 90s. We built a modern, intuitive control center that gives you total command over your hardware at global scale.
            </p>
          </motion.div>

          {/* Dashboard mockup — click to play demo */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="relative mb-16 cursor-pointer group"
            onClick={() => setShowDemo(true)}
          >
            <div className="relative rounded-2xl border border-white/[0.08] bg-brand-deep shadow-3xl overflow-hidden h-[280px] sm:h-[400px] md:h-[500px] lg:h-[600px] animated-border">
              <DashboardMockup />

              {/* Hover overlay with play button */}
              <div className="absolute inset-0 bg-brand-deep/0 group-hover:bg-brand-deep/50 transition-all duration-500 z-20 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 scale-90 group-hover:scale-100 flex flex-col items-center gap-4">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-brand-lime flex items-center justify-center text-black shadow-[0_0_60px_rgba(191,253,17,0.4)] group-hover:shadow-[0_0_80px_rgba(191,253,17,0.6)] transition-all duration-500">
                    <Play className="w-8 h-8 md:w-10 md:h-10 ml-1" fill="currentColor" />
                  </div>
                  <span className="text-white font-semibold text-base md:text-lg font-display">Watch the demo</span>
                </div>
              </div>
            </div>

            {/* Glow behind mockup */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] h-[85%] bg-brand-lime/15 blur-[100px] -z-10 rounded-full group-hover:bg-brand-lime/25 transition-all duration-700" />
          </motion.div>

          {/* Feature cards — 4-column grid beneath the mockup */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {highlights.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-brand-lime/20 transition-all duration-500"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-lime/10 flex items-center justify-center text-brand-lime mb-4 group-hover:bg-brand-lime group-hover:text-black transition-all duration-300 border border-brand-lime/20">
                  {item.icon}
                </div>
                <h3 className="text-base font-bold mb-2 text-white font-display">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Video demo overlay */}
      <AnimatePresence>
        {showDemo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9998] flex items-center justify-center p-4 md:p-8"
            onClick={() => setShowDemo(false)}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

            {/* Modal */}
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="relative w-full max-w-5xl aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_100px_rgba(191,253,17,0.15)]"
              onClick={(e) => e.stopPropagation()}
            >
              <iframe
                src="https://app.guidde.com/share/playbooks/vUznNL1bGLBJSjMZVZn7hs"
                title="Hologram Dashboard Demo"
                className="absolute inset-0 w-full h-full bg-brand-deep"
                frameBorder="0"
                allow="autoplay; clipboard-write"
                allowFullScreen
              />

              {/* Close button */}
              <button
                onClick={() => setShowDemo(false)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 border border-white/10 flex items-center justify-center text-white transition-colors z-10 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime"
                aria-label="Close demo video"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// --- Cinematic CTA Section ---

const CinematicCTA = () => {
  return (
    <section className="relative py-32 md:py-40 overflow-hidden">
      {/* Aurora background effects */}
      <div className="absolute inset-0 aurora-glow opacity-20 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-brand-lime/[0.08] rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full section-divider" />
      <div className="absolute bottom-0 left-0 w-full section-divider" />

      <div className="max-w-4xl mx-auto text-center relative z-10 px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold font-display tracking-tight mb-8 leading-[1.05]">
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/50">Ready to</span>
            <br />
            <span className="gradient-text">break free?</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
            Join 6,000+ companies that ditched legacy carriers for smarter, cheaper, more reliable IoT connectivity.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button variant="primary" className="px-10 py-5 text-lg font-display" href="https://dashboard.hologram.io/account/register">Get Started Free</Button>
            <Button variant="outline" className="px-10 py-5 text-lg" href="https://www.hologram.io/contact-sales/">Talk to Sales</Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// --- Footer (Polished) ---

const Footer = () => {
  return (
    <footer className="bg-brand-deep border-t border-white/5 pt-24 pb-12 relative z-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-16 mb-20 text-white">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center mb-8 h-10">
              <img src="/Logo Lime@2x.png" alt="Hologram" className="h-full w-auto" />
            </div>
            <p className="text-gray-400 text-base mb-8 leading-relaxed">
              Connectivity for the next billion devices.
            </p>
            <div className="flex gap-4">
              <button aria-label="Follow Hologram" className="w-10 h-10 rounded-full bg-white/5 hover:bg-brand-lime hover:text-black flex items-center justify-center transition-all duration-300 cursor-pointer shadow-lg shadow-brand-lime/0 hover:shadow-brand-lime/20 font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime"><ArrowRight className="w-5 h-5" /></button>
              <button aria-label="Contact us" className="w-10 h-10 rounded-full bg-white/5 hover:bg-brand-lime hover:text-black flex items-center justify-center transition-all duration-300 cursor-pointer shadow-lg shadow-brand-lime/0 hover:shadow-brand-lime/20 font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime"><MessageSquare className="w-5 h-5" /></button>
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-8 text-white text-lg font-display">Platform</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><a href="https://www.hologram.io/products/global-iot-sim-card/" className="hover:text-brand-lime transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime">Hyper SIM</a></li>
              <li><a href="https://www.hologram.io/coverage/" className="hover:text-brand-lime transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime">Global Network</a></li>
              <li><a href="https://www.hologram.io/products/dashboard/" className="hover:text-brand-lime transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime">Dashboard</a></li>
              <li><a href="https://docs.hologram.io/api/" className="hover:text-brand-lime transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime">REST API</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-8 text-white text-lg font-display">Compare</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><a href="#compare" onClick={(e) => { e.preventDefault(); scrollToSection('compare'); }} className="hover:text-brand-lime transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime">vs. Twilio Super SIM</a></li>
              <li><a href="#compare" onClick={(e) => { e.preventDefault(); scrollToSection('compare'); }} className="hover:text-brand-lime transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime">vs. AT&amp;T / Verizon</a></li>
              <li><a href="#compare" onClick={(e) => { e.preventDefault(); scrollToSection('compare'); }} className="hover:text-brand-lime transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime">vs. 1NCE</a></li>
              <li><a href="#compare" onClick={(e) => { e.preventDefault(); scrollToSection('compare'); }} className="hover:text-brand-lime transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime">vs. Particle</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-8 text-white text-lg font-display">Updates</h4>
            <div className="flex flex-col gap-4">
              <input
                type="email"
                placeholder="Enter your email"
                aria-label="Email address for updates"
                className="bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:border-brand-lime focus-visible:ring-2 focus-visible:ring-brand-lime transition-colors shadow-inner"
              />
              <Button variant="primary" className="w-full py-3">Subscribe</Button>
            </div>
          </div>
        </div>

        <div className="section-divider mb-10" />

        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-600">
          <p>&copy; 2026 Hologram Inc. All rights reserved.</p>
          <div className="flex gap-8 mt-6 md:mt-0">
            <a href="#" className="hover:text-white transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime px-1">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime px-1">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

// --- App (with grain texture overlay) ---

const App = () => {
  return (
    <div className="min-h-screen text-white font-sans selection:bg-brand-lime selection:text-black relative overflow-x-hidden grain">

      <div className="relative z-10">
        <Navbar />
        <Hero />
        <LogoCloud />
        <ComparisonTable />
        <DashboardSpotlight />
        <FeatureGrid />
        <Testimonial />
        <IntegrationHub />
        <ProcessSteps />
        <CinematicCTA />
        <FAQ />
        <Footer />
      </div>
    </div>
  );
};

export default App;