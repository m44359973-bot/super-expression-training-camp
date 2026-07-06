// 宇宙无敌表达训练系统 - 前端主逻辑

class ExpressionTrainer {
  constructor() {
    this.isRecording = false;
    this.isPaused = false;
    this.startTime = null;
    this.pausedTime = 0;        // 累计暂停时长
    this.pauseStart = null;     // 本次暂停开始时间
    this.timerInterval = null;
    this.fullText = '';          // 完整识别文本
    this.sentences = [];         // 每句话
    this.stats = {
      fillers: 0,
      hedges: 0,
      vagueWords: 0,
      totalWords: 0,
      duration: 0
    };
    this.lastFeedbackText = '';

    this.initElements();
    this.bindEvents();
  }

  initElements() {
    this.btnStart = document.getElementById('btn-start');
    this.btnPause = document.getElementById('btn-pause');
    this.btnResume = document.getElementById('btn-resume');
    this.btnStop = document.getElementById('btn-stop');
    this.btnReport = document.getElementById('btn-report');
    this.btnSettings = document.getElementById('btn-settings');
    this.btnCloseFeedback = document.getElementById('btn-close-feedback');
    this.btnCloseReport = document.getElementById('btn-close-report');

    this.subtitleText = document.getElementById('subtitle-text');
    this.timer = document.getElementById('timer');
    this.feedbackPanel = document.getElementById('feedback-panel');
    this.feedbackContent = document.getElementById('feedback-content');
    this.lexiconPanel = document.getElementById('lexicon-panel');
    this.reportModal = document.getElementById('report-modal');
    this.reportBody = document.getElementById('report-body');

    this.statFillers = document.getElementById('stat-fillers');
    this.statHedges = document.getElementById('stat-hedges');
    this.statVague = document.getElementById('stat-vague');
    this.statDensity = document.getElementById('stat-density');
  }

  bindEvents() {
    this.btnStart.addEventListener('click', () => this.startRecording());
    this.btnPause.addEventListener('click', () => this.pauseRecording());
    this.btnResume.addEventListener('click', () => this.resumeRecording());
    this.btnStop.addEventListener('click', () => this.stopRecording());
    this.btnReport.addEventListener('click', () => this.generateReport());
    this.btnSettings.addEventListener('click', () => window.api.openSettings());
    this.btnCloseFeedback.addEventListener('click', () => {
      this.feedbackPanel.classList.add('hidden');
    });
    this.btnCloseReport.addEventListener('click', () => {
      this.reportModal.classList.add('hidden');
    });
  }

  async startRecording() {
    const initResult = await window.api.initASR();
    if (!initResult.success) {
      this.showError(`语音识别启动失败: ${initResult.error}`);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new AudioContext({ sampleRate: 16000 });
      const source = this.audioContext.createMediaStreamSource(stream);
      
      this.audioProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);
      this.audioProcessor.onaudioprocess = async (e) => {
        if (!this.isRecording || this.isPaused) return;
        const samples = e.inputBuffer.getChannelData(0);
        const result = await window.api.feedAudio(samples);
        if (result) {
          this.handleASRResult(result);
        }
      };
      source.connect(this.audioProcessor);
      this.audioProcessor.connect(this.audioContext.destination);
      this.mediaStream = stream;
    } catch (err) {
      this.showError(`麦克风访问失败: ${err.message}`);
      return;
    }

    this.isRecording = true;
    this.isPaused = false;
    this.startTime = Date.now();
    this.pausedTime = 0;
    this.fullText = '';
    this.sentences = [];
    this.resetStats();

    // 清空字幕区域
    const container = document.getElementById('subtitle-container');
    container.innerHTML = '';

    // UI
    this.btnStart.classList.add('hidden');
    this.btnPause.classList.remove('hidden');
    this.btnStop.classList.remove('hidden');
    this.btnReport.classList.add('hidden');
    this.btnResume.classList.add('hidden');
    this.feedbackPanel.classList.remove('hidden');
    this.lexiconPanel.classList.remove('hidden');
    this.timer.classList.add('active');
    document.body.classList.add('recording');
    this.subtitleText.textContent = '正在听...';

