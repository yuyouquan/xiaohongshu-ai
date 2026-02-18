'use client';

import { useState } from 'react';

export default function Home() {
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState('passion');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [displayProgress, setDisplayProgress] = useState(0);

  const generate = async () => {
    if (!topic.trim()) return;

    setLoading(true);
    setDisplayProgress(0);
    setContent('');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, style }),
      });

      if (!res.ok) {
        const data = await res.json();
        setContent(data.error || '生成失败，请重试');
        setLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (!reader) {
        setLoading(false);
        return;
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.progress !== undefined) {
                setDisplayProgress(prev => Math.max(prev, data.progress));
              }
              
              if (data.content) {
                setContent(prev => prev + data.content);
              }
              
              if (data.done) {
                setDisplayProgress(100);
                setLoading(false);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (e) {
      setContent('生成失败，请重试');
    }
    setLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    alert('已复制到剪贴板！');
  };

  const styles = [
    { id: 'passion', name: '热情种草', emoji: '💕', desc: '充满激情，推荐好物' },
    { id: 'funny', name: '搞笑日常', emoji: '😂', desc: '幽默风趣，分享生活' },
    { id: '干货', name: '干货教程', emoji: '📚', desc: '知识分享，实用教程' },
    { id: '情感', name: '情感共鸣', emoji: '💝', desc: '情感表达，引发共鸣' },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header>
        <div className="container header-content">
          <h1 className="logo">🔴 小红书AI</h1>
          <span className="tagline">AI 文案生成器</span>
        </div>
      </header>

      <main className="container">
        {/* Hero */}
        <div className="hero">
          <h2>一键生成爆款小红书文案</h2>
          <p>输入主题，AI 自动生成种草笔记、搞笑日常、干货教程</p>
        </div>

        {/* Input Section */}
        <div className="card">
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="例如：分享一款超好用的护肤神器"
          />

          {/* Style Selection */}
          <div style={{ marginTop: '1rem' }}>
            <label className="label">选择风格</label>
            <div className="style-grid">
              {styles.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStyle(s.id)}
                  className={`style-btn ${s.id} ${style === s.id ? 'active' : ''}`}
                >
                  <div className="style-emoji">{s.emoji}</div>
                  <div className="style-name">{s.name}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={generate}
            disabled={loading || !topic.trim()}
            className="generate-btn"
          >
            {loading ? `🤔 AI 创作中 ${displayProgress}%` : '✨ 生成文案'}
          </button>

          {/* Progress */}
          {loading && (
            <div className="progress-bar">
              <div className="progress-track">
                <div 
                  className="progress-fill"
                  style={{ width: `${displayProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Output Section */}
        <div className="card">
          <div className="output-header">
            <h3>📝 生成的文案</h3>
            {content && (
              <button onClick={copyToClipboard} className="copy-btn">
                📋 一键复制
              </button>
            )}
          </div>
          
          <div className="output-content">
            {loading ? (
              <div className="loading">
                <div className="loading-emoji">✨</div>
                <p className="loading-text">AI 正在创作中...</p>
                <p className="loading-progress">{displayProgress}%</p>
              </div>
            ) : content ? (
              <div className="content-text">{content}</div>
            ) : (
              <div className="empty">
                <p>输入主题后点击生成按钮</p>
              </div>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="features">
          <div className="feature">
            <div className="feature-emoji">🎯</div>
            <h4 className="feature-title">精准定位</h4>
            <p className="feature-desc">针对小红书用户特点优化</p>
          </div>
          <div className="feature">
            <div className="feature-emoji">⚡</div>
            <h4 className="feature-title">快速生成</h4>
            <p className="feature-desc">几秒钟生成优质文案</p>
          </div>
          <div className="feature">
            <div className="feature-emoji">💯</div>
            <h4 className="feature-title">爆款体质</h4>
            <p className="feature-desc">学习爆款笔记套路</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer>
        <p>© 2026 小红书AI - AI 文案生成器</p>
      </footer>
    </div>
  );
}
