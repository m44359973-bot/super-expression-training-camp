// 超级表达训练营 - 本地桌面版

class ExpressionTrainer {
  constructor() {
    this.isRecording = false;
    this.isPaused = false;
    this.startTime = null;
    this.pausedTime = 0;
    this.pauseStart = null;
    this.timerInterval = null;
    this.fullText = '';
    this.sentences = [];
    this.conversation = [];
    this.aiReplyPending = false;
    this.stats = { fillers: 0, hedges: 0, vagueWords: 0, totalWords: 0, duration: 0 };
    this.lastFeedbackText = '';
    this.lastReport = '';
    this.mode = 'solo';
    this.challengeQuestion = '';
    this.challengeSeconds = 60;
    this.challengeTimer = null;
    this.challengeHistory = JSON.parse(localStorage.getItem('challenge-history') || '[]');
    this.analysisPromises = [];
    this.conversation = [];
    this.aiReplyPending = false;

    this.initElements();
    this.bindEvents();
  }

  initElements() {
    this.btnStart = document.getElementById('btn-start');
    this.btnPaste = document.getElementById('btn-paste');
    this.btnPause = document.getElementById('btn-pause');
    this.btnResume = document.getElementById('btn-resume');
    this.btnStop = document.getElementById('btn-stop');
    this.btnReport = document.getElementById('btn-report');
    this.btnSettings = document.getElementById('btn-settings');
    this.btnCloseReport = document.getElementById('btn-close-report');
    this.btnClosePaste = document.getElementById('btn-close-paste');
    this.btnAnalyzePaste = document.getElementById('btn-analyze-paste');
    this.btnCopyText = document.getElementById('btn-copy-text');
    this.btnSaveText = document.getElementById('btn-save-text');
    this.btnClear = document.getElementById('btn-clear');
    this.btnCopyReport = document.getElementById('btn-copy-report');
    this.pasteModal = document.getElementById('paste-modal');
    this.pasteTextarea = document.getElementById('paste-textarea');
    this.timer = document.getElementById('timer');
    this.subtitleScroll = document.getElementById('subtitle-scroll');
    this.subtitleContainer = document.getElementById('subtitle-container');
    this.feedbackContent = document.getElementById('feedback-content');
    this.reportModal = document.getElementById('report-modal');
    this.reportBody = document.getElementById('report-body');
    this.statFillers = document.getElementById('stat-fillers');
    this.statHedges = document.getElementById('stat-hedges');
    this.statVague = document.getElementById('stat-vague');
    this.statDensity = document.getElementById('stat-density');
    this.modeSolo = document.getElementById('btn-mode-solo');
    this.modeDialogue = document.getElementById('btn-mode-dialogue');
    this.modeChallenge = document.getElementById('btn-mode-challenge');
    this.modeDescription = document.getElementById('mode-description');
    this.challengePanel = document.getElementById('challenge-panel');
    this.challengeQuestionEl = document.getElementById('challenge-question');
    this.challengeRecordCount = document.getElementById('challenge-record-count');
    this.challengeBestScore = document.getElementById('challenge-best-score');
    this.challengeHistoryList = document.getElementById('challenge-history-list');
    this.btnChangeQuestion = document.getElementById('btn-change-question');
    this.challengeResultModal = document.getElementById('challenge-result-modal');
    this.challengeResultBody = document.getElementById('challenge-result-body');
    this.btnCloseChallengeResult = document.getElementById('btn-close-challenge-result');
    this.sceneCanvas = document.getElementById('scene-canvas');
    this.fontSizeSlider = document.getElementById('font-size-slider');
    this.fontSizeValue = document.getElementById('font-size-value');
    this.fontFamilySelect = document.getElementById('font-family-select');
  }

