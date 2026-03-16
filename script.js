const STORAGE_KEY = "math-training-full-v1";

const modeConfig = {
  daily: {
    name: "今日のドリル",
    description: "日付ごとに固定される5問のドリル",
    count: 5,
    dailyFixed: true,
    speedMode: false
  },
  ten: {
    name: "10問連続",
    description: "テンポよく10問解く標準トレーニング",
    count: 10,
    dailyFixed: false,
    speedMode: false
  },
  carry: {
    name: "繰り上がり特化",
    description: "足し算の繰り上がりだけを集中練習",
    count: 10,
    dailyFixed: false,
    speedMode: false
  },
  borrow: {
    name: "繰り下がり特化",
    description: "引き算の繰り下がりだけを集中練習",
    count: 10,
    dailyFixed: false,
    speedMode: false
  },
  speed: {
    name: "高速モード",
    description: "1問ずつ解いてどんどん進む高速練習",
    count: 10,
    dailyFixed: false,
    speedMode: true
  }
};

const modeNameEl = document.getElementById("modeName");
const modeDescriptionEl = document.getElementById("modeDescription");
const timerEl = document.getElementById("timer");
const todayCountEl = document.getElementById("todayCount");
const bestTimeEl = document.getElementById("bestTime");
const quizFormEl = document.getElementById("quizForm");
const checkButtonEl = document.getElementById("checkButton");
const retryButtonEl = document.getElementById("retryButton");
const tabs = Array.from(document.querySelectorAll(".modeTab"));

const resultEmptyEl = document.getElementById("resultEmpty");
const resultPanelEl = document.getElementById("resultPanel");
const correctCountEl = document.getElementById("correctCount");
const finalTimeEl = document.getElementById("finalTime");
const averageTimeEl = document.getElementById("averageTime");
const comparisonTextEl = document.getElementById("comparisonText");
const bestUpdateEl = document.getElementById("bestUpdate");
const speedRatingEl = document.getElementById("speedRating");
const lastRecordTextEl = document.getElementById("lastRecordText");
const dateTextEl = document.getElementById("dateText");
const progressTextEl = document.getElementById("progressText");

const normalButtonsEl = document.getElementById("normalButtons");
const speedButtonsEl = document.getElementById("speedButtons");
const speedNextButtonEl = document.getElementById("speedNextButton");
const speedRetryButtonEl = document.getElementById("speedRetryButton");

const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, "0");
const dd = String(today.getDate()).padStart(2, "0");
const todayKey = `${yyyy}-${mm}-${dd}`;
const dateSeed = Number(`${yyyy}${mm}${dd}`);

if (dateTextEl) {
  dateTextEl.textContent = `今日: ${yyyy}/${mm}/${dd}`;
}