    this.timerInterval = setInterval(() => this.updateTimer(), 1000);
  }

  pauseRecording() {
    this.isPaused = true;
    this.pauseStart = Date.now();

    // UI
    this.btnPause.classList.add('hidden');
    this.btnResume.classList.remove('hidden');
    this.timer.classList.remove('active');
  }

  resumeRecording() {
    this.isPaused = false;
    this.pausedTime += Date.now() - this.pauseStart;
    this.pauseStart = null;

    // UI
    this.btnResume.classList.add('hidden');
    this.btnPause.classList.remove('hidden');
    this.timer.classList.add('active');
    
    // 恢复显示最近的字幕
    if (this.sentences.length > 0) {
      const recent = this.sentences.slice(-3).join('');
      this.subtitleText.innerHTML = this.highlightText(recent);
    } else {
      this.subtitleText.textContent = '正在听...';
    }
  }

  async stopRecording() {
    // 停止录音
    if (this.audioProcessor) {
      this.audioProcessor.disconnect();
      this.audioProcessor = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
    await window.api.stopASR();
    this.isRecording = false;
    this.isPaused = false;

    // 计算实际时长（减去暂停）
    clearInterval(this.timerInterval);
    let totalPaused = this.pausedTime;
    if (this.pauseStart) totalPaused += Date.now() - this.pauseStart;
    this.stats.duration = Math.floor((Date.now() - this.startTime - totalPaused) / 1000);

    // UI
    this.btnStop.classList.add('hidden');
    this.btnPause.classList.add('hidden');
    this.btnResume.classList.add('hidden');
    this.btnStart.classList.remove('hidden');
    this.timer.classList.remove('active');
    document.body.classList.remove('recording');

    // 结束后显示报告按钮，不自动生成
    if (this.fullText.trim()) {
      this.btnReport.classList.remove('hidden');
    } else {
      const container = document.getElementById('subtitle-container');
      const line = document.createElement('div');
      line.className = 'subtitle-line current';
      line.style.color = '#ff6b6b';
      line.textContent = '没有检测到语音，请重试';
      container.appendChild(line);
    }
  }

  handleASRResult({ text, isFinal }) {
    if (isFinal) {
      this.sentences.push(text);
      this.fullText += text;

      this.analyzeCurrentSentence(text);

      if (this.fullText.length - this.lastFeedbackText.length >= 50) {
        this.requestRealtimeFeedback();
      }
    }

    this.renderSubtitle(text, isFinal);
  }

  renderSubtitle(currentText, isFinal) {
    const container = document.getElementById('subtitle-container');
    
    if (isFinal) {
      // 移除之前的interim元素
      const interim = container.querySelector('.interim-line');
      if (interim) interim.remove();

      // 把之前的current变成old
      const currentLines = container.querySelectorAll('.subtitle-line.current');
      currentLines.forEach(el => {
        el.classList.remove('current');
        el.classList.add('old');
      });

      // 新增一行确认文字
      const line = document.createElement('div');
      line.className = 'subtitle-line current';
      line.innerHTML = this.highlightText(currentText);
      container.appendChild(line);

      // 滚动到底部
      const area = document.querySelector('.subtitle-area');
      area.scrollTop = area.scrollHeight;
    } else {
      // 中间结果：更新或创建 interim 行
      let interim = container.querySelector('.interim-line');
      if (!interim) {
        interim = document.createElement('div');
        interim.className = 'subtitle-line current interim-line';
        container.appendChild(interim);
      }
      interim.textContent = currentText;

      const area = document.querySelector('.subtitle-area');
      area.scrollTop = area.scrollHeight;
    }
  }

  highlightText(text) {
    let result = text;
    // 笼统词高亮（黄色）
    const vagueWords = ['开心','难过','害怕','生气','不舒服','很好','很多','很快','很大','很小','好看','不好','喜欢','讨厌','觉得','想想'];
    vagueWords.forEach(w => {
      result = result.replace(new RegExp(w, 'g'), `<span class="vague">${w}</span>`);
    });
    // 填充词高亮（红色）
    const fillerPatterns = /(嗯|啊|呃|额|那个|就是|然后|这个|对吧|是吧|反正|基本上)/g;
    result = result.replace(fillerPatterns, '<span class="filler">$1</span>');
    // 犹豫词高亮（橙色）
    const hedgePatterns = /(可能|也许|大概|应该|我觉得|好像|似乎|或许|不一定|差不多|感觉)/g;
    result = result.replace(hedgePatterns, '<span class="hedge">$1</span>');
    return result;
  }

  async analyzeCurrentSentence(text) {
    const analysis = await window.api.analyzeText(text);
    if (analysis) {
      this.stats.fillers += analysis.fillers.length;
      this.stats.hedges += analysis.hedges.length;
      this.stats.vagueWords += analysis.vagueWords.length;
      this.stats.totalWords += analysis.totalWords;
      this.updateStatsDisplay();

      // 词库精准词提示加入实时反馈
      if (analysis.suggestions && analysis.suggestions.length > 0) {
        analysis.suggestions.forEach(s => {
          if (s.type === 'vague' && s.alternatives) {
            this.addFeedbackItem(`「${s.original}」→ ${s.alternatives.join(' / ')}`);
          } else {
            this.addFeedbackItem(s.message);
          }
        });
      }
    }
  }

  updateStatsDisplay() {
    this.statFillers.textContent = this.stats.fillers;
    this.statHedges.textContent = this.stats.hedges;
    this.statVague.textContent = this.stats.vagueWords;
    if (this.stats.totalWords > 0) {
      const density = ((this.stats.totalWords - this.stats.fillers - this.stats.hedges) / this.stats.totalWords * 100).toFixed(0);
      this.statDensity.textContent = density + '%';
    }
  }

  async requestRealtimeFeedback() {
    this.lastFeedbackText = this.fullText;
    const result = await window.api.getRealtimeFeedback(this.fullText);
    if (result.success && result.feedback) {
      this.addFeedbackItem(result.feedback);
    }
  }

  addFeedbackItem(feedback) {
    const item = document.createElement('div');
    item.className = 'feedback-item';
    item.innerHTML = feedback;
    this.feedbackContent.insertBefore(item, this.feedbackContent.firstChild);
    while (this.feedbackContent.children.length > 10) {
      this.feedbackContent.removeChild(this.feedbackContent.lastChild);
    }
  }

  async generateReport() {
    if (!this.fullText.trim()) {
      this.showError('没有可分析的内容');
      return;
    }

    this.reportBody.innerHTML = '<p style="text-align:center;color:#888;">正在生成报告...</p>';
    this.reportModal.classList.remove('hidden');

    const result = await window.api.getFinalReport({
      fullText: this.fullText,
      stats: this.stats
    });

    if (result.success) {
      this.lastReport = result.report;
      this.renderReport(result.report);
    } else {
      this.reportBody.innerHTML = `<p style="color:#ff6b6b;">生成失败: ${result.error}</p>`;
    }
  }

  renderReport(report) {
    // 渲染报告
    const html = report
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 style="color:#E5007E;margin-top:24px;margin-bottom:8px;">$1</h2>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code style="background:#2a2a2a;padding:2px 6px;border-radius:4px;color:#E5007E;">$1</code>')
      .replace(/^> (.+)$/gm, '<blockquote style="border-left:3px solid #E5007E;padding-left:12px;color:#aaa;margin:8px 0;">$1</blockquote>')
      .replace(/\n/g, '<br>');

    // 加保存按钮
    this.reportBody.innerHTML = `
      <div style="text-align:right;margin-bottom:16px;">
        <button id="btn-save-report" style="background:#E5007E;color:#fff;border:none;border-radius:8px;padding:8px 16px;font-size:13px;cursor:pointer;">💾 保存为 Markdown</button>
      </div>
      ${html}
    `;

    // 绑定保存按钮
    document.getElementById('btn-save-report').addEventListener('click', () => this.saveReport());
  }

  async saveReport() {
    if (!this.lastReport) return;

    // 拼接完整markdown：原文 + AI分析
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 5).replace(':', '');
    
    const markdown = `# 表达训练报告\n\n**日期**: ${dateStr}  \n**时长**: ${this.stats.duration}秒  \n**总字数**: ${this.stats.totalWords}  \n\n---\n\n## 完整原文\n\n${this.fullText}\n\n---\n\n${this.lastReport}`;

    // 通过 Electron 保存文件
    const filename = `表达训练-${dateStr}-${timeStr}.md`;
    
    try {
      const result = await window.api.saveFile(markdown, filename);
      if (result.success) {
        const btn = document.getElementById('btn-save-report');
        btn.textContent = '✓ 已保存';
        btn.style.background = '#333';
        setTimeout(() => {
          btn.textContent = '💾 保存为 Markdown';
          btn.style.background = '#E5007E';
        }, 2000);
      }
    } catch (e) {
      alert('保存失败: ' + e.message);
    }
  }

  updateTimer() {
    let totalPaused = this.pausedTime;
    if (this.pauseStart) totalPaused += Date.now() - this.pauseStart;
    const elapsed = Math.floor((Date.now() - this.startTime - totalPaused) / 1000);
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    this.timer.textContent = `${minutes}:${seconds}`;
  }

  resetStats() {
    this.stats = { fillers: 0, hedges: 0, vagueWords: 0, totalWords: 0, duration: 0 };
    this.updateStatsDisplay();
    this.feedbackContent.innerHTML = '';
  }

  showError(message) {
    this.subtitleText.textContent = message;
    this.subtitleText.style.color = '#ff6b6b';
    setTimeout(() => {
      this.subtitleText.style.color = '';
    }, 3000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new ExpressionTrainer();
});
