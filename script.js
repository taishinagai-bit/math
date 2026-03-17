const STORAGE_KEY = "math-training-modal-v2";

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
  }
};

const dateTextEl = document.getElementById("dateText");

const homeScreenEl = document.getElementById("homeScreen");
const playScreenEl = document.getElementById("playScreen");

const modeSelectButtons = Array.from(document.querySelectorAll(".modeSelectButton"));

const modeNameEl = document.getElementById("modeName");
const modeDescriptionEl = document.getElementById("modeDescription");
const timerEl = document.getElementById("timer");
const todayCountEl = document.getElementById("todayCount");
const bestTimeEl = document.getElementById("bestTime");
const progressTextEl = document.getElementById("progressText");
const quizFormEl = document.getElementById("quizForm");

const resultEmptyEl = document.getElementById("resultEmpty");
const resultPanelEl = document.getElementById("resultPanel");
const correctCountEl = document.getElementById("correctCount");
const finalTimeEl = document.getElementById("finalTime");
const averageTimeEl = document.getElementById("averageTime");
const comparisonTextEl = document.getElementById("comparisonText");
const bestUpdateEl = document.getElementById("bestUpdate");
const speedRatingEl = document.getElementById("speedRating");

const retryButtonEl = document.getElementById("retryButton");
const backToHomeButtonEl = document.getElementById("backToHomeButton");
const resultHomeButtonEl = document.getElementById("resultHomeButton");

const modeModalEl = document.getElementById("modeModal");
const modalModeNameEl = document.getElementById("modalModeName");
const modalModeDescriptionEl = document.getElementById("modalModeDescription");
const modalBestTimeEl = document.getElementById("modalBestTime");
const modalLastRecordEl = document.getElementById("modalLastRecord");
const modalStartButtonEl = document.getElementById("modalStartButton");
const closeModalButtonEl = document.getElementById("closeModalButton");

const judgeOverlayEl = document.getElementById("judgeOverlay");
const judgeMarkEl = document.getElementById("judgeMark");

const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, "0");
const dd = String(today.getDate()).padStart(2, "0");
const todayKey = `${yyyy}-${mm}-${dd}`;

if (dateTextEl) {
  dateTextEl.textContent = `今日: ${yyyy}/${mm}/${dd}`;
}