let currentMode = "daily";
let questions = [];
let startTime = Date.now();
let timerId = null;
let currentQuestionIndex = 0;
let speedCorrect = 0;

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        todayCounts: {},
        bestTimes: {},
        lastResults: {}
      };
    }
    return JSON.parse(raw);
  } catch (error) {
    return {
      todayCounts: {},
      bestTimes: {},
      lastResults: {}
    };
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

  if (!data.todayCounts[todayKey]) {
    data.todayCounts[todayKey] = {};
  }

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

function setLastResult(mode, result) {
  const data = loadData();
  data.lastResults[mode] = result;
  saveData(data);
}

function getLastResult(mode) {
  const data = loadData();
  return data.lastResults?.[mode] || null;
}

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function randInt(min, max, seed = null) {
  if (seed === null) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  return Math.floor(seededRandom(seed) * (max - min + 1)) + min;
}

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function makeAdd(seed = null) {
  const a = randInt(11, 79, seed === null ? null : seed + 1);
  const b = randInt(11, 29, seed === null ? null : seed + 2);
  return { text: `${a} + ${b}`, answer: a + b };
}

function makeSub(seed = null) {
  const a = randInt(40, 99, seed === null ? null : seed + 1);
  const b = randInt(11, 39, seed === null ? null : seed + 2);
  const top = Math.max(a, b + 10);
  const bottom = Math.min(b, top - 10);
  return { text: `${top} - ${bottom}`, answer: top - bottom };
}

function makeCarry(seed = null) {
  let a, b;
  let offset = 0;
  do {
    a = randInt(15, 79, seed === null ? null : seed + 1 + offset);
    b = randInt(15, 79, seed === null ? null : seed + 2 + offset);
    offset += 10;
  } while ((a % 10) + (b % 10) < 10);
  return { text: `${a} + ${b}`, answer: a + b };
}

function makeBorrow(seed = null) {
  let a, b;
  let offset = 0;
  do {
    a = randInt(30, 99, seed === null ? null : seed + 1 + offset);
    b = randInt(11, a - 1, seed === null ? null : seed + 2 + offset);
    offset += 10;
  } while ((a % 10) >= (b % 10));
  return { text: `${a} - ${b}`, answer: a - b };
}

function createQuestion(mode, seed = null) {
  if (mode === "carry") return makeCarry(seed);
  if (mode === "borrow") return makeBorrow(seed);
  if (mode === "speed") {
    if (seed === null) return Math.random() < 0.5 ? makeCarry() : makeBorrow();
    return seededRandom(seed) < 0.5 ? makeCarry(seed) : makeBorrow(seed);
  }
  if (mode === "ten") {
    if (seed === null) return Math.random() < 0.5 ? makeAdd() : makeSub();
    return seededRandom(seed) < 0.5 ? makeAdd(seed) : makeSub(seed);
  }
  if (mode === "daily") {
    const chooser = seed === null ? Math.random() : seededRandom(seed);
    return chooser < 0.25
      ? makeAdd(seed)
      : chooser < 0.5
      ? makeSub(seed)
      : chooser < 0.75
      ? makeCarry(seed)
      : makeBorrow(seed);
  }
  return makeAdd(seed);
}

function generateQuestions() {
  questions = [];
  const count = modeConfig[currentMode].count;

  for (let i = 0; i < count; i++) {
    let q;
    if (modeConfig[currentMode].dailyFixed) {
      const seed = dateSeed + i * 17 + currentMode.length * 101;
      q = createQuestion(currentMode, seed);
    } else {
      q = createQuestion(currentMode);
    }
    questions.push(q);
  }

  currentQuestionIndex = 0;
  speedCorrect = 0;
}

function renderNormalQuestions() {
  quizFormEl.innerHTML = "";

  questions.forEach((q, index) => {
    const row = document.createElement("div");
    row.className = "questionRow";
    row.innerHTML = `
      <label class="questionLabel" for="answer-${index}">
        <span class="questionNumber">問${index + 1}</span>
        <span>${q.text} = </span>
      </label>
      <input
        id="answer-${index}"
        class="answerInput"
        type="number"
        inputmode="numeric"
        autocomplete="off"
      />
      <div id="feedback-${index}" class="feedback"></div>
    `;
    quizFormEl.appendChild(row);
  });

  if (progressTextEl) {
    progressTextEl.textContent = `${questions.length}問`;
  }
}

function renderSpeedQuestion() {
  quizFormEl.innerHTML = "";

  const q = questions[currentQuestionIndex];
  const row = document.createElement("div");
  row.className = "questionRow";
  row.innerHTML = `
    <label class="questionLabel" for="answer-speed">
      <span class="questionNumber">問${currentQuestionIndex + 1}</span>
      <span>${q.text} = </span>
    </label>
    <input
      id="answer-speed"
      class="answerInput"
      type="number"
      inputmode="numeric"
      autocomplete="off"
    />
    <div id="feedback-speed" class="feedback"></div>
  `;
  quizFormEl.appendChild(row);

  const input = document.getElementById("answer-speed");
  if (input) input.focus();

  if (progressTextEl) {
    progressTextEl.textContent = `${currentQuestionIndex + 1} / ${questions.length}`;
  }
}

function renderQuestions() {
  if (!quizFormEl) return;

  if (modeConfig[currentMode].speedMode) {
    renderSpeedQuestion();
  } else {
    renderNormalQuestions();
  }
}

function startTimer() {
  startTime = Date.now();
  if (timerEl) timerEl.textContent = "00:00";

  if (timerId) clearInterval(timerId);

  timerId = setInterval(() => {
    if (timerEl) {
      timerEl.textContent = formatTime(Date.now() - startTime);
    }
  }, 200);
}

function updateStats() {
  if (todayCountEl) {
    todayCountEl.textContent = `${getTodayCount(currentMode)}回`;
  }

  const best = getBestTime(currentMode);
  if (bestTimeEl) {
    bestTimeEl.textContent = best ? formatTime(best) : "未記録";
  }

  const last = getLastResult(currentMode);
  if (lastRecordTextEl) {
    if (last) {
      lastRecordTextEl.textContent =
        `${last.correct}/${last.total}問正解 ・ ${formatTime(last.totalMs)} ・ ${last.avgSec.toFixed(1)}秒/問`;
    } else {
      lastRecordTextEl.textContent = "未記録";
    }
  }
}

function resetResultView() {
  if (resultEmptyEl) resultEmptyEl.classList.remove("hidden");
  if (resultPanelEl) resultPanelEl.classList.add("hidden");
  if (bestUpdateEl) bestUpdateEl.classList.add("hidden");
  if (speedRatingEl) speedRatingEl.classList.add("hidden");
}

function updateModeButtons() {
  const isSpeed = modeConfig[currentMode].speedMode;

  if (normalButtonsEl) {
    normalButtonsEl.classList.toggle("hidden", isSpeed);
  }
  if (speedButtonsEl) {
    speedButtonsEl.classList.toggle("hidden", !isSpeed);
  }
}

function switchMode(mode) {
  currentMode = mode;

  tabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.mode === mode);
  });

  if (modeNameEl) modeNameEl.textContent = modeConfig[mode].name;
  if (modeDescriptionEl) modeDescriptionEl.textContent = modeConfig[mode].description;

  updateModeButtons();
  resetResultView();
  updateStats();
  generateQuestions();
  renderQuestions();
  startTimer();
}

