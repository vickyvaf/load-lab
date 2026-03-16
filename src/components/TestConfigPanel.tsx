'use client';

import { useState, useCallback } from 'react';
import type { TestConfig } from '@/types';

interface TestConfigPanelProps {
  onStartTest: (config: TestConfig) => void;
  onStopTest: () => void;
  isRunning: boolean;
}

export default function TestConfigPanel({ onStartTest, onStopTest, isRunning }: TestConfigPanelProps) {
  const [config, setConfig] = useState<TestConfig>({
    url: '',
    method: 'GET',
    vus: 10,
    duration: '30s',
    headers: [{ key: '', value: '' }],
    body: '',
    stages: [{ duration: '10s', target: 5 }],
    thresholds: [{ key: 'http_req_duration', value: 'p(95)<500' }],
    useStages: false,
  });

  const [showHeaders, setShowHeaders] = useState(false);
  const [showBody, setShowBody] = useState(false);
  const [showStages, setShowStages] = useState(false);
  const [showThresholds, setShowThresholds] = useState(false);

  const updateField = useCallback(<K extends keyof TestConfig>(field: K, value: TestConfig[K]) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = () => {
    if (!config.url.trim() || !config.vus) return;
    onStartTest(config);
  };

  // Header handlers
  const addHeader = () => updateField('headers', [...config.headers, { key: '', value: '' }]);
  const removeHeader = (i: number) => updateField('headers', config.headers.filter((_, idx) => idx !== i));
  const updateHeader = (i: number, field: 'key' | 'value', val: string) => {
    const h = [...config.headers];
    h[i] = { ...h[i], [field]: val };
    updateField('headers', h);
  };

  // Stage handlers
  const addStage = () => updateField('stages', [...config.stages, { duration: '10s', target: 10 }]);
  const removeStage = (i: number) => updateField('stages', config.stages.filter((_, idx) => idx !== i));
  const updateStage = (i: number, field: 'duration' | 'target', val: string | number) => {
    const s = [...config.stages];
    s[i] = { ...s[i], [field]: val };
    updateField('stages', s);
  };

  // Threshold handlers
  const addThreshold = () => updateField('thresholds', [...config.thresholds, { key: '', value: '' }]);
  const removeThreshold = (i: number) => updateField('thresholds', config.thresholds.filter((_, idx) => idx !== i));
  const updateThreshold = (i: number, field: 'key' | 'value', val: string) => {
    const t = [...config.thresholds];
    t[i] = { ...t[i], [field]: val };
    updateField('thresholds', t);
  };

  return (
    <section className="glass-card config-panel animate-in" id="config-panel">
      <div className="section-title">
        <span className="section-title-icon">⚙️</span>
        Test Configuration
      </div>

      {/* URL + Method */}
      <div className="config-main-row">
        <div className="url-input-group">
          <div className="form-group" style={{ width: '140px', flexShrink: 0 }}>
            <label className="form-label" htmlFor="method-select">Method</label>
            <select
              id="method-select"
              className="select-field"
              value={config.method}
              onChange={e => updateField('method', e.target.value)}
              disabled={isRunning}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label" htmlFor="url-input">Target URL</label>
            <input
              id="url-input"
              type="url"
              className="input-field"
              placeholder="https://example.com/api/endpoint"
              value={config.url}
              onChange={e => updateField('url', e.target.value)}
              disabled={isRunning}
            />
          </div>
        </div>
      </div>

      {/* VUs, Duration */}
      <div className="config-params-row">
        <div className="form-group">
          <label className="form-label" htmlFor="vus-input">Virtual Users (VUs)</label>
          <input
            id="vus-input"
            type="number"
            className="input-field"
            min={1}
            max={10000}
            value={config.vus}
            onChange={e => updateField('vus', e.target.value)}
            disabled={isRunning}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="duration-input">Duration</label>
          <input
            id="duration-input"
            type="text"
            className="input-field"
            placeholder="30s, 1m, 5m"
            value={config.duration}
            onChange={e => updateField('duration', e.target.value)}
            disabled={isRunning}
          />
        </div>
        <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button
            className={`toggle-btn ${config.useStages ? 'active' : ''}`}
            onClick={() => {
              updateField('useStages', !config.useStages);
              if (!config.useStages) setShowStages(true);
            }}
            disabled={isRunning}
            style={{ height: '42px' }}
          >
            📈 {config.useStages ? 'Stages ON' : 'Use Stages'}
          </button>
        </div>
      </div>

      {/* Toggle buttons */}
      <div className="toggle-buttons">
        <button
          className={`toggle-btn ${showHeaders ? 'active' : ''}`}
          onClick={() => setShowHeaders(!showHeaders)}
        >
          📋 Headers
        </button>
        <button
          className={`toggle-btn ${showBody ? 'active' : ''}`}
          onClick={() => setShowBody(!showBody)}
        >
          📝 Body
        </button>
        <button
          className={`toggle-btn ${showStages ? 'active' : ''}`}
          onClick={() => setShowStages(!showStages)}
        >
          📊 Stages
        </button>
        <button
          className={`toggle-btn ${showThresholds ? 'active' : ''}`}
          onClick={() => setShowThresholds(!showThresholds)}
        >
          🎯 Thresholds
        </button>
      </div>

      {/* Headers */}
      {showHeaders && (
        <div className="expandable-section">
          <div className="expandable-section-title">Request Headers</div>
          {config.headers.map((h, i) => (
            <div className="kv-row" key={i}>
              <input
                className="input-field"
                placeholder="Header name"
                value={h.key}
                onChange={e => updateHeader(i, 'key', e.target.value)}
                disabled={isRunning}
              />
              <input
                className="input-field"
                placeholder="Header value"
                value={h.value}
                onChange={e => updateHeader(i, 'value', e.target.value)}
                disabled={isRunning}
              />
              <button
                className="kv-remove-btn"
                onClick={() => removeHeader(i)}
                disabled={isRunning}
                title="Remove"
              >×</button>
            </div>
          ))}
          <button className="add-row-btn" onClick={addHeader} disabled={isRunning}>
            + Add Header
          </button>
        </div>
      )}

      {/* Body */}
      {showBody && (
        <div className="expandable-section">
          <div className="expandable-section-title">Request Body</div>
          <textarea
            className="textarea-field"
            placeholder='{"key": "value"}'
            value={config.body}
            onChange={e => updateField('body', e.target.value)}
            disabled={isRunning}
            rows={5}
          />
        </div>
      )}

      {/* Stages */}
      {showStages && (
        <div className="expandable-section">
          <div className="expandable-section-title">Ramp-up Stages</div>
          {config.stages.map((s, i) => (
            <div className="stage-row" key={i}>
              <div className="form-group">
                <label className="form-label">Duration</label>
                <input
                  className="input-field"
                  placeholder="10s"
                  value={s.duration}
                  onChange={e => updateStage(i, 'duration', e.target.value)}
                  disabled={isRunning}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Target VUs</label>
                <input
                  className="input-field"
                  type="number"
                  min={0}
                  value={s.target}
                  onChange={e => updateStage(i, 'target', parseInt(e.target.value) || 0)}
                  disabled={isRunning}
                />
              </div>
              <button
                className="kv-remove-btn"
                onClick={() => removeStage(i)}
                disabled={isRunning}
                title="Remove"
                style={{ marginTop: '18px' }}
              >×</button>
            </div>
          ))}
          <button className="add-row-btn" onClick={addStage} disabled={isRunning}>
            + Add Stage
          </button>
        </div>
      )}

      {/* Thresholds */}
      {showThresholds && (
        <div className="expandable-section">
          <div className="expandable-section-title">Thresholds</div>
          {config.thresholds.map((t, i) => (
            <div className="kv-row" key={i}>
              <input
                className="input-field"
                placeholder="e.g. http_req_duration"
                value={t.key}
                onChange={e => updateThreshold(i, 'key', e.target.value)}
                disabled={isRunning}
              />
              <input
                className="input-field"
                placeholder="e.g. p(95)<500"
                value={t.value}
                onChange={e => updateThreshold(i, 'value', e.target.value)}
                disabled={isRunning}
              />
              <button
                className="kv-remove-btn"
                onClick={() => removeThreshold(i)}
                disabled={isRunning}
                title="Remove"
              >×</button>
            </div>
          ))}
          <button className="add-row-btn" onClick={addThreshold} disabled={isRunning}>
            + Add Threshold
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="action-buttons">
        <button
          id="start-test-btn"
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={isRunning || !config.url.trim() || !config.vus || Number(config.vus) <= 0}
        >
          ▶ Start Test
        </button>
        <button
          id="stop-test-btn"
          className="btn btn-danger"
          onClick={onStopTest}
          disabled={!isRunning}
        >
          ⏹ Stop Test
        </button>
      </div>
    </section>
  );
}