let currentMode = "ten";
let selectedMode = null;
let questions = [];
let currentQuestionIndex = 0;
let correctCount = 0;
let startTime = 0;
let timerId = null;
let started = false;
let isLocked = false;

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { todayCounts: {}, bestTimes: {}, lastResults: {} };
    }
    return JSON.parse(raw);
  } catch (error) {
    return { todayCounts: {}, bestTimes: {}, lastResults: {} };
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getTodayCount(mode) {
  const data = loadData();
  return data.todayCounts?.[todayKey]?.[mode] || 0;
}

function incrementTodayCount(mode) {
  const data = loadData();
  if (!data.todayCounts[todayKey]) data.todayCounts[todayKey] = {};
  data.todayCounts[todayKey][mode] = (data.todayCounts[todayKey][mode] || 0) + 1;
  saveData(data);
}

function getBestTime(mode) {
  const data = loadData();
  return data.bestTimes?.[mode] || null;
}

function setBestTime(mode, ms) {
  const data = loadData();
  const currentBest = data.bestTimes?.[mode] || null;
  let updated = false;

  if (currentBest === null || ms < currentBest) {
    data.bestTimes[mode] = ms;
    updated = true;
  }

  saveData(data);
  return updated;
}

function getLastResult(mode) {
  const data = loadData();
  return data.lastResults?.[mode] || null;
}

function setLastResult(mode, result) {
  const data = loadData();
  data.lastResults[mode] = result;
  saveData(data);
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function formatLastRecord(mode) {
  const last = getLastResult(mode);
  if (!last) return "未記録";
  return `${last.correct}/${last.total}問 ・ ${formatTime(last.totalMs)} ・ ${last.avgSec.toFixed(1)}秒/問`;
}

function getSpeedText(avgSec) {
  if (avgSec < 1.0) return "かなり速い";
  if (avgSec < 2.0) return "速い";
  if (avgSec < 3.0) return "標準";
  return "伸びしろあり";
}

function makeAdd() {
  const a = randInt(11, 79);
  const b = randInt(11, 29);
  return { text: `${a} + ${b}`, answer: a + b };
}

function makeSub() {
  const a = randInt(40, 99);
  const b = randInt(11, 39);
  const top = Math.max(a, b + 10);
  const bottom = Math.min(b, top - 10);
  return { text: `${top} - ${bottom}`, answer: top - bottom };
}

function makeCarry() {
  let a, b;
  do {
    a = randInt(15, 79);
    b = randInt(15, 79);
  } while ((a % 10) + (b % 10) < 10);
  return { text: `${a} + ${b}`, answer: a + b };
}

function makeBorrow() {
  let a, b;
  do {
    a = randInt(30, 99);
    b = randInt(11, a - 1);
  } while ((a % 10) >= (b % 10));
  return { text: `${a} - ${b}`, answer: a - b };
}

function createQuestion(mode) {
  if (mode === "carry") return makeCarry();
  if (mode === "borrow") return makeBorrow();
  return Math.random() < 0.5 ? makeAdd() : makeSub();
}

function generateQuestions() {
  questions = [];
  const count = modeConfig[currentMode].count;

  for (let i = 0; i < count; i++) {
    questions.push(createQuestion(currentMode));
  }

  currentQuestionIndex = 0;
  correctCount = 0;
  isLocked = false;
}

function getAnswerDigits(answer) {
  return String(Math.abs(answer)).length;
}

function updateProgress() {
  if (!progressTextEl) return;
  progressTextEl.textContent = `${currentQuestionIndex + 1} / ${questions.length}`;
}

function renderCurrentQuestion() {
  if (!quizFormEl) return;

  const q = questions[currentQuestionIndex];
  if (!q) return;

  quizFormEl.innerHTML = `
    <div class="questionRow">
      <label class="questionLabel" for="answerInput">
        <span class="questionNumber">問${currentQuestionIndex + 1}</span>
        <span>${q.text} = </span>
      </label>
      <input
        id="answerInput"
        class="answerInput"
        type="number"
        inputmode="numeric"
        autocomplete="off"
      />
      <div id="feedbackText" class="feedback"></div>
    </div>
  `;

  const input = document.getElementById("answerInput");
  if (input) {
    input.focus();
    input.addEventListener("input", handleAutoSubmit);
  }

  updateProgress();
}

function startTimer() {
  startTime = Date.now();
  if (timerEl) timerEl.textContent = "00:00";

  if (timerId) clearInterval(timerId);

  timerId = setInterval(() => {
    if (timerEl && started) {
      timerEl.textContent = formatTime(Date.now() - startTime);
    }
  }, 100);
}

function stopTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
}

function updatePlayStats() {
  if (modeNameEl) modeNameEl.textContent = modeConfig[currentMode].name;
  if (modeDescriptionEl) modeDescriptionEl.textContent = modeConfig[currentMode].description;
  if (todayCountEl) todayCountEl.textContent = `${getTodayCount(currentMode)}回`;

  const best = getBestTime(currentMode);
  if (bestTimeEl) {
    bestTimeEl.textContent = best ? formatTime(best) : "未記録";
  }
}

function resetResultView() {
  if (resultEmptyEl) resultEmptyEl.classList.remove("hidden");
  if (resultPanelEl) resultPanelEl.classList.add("hidden");
  if (bestUpdateEl) bestUpdateEl.classList.add("hidden");
  if (speedRatingEl) speedRatingEl.classList.add("hidden");
}

function openModeModal(mode) {
  selectedMode = mode;

  if (modalModeNameEl) modalModeNameEl.textContent = modeConfig[mode].name;
  if (modalModeDescriptionEl) modalModeDescriptionEl.textContent = modeConfig[mode].description;

  const best = getBestTime(mode);
  if (modalBestTimeEl) {
    modalBestTimeEl.textContent = best ? formatTime(best) : "未記録";
  }

  if (modalLastRecordEl) {
    modalLastRecordEl.textContent = formatLastRecord(mode);
  }

  if (modeModalEl) {
    modeModalEl.classList.remove("hidden");
  }
}

function closeModeModal() {
  selectedMode = null;
  if (modeModalEl) {
    modeModalEl.classList.add("hidden");
  }
}

function showHome() {
  started = false;
  stopTimer();

  if (homeScreenEl) homeScreenEl.classList.remove("hidden");
  if (playScreenEl) playScreenEl.classList.add("hidden");
  closeModeModal();
}

function showPlayScreen() {
  if (homeScreenEl) homeScreenEl.classList.add("hidden");
  if (playScreenEl) playScreenEl.classList.remove("hidden");
}

function startSession(mode) {
  currentMode = mode;
  closeModeModal();
  showPlayScreen();
  updatePlayStats();
  resetResultView();
  generateQuestions();
  started = true;
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
  if (!judgeOverlayEl) return;
  judgeOverlayEl.classList.add("hidden");
  judgeOverlayEl.classList.remove("correct", "wrong");
}

function makeComparisonText(mode, totalMs) {
  const last = getLastResult(mode);
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

  const totalMs = Date.now() - startTime;
  const total = questions.length;
  const avgSec = totalMs / 1000 / total;

  incrementTodayCount(currentMode);

  const isPerfect = correctCount === total;
  const comparisonMessage = makeComparisonText(currentMode, totalMs);

  let bestUpdated = false;
  if (isPerfect) {
    bestUpdated = setBestTime(currentMode, totalMs);
  }

  setLastResult(currentMode, {
    correct: correctCount,
    total,
    totalMs,
    avgSec
  });

  if (resultEmptyEl) resultEmptyEl.classList.add("hidden");
  if (resultPanelEl) resultPanelEl.classList.remove("hidden");
  if (correctCountEl) correctCountEl.textContent = `${correctCount}/${total}`;
  if (finalTimeEl) finalTimeEl.textContent = formatTime(totalMs);
  if (averageTimeEl) averageTimeEl.textContent = `${avgSec.toFixed(1)}秒/問`;
  if (comparisonTextEl) comparisonTextEl.textContent = comparisonMessage;

  if (bestUpdateEl) {
    if (bestUpdated) {
      bestUpdateEl.textContent = "ベスト更新！";
      bestUpdateEl.classList.remove("hidden");
    } else {
      bestUpdateEl.classList.add("hidden");
    }
  }

  if (speedRatingEl) {
    speedRatingEl.textContent = `速度評価: ${getSpeedText(avgSec)}`;
    speedRatingEl.classList.remove("hidden");
  }

  updatePlayStats();
}

function goNextQuestion() {
  currentQuestionIndex += 1;

  if (currentQuestionIndex >= questions.length) {
    finalizeResult();
    return;
  }

  renderCurrentQuestion();
  isLocked = false;
}

function handleAutoSubmit(event) {
  if (!started || isLocked) return;

  const input = event.target;
  const q = questions[currentQuestionIndex];
  const requiredDigits = getAnswerDigits(q.answer);
  const currentValue = input.value.replace("-", "");

  if (currentValue.length < requiredDigits) return;

  isLocked = true;

  const numericValue = Number(input.value);
  const isCorrect = numericValue === q.answer;

  if (isCorrect) {
    correctCount += 1;
  }

  showJudge(isCorrect);

  setTimeout(() => {
    hideJudge();
    goNextQuestion();
  }, 420);
}

modeSelectButtons.forEach((button) => {
  button.addEventListener("click", () => {
    openModeModal(button.dataset.mode);
  });
});

if (modalStartButtonEl) {
  modalStartButtonEl.addEventListener("click", () => {
    if (!selectedMode) return;
    startSession(selectedMode);
  });
}

if (closeModalButtonEl) {
  closeModalButtonEl.addEventListener("click", closeModeModal);
}

if (modeModalEl) {
  modeModalEl.addEventListener("click", (event) => {
    if (event.target === modeModalEl) {
      closeModeModal();
    }
  });
}

if (retryButtonEl) {
  retryButtonEl.addEventListener("click", () => {
    startSession(currentMode);
  });
}

if (backToHomeButtonEl) {
  backToHomeButtonEl.addEventListener("click", showHome);
}

if (resultHomeButtonEl) {
  resultHomeButtonEl.addEventListener("click", showHome);
}

showHome();