  bindEvents() {
    this.btnStart.addEventListener('click', () => this.startRecording());
    this.btnPaste.addEventListener('click', () => this.openPasteModal());
    this.btnPause.addEventListener('click', () => this.pauseRecording());
    this.btnResume.addEventListener('click', () => this.resumeRecording());
    this.btnStop.addEventListener('click', () => this.stopRecording());
    this.btnReport.addEventListener('click', () => this.generateReport());
    this.btnSettings.addEventListener('click', () => window.api.openSettings());
    document.getElementById('btn-prompt-editor').addEventListener('click', () => window.api.openPromptEditor());
    this.btnCloseReport.addEventListener('click', () => this.reportModal.classList.add('hidden'));
    this.btnCopyReport.addEventListener('click', () => {
      const reportText = this.reportBody.innerText;
      navigator.clipboard.writeText(reportText).then(() => {
        this.btnCopyReport.textContent = '✅ 已复制';
        setTimeout(() => { this.btnCopyReport.textContent = '📋 复制全文'; }, 2000);
      });
    });
    this.btnClosePaste.addEventListener('click', () => this.pasteModal.classList.add('hidden'));
    this.btnAnalyzePaste.addEventListener('click', () => this.analyzePastedText());
    this.btnCopyText.addEventListener('click', () => this.copyOriginalText());
    this.btnSaveText.addEventListener('click', () => this.saveOriginalText());
    this.btnClear.addEventListener('click', () => this.clearAll());
    this.modeSolo.addEventListener('click', () => this.setMode('solo'));
    this.modeDialogue.addEventListener('click', () => this.setMode('dialogue'));
    this.modeChallenge.addEventListener('click', () => this.setMode('challenge'));
    this.btnChangeQuestion.addEventListener('click', () => this.chooseChallengeQuestion());
    this.btnCloseChallengeResult.addEventListener('click', () => this.challengeResultModal.classList.add('hidden'));
    this.renderChallengeHistory();
    this.fontSizeSlider.addEventListener('input', () => this.setFontSize(this.fontSizeSlider.value));
    this.fontFamilySelect.addEventListener('change', () => this.setFontFamily(this.fontFamilySelect.value));
    this.loadFontSize();
    this.loadFontFamily();
    this.initScene();
  }

  loadFontSize() {
    const saved = Number.parseInt(localStorage.getItem('subtitle-font-size') || '25', 10);
    const size = Math.min(36, Math.max(18, Number.isFinite(saved) ? saved : 25));
    this.fontSizeSlider.value = size;
    this.setFontSize(size);
  }

  setFontSize(value) {
    const size = Math.min(36, Math.max(18, Number.parseInt(value, 10) || 25));
    document.documentElement.style.setProperty('--subtitle-size', `${size}px`);
    this.fontSizeSlider.value = size;
    this.fontSizeValue.textContent = `${size}px`;
    const progress = ((size - 18) / 18) * 100;
    this.fontSizeSlider.style.background = `linear-gradient(90deg, var(--cyan) 0%, var(--cyan) ${progress}%, rgba(194,215,230,.18) ${progress}%, rgba(194,215,230,.18) 100%)`;
    localStorage.setItem('subtitle-font-size', String(size));
  }

  loadFontFamily() {
    this.setFontFamily(localStorage.getItem('subtitle-font-family') || 'system');
  }

  setFontFamily(value) {
    const families = {
      system: '"Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", sans-serif',
      rounded: '"Arial Rounded MT Bold", "Microsoft YaHei", "PingFang SC", sans-serif',
      serif: '"Noto Serif CJK SC", "Songti SC", SimSun, serif',
      mono: '"Cascadia Mono", "SFMono-Regular", Consolas, monospace'
    };
    const selected = families[value] ? value : 'system';
    document.documentElement.style.setProperty('--subtitle-font', families[selected]);
    this.fontFamilySelect.value = selected;
    localStorage.setItem('subtitle-font-family', selected);
  }

  setMode(mode) {
    if (this.isRecording || this.aiReplyPending) return;
    this.mode = mode;
    this.modeSolo.classList.toggle('active', mode === 'solo');
    this.modeDialogue.classList.toggle('active', mode === 'dialogue');
    this.modeChallenge.classList.toggle('active', mode === 'challenge');
    this.challengePanel.classList.toggle('hidden', mode !== 'challenge');
    this.modeDescription.textContent = mode === 'dialogue'
      ? '你说一句，AI 接着聊下去'
      : mode === 'challenge' ? '随机题目，60 秒说清你的看法' : '你说，我帮你记录和分析';
    if (mode === 'challenge' && !this.challengeQuestion) this.chooseChallengeQuestion();
  }

