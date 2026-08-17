'use client';

import type { StyleConfig } from '@/lib/types';

interface StyleCustomizerProps {
  config: StyleConfig;
  onChange: (config: StyleConfig) => void;
}

const PRESETS = [
  { name: '紫夜霓虹', primary: '#8b5cf6', secondary: '#ec4899', accent: '#06b6d4' },
  { name: '极光幻境', primary: '#10b981', secondary: '#6366f1', accent: '#f59e0b' },
  { name: '赛博朋克', primary: '#f43f5e', secondary: '#3b82f6', accent: '#22d3ee' },
  { name: '深海幽光', primary: '#0ea5e9', secondary: '#8b5cf6', accent: '#14b8a6' },
  { name: '烈焰星辰', primary: '#f97316', secondary: '#ef4444', accent: '#eab308' },
];

export default function StyleCustomizer({ config, onChange }: StyleCustomizerProps) {
  const update = (partial: Partial<StyleConfig>) => {
    onChange({ ...config, ...partial });
  };

  return (
    <div className="space-y-6">
      {/* Presets */}
      <div>
        <label className="text-sm font-medium text-white/60 mb-3 block">预设主题</label>
        <div className="grid grid-cols-1 gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => update({ primaryColor: preset.primary, secondaryColor: preset.secondary, accentColor: preset.accent })}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/10 hover:border-white/25 transition-all duration-200 bg-white/5 hover:bg-white/8"
            >
              <div className="flex gap-1.5">
                <span className="w-5 h-5 rounded-full" style={{ background: preset.primary, boxShadow: `0 0 8px ${preset.primary}60` }} />
                <span className="w-5 h-5 rounded-full" style={{ background: preset.secondary, boxShadow: `0 0 8px ${preset.secondary}60` }} />
                <span className="w-5 h-5 rounded-full" style={{ background: preset.accent, boxShadow: `0 0 8px ${preset.accent}60` }} />
              </div>
              <span className="text-sm text-white/80">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Colors */}
      <div>
        <label className="text-sm font-medium text-white/60 mb-3 block">自定义颜色</label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: 'primaryColor' as const, label: '主色' },
            { key: 'secondaryColor' as const, label: '辅色' },
            { key: 'accentColor' as const, label: '强调色' },
          ].map(({ key, label }) => (
            <div key={key} className="flex flex-col items-center gap-2">
              <input
                type="color"
                value={config[key]}
                onChange={(e) => update({ [key]: e.target.value })}
                className="w-10 h-10 rounded-lg cursor-pointer border border-white/10 bg-transparent"
              />
              <span className="text-xs text-white/40">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-4">
        <label className="text-sm font-medium text-white/60 block">效果调节</label>

        <div className="space-y-3">
          <div className="flex justify-between text-xs text-white/40">
            <span>动画速度</span>
            <span>{config.animationSpeed.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            value={config.animationSpeed}
            onChange={(e) => update({ animationSpeed: parseFloat(e.target.value) })}
            className="w-full accent-purple-500"
          />
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-xs text-white/40">
            <span>面板透明度</span>
            <span>{Math.round(config.panelOpacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.05"
            max="0.4"
            step="0.01"
            value={config.panelOpacity}
            onChange={(e) => update({ panelOpacity: parseFloat(e.target.value) })}
            className="w-full accent-purple-500"
          />
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-xs text-white/40">
            <span>模糊强度</span>
            <span>{config.panelBlur}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="40"
            step="1"
            value={config.panelBlur}
            onChange={(e) => update({ panelBlur: parseInt(e.target.value) })}
            className="w-full accent-purple-500"
          />
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-xs text-white/40">
            <span>字体大小</span>
            <span>{config.fontSize}px</span>
          </div>
          <input
            type="range"
            min="12"
            max="20"
            step="1"
            value={config.fontSize}
            onChange={(e) => update({ fontSize: parseInt(e.target.value) })}
            className="w-full accent-purple-500"
          />
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-xs text-white/40">
            <span>圆角大小</span>
            <span>{config.borderRadius}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="32"
            step="1"
            value={config.borderRadius}
            onChange={(e) => update({ borderRadius: parseInt(e.target.value) })}
            className="w-full accent-purple-500"
          />
        </div>
      </div>
    </div>
  );
}
