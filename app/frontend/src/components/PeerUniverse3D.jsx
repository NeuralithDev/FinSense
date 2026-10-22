import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Users, 
  Sparkles, 
  Compass, 
  Share2, 
  TrendingUp, 
  ShieldCheck, 
  Eye, 
  ArrowRight, 
  Award, 
  Layers, 
  Zap, 
  Info, 
  Download, 
  Check, 
  Copy,
  Maximize2,
  RotateCcw,
  Sliders
} from 'lucide-react';
import { fetch3DPeerGalaxy, simulatePeerClimb, fetchTwins } from '../services/api';
import { useCurrency } from '../design-system/currencyStore';
import { useTheme } from '../design-system/themeStore';

export default function PeerUniverse3D() {
  const { format, currency, symbol } = useCurrency();
  const { isDark } = useTheme();

  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const [galaxyData, setGalaxyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [viewMode, setViewMode] = useState('twin_cluster'); // 'twin_cluster', 'top_10', 'all_galaxies'
  
  // Slider state for "Climb the Peer Rank"
  const defaultStep = currency === 'INR' ? 1000 : 100;
  const maxSavings = currency === 'INR' ? 5000 : 500;
  const [additionalSavings, setAdditionalSavings] = useState(0);
  const [climbSim, setClimbSim] = useState(null);

  // Wrapped Share Modal
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // 3D Orbital Camera Physics State
  const cameraRef = useRef({
    rotX: 0.25,
    rotY: -0.35,
    targetRotX: 0.25,
    targetRotY: -0.35,
    zoom: 1.25,
    targetZoom: 1.25,
    panX: 0,
    panY: 0,
    targetPanX: 0,
    targetPanY: 0,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
    heroOffset: [0, 0, 0] // Dynamic translation when climbing
  });

  useEffect(() => {
    loadGalaxy();
  }, []);

  const loadGalaxy = async () => {
    setLoading(true);
    try {
      const res = await fetch3DPeerGalaxy('0');
      if (res && res.nodes) {
        setGalaxyData(res);
      } else {
        // Fallback twin fetch
        const twinsRes = await fetchTwins('0');
        setGalaxyData({
          nodes: [],
          twins: twinsRes.twins,
          radar_comparison: twinsRes.radar_comparison
        });
      }
    } catch (e) {
      console.error('Failed to load 3D Galaxy:', e);
    } finally {
      setLoading(false);
    }
  };

  // Handle Climb Slider change
  const handleSliderChange = async (val) => {
    const num = Number(val);
    setAdditionalSavings(num);
    try {
      const res = await simulatePeerClimb(num, '0');
      if (res && res.status === 'success') {
        setClimbSim(res);
        // Animate hero node in 3D toward top cluster
        const currentCoords = [12.0, 8.0, 15.0];
        const newCoords = res.new_3d_coordinates;
        cameraRef.current.heroOffset = [
          newCoords[0] - currentCoords[0],
          newCoords[1] - currentCoords[1],
          newCoords[2] - currentCoords[2]
        ];
      }
    } catch (e) {
      console.warn('Simulation fallback:', e);
    }
  };

  // Camera presets
  const applyCameraPreset = (mode) => {
    setViewMode(mode);
    const cam = cameraRef.current;
    if (mode === 'twin_cluster') {
      cam.targetRotX = 0.25;
      cam.targetRotY = -0.35;
      cam.targetZoom = 1.35;
      cam.targetPanX = 0;
      cam.targetPanY = 0;
    } else if (mode === 'top_10') {
      cam.targetRotX = 0.45;
      cam.targetRotY = -1.15;
      cam.targetZoom = 1.15;
      cam.targetPanX = -40;
      cam.targetPanY = 30;
    } else {
      cam.targetRotX = 0.15;
      cam.targetRotY = 0.85;
      cam.targetZoom = 0.85;
      cam.targetPanX = 0;
      cam.targetPanY = 0;
    }
  };

  // 60FPS 3D PERSPECTIVE PROJECTION RENDER LOOP
  useEffect(() => {
    if (!galaxyData || !galaxyData.nodes || galaxyData.nodes.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const nodes = galaxyData.nodes;
    const heroNode = nodes.find(n => n.is_hero) || nodes[0];
    const twinNodes = nodes.filter(n => n.is_twin);

    // Orbital drag listeners
    const onMouseDown = (e) => {
      cameraRef.current.isDragging = true;
      cameraRef.current.lastMouseX = e.clientX;
      cameraRef.current.lastMouseY = e.clientY;
    };

    const onMouseMove = (e) => {
      const cam = cameraRef.current;
      if (cam.isDragging) {
        const dx = e.clientX - cam.lastMouseX;
        const dy = e.clientY - cam.lastMouseY;
        cam.targetRotY += dx * 0.006;
        cam.targetRotX += dy * 0.006;
        // Limit pitch
        cam.targetRotX = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, cam.targetRotX));
        cam.lastMouseX = e.clientX;
        cam.lastMouseY = e.clientY;
      } else {
        // Node raycasting / hit test
        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
        const my = (e.clientY - rect.top) * (canvas.height / rect.height);
        
        // Find closest projected screen node within 15px radius
        let closest = null;
        let minD = 18;
        if (canvas._projectedNodes) {
          for (let p of canvas._projectedNodes) {
            const d = Math.hypot(p.sx - mx, p.sy - my);
            if (d < minD && p.sz > 0) {
              minD = d;
              closest = p.node;
            }
          }
        }
        setHoveredNode(closest);
      }
    };

    const onMouseUp = () => {
      cameraRef.current.isDragging = false;
    };

    const onWheel = (e) => {
      e.preventDefault();
      const cam = cameraRef.current;
      cam.targetZoom = Math.max(0.5, Math.min(2.8, cam.targetZoom - e.deltaY * 0.0015));
    };

    // Touch support for mobile/tablet
    let touchStartDist = 0;
    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        cameraRef.current.isDragging = true;
        cameraRef.current.lastMouseX = e.touches[0].clientX;
        cameraRef.current.lastMouseY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        touchStartDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    };

    const onTouchMove = (e) => {
      if (e.touches.length === 1 && cameraRef.current.isDragging) {
        const dx = e.touches[0].clientX - cameraRef.current.lastMouseX;
        const dy = e.touches[0].clientY - cameraRef.current.lastMouseY;
        cameraRef.current.targetRotY += dx * 0.008;
        cameraRef.current.targetRotX += dy * 0.008;
        cameraRef.current.lastMouseX = e.touches[0].clientX;
        cameraRef.current.lastMouseY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const diff = dist - touchStartDist;
        cameraRef.current.targetZoom = Math.max(0.5, Math.min(2.8, cameraRef.current.targetZoom + diff * 0.005));
        touchStartDist = dist;
      }
    };

    const onTouchEnd = () => {
      cameraRef.current.isDragging = false;
    };

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchmove', onTouchMove, { passive: true });
    canvas.addEventListener('touchend', onTouchEnd, { passive: true });

    // Main 3D Render Loop
    let time = 0;
    const render = () => {
      time += 0.016;
      const cam = cameraRef.current;

      // Spring damping physics
      cam.rotX += (cam.targetRotX - cam.rotX) * 0.08;
      cam.rotY += (cam.targetRotY - cam.rotY) * 0.08;
      cam.zoom += (cam.targetZoom - cam.zoom) * 0.08;
      cam.panX += (cam.targetPanX - cam.panX) * 0.08;
      cam.panY += (cam.targetPanY - cam.panY) * 0.08;

      // Idle gentle celestial orbit if not dragging
      if (!cam.isDragging && viewMode === 'all_galaxies') {
        cam.targetRotY += 0.0008;
      }

      // Responsive viewport size
      const width = canvas.width = canvas.parentElement.clientWidth;
      const height = canvas.height = canvas.parentElement.clientHeight || 520;

      ctx.clearRect(0, 0, width, height);

      // Background celestial depth gradient
      const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, width * 0.8);
      if (isDark) {
        bgGrad.addColorStop(0, '#0F172A');
        bgGrad.addColorStop(0.6, '#0B0F19');
        bgGrad.addColorStop(1, '#070A12');
      } else {
        bgGrad.addColorStop(0, '#FFFFFF');
        bgGrad.addColorStop(0.6, '#F8FAFC');
        bgGrad.addColorStop(1, '#F1F5F9');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Rotation matrix values
      const cosX = Math.cos(cam.rotX);
      const sinX = Math.sin(cam.rotX);
      const cosY = Math.cos(cam.rotY);
      const sinY = Math.sin(cam.rotY);

      const focalLength = 380 * cam.zoom;
      const cx = width / 2 + cam.panX;
      const cy = height / 2 + cam.panY;

      // Transform all nodes from 3D to 2D
      const projected = [];
      const heroOffsetX = cam.heroOffset[0];
      const heroOffsetY = cam.heroOffset[1];
      const heroOffsetZ = cam.heroOffset[2];

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        let px = n.x;
        let py = n.y;
        let pz = n.z;

        // Apply dynamic climb offset if hero node
        if (n.is_hero) {
          px += heroOffsetX;
          py += heroOffsetY;
          pz += heroOffsetZ;
        }

        // 3D Yaw Rotation (around Y axis)
        const x1 = px * cosY - pz * sinY;
        const z1 = px * sinY + pz * cosY;

        // 3D Pitch Rotation (around X axis)
        const y2 = py * cosX - z1 * sinX;
        const z2 = py * sinX + z1 * cosX;

        // Camera distance shift
        const zCam = z2 + 220;

        if (zCam > 5) {
          const factor = focalLength / zCam;
          const sx = cx + x1 * factor;
          const sy = cy - y2 * factor; // Invert Y for screen coords
          const scale = Math.max(0.4, factor * 0.85);

          projected.push({
            node: n,
            sx,
            sy,
            sz: zCam,
            scale,
            x1,
            y2,
            is_hero: n.is_hero,
            is_twin: n.is_twin
          });
        }
      }

      // Store projected nodes on canvas for raycasting
      canvas._projectedNodes = projected;

      // Sort back-to-front (painter's algorithm)
      projected.sort((a, b) => b.sz - a.sz);

      // 1. Draw glowing tether lines from Hero to 5 Twins
      const heroProj = projected.find(p => p.is_hero);
      if (heroProj) {
        ctx.save();
        for (let p of projected) {
          if (p.is_twin) {
            // Glowing tether curve
            ctx.beginPath();
            ctx.moveTo(heroProj.sx, heroProj.sy);
            
            // Midpoint curved control point with subtle pulsation
            const mx = (heroProj.sx + p.sx) / 2 + Math.sin(time * 2 + p.node.x) * 12;
            const my = (heroProj.sy + p.sy) / 2 + Math.cos(time * 2 + p.node.y) * 12;
            ctx.quadraticCurveTo(mx, my, p.sx, p.sy);

            ctx.strokeStyle = isDark ? 'rgba(20, 184, 166, 0.45)' : 'rgba(13, 148, 136, 0.35)';
            ctx.lineWidth = 1.5 * heroProj.scale;
            ctx.stroke();

            // Animated light energy pulse traveling along tether
            const progress = (time * 0.8 + p.node.percentile * 0.1) % 1.0;
            const pxTether = (1 - progress) * (1 - progress) * heroProj.sx + 2 * (1 - progress) * progress * mx + progress * progress * p.sx;
            const pyTether = (1 - progress) * (1 - progress) * heroProj.sy + 2 * (1 - progress) * progress * my + progress * progress * p.sy;

            ctx.beginPath();
            ctx.arc(pxTether, pyTether, 2.5 * p.scale, 0, Math.PI * 2);
            ctx.fillStyle = '#14B8A6';
            ctx.shadowColor = '#14B8A6';
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
        ctx.restore();
      }

      // 2. Draw all background constellation nodes
      for (let p of projected) {
        const isHovered = hoveredNode && hoveredNode.id === p.node.id;
        const radius = (p.is_hero ? 8 : (p.is_twin ? 5 : 2.5)) * p.scale * (isHovered ? 1.6 : 1.0);

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, Math.max(1.2, radius), 0, Math.PI * 2);

        if (p.is_hero) {
          // Pulsing Hero Glow
          const pulse = (Math.sin(time * 4) + 1) * 0.5;
          ctx.fillStyle = '#10B981';
          ctx.shadowColor = '#10B981';
          ctx.shadowBlur = 18 + pulse * 12;
          ctx.fill();

          // Outer halo ring
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, radius * (1.8 + pulse * 0.6), 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(16, 185, 129, ${0.4 + pulse * 0.3})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else if (p.is_twin) {
          ctx.fillStyle = p.node.color || '#14B8A6';
          ctx.shadowColor = '#14B8A6';
          ctx.shadowBlur = 8;
          ctx.fill();
        } else {
          // Background peer node
          const alpha = Math.max(0.25, Math.min(0.85, 1.0 - (p.sz - 120) / 280));
          ctx.fillStyle = p.node.color || (isDark ? '#64748B' : '#94A3B8');
          ctx.globalAlpha = isHovered ? 1.0 : alpha;
          ctx.fill();
        }

        ctx.restore();
      }

      // 3. Render Hero Node Screen Label
      if (heroProj) {
        ctx.save();
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.fillStyle = isDark ? '#F8FAFC' : '#0F172A';
        ctx.textAlign = 'center';
        ctx.fillText('⭐ YOU', heroProj.sx, heroProj.sy - 16 * heroProj.scale);
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
    };
  }, [galaxyData, isDark, viewMode, hoveredNode]);

  const radarData = galaxyData?.radar_comparison || {
    axes: [
      { name: 'Savings Rate', key: 'savings_rate' },
      { name: 'Emergency Runway', key: 'emergency_runway' },
      { name: 'Bill Efficiency', key: 'bill_efficiency' },
      { name: 'Weekend Control', key: 'weekend_control' },
      { name: 'Debt Freedom', key: 'debt_freedom' },
      { name: 'Auto-Save Consistency', key: 'autosave_consistency' }
    ],
    you: { savings_rate: 72, emergency_runway: 68, bill_efficiency: 85, weekend_control: 64, debt_freedom: 95, autosave_consistency: 80 },
    peer_average: { savings_rate: 50, emergency_runway: 48, bill_efficiency: 60, weekend_control: 52, debt_freedom: 65, autosave_consistency: 45 },
    top_10_percent: { savings_rate: 88, emergency_runway: 92, bill_efficiency: 94, weekend_control: 86, debt_freedom: 98, autosave_consistency: 95 }
  };

  // Active simulated or base radar
  const activeYouRadar = climbSim ? climbSim.updated_radar : radarData.you;
  const activePercentile = climbSim ? climbSim.new_percentile : 68;

  // Radar Polygon math
  const radarSvgPoints = useMemo(() => {
    const axes = radarData.axes;
    const count = axes.length;
    const center = 110;
    const maxRadius = 85;

    const getPolyPoints = (dataSet) => {
      return axes.map((ax, i) => {
        const val = dataSet[ax.key] || 50;
        const r = (val / 100) * maxRadius;
        const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(' ');
    };

    return {
      youPoints: getPolyPoints(activeYouRadar),
      peerPoints: getPolyPoints(radarData.peer_average),
      top10Points: getPolyPoints(radarData.top_10_percent)
    };
  }, [radarData, activeYouRadar]);

  return (
    <div style={{
      background: isDark ? '#111827' : '#FFFFFF',
      border: `1px solid ${isDark ? '#1E293B' : '#E2E8F0'}`,
      borderRadius: '20px',
      padding: '24px',
      boxShadow: isDark ? '0 8px 32px rgba(0, 0, 0, 0.4)' : '0 4px 20px rgba(15, 23, 42, 0.05)',
      color: isDark ? '#F8FAFC' : '#0F172A',
      marginBottom: '28px',
      transition: 'all 0.3s ease'
    }}>
      {/* 3D Showcase Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '16px',
        borderBottom: `1px solid ${isDark ? '#1E293B' : '#F1F5F9'}`,
        paddingBottom: '20px',
        marginBottom: '20px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: isDark ? 'rgba(16, 185, 129, 0.15)' : '#F0FDF4',
              border: `1px solid ${isDark ? 'rgba(16, 185, 129, 0.3)' : '#DCFCE7'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10B981'
            }}>
              <Compass size={20} />
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              People Like You: 3D Peer Universe
            </h2>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '3px 9px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #10B981 0%, #0D9488 100%)',
              color: '#FFFFFF',
              letterSpacing: '0.04em',
              textTransform: 'uppercase'
            }}>
              GraphSAGE AI
            </span>
          </div>
          <p style={{ fontSize: '0.86rem', color: isDark ? '#94A3B8' : '#64748B', margin: 0 }}>
            Compare your financial trajectory against 1,420 anonymous peers in your income tier. Drag to rotate, scroll to zoom.
          </p>
        </div>

        {/* View Mode Camera Buttons & Share */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            background: isDark ? '#0F172A' : '#F8FAFC',
            padding: '3px',
            borderRadius: '10px',
            border: `1px solid ${isDark ? '#1E293B' : '#E2E8F0'}`
          }}>
            {[
              { id: 'twin_cluster', label: 'My Twin Cluster' },
              { id: 'top_10', label: 'Top 10% Galaxy' },
              { id: 'all_galaxies', label: 'Whole Constellation' }
            ].map(pill => (
              <button
                key={pill.id}
                onClick={() => applyCameraPreset(pill.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '7px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  background: viewMode === pill.id ? (isDark ? '#1E293B' : '#FFFFFF') : 'transparent',
                  color: viewMode === pill.id ? '#10B981' : (isDark ? '#94A3B8' : '#64748B'),
                  boxShadow: viewMode === pill.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                {pill.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowShareModal(true)}
            style={{
              padding: '7px 14px',
              borderRadius: '10px',
              fontSize: '0.8rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #10B981 0%, #0D9488 100%)',
              color: '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
            }}
          >
            <Share2 size={15} />
            <span>Share Persona</span>
          </button>
        </div>
      </div>

      {/* 3D Canvas Container */}
      <div 
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          height: '460px',
          borderRadius: '16px',
          overflow: 'hidden',
          border: `1px solid ${isDark ? '#1E293B' : '#E2E8F0'}`,
          cursor: 'grab'
        }}
      >
        <canvas 
          ref={canvasRef} 
          style={{ width: '100%', height: '100%', display: 'block' }} 
        />

        {/* Floating Mini Controls & Hint */}
        <div style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(8px)',
          padding: '6px 14px',
          borderRadius: '20px',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0'}`,
          fontSize: '0.74rem',
          color: isDark ? '#94A3B8' : '#64748B'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
            You ({activePercentile}th %tile)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#14B8A6' }} />
            5 Financial Twins
          </span>
          <span>• Drag to Orbit • Pinch to Zoom</span>
        </div>

        {/* Reset Camera Button */}
        <button
          onClick={() => applyCameraPreset('twin_cluster')}
          title="Reset Orbit"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.9)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0'}`,
            color: isDark ? '#CBD5E1' : '#475569',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <RotateCcw size={15} />
        </button>

        {/* Hover / Tap Inspection Tooltip */}
        {hoveredNode && (
          <div style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            maxWidth: '310px',
            background: isDark ? 'rgba(15, 23, 42, 0.94)' : 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(12px)',
            borderRadius: '12px',
            padding: '12px 16px',
            border: `1px solid ${isDark ? '#334155' : '#CBD5E1'}`,
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            pointerEvents: 'none',
            zIndex: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontWeight: 800, fontSize: '0.85rem', color: hoveredNode.is_hero ? '#10B981' : (hoveredNode.color || '#14B8A6') }}>
                {hoveredNode.name}
              </span>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px',
                background: isDark ? '#1E293B' : '#F1F5F9',
                color: isDark ? '#94A3B8' : '#475569'
              }}>
                {hoveredNode.percentile}th Percentile
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: isDark ? '#CBD5E1' : '#334155', margin: '0 0 6px 0', lineHeight: 1.4 }}>
              {hoveredNode.tip}
            </p>
            <div style={{ display: 'flex', gap: '12px', fontSize: '0.72rem', color: isDark ? '#94A3B8' : '#64748B' }}>
              <span>Savings Rate: <strong>{hoveredNode.savings_rate}%</strong></span>
              <span>Buffer: <strong>{hoveredNode.runway_months} Mo</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* 2-COLUMN LOWER SECTION: 6-AXIS RADAR & CLIMB THE RANK SIMULATOR */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px',
        marginTop: '24px'
      }}>
        {/* Left: 6-Axis Radar Overlay */}
        <div style={{
          background: isDark ? '#0B0F19' : '#F8FAFC',
          borderRadius: '16px',
          border: `1px solid ${isDark ? '#1E293B' : '#E2E8F0'}`,
          padding: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>
              6-Axis Financial Capability Radar
            </h4>
            <div style={{ display: 'flex', gap: '12px', fontSize: '0.72rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10B981' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
                You ({activePercentile}th %)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#94A3B8' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94A3B8' }} />
                Peer Median
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#F59E0B' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B' }} />
                Top 10%
              </span>
            </div>
          </div>

          {/* SVG Radar */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <svg width="240" height="230" viewBox="0 0 220 220">
              {/* Concentric rings */}
              {[0.25, 0.5, 0.75, 1.0].map((frac, idx) => (
                <circle
                  key={idx}
                  cx="110"
                  cy="110"
                  r={85 * frac}
                  fill="none"
                  stroke={isDark ? '#1E293B' : '#E2E8F0'}
                  strokeDasharray={frac < 1.0 ? '2 2' : 'none'}
                />
              ))}

              {/* Axis Spoke Lines */}
              {radarData.axes.map((ax, idx) => {
                const count = radarData.axes.length;
                const angle = (Math.PI * 2 * idx) / count - Math.PI / 2;
                const x2 = 110 + 85 * Math.cos(angle);
                const y2 = 110 + 85 * Math.sin(angle);
                const lx = 110 + 102 * Math.cos(angle);
                const ly = 110 + 102 * Math.sin(angle);
                return (
                  <g key={idx}>
                    <line x1="110" y1="110" x2={x2} y2={y2} stroke={isDark ? '#1E293B' : '#E2E8F0'} strokeWidth="1" />
                    <text
                      x={lx}
                      y={ly + 3}
                      fill={isDark ? '#94A3B8' : '#64748B'}
                      fontSize="8.5"
                      fontWeight="700"
                      textAnchor="middle"
                    >
                      {ax.name}
                    </text>
                  </g>
                );
              })}

              {/* Top 10% Polygon */}
              <polygon
                points={radarSvgPoints.top10Points}
                fill="none"
                stroke="#F59E0B"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />

              {/* Peer Average Polygon */}
              <polygon
                points={radarSvgPoints.peerPoints}
                fill={isDark ? 'rgba(148, 163, 184, 0.08)' : 'rgba(100, 116, 139, 0.06)'}
                stroke={isDark ? '#64748B' : '#94A3B8'}
                strokeWidth="1.5"
              />

              {/* You Polygon */}
              <polygon
                points={radarSvgPoints.youPoints}
                fill={isDark ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.2)'}
                stroke="#10B981"
                strokeWidth="2.5"
              />
            </svg>
          </div>
        </div>

        {/* Right: "Climb the Peer Rank" Interactive Simulator */}
        <div style={{
          background: isDark ? '#0B0F19' : '#F8FAFC',
          borderRadius: '16px',
          border: `1px solid ${isDark ? '#1E293B' : '#E2E8F0'}`,
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sliders size={18} color="#10B981" />
                <h4 style={{ fontSize: '0.98rem', fontWeight: 800, margin: 0 }}>
                  "Climb the Peer Rank" Simulator
                </h4>
              </div>
              <span style={{
                fontSize: '0.78rem',
                fontWeight: 800,
                color: '#10B981',
                background: isDark ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7',
                padding: '3px 8px',
                borderRadius: '6px'
              }}>
                {climbSim ? climbSim.rank_boost : '+0%'} Rank Shift
              </span>
            </div>

            <p style={{ fontSize: '0.82rem', color: isDark ? '#94A3B8' : '#64748B', margin: '0 0 16px 0', lineHeight: 1.4 }}>
              Drag the savings booster below to physically move your 3D avatar node across the GraphSAGE latent manifold into the Top 10% Savers Galaxy!
            </p>

            {/* Slider */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                <span>Additional Monthly Savings:</span>
                <span style={{ color: '#10B981' }}>+{symbol}{additionalSavings.toLocaleString()} / mo</span>
              </div>
              <input
                type="range"
                min="0"
                max={maxSavings}
                step={defaultStep}
                value={additionalSavings}
                onChange={(e) => handleSliderChange(e.target.value)}
                style={{
                  width: '100%',
                  accentColor: '#10B981',
                  cursor: 'pointer'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: isDark ? '#64748B' : '#94A3B8', marginTop: '4px' }}>
                <span>+{symbol}0/mo</span>
                <span>+{symbol}{(maxSavings / 2).toLocaleString()}/mo</span>
                <span>+{symbol}{maxSavings.toLocaleString()}/mo</span>
              </div>
            </div>

            {/* Projected Milestone Badge */}
            <div style={{
              background: isDark ? '#111827' : '#FFFFFF',
              border: `1px solid ${isDark ? '#1E293B' : '#E2E8F0'}`,
              borderRadius: '12px',
              padding: '14px',
              marginBottom: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Award size={18} color="#F59E0B" />
                <span style={{ fontSize: '0.84rem', fontWeight: 800 }}>
                  {climbSim?.milestone_badge || 'Top 30% Disciplined Saver'}
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: isDark ? '#94A3B8' : '#64748B', margin: 0 }}>
                {climbSim 
                  ? `Annualized wealth accumulation: +${symbol}${climbSim.annualized_wealth_gain.toLocaleString()}. Traveled ${climbSim.distance_traveled_units} units toward ${climbSim.target_cluster}.` 
                  : `Save an extra ${symbol}${defaultStep}/mo to boost your peer rank from the 68th to the 78th percentile.`}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => handleSliderChange(maxSavings / 2)}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 700,
                border: `1px solid ${isDark ? '#334155' : '#CBD5E1'}`,
                background: 'transparent',
                color: isDark ? '#CBD5E1' : '#475569',
                cursor: 'pointer'
              }}
            >
              Recommended Plan
            </button>
            <button
              onClick={() => handleSliderChange(0)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 600,
                border: 'none',
                background: isDark ? '#1E293B' : '#E2E8F0',
                color: isDark ? '#94A3B8' : '#64748B',
                cursor: 'pointer'
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* PRIVACY-SAFE "MONEY WRAPPED" SHARE MODAL */}
      {showShareModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: isDark ? '#111827' : '#FFFFFF',
            border: `1px solid ${isDark ? '#1E293B' : '#E2E8F0'}`,
            borderRadius: '24px',
            maxWidth: '440px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            {/* Wrapped Card Preview (Privacy Safe: Zero balances shown) */}
            <div style={{
              background: 'linear-gradient(135deg, #090D16 0%, #064E3B 50%, #0F172A 100%)',
              padding: '32px 28px',
              color: '#FFFFFF',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={18} color="#10B981" />
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#10B981' }}>
                    FinSense Wrapped
                  </span>
                </div>
                <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600 }}>Verified Ledger</span>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <span style={{ fontSize: '0.8rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Money Persona Badge
                </span>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 900, margin: '4px 0 8px 0', letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                  Disciplined Wealth Builder
                </h3>
                <div style={{ display: 'inline-block', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '20px', padding: '4px 12px', fontSize: '0.8rem', fontWeight: 700, color: '#34D399' }}>
                  Top {100 - activePercentile}% Peer Saver Nationwide
                </div>
              </div>

              {/* 3 Privacy Safe Metrics */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '14px',
                padding: '14px',
                marginBottom: '20px'
              }}>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>Runway</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>4.8 Mo</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>Auto-Save</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#34D399' }}>100%</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>Overdraft</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#34D399' }}>0.0%</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#64748B' }}>
                <span>No dollar balances revealed</span>
                <span>finsense.ai</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ padding: '20px', display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  border: `1px solid ${isDark ? '#334155' : '#CBD5E1'}`,
                  background: 'transparent',
                  color: isDark ? '#F8FAFC' : '#0F172A',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                {copiedLink ? <Check size={16} color="#10B981" /> : <Copy size={16} />}
                <span>{copiedLink ? 'Copied Link!' : 'Copy Share Link'}</span>
              </button>

              <button
                onClick={() => setShowShareModal(false)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isDark ? '#1E293B' : '#F1F5F9',
                  color: isDark ? '#CBD5E1' : '#475569',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