  chooseChallengeQuestion() {
    const questions = [
      '如果要把一支笔卖给我，你会怎么说？',
      '你最喜欢的一个地方是什么？为什么？',
      '你最近做过的一次重要决定是什么？',
      '你认为家庭环境会怎样影响一个人的成长？',
      '如果明天放假一天，你会怎么安排？',
      '你最想培养的一个习惯是什么？',
      '你怎么看待“先完成，再完美”？',
      '一个朋友遇到挫折时，你会怎么安慰他？',
      '你觉得一份好工作最重要的条件是什么？',
      '如果只能带三样东西去旅行，你会选什么？'
    ];
    const candidates = questions.filter(question => question !== this.challengeQuestion);
    this.challengeQuestion = candidates[Math.floor(Math.random() * candidates.length)];
    this.challengeQuestionEl.textContent = this.challengeQuestion;
  }

  renderChallengeHistory() {
    this.challengeRecordCount.textContent = `${this.challengeHistory.length} 次`;
    const best = this.challengeHistory.reduce((max, item) => Math.max(max, item.score || 0), 0);
    this.challengeBestScore.textContent = best ? `${best} 分` : '--';
    this.challengeHistoryList.innerHTML = this.challengeHistory.slice(0, 3).map(item => {
      const date = new Date(item.createdAt).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
      return `<div class="challenge-history-item"><span>${date}</span><strong>${item.score}分</strong></div>`;
    }).join('');
  }

  initScene() {
    if (!this.sceneCanvas) return;
    const canvas = this.sceneCanvas;
    const ctx = canvas.getContext('2d');
    const meteors = [];
    let lastMeteor = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const draw = (time) => {
      const t = time / 1000;
      ctx.clearRect(0, 0, width, height);

      if (t - lastMeteor > 5.5) {
        meteors.push({ born: t, x: width * (.56 + Math.random() * .32), y: height * (.12 + Math.random() * .2) });
        lastMeteor = t;
      }
      meteors.splice(0, meteors.length, ...meteors.filter(meteor => t - meteor.born < .85));
      meteors.forEach(meteor => {
        const p = (t - meteor.born) / .85;
        const x = meteor.x - p * width * .22;
        const y = meteor.y + p * height * .22;
        const trail = ctx.createLinearGradient(x, y, x + width * .1, y - height * .1);
        trail.addColorStop(0, 'rgba(255,255,255,.8)');
        trail.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = trail;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + width * .1, y - height * .1);
        ctx.stroke();
      });

      // 只在用户提供的背景图上叠加轻微摆动的植物线条。
      ctx.strokeStyle = 'rgba(93,153,125,.45)';
      ctx.lineWidth = 1.4;
      for (let i = 0; i < 34; i += 1) {
        const x = (i / 34) * width + Math.sin(i * 7.1) * 18;
        const base = height * (.96 + (i % 3) * .008);
        const sway = Math.sin(t * 1.2 + i) * 8;
        ctx.beginPath();
        ctx.moveTo(x, base);
        ctx.quadraticCurveTo(x + sway * .35, base - 24, x + sway, base - 43 - (i % 4) * 5);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(draw);
    };
    resize();
    window.addEventListener('resize', resize);
    requestAnimationFrame(draw);
  }

  // ===== 录制控制 =====

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
      this.silenceGain = this.audioContext.createGain();
      this.silenceGain.gain.value = 0;
      this.audioProcessor.onaudioprocess = async (e) => {
        if (!this.isRecording || this.isPaused) return;
        const samples = e.inputBuffer.getChannelData(0);
        const result = await window.api.feedAudio(samples);
        if (result) this.handleASRResult(result);
      };
      source.connect(this.audioProcessor);
      // ScriptProcessor 需要连接到输出链才能持续触发，但增益为 0，避免麦克风回放。
      this.audioProcessor.connect(this.silenceGain);
      this.silenceGain.connect(this.audioContext.destination);
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
    this.conversation = [];
    this.analysisPromises = [];
    this.resetStats();
    this.subtitleContainer.innerHTML = '';

