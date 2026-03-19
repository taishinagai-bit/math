document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "math-training-modal-c-layout-v6";

  const modeOrder = ["ten", "carry", "borrow", "survival"];

  const modeConfig = {
    ten: {
      name: "10問連続",
      description: "足し算・引き算をテンポよく10問",
      count: 10
    },
    carry: {
      name: "繰り上がり特化",
      description: "足し算の繰り上がりだけを集中練習",
      count: 10
    },
    borrow: {
      name: "繰り下がり特化",
      description: "引き算の繰り下がりだけを集中練習",
      count: 10
    },
    survival: {
      name: "サバイバル",
      description: "ライフが0になるまで続くサバイバルモード",
      count: Infinity
    }
  };

  const survivalDifficultyConfig = {
    easy: {
      name: "イージー",
      lives: 3,
      limit: 5
    },
    normal: {
      name: "ノーマル",
      lives: 2,
      limit: 4
    },
    hard: {
      name: "ハード",
      lives: 1,
      limit: 3
    }
  };

  const currentModeNameEl = document.getElementById("currentModeName");
  const currentModeDescriptionEl = document.getElementById("currentModeDescription");
  const prevModeButtonEl = document.getElementById("prevModeButton");
  const nextModeButtonEl = document.getElementById("nextModeButton");
  const openSelectedModeButtonEl = document.getElementById("openSelectedModeButton");

  const limitOptionButtons = Array.from(document.querySelectorAll(".limitOption"));
  const difficultyOptionButtons = Array.from(document.querySelectorAll(".difficultyOption"));

  const normalLimitBlockEl = document.getElementById("normalLimitBlock");
  const survivalDifficultyBlockEl = document.getElementById("survivalDifficultyBlock");

  const modeModalEl = document.getElementById("modeModal");
  const closeModalButtonEl = document.getElementById("closeModalButton");
  const closePlayModalButtonEl = document.getElementById("closePlayModalButton");
  const modalStartButtonEl = document.getElementById("modalStartButton");
  const modalRetryButtonEl = document.getElementById("modalRetryButton");
  const modalCloseAfterResultButtonEl = document.getElementById("modalCloseAfterResultButton");
  const modalCloseAfterResultButtonTopEl = document.getElementById("modalCloseAfterResultButtonTop");

  const modalModeNameEl = document.getElementById("modalModeName");
  const modalModeDescriptionEl = document.getElementById("modalModeDescription");
  const modalBestTimeEl = document.getElementById("modalBestTime");
  const modalLastRecordEl = document.getElementById("modalLastRecord");

  const modalReadyViewEl = document.getElementById("modalReadyView");
  const modalPlayViewEl = document.getElementById("modalPlayView");
  const modalResultViewEl = document.getElementById("modalResultView");

  const playModeNameEl = document.getElementById("playModeName");
  const playModeMetaEl = document.getElementById("playModeMeta");
  const modalTimerEl = document.getElementById("modalTimer");
  const modalProgressEl = document.getElementById("modalProgress");
  const modalPlayDescriptionEl = document.getElementById("modalPlayDescription");
  const modalQuizFormEl = document.getElementById("modalQuizForm");

  const limitMeterWrapEl = document.getElementById("limitMeterWrap");
  const limitMeterTextEl = document.getElementById("limitMeterText");
  const limitMeterBarEl = document.getElementById("limitMeterBar");

  const survivalHudEl = document.getElementById("survivalHud");
  const survivalLivesEl = document.getElementById("survivalLives");
  const survivalScoreEl = document.getElementById("survivalScore");

  const resultCorrectCountEl = document.getElementById("resultCorrectCount");
  const resultFinalTimeEl = document.getElementById("resultFinalTime");
  const resultAverageTimeEl = document.getElementById("resultAverageTime");
  const resultComparisonTextEl = document.getElementById("resultComparisonText");
  const resultBestUpdateEl = document.getElementById("resultBestUpdate");
  const resultSpeedRatingEl = document.getElementById("resultSpeedRating");

  const survivalResultHeroEl = document.getElementById("survivalResultHero");
  const survivalResultRankEl = document.getElementById("survivalResultRank");
  const survivalResultScoreEl = document.getElementById("survivalResultScore");
  const survivalResultCommentEl = document.getElementById("survivalResultComment");

  const judgeOverlayEl = document.getElementById("judgeOverlay");
  const judgeMarkEl = document.getElementById("judgeMark");

  let currentMode = "ten";
  let currentLimit = 0;
  let currentSurvivalDifficulty = "easy";

  let questions = [];
  let currentQuestionIndex = 0;
  let correctCount = 0;
  let startTime = 0;
  let timerId = null;
  let started = false;
  let isLocked = false;

  let survivalLives = 0;
  let survivalScore = 0;
  let currentAnswerValue = "";

  let perQuestionStart = 0;
  let perQuestionFrameId = null;
  let perQuestionTimeoutId = null;

  let audioEnabled = true;
  let audioUnlocked = false;

  const correctSound = new Audio("correct.mp3");
  const wrongSound = new Audio("wrong.mp3");
  const menuBgm = new Audio("menu-bgm.mp3");
  const playBgm = new Audio("play-bgm.mp3");

  correctSound.preload = "auto";
  wrongSound.preload = "auto";
  menuBgm.preload = "auto";
  playBgm.preload = "auto";

  correctSound.volume = 0.75;
  wrongSound.volume = 0.75;
  menuBgm.volume = 0.35;
  playBgm.volume = 0.4;

  menuBgm.loop = true;
  playBgm.loop = true;

  function primeAudio(audio) {
    try {
      audio.play().then(() => {
        audio.pause();
        audio.currentTime = 0;
      }).catch(() => {});
    } catch (error) {
      // no-op
    }
  }

  function unlockAudio() {
    if (!audioEnabled || audioUnlocked) return;
    audioUnlocked = true;
    primeAudio(correctSound);
    primeAudio(wrongSound);
    primeAudio(menuBgm);
    primeAudio(playBgm);
  }

  function playMenuBgm() {
    if (!audioEnabled || !audioUnlocked) return;

    playBgm.pause();
    playBgm.currentTime = 0;

    if (menuBgm.paused) {
      menuBgm.currentTime = 0;
      menuBgm.play().catch(() => {});
    }
  }

  function playPlayBgm() {
    if (!audioEnabled || !audioUnlocked) return;

    menuBgm.pause();
    menuBgm.currentTime = 0;

    if (playBgm.paused) {
      playBgm.currentTime = 0;
      playBgm.play().catch(() => {});
    }
  }

  function playCorrectSound() {
    if (!audioEnabled || !audioUnlocked) return;
    correctSound.currentTime = 0;
    correctSound.play().catch(() => {});
  }

  function playWrongSound() {
    if (!audioEnabled || !audioUnlocked) return;
    wrongSound.currentTime = 0;
    wrongSound.play().catch(() => {});
  }

  function bindInitialAudioUnlock() {
    const unlockOnce = () => {
      unlockAudio();
      playMenuBgm();
      document.removeEventListener("touchstart", unlockOnce);
      document.removeEventListener("click", unlockOnce);
    };

    document.addEventListener("touchstart", unlockOnce, { once: true });
    document.addEventListener("click", unlockOnce, { once: true });
  }

  function isSurvivalMode(mode = currentMode) {
    return mode === "survival";
  }

  function makeRecordKey(mode, limit, difficulty = "") {
    return `${mode}__limit_${limit}__difficulty_${difficulty}`;
  }

  function getLimitLabel(limit) {
    return limit === 0 ? "制限なし" : `${limit}秒`;
  }

  function getCurrentPlayMeta() {
    if (isSurvivalMode()) {
      const diff = survivalDifficultyConfig[currentSurvivalDifficulty];
      return `${diff.name} / ${diff.lives}ライフ / ${diff.limit}秒`;
    }
    return getLimitLabel(currentLimit);
  }

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return { bestTimes: {}, lastResults: {} };
      }
      return JSON.parse(raw);
    } catch (error) {
      return { bestTimes: {}, lastResults: {} };
    }
  }

  function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function getBestRecord(mode, limit, difficulty = "") {
    const key = makeRecordKey(mode, limit, difficulty);
    const data = loadData();
    return data.bestTimes?.[key] ?? null;
  }

  function setBestRecord(mode, limit, difficulty, value, preferLower = false) {
    const key = makeRecordKey(mode, limit, difficulty);
    const data = loadData();
    const currentBest = data.bestTimes?.[key] ?? null;
    let updated = false;

    if (currentBest === null) {
      data.bestTimes[key] = value;
      updated = true;
    } else if (preferLower ? value < currentBest : value > currentBest) {
      data.bestTimes[key] = value;
      updated = true;
    }

    saveData(data);
    return updated;
  }

  function getLastResult(mode, limit, difficulty = "") {
    const key = makeRecordKey(mode, limit, difficulty);
    const data = loadData();
    return data.lastResults?.[key] || null;
  }

  function setLastResult(mode, limit, difficulty, result) {
    const key = makeRecordKey(mode, limit, difficulty);
    const data = loadData();
    data.lastResults[key] = result;
    saveData(data);
  }

  function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  function formatLastRecord(mode, limit, difficulty = "") {
    const last = getLastResult(mode, limit, difficulty);
    if (!last) return "未記録";

    if (mode === "survival") {
      return `${last.score}問 ・ ${formatTime(last.totalMs)}`;
    }

    return `${last.correct}/${last.total}問 ・ ${formatTime(last.totalMs)} ・ ${last.avgSec.toFixed(1)}秒/問`;
  }

  function getSpeedText(avgSec) {
    if (avgSec < 1.0) return "かなり速い";
    if (avgSec < 2.0) return "速い";
    if (avgSec < 3.0) return "標準";
    return "伸びしろあり";
  }

  function getSurvivalRankInfo(score, difficulty) {
    if (difficulty === "easy") {
      if (score >= 20) {
        return {
          rank: "イージー王者",
          comment: "安定感ばつぐん。完全に流れをつかんでる。"
        };
      }
      if (score >= 12) {
        return {
          rank: "イージー達人",
          comment: "かなりいい。落ち着いて解けてる。"
        };
      }
      if (score >= 6) {
        return {
          rank: "イージー中級者",
          comment: "いい調子。このまま二桁を狙える。"
        };
      }
      return {
        rank: "イージー見習い",
        comment: "まずはここから。感覚をつかんでいこう。"
      };
    }

    if (difficulty === "normal") {
      if (score >= 18) {
        return {
          rank: "ノーマル王者",
          comment: "強い。かなり仕上がってる。"
        };
      }
      if (score >= 10) {
        return {
          rank: "ノーマル達人",
          comment: "いい突破力。安定して伸ばせてる。"
        };
      }
      if (score >= 5) {
        return {
          rank: "ノーマル中級者",
          comment: "いい線いってる。次は二桁が目標。"
        };
      }
      return {
        rank: "ノーマル見習い",
        comment: "ここからが本番。まずはリズムを作ろう。"
      };
    }

    if (score >= 12) {
      return {
        rank: "ハード王者",
        comment: "すごい。かなりの反応速度。"
      };
    }
    if (score >= 6) {
      return {
        rank: "ハード達人",
        comment: "強い。ハードでもしっかり戦えてる。"
      };
    }
    if (score >= 3) {
      return {
        rank: "ハード中級者",
        comment: "いい挑戦。かなりゲームになってきた。"
      };
    }
    return {
      rank: "ハード挑戦者",
      comment: "ハードは別格。ここから少しずつ伸ばそう。"
    };
  }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function makeAddRange(minA, maxA, minB, maxB) {
    const a = randInt(minA, maxA);
    const b = randInt(minB, maxB);
    return { text: `${a} + ${b}`, answer: a + b };
  }

  function makeSubRange(minA, maxA, minB, maxB) {
    const a = randInt(minA, maxA);
    const b = randInt(minB, Math.min(maxB, a - 1));
    return { text: `${a} - ${b}`, answer: a - b };
  }

  function makeCarryRange(minA, maxA, minB, maxB) {
    let a;
    let b;

    do {
      a = randInt(minA, maxA);
      b = randInt(minB, maxB);
    } while ((a % 10) + (b % 10) < 10);

    return { text: `${a} + ${b}`, answer: a + b };
  }

  function makeBorrowRange(minA, maxA, minB, maxB) {
    let a;
    let b;

    do {
      a = randInt(minA, maxA);
      b = randInt(minB, Math.min(maxB, a - 1));
    } while ((a % 10) >= (b % 10));

    return { text: `${a} - ${b}`, answer: a - b };
  }

  function makeAdd() {
    return makeAddRange(11, 79, 11, 29);
  }

  function makeSub() {
    return makeSubRange(40, 99, 11, 39);
  }

  function makeCarry() {
    return makeCarryRange(15, 79, 15, 79);
  }

  function makeBorrow() {
    return makeBorrowRange(30, 99, 11, 79);
  }

  function getSurvivalStage(score) {
    if (score <= 4) return 1;
    if (score <= 9) return 2;
    return 3;
  }

  function createSurvivalQuestion(difficulty, score) {
    const stage = getSurvivalStage(score);

    if (difficulty === "easy") {
      if (stage === 1) {
        return Math.random() < 0.6
          ? makeAddRange(1, 9, 1, 9)
          : makeSubRange(5, 18, 1, 9);
      }
      if (stage === 2) {
        return Math.random() < 0.5
          ? makeAddRange(5, 19, 2, 12)
          : makeSubRange(10, 25, 2, 12);
      }
      return Math.random() < 0.5
        ? makeCarryRange(8, 29, 5, 19)
        : makeBorrowRange(20, 39, 5, 19);
    }

    if (difficulty === "normal") {
      if (stage === 1) {
        return Math.random() < 0.5
          ? makeAddRange(8, 25, 3, 15)
          : makeSubRange(12, 30, 3, 15);
      }
      if (stage === 2) {
        return Math.random() < 0.5
          ? makeCarryRange(12, 39, 8, 29)
          : makeBorrowRange(20, 49, 8, 29);
      }
      return Math.random() < 0.5
        ? makeCarryRange(20, 59, 12, 39)
        : makeBorrowRange(35, 79, 12, 39);
    }

    if (stage === 1) {
      return Math.random() < 0.5
        ? makeCarryRange(15, 49, 10, 35)
        : makeBorrowRange(25, 59, 10, 35);
    }

    if (stage === 2) {
      return Math.random() < 0.5
        ? makeCarryRange(30, 69, 15, 45)
        : makeBorrowRange(45, 89, 15, 45);
    }

    return Math.random() < 0.5
      ? makeCarryRange(45, 99, 25, 59)
      : makeBorrowRange(60, 99, 25, 59);
  }

  function createQuestion(mode) {
    if (mode === "carry") return makeCarry();
    if (mode === "borrow") return makeBorrow();
    return Math.random() < 0.5 ? makeAdd() : makeSub();
  }

  function generateQuestions() {
    questions = [];
    const count = modeConfig[currentMode].count;

    for (let i = 0; i < count; i += 1) {
      questions.push(createQuestion(currentMode));
    }

    currentQuestionIndex = 0;
    correctCount = 0;
    isLocked = false;
  }

  function updateSurvivalHud() {
    if (survivalLivesEl) {
      survivalLivesEl.textContent = "❤️".repeat(Math.max(0, survivalLives));
    }
    if (survivalScoreEl) {
      survivalScoreEl.textContent = String(survivalScore);
    }
  }

  function getAnswerDigits(answer) {
    return String(Math.abs(answer)).length;
  }

  function updateHomeMode() {
    if (currentModeNameEl) currentModeNameEl.textContent = modeConfig[currentMode].name;
    if (currentModeDescriptionEl) currentModeDescriptionEl.textContent = modeConfig[currentMode].description;
  }

  function updateDifficultyButtons() {
    difficultyOptionButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.difficulty === currentSurvivalDifficulty);
    });
  }

  function updateLimitButtons(limit) {
    limitOptionButtons.forEach((button) => {
      button.classList.toggle("active", Number(button.dataset.limit) === limit);
    });
  }

  function updateModalInfo(mode, limit) {
    if (modalModeNameEl) modalModeNameEl.textContent = modeConfig[mode].name;
    if (modalModeDescriptionEl) modalModeDescriptionEl.textContent = modeConfig[mode].description;
    if (modalPlayDescriptionEl) modalPlayDescriptionEl.textContent = modeConfig[mode].description;
    if (playModeNameEl) playModeNameEl.textContent = modeConfig[mode].name;
    if (playModeMetaEl) playModeMetaEl.textContent = getCurrentPlayMeta();

    if (isSurvivalMode(mode)) {
      normalLimitBlockEl?.classList.add("hidden");
      survivalDifficultyBlockEl?.classList.remove("hidden");
      survivalHudEl?.classList.remove("hidden");

      const diff = survivalDifficultyConfig[currentSurvivalDifficulty];
      const best = getBestRecord(mode, diff.limit, currentSurvivalDifficulty);

      if (modalBestTimeEl) modalBestTimeEl.textContent = best !== null ? `${best}問` : "未記録";
      if (modalLastRecordEl) modalLastRecordEl.textContent = formatLastRecord(mode, diff.limit, currentSurvivalDifficulty);
    } else {
      normalLimitBlockEl?.classList.remove("hidden");
      survivalDifficultyBlockEl?.classList.add("hidden");
      survivalHudEl?.classList.add("hidden");

      const best = getBestRecord(mode, limit, "");
      if (modalBestTimeEl) modalBestTimeEl.textContent = best ? formatTime(best) : "未記録";
      if (modalLastRecordEl) modalLastRecordEl.textContent = formatLastRecord(mode, limit, "");
    }
  }

  function showReadyView() {
    modalReadyViewEl?.classList.remove("hidden");
    modalPlayViewEl?.classList.add("hidden");
    modalResultViewEl?.classList.add("hidden");
  }

  function showPlayView() {
    modalReadyViewEl?.classList.add("hidden");
    modalPlayViewEl?.classList.remove("hidden");
    modalResultViewEl?.classList.add("hidden");
  }

  function showResultView() {
    modalReadyViewEl?.classList.add("hidden");
    modalPlayViewEl?.classList.add("hidden");
    modalResultViewEl?.classList.remove("hidden");
  }

  function openModeModal(mode) {
    unlockAudio();
    playMenuBgm();
    currentMode = mode;
    updateHomeMode();
    updateDifficultyButtons();
    updateLimitButtons(currentLimit);
    updateModalInfo(currentMode, currentLimit);
    showReadyView();
    modeModalEl?.classList.remove("hidden");
  }

  function closeModeModal() {
    stopTimer();
    stopPerQuestionLimit();
    started = false;
    playMenuBgm();
    modeModalEl?.classList.add("hidden");
  }

  function updateProgress() {
    if (!modalProgressEl) return;

    if (isSurvivalMode()) {
      modalProgressEl.textContent = `${survivalScore}問`;
    } else {
      modalProgressEl.textContent = `${currentQuestionIndex + 1} / ${questions.length}`;
    }
  }

  function updateAnswerDisplay() {
    const answerDisplayEl = modalQuizFormEl?.querySelector("#answerDisplay");
    if (!answerDisplayEl) return;

    if (!currentAnswerValue) {
      answerDisplayEl.textContent = "入力";
      answerDisplayEl.classList.add("is-empty");
      return;
    }

    answerDisplayEl.textContent = currentAnswerValue;
    answerDisplayEl.classList.remove("is-empty");
  }

  function clearAnswer() {
    if (!started || isLocked) return;
    currentAnswerValue = "";
    updateAnswerDisplay();
  }

  function deleteAnswer() {
    if (!started || isLocked) return;
    currentAnswerValue = currentAnswerValue.slice(0, -1);
    updateAnswerDisplay();
  }

  function getCurrentRenderedQuestion() {
    return questions[currentQuestionIndex] || questions[0] || null;
  }

  function appendDigit(digit) {
    if (!started || isLocked) return;

    const q = getCurrentRenderedQuestion();
    if (!q) return;

    const requiredDigits = getAnswerDigits(q.answer);
    if (currentAnswerValue.length >= requiredDigits) return;

    currentAnswerValue += digit;
    updateAnswerDisplay();

    if (currentAnswerValue.length >= requiredDigits) {
      setTimeout(() => {
        if (started && !isLocked) {
          submitCurrentAnswer();
        }
      }, 80);
    }
  }

  function submitCurrentAnswer() {
    if (!started || isLocked) return;

    const q = getCurrentRenderedQuestion();
    if (!q) return;

    const requiredDigits = getAnswerDigits(q.answer);
    if (currentAnswerValue.length < requiredDigits) return;

    const numericValue = Number(currentAnswerValue);
    const isCorrect = numericValue === q.answer;
    lockAndJudge(isCorrect);
  }

  function bindKeypadButtons() {
    const keypadButtons = Array.from(modalQuizFormEl?.querySelectorAll(".keypadButton") || []);

    keypadButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const action = button.dataset.action;
        const key = button.dataset.key;

        if (action === "clear") {
          clearAnswer();
          return;
        }

        if (action === "delete") {
          deleteAnswer();
          return;
        }

        if (key) {
          appendDigit(key);
        }
      });
    });
  }

  function renderCurrentQuestion() {
    if (!modalQuizFormEl) return;

    let q;

    if (isSurvivalMode()) {
      q = createSurvivalQuestion(currentSurvivalDifficulty, survivalScore);
      questions = [q];
      currentQuestionIndex = 0;
    } else {
      q = questions[currentQuestionIndex];
    }

    if (!q) return;

    currentAnswerValue = "";

    modalQuizFormEl.innerHTML = `
      <div class="questionShell">
        <div class="questionTop">
          <div class="questionNumber">${isSurvivalMode() ? `サバイバル ${survivalScore + 1}問目` : `問${currentQuestionIndex + 1}`}</div>

          <div class="equationRow">
            <div class="equationText">${q.text} =</div>
            <div id="answerDisplay" class="answerDisplay is-empty">入力</div>
          </div>

          <div id="feedbackText" class="feedback"></div>
        </div>

        <div class="keypadWrap">
          <div class="keypadGrid">
            <button class="keypadButton" type="button" data-key="1">1</button>
            <button class="keypadButton" type="button" data-key="2">2</button>
            <button class="keypadButton" type="button" data-key="3">3</button>

            <button class="keypadButton" type="button" data-key="4">4</button>
            <button class="keypadButton" type="button" data-key="5">5</button>
            <button class="keypadButton" type="button" data-key="6">6</button>

            <button class="keypadButton" type="button" data-key="7">7</button>
            <button class="keypadButton" type="button" data-key="8">8</button>
            <button class="keypadButton" type="button" data-key="9">9</button>

            <button class="keypadButton function" type="button" data-action="clear">C</button>
            <button class="keypadButton" type="button" data-key="0">0</button>
            <button class="keypadButton function" type="button" data-action="delete">←</button>
          </div>
        </div>
      </div>
    `;

    bindKeypadButtons();
    updateAnswerDisplay();
    updateProgress();
    updateSurvivalHud();
    startPerQuestionLimit();

    requestAnimationFrame(() => {
      if (modalQuizFormEl) {
        modalQuizFormEl.scrollTop = 0;
      }
      if (modalQuizFormEl?.parentElement) {
        modalQuizFormEl.parentElement.scrollTop = 0;
      }
    });
  }

  function startTimer() {
    startTime = Date.now();
    if (modalTimerEl) modalTimerEl.textContent = "00:00";

    if (timerId) clearInterval(timerId);

    timerId = setInterval(() => {
      if (modalTimerEl && started) {
        modalTimerEl.textContent = formatTime(Date.now() - startTime);
      }
    }, 100);
  }

  function stopTimer() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function stopPerQuestionLimit() {
    if (perQuestionFrameId) {
      cancelAnimationFrame(perQuestionFrameId);
      perQuestionFrameId = null;
    }
    if (perQuestionTimeoutId) {
      clearTimeout(perQuestionTimeoutId);
      perQuestionTimeoutId = null;
    }
  }

  function getCurrentQuestionLimit() {
    if (isSurvivalMode()) {
      return survivalDifficultyConfig[currentSurvivalDifficulty].limit;
    }
    return currentLimit;
  }

  function updateLimitMeterVisibility() {
    const currentQuestionLimit = getCurrentQuestionLimit();
    const show = currentQuestionLimit > 0;

    if (limitMeterWrapEl) {
      limitMeterWrapEl.classList.toggle("hidden", !show);
    }
    if (limitMeterTextEl) {
      limitMeterTextEl.textContent = show ? `${currentQuestionLimit.toFixed(1)}秒` : "";
    }
    if (limitMeterBarEl) {
      limitMeterBarEl.style.transform = "scaleX(1)";
    }
  }

  function startPerQuestionLimit() {
    stopPerQuestionLimit();
    updateLimitMeterVisibility();

    const currentQuestionLimit = getCurrentQuestionLimit();
    if (currentQuestionLimit <= 0) return;

    perQuestionStart = performance.now();
    const totalMs = currentQuestionLimit * 1000;

    function tick(now) {
      const elapsed = now - perQuestionStart;
      const remain = Math.max(0, totalMs - elapsed);
      const ratio = remain / totalMs;

      if (limitMeterBarEl) {
        limitMeterBarEl.style.transform = `scaleX(${ratio})`;
      }
      if (limitMeterTextEl) {
        limitMeterTextEl.textContent = `${(remain / 1000).toFixed(1)}秒`;
      }

      if (remain <= 0) return;
      perQuestionFrameId = requestAnimationFrame(tick);
    }

    perQuestionFrameId = requestAnimationFrame(tick);

    perQuestionTimeoutId = setTimeout(() => {
      if (!started || isLocked) return;
      handleTimeUp();
    }, totalMs);
  }

  function startSession() {
    unlockAudio();
    started = true;
    isLocked = false;
    correctCount = 0;

    if (isSurvivalMode()) {
      const diff = survivalDifficultyConfig[currentSurvivalDifficulty];
      survivalLives = diff.lives;
      survivalScore = 0;
    } else {
      generateQuestions();
    }

    playPlayBgm();
    showPlayView();
    updateModalInfo(currentMode, currentLimit);
    updateLimitMeterVisibility();
    startTimer();
    renderCurrentQuestion();
  }

  function showJudge(isCorrect) {
    if (!judgeOverlayEl || !judgeMarkEl) return;

    judgeOverlayEl.classList.remove("hidden", "correct", "wrong");
    judgeOverlayEl.classList.add(isCorrect ? "correct" : "wrong");
    judgeMarkEl.textContent = isCorrect ? "⭕️" : "✖️";
  }

  function hideJudge() {
    judgeOverlayEl?.classList.add("hidden");
    judgeOverlayEl?.classList.remove("correct", "wrong");
  }

  function makeComparisonText(mode, totalMs) {
    if (isSurvivalMode(mode)) {
      const diff = survivalDifficultyConfig[currentSurvivalDifficulty];
      const last = getLastResult(mode, diff.limit, currentSurvivalDifficulty);
      if (!last) return "初回記録";

      const diffScore = survivalScore - last.score;
      if (diffScore > 0) return `前回より +${diffScore}問`;
      if (diffScore < 0) return `前回より ${Math.abs(diffScore)}問少ない`;
      return "前回と同じ記録";
    }

    const last = getLastResult(mode, currentLimit, "");
    if (!last) return "初回記録";

    const diffMs = totalMs - last.totalMs;
    const diffSec = Math.abs(diffMs / 1000).toFixed(1);

    if (diffMs < 0) return `前回より速い！ (${diffSec}秒短縮)`;
    if (diffMs > 0) return `前回より少しゆっくり (${diffSec}秒)`;
    return "前回と同じタイム";
  }

  function finalizeResult() {
    started = false;
    stopTimer();
    stopPerQuestionLimit();

    const totalMs = Date.now() - startTime;
    const comparisonMessage = makeComparisonText(currentMode, totalMs);

    let bestUpdated = false;

    if (isSurvivalMode()) {
      const diff = survivalDifficultyConfig[currentSurvivalDifficulty];
      const rankInfo = getSurvivalRankInfo(survivalScore, currentSurvivalDifficulty);

      bestUpdated = setBestRecord(currentMode, diff.limit, currentSurvivalDifficulty, survivalScore, false);

      setLastResult(currentMode, diff.limit, currentSurvivalDifficulty, {
        score: survivalScore,
        totalMs
      });

      if (survivalResultHeroEl) survivalResultHeroEl.classList.remove("hidden");
      if (survivalResultRankEl) survivalResultRankEl.textContent = rankInfo.rank;
      if (survivalResultScoreEl) survivalResultScoreEl.textContent = `${survivalScore}問突破`;
      if (survivalResultCommentEl) survivalResultCommentEl.textContent = rankInfo.comment;

      if (resultCorrectCountEl) resultCorrectCountEl.textContent = `${survivalScore}問`;
      if (resultFinalTimeEl) resultFinalTimeEl.textContent = formatTime(totalMs);
      if (resultAverageTimeEl) {
        const avgSec = survivalScore > 0 ? totalMs / 1000 / survivalScore : totalMs / 1000;
        resultAverageTimeEl.textContent = `${avgSec.toFixed(1)}秒/問`;
      }
      if (resultComparisonTextEl) resultComparisonTextEl.textContent = comparisonMessage;
      if (resultSpeedRatingEl) {
        resultSpeedRatingEl.textContent = `難易度: ${survivalDifficultyConfig[currentSurvivalDifficulty].name}`;
        resultSpeedRatingEl.classList.remove("hidden");
      }
    } else {
      const total = questions.length;
      const avgSec = totalMs / 1000 / total;

      if (correctCount === total) {
        bestUpdated = setBestRecord(currentMode, currentLimit, "", totalMs, true);
      }

      setLastResult(currentMode, currentLimit, "", {
        correct: correctCount,
        total,
        totalMs,
        avgSec
      });

      if (survivalResultHeroEl) survivalResultHeroEl.classList.add("hidden");

      if (resultCorrectCountEl) resultCorrectCountEl.textContent = `${correctCount}/${total}`;
      if (resultFinalTimeEl) resultFinalTimeEl.textContent = formatTime(totalMs);
      if (resultAverageTimeEl) resultAverageTimeEl.textContent = `${avgSec.toFixed(1)}秒/問`;
      if (resultComparisonTextEl) resultComparisonTextEl.textContent = comparisonMessage;
      if (resultSpeedRatingEl) {
        resultSpeedRatingEl.textContent = `速度評価: ${getSpeedText(avgSec)}`;
        resultSpeedRatingEl.classList.remove("hidden");
      }
    }

    if (resultBestUpdateEl) {
      if (bestUpdated) {
        resultBestUpdateEl.textContent = "ベスト更新！";
        resultBestUpdateEl.classList.remove("hidden");
      } else {
        resultBestUpdateEl.classList.add("hidden");
      }
    }

    updateModalInfo(currentMode, currentLimit);
    showResultView();
  }

  function goNextQuestion() {
    if (isSurvivalMode()) {
      renderCurrentQuestion();
      isLocked = false;
      return;
    }

    currentQuestionIndex += 1;

    if (currentQuestionIndex >= questions.length) {
      finalizeResult();
      return;
    }

    renderCurrentQuestion();
    isLocked = false;
  }

  function applySurvivalDamage() {
    survivalLives -= 1;
    updateSurvivalHud();

    if (survivalLives <= 0) {
      finalizeResult();
      return false;
    }

    return true;
  }

  function lockAndJudge(isCorrect) {
    isLocked = true;
    stopPerQuestionLimit();

    if (isSurvivalMode()) {
      if (isCorrect) {
        survivalScore += 1;
        playCorrectSound();
        showJudge(true);

        setTimeout(() => {
          hideJudge();
          goNextQuestion();
        }, 420);
        return;
      }

      playWrongSound();
      showJudge(false);

      setTimeout(() => {
        hideJudge();
        const canContinue = applySurvivalDamage();
        if (canContinue) {
          goNextQuestion();
        }
      }, 420);
      return;
    }

    if (isCorrect) {
      correctCount += 1;
      playCorrectSound();
    } else {
      playWrongSound();
    }

    showJudge(isCorrect);

    setTimeout(() => {
      hideJudge();
      goNextQuestion();
    }, 420);
  }

  function handleTimeUp() {
    if (!started || isLocked) return;
    lockAndJudge(false);
  }

  prevModeButtonEl?.addEventListener("click", () => {
    const index = modeOrder.indexOf(currentMode);
    const nextIndex = (index - 1 + modeOrder.length) % modeOrder.length;
    currentMode = modeOrder[nextIndex];
    updateHomeMode();
  });

  nextModeButtonEl?.addEventListener("click", () => {
    const index = modeOrder.indexOf(currentMode);
    const nextIndex = (index + 1) % modeOrder.length;
    currentMode = modeOrder[nextIndex];
    updateHomeMode();
  });

  openSelectedModeButtonEl?.addEventListener("click", () => {
    openModeModal(currentMode);
  });

  limitOptionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      currentLimit = Number(button.dataset.limit);
      updateLimitButtons(currentLimit);
      updateModalInfo(currentMode, currentLimit);
    });
  });

  difficultyOptionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      currentSurvivalDifficulty = button.dataset.difficulty;
      updateDifficultyButtons();
      updateModalInfo(currentMode, currentLimit);
    });
  });

  closeModalButtonEl?.addEventListener("click", closeModeModal);
  closePlayModalButtonEl?.addEventListener("click", closeModeModal);
  modalStartButtonEl?.addEventListener("click", startSession);
  modalRetryButtonEl?.addEventListener("click", startSession);
  modalCloseAfterResultButtonEl?.addEventListener("click", closeModeModal);
  modalCloseAfterResultButtonTopEl?.addEventListener("click", closeModeModal);

  modeModalEl?.addEventListener("click", (event) => {
    if (event.target === modeModalEl) {
      closeModeModal();
    }
  });

  updateHomeMode();
  updateDifficultyButtons();
  updateLimitButtons(currentLimit);
  bindInitialAudioUnlock();
});