function getSpeedText(avgSec) {
  if (avgSec < 1.0) return "かなり速い";
  if (avgSec < 2.0) return "速い";
  if (avgSec < 3.0) return "標準";
  return "伸びしろあり";
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

function finalizeResult(correct, total) {
  clearInterval(timerId);

  const totalMs = Date.now() - startTime;
  const avgSec = totalMs / 1000 / total;

  incrementTodayCount(currentMode);

  const isPerfect = correct === total;
  const comparisonMessage = makeComparisonText(currentMode, totalMs);

  let bestUpdated = false;
  if (isPerfect) {
    bestUpdated = setBestTime(currentMode, totalMs);
  }

  setLastResult(currentMode, {
    correct,
    total,
    totalMs,
    avgSec
  });

  if (resultEmptyEl) resultEmptyEl.classList.add("hidden");
  if (resultPanelEl) resultPanelEl.classList.remove("hidden");
  if (correctCountEl) correctCountEl.textContent = `${correct}/${total}`;
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

  updateStats();
}

function checkAnswers() {
  let correct = 0;

  questions.forEach((q, index) => {
    const input = document.getElementById(`answer-${index}`);
    const feedback = document.getElementById(`feedback-${index}`);
    const value = Number(input ? input.value : "");

    if (value === q.answer) {
      correct += 1;
      if (feedback) {
        feedback.textContent = "○";
        feedback.className = "feedback correct";
      }
    } else {
      if (feedback) {
        feedback.textContent = `× 正解: ${q.answer}`;
        feedback.className = "feedback wrong";
      }
    }
  });

  finalizeResult(correct, modeConfig[currentMode].count);
}

function submitSpeedAnswer() {
  const input = document.getElementById("answer-speed");
  const feedback = document.getElementById("feedback-speed");
  const q = questions[currentQuestionIndex];
  const value = Number(input ? input.value : "");

  if (value === q.answer) {
    speedCorrect += 1;
    if (feedback) {
      feedback.textContent = "○ 正解";
      feedback.className = "feedback correct";
    }
  } else {
    if (feedback) {
      feedback.textContent = `× 正解: ${q.answer}`;
      feedback.className = "feedback wrong";
    }
  }

  currentQuestionIndex += 1;

  setTimeout(() => {
    if (currentQuestionIndex >= questions.length) {
      finalizeResult(speedCorrect, questions.length);
      return;
    }
    renderSpeedQuestion();
  }, 250);
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    switchMode(tab.dataset.mode);
  });
});

if (checkButtonEl) {
  checkButtonEl.addEventListener("click", checkAnswers);
}

if (retryButtonEl) {
  retryButtonEl.addEventListener("click", () => switchMode(currentMode));
}

if (speedNextButtonEl) {
  speedNextButtonEl.addEventListener("click", submitSpeedAnswer);
}

if (speedRetryButtonEl) {
  speedRetryButtonEl.addEventListener("click", () => switchMode(currentMode));
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && modeConfig[currentMode].speedMode) {
    const active = document.activeElement;
    if (active && active.id === "answer-speed") {
      event.preventDefault();
      submitSpeedAnswer();
    }
  }
});

switchMode("daily");