    // UI
    this.btnStart.classList.add('hidden');
    this.btnPause.classList.remove('hidden');
    this.btnStop.classList.remove('hidden');
    this.btnReport.classList.add('hidden');
    this.btnResume.classList.add('hidden');
    this.timer.classList.add('active');

    if (this.mode === 'challenge') {
      this.challengeSeconds = 60;
      this.timer.textContent = '01:00';
      this.challengeTimer = setInterval(() => {
        this.challengeSeconds -= 1;
        const seconds = String(Math.max(this.challengeSeconds, 0)).padStart(2, '0');
        this.timer.textContent = `00:${seconds}`;
        if (this.challengeSeconds <= 0) {
          clearInterval(this.challengeTimer);
          this.challengeTimer = null;
          this.stopRecording(true);
        }
      }, 1000);
    } else {
      this.timerInterval = setInterval(() => this.updateTimer(), 1000);
    }
  }

  pauseRecording() {
    this.isPaused = true;
    this.pauseStart = Date.now();
    this.btnPause.classList.add('hidden');
    this.btnResume.classList.remove('hidden');
    this.timer.classList.remove('active');
  }

  resumeRecording() {
    this.isPaused = false;
    this.pausedTime += Date.now() - this.pauseStart;
    this.pauseStart = null;
    this.btnResume.classList.add('hidden');
    this.btnPause.classList.remove('hidden');
    this.timer.classList.add('active');
  }

  async stopRecording(challengeTimedOut = false) {
    if (this.audioProcessor) { this.audioProcessor.disconnect(); this.audioProcessor = null; }
    if (this.silenceGain) { this.silenceGain.disconnect(); this.silenceGain = null; }
    if (this.audioContext) { this.audioContext.close(); this.audioContext = null; }
    if (this.mediaStream) { this.mediaStream.getTracks().forEach(t => t.stop()); this.mediaStream = null; }
    await window.api.stopASR();
    await Promise.all(this.analysisPromises);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    this.isRecording = false;
    this.isPaused = false;

    clearInterval(this.timerInterval);
    if (this.challengeTimer) {
      clearInterval(this.challengeTimer);
      this.challengeTimer = null;
    }
    let totalPaused = this.pausedTime;
    if (this.pauseStart) totalPaused += Date.now() - this.pauseStart;
    this.stats.duration = Math.floor((Date.now() - this.startTime - totalPaused) / 1000);

    // UI：显示生成报告按钮，可翻阅字幕
    this.btnStop.classList.add('hidden');
    this.btnPause.classList.add('hidden');
    this.btnResume.classList.add('hidden');
    this.btnStart.classList.remove('hidden');
    this.timer.classList.remove('active');

    if (this.fullText.trim()) {
      this.btnReport.classList.remove('hidden');
      this.btnCopyText.classList.remove('hidden');
      this.btnSaveText.classList.remove('hidden');
      this.btnClear.classList.remove('hidden');
      if (this.mode === 'challenge') this.finishChallenge(challengeTimedOut);
    }
  }

  finishChallenge(timedOut) {
    const scorecard = this.scoreChallenge();
    const record = {
      id: Date.now(),
      question: this.challengeQuestion,
      answer: this.fullText,
      score: scorecard.total,
      metrics: scorecard.metrics,
      createdAt: new Date().toISOString()
    };
    this.challengeHistory.unshift(record);
    this.challengeHistory = this.challengeHistory.slice(0, 50);
    localStorage.setItem('challenge-history', JSON.stringify(this.challengeHistory));
    this.renderChallengeHistory();
    this.challengeResultBody.innerHTML = `
      <div class="challenge-result-question">${this.escapeHtml(this.challengeQuestion)}</div>
      <div class="challenge-total"><span>${scorecard.total}</span><small>/ 100</small></div>
      <div class="challenge-score-grid">
        ${scorecard.cards.map(card => `<div class="challenge-score-card"><span>${card.label}</span><strong>${card.score}</strong><small>${card.note}</small></div>`).join('')}
      </div>
      <section class="challenge-suggestions"><h3>下一次怎么说得更好</h3><ul>${scorecard.suggestions.map(item => `<li>${item}</li>`).join('')}</ul></section>
      <div class="challenge-result-meta">${timedOut ? '计时结束，已自动保存本次记录' : '本次记录已保存'}</div>
    `;
    this.challengeResultModal.classList.remove('hidden');
  }

  scoreChallenge() {
    const { fillers, hedges, vagueWords, totalWords, duration } = this.stats;
    const density = totalWords ? Math.max(0, Math.min(100, Math.round((totalWords - fillers - hedges) / totalWords * 100))) : 0;
    const wordScore = Math.min(25, Math.round(totalWords / 3));
    const fluencyScore = Math.max(0, 25 - fillers * 4 - hedges * 3);
    const clarityScore = Math.max(0, 25 - vagueWords * 3);
    const structureSignals = /首先|其次|最后|因为|所以|比如|例如|总结|我认为|我的看法/.test(this.fullText);
    const structureScore = Math.min(25, Math.round((totalWords / 12) + (structureSignals ? 12 : 0)));
    const total = Math.max(0, Math.min(100, wordScore + fluencyScore + clarityScore + structureScore));
    const suggestions = [];
    if (totalWords < 45) suggestions.push('先给结论，再补一个具体例子，60 秒至少说出 45 个字。');
    if (fillers > 1) suggestions.push('想下一句时停半秒，替代“嗯、那个、就是”这类填充词。');
    if (hedges > 1) suggestions.push('把“我觉得、可能”换成明确判断，例如“我的看法是”。');
    if (vagueWords > 1) suggestions.push('把“很好、很多、开心”等笼统词换成事实、数字或画面。');
    if (!structureSignals) suggestions.push('使用“我的观点是 - 因为 - 例如 - 所以”四步结构组织答案。');
    if (!suggestions.length) suggestions.push('表达已经很完整，下次尝试加入一个反例或更具体的细节，让观点更有说服力。');
    return {
      total,
      metrics: { totalWords, fillers, hedges, vagueWords, duration, density },
      cards: [
        { label: '内容展开', score: wordScore, note: `${totalWords} 字` },
        { label: '流畅度', score: fluencyScore, note: `${fillers} 次填充词` },
        { label: '清晰度', score: clarityScore, note: `${vagueWords} 个笼统词` },
        { label: '结构感', score: structureScore, note: structureSignals ? '有结构信号' : '补充结构词' }
      ],
      suggestions
    };
  }

  escapeHtml(text) {
    const element = document.createElement('div');
    element.textContent = text;
    return element.innerHTML;
  }

  // ===== ASR结果处理 =====

  async handleASRResult({ text, isFinal }) {
    if (isFinal) {
      this.sentences.push(text);
      this.fullText += text;
      this.conversation.push({ speaker: 'user', text });
      this.analysisPromises.push(this.analyzeCurrentSentence(text));

      // 每30字触发一次AI反馈（语境化精准词建议）
      if (this.fullText.length - this.lastFeedbackText.length >= 30) {
        this.requestRealtimeFeedback();
      }
      this.renderSubtitle(text, isFinal, this.mode === 'dialogue' ? 'user' : null);
      if (this.mode === 'dialogue') {
        await this.requestConversationReply(text);
      }
      return;
    }
    this.renderSubtitle(text, isFinal, this.mode === 'dialogue' ? 'user' : null);
  }

  renderSubtitle(currentText, isFinal, speaker = null) {
    if (isFinal) {
      // 移除interim
      const interim = this.subtitleContainer.querySelector('.interim-line');
      if (interim) interim.remove();

      // 旧行变灰
      this.subtitleContainer.querySelectorAll('.subtitle-line:not(.old)').forEach(el => {
        el.classList.add('old');
      });

      // 新行
      this.appendDialogueLine(speaker || 'user', currentText);
    } else {
      let interim = this.subtitleContainer.querySelector('.interim-line');
      if (!interim) {
        interim = document.createElement('div');
        interim.className = 'subtitle-line interim-line';
        this.subtitleContainer.appendChild(interim);
      }
      interim.textContent = currentText;
    }

    // 自动滚到底
    this.subtitleScroll.scrollTop = this.subtitleScroll.scrollHeight;
  }

  appendDialogueLine(speaker, text, pending = false) {
    const line = document.createElement('div');
    line.className = `subtitle-line dialogue-line dialogue-${speaker}${pending ? ' dialogue-pending' : ''}`;
    const label = document.createElement('span');
    label.className = 'speaker-label';
    label.textContent = speaker === 'ai' ? 'AI' : '我';
    const body = document.createElement('span');
    body.className = 'dialogue-text';
    if (speaker === 'ai') body.textContent = text;
    else body.innerHTML = this.highlightText(text);
    line.append(label, body);
    this.subtitleContainer.appendChild(line);
    this.subtitleScroll.scrollTop = this.subtitleScroll.scrollHeight;
    return line;
  }

  async requestConversationReply(text) {
    this.aiReplyPending = true;
    const pending = this.appendDialogueLine('ai', '正在组织回应…', true);
    const messages = this.conversation.slice(-12).map(turn => ({
      role: turn.speaker === 'ai' ? 'assistant' : 'user',
      content: turn.text
    }));
    const result = await window.api.getAIDialogueReply(messages);
    pending.remove();
    if (result.success && result.reply) {
      const reply = result.reply.trim();
      this.conversation.push({ speaker: 'ai', text: reply });
      this.appendDialogueLine('ai', reply);
      this.addFeedbackItem('AI 已接话，继续回应它的问题', 'ai');
    } else {
      this.addFeedbackItem(`AI 对话失败：${result.error}`, 'filler');
    }
    this.aiReplyPending = false;
  }

  highlightText(text) {
    let result = text;
    const vagueWords = ['开心','难过','害怕','生气','不舒服','很好','很多','很快','很大','很小','好看','不好','喜欢','讨厌','觉得','想想'];
    vagueWords.forEach(w => {
      result = result.replace(new RegExp(w, 'g'), `<span class="vague">${w}</span>`);
    });
    const fillerPatterns = /(嗯|啊|呃|额|那个|就是|然后|这个|对吧|是吧|反正|基本上)/g;
    result = result.replace(fillerPatterns, '<span class="filler">$1</span>');
    const hedgePatterns = /(可能|也许|大概|应该|我觉得|好像|似乎|或许|不一定|差不多|感觉)/g;
    result = result.replace(hedgePatterns, '<span class="hedge">$1</span>');
    return result;
  }

  // ===== 分析 =====

  async analyzeCurrentSentence(text) {
    const analysis = await window.api.analyzeText(text);
    if (analysis) {
      this.stats.fillers += analysis.fillers.length;
      this.stats.hedges += analysis.hedges.length;
      this.stats.vagueWords += analysis.vagueWords.length;
      this.stats.totalWords += analysis.totalWords;
      this.updateStatsDisplay();
      // 词库反馈不依赖网络，保证每个完成句子都能得到即时提示。
      if (analysis.fillers.length === 0 && analysis.hedges.length === 0 && analysis.vagueWords.length === 0) {
        this.addFeedbackItem('本段表达清晰，继续保持。', 'good');
      } else if (analysis.fillers.length > 0 || analysis.hedges.length > 0) {
        this.addFeedbackItem('已发现可优化的口头表达，看看左侧标记并尝试停顿。', 'ai');
      } else {
        this.addFeedbackItem('可以把笼统词换成具体事实或例子。', 'vague');
      }
      // 碰到笼统词 → 立刻在反馈栏弹出替换建议
      if (analysis.vagueWords && analysis.vagueWords.length > 0) {
        analysis.vagueWords.forEach(item => {
          const alts = item.alternatives.slice(0, 3).join(' / ');
          this.addFeedbackItem(`「${item.word}」→ ${alts}`, 'vague');
        });
      }
      // 碰到填充词 → 弹提醒
      if (analysis.fillers && analysis.fillers.length >= 2) {
        const uniqueFillers = [...new Set(analysis.fillers.map(f => f.word))].slice(0, 3);
        this.addFeedbackItem(`填充词：${uniqueFillers.join('、')}——试试停顿`, 'filler');
      }
      // 碰到犹豫词 → 弹提醒
      if (analysis.hedges && analysis.hedges.length >= 1) {
        const uniqueHedges = [...new Set(analysis.hedges.map(h => h.word))].slice(0, 2);
        this.addFeedbackItem(`「${uniqueHedges.join('」「')}」→ 直接说`, 'hedge');
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

  // ===== 实时反馈 =====

  async requestRealtimeFeedback() {
    this.lastFeedbackText = this.fullText;
    try {
      const result = await window.api.getRealtimeFeedback(this.fullText);
      if (result.success && result.feedback) {
        const lines = result.feedback.split('\n').filter(l => l.trim());
        lines.forEach(line => {
          const type = this.classifyFeedback(line.trim());
          this.addFeedbackItem(line.trim(), type);
        });
      }
    } catch (error) {
      // AI 不可用时保留本地词库反馈，不让右栏看起来像失效。
      this.addFeedbackItem('AI 实时建议暂不可用，已使用本地词库继续分析。', 'ai');
    }
  }

  classifyFeedback(text) {
    if (text === '✓' || text.includes('✓')) return 'good';
    // 填充词相关
    const fillerKeywords = ['嗯','啊','呃','那个','就是','然后','这个','对吧','是吧','反正','基本上','所以说'];
    if (fillerKeywords.some(w => text.includes(`「${w}」`))) return 'filler';
    // 犹豫词相关
    const hedgeKeywords = ['可能','也许','大概','应该','我觉得','好像','似乎','感觉','或许'];
    if (hedgeKeywords.some(w => text.includes(`「${w}」`))) return 'hedge';
    // 其他精准词替换
    if (text.includes('→')) return 'vague';
    return 'ai';
  }

  addFeedbackItem(text, type = 'ai') {
    // 去重：如果前3条已经有相同内容，跳过
    const existing = Array.from(this.feedbackContent.children).slice(0, 3);
    if (existing.some(el => el.textContent === text)) return;

    const item = document.createElement('div');
    item.className = `feedback-item type-${type}`;
    item.textContent = text;
    this.feedbackContent.insertBefore(item, this.feedbackContent.firstChild);
    while (this.feedbackContent.children.length > 12) {
      this.feedbackContent.removeChild(this.feedbackContent.lastChild);
    }
  }

  // ===== 报告 =====

  async generateReport() {
    this.reportBody.innerHTML = '<p style="text-align:center;color:#666;padding:40px;">正在生成报告...</p>';
    this.reportModal.classList.remove('hidden');

    const result = await window.api.getFinalReport({
      fullText: this.fullText,
      stats: this.stats,
      conversation: this.mode === 'dialogue' ? this.conversation : []
    });

    if (result.success) {
      this.lastReport = result.report;
      this.renderReport(result.report);
    } else {
      this.reportBody.innerHTML = `<p style="color:#ff6b6b;">生成失败: ${result.error}</p>`;
    }
  }

  renderReport(report) {
    let html = report
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
      .replace(/\|(.+)\|/g, (match) => {
        // 简单表格支持
        return match;
      })
      .replace(/\n/g, '<br>');

    this.reportBody.innerHTML = `
      <div style="text-align:right;margin-bottom:12px;">
        <button id="btn-save-report" style="background:#E5007E;color:#fff;border:none;border-radius:6px;padding:8px 14px;font-size:12px;cursor:pointer;">💾 保存为 Markdown</button>
      </div>
      ${html}
    `;

    document.getElementById('btn-save-report').addEventListener('click', () => this.saveReport());
  }

  async saveReport() {
    if (!this.lastReport) return;
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 5).replace(':', '');
    const transcript = this.mode === 'dialogue'
      ? `## 对话记录\n\n${this.conversation.map(turn => `**${turn.speaker === 'ai' ? 'AI' : '我'}**：${turn.text}`).join('\n\n')}\n\n---\n\n`
      : '';
    const modeLabel = this.mode === 'dialogue' ? 'AI 对话' : this.mode === 'challenge' ? '挑战模式' : '独自表达';
    const markdown = `# 表达训练报告\n\n**模式**: ${modeLabel}  \n**日期**: ${dateStr}  \n**时长**: ${this.stats.duration}秒  \n**总字数**: ${this.stats.totalWords}  \n\n---\n\n${transcript}## 我的原文\n\n${this.fullText}\n\n---\n\n${this.lastReport}`;
    const filename = `表达训练-${dateStr}-${timeStr}.md`;

    try {
      const result = await window.api.saveFile(markdown, filename);
      if (result.success) {
        const btn = document.getElementById('btn-save-report');
        btn.textContent = '✓ 已保存';
        btn.style.background = '#333';
        setTimeout(() => { btn.textContent = '💾 保存为 Markdown'; btn.style.background = '#E5007E'; }, 2000);
      }
    } catch (e) {
      alert('保存失败: ' + e.message);
    }
  }

  // ===== 工具 =====

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

  showError(msg) {
    const line = document.createElement('div');
    line.className = 'subtitle-line';
    line.style.color = '#ff6b6b';
    line.textContent = msg;
    this.subtitleContainer.appendChild(line);
  }

  // ===== 复制 & 保存原文 & 清空 =====

  copyOriginalText() {
    if (!this.fullText.trim()) return;
    navigator.clipboard.writeText(this.fullText).then(() => {
      this.btnCopyText.textContent = '✓ 已复制';
      setTimeout(() => { this.btnCopyText.textContent = '📋 复制'; }, 1500);
    });
  }

  async saveOriginalText() {
    if (!this.fullText.trim()) return;
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 5).replace(':', '');
    const markdown = `# 表达训练原文\n\n**日期**: ${dateStr}\n\n---\n\n${this.fullText}`;
    const filename = `原文-${dateStr}-${timeStr}.md`;

    try {
      const result = await window.api.saveFile(markdown, filename);
      if (result.success) {
        this.btnSaveText.textContent = '✓ 已保存';
        setTimeout(() => { this.btnSaveText.textContent = '💾 保存'; }, 2000);
      }
    } catch (e) {
      alert('保存失败: ' + e.message);
    }
  }

  clearAll() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    this.fullText = '';
    this.sentences = [];
    this.conversation = [];
    this.aiReplyPending = false;
    this.lastReport = '';
    this.subtitleContainer.innerHTML = '<div class="subtitle-line hint">点击下方按钮开始说话</div>';
    this.feedbackContent.innerHTML = '';
    this.resetStats();
    this.timer.textContent = '00:00';
    this.timer.classList.remove('active');
    this.btnReport.classList.add('hidden');
    this.btnCopyText.classList.add('hidden');
    this.btnSaveText.classList.add('hidden');
    this.btnClear.classList.add('hidden');
  }

  // ===== 粘贴逐字稿分析 =====

  openPasteModal() {
    this.pasteTextarea.value = '';
    this.pasteModal.classList.remove('hidden');
    this.pasteTextarea.focus();
  }

  async analyzePastedText() {
    const text = this.pasteTextarea.value.trim();
    if (!text) return;

    // 关闭粘贴弹窗
    this.pasteModal.classList.add('hidden');

    // 把文本显示到字幕区（高亮标记）
    this.subtitleContainer.innerHTML = '';
    this.fullText = text;
    this.conversation = [{ speaker: 'user', text }];
    this.resetStats();

    // 按句号/问号/感叹号/换行分句
    const sentences = text.split(/(?<=[。！？\n])/g).filter(s => s.trim());
    this.sentences = sentences;

    for (const sentence of sentences) {
      const line = document.createElement('div');
      line.className = 'subtitle-line';
      line.innerHTML = this.highlightText(sentence.trim());
      this.subtitleContainer.appendChild(line);

      // 词库分析
      const analysis = await window.api.analyzeText(sentence);
      if (analysis) {
        this.stats.fillers += analysis.fillers.length;
        this.stats.hedges += analysis.hedges.length;
        this.stats.vagueWords += analysis.vagueWords.length;
        this.stats.totalWords += analysis.totalWords;
      }
    }

    this.stats.duration = 0; // 粘贴模式没有时长
    this.updateStatsDisplay();

    // 显示操作按钮
    this.btnReport.classList.remove('hidden');
    this.btnCopyText.classList.remove('hidden');
    this.btnSaveText.classList.remove('hidden');
    this.btnClear.classList.remove('hidden');

    // 请求AI语境化反馈
    this.requestRealtimeFeedback();
  }
}

document.addEventListener('DOMContentLoaded', () => { new ExpressionTrainer(); });
