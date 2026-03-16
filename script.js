const STORAGE_KEY = "math-training-simple-v1";

const modeConfig = {
  daily: {
    name: "今日のドリル",
    description: "日付で変わる5問のドリル",
    count: 5
  },
  ten: {
    name: "10問連続",
    description: "テンポよく10問解く標準トレーニング",
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

const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, "0");
const dd = String(today.getDate()).padStart(2, "0");
const todayKey = `${yyyy}-${mm}-${dd}`;

if (dateTextEl) {
  dateTextEl.textContent = `今日: ${yyyy}/${mm}/${dd}`;
}

let currentMode = "daily";
let questions = [];
let startTime = Date.now();
let timerId = null;

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

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
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
  if (mode === "ten") return Math.random() < 0.5 ? makeAdd() : makeSub();
  return Math.random() < 0.5 ? makeAdd() : makeSub();
}

function generateQuestions() {
  questions = [];
  const count = modeConfig[currentMode].count;

  for (let i = 0; i < count; i++) {
    questions.push(createQuestion(currentMode));
  }
}

function renderQuestions() {
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
}

function startTimer() {
  startTime = Date.now();
  timerEl.textContent = "00:00";

  if (timerId) clearInterval(timerId);

  timerId = setInterval(() => {
    timerEl.textContent = formatTime(Date.now() - startTime);
  }, 200);
}

function updateStats() {
  const todayCount = getTodayCount(currentMode);
  todayCountEl.textContent = `${todayCount}回`;

  const best = getBestTime(currentMode);
  bestTimeEl.textContent = best ? formatTime(best) : "未記録";

  const last = getLastResult(currentMode);
  if (last) {
    lastRecordTextEl.textContent =
      `${last.correct}/${last.total}問正解 ・ ${formatTime(last.totalMs)} ・ ${last.avgSec.toFixed(1)}秒/問`;
  } else {
    lastRecordTextEl.textContent = "未記録";
  }
}

function switchMode(mode) {
  currentMode = mode;

  tabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.mode === mode);
  });

  modeNameEl.textContent = modeConfig[mode].name;
  modeDescriptionEl.textContent = modeConfig[mode].description;

  resultEmptyEl.classList.remove("hidden");
  resultPanelEl.classList.add("hidden");
  bestUpdateEl.classList.add("hidden");
  speedRatingEl.classList.add("hidden");

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

function checkAnswers() {
  let correct = 0;

  questions.forEach((q, index) => {
    const input = document.getElementById(`answer-${index}`);
    const feedback = document.getElementById(`feedback-${index}`);
    const value = Number(input.value);

    if (value === q.answer) {
      correct += 1;
      feedback.textContent = "○";
      feedback.className = "feedback correct";
    } else {
      feedback.textContent = `× 正解: ${q.answer}`;
      feedback.className = "feedback wrong";
    }
  });

  clearInterval(timerId);

  const totalMs = Date.now() - startTime;
  const total = modeConfig[currentMode].count;
  const avgSec = totalMs / 1000 / total;

  incrementTodayCount(currentMode);

  const isPerfect = correct === total;
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

  resultEmptyEl.classList.add("hidden");
  resultPanelEl.classList.remove("hidden");
  correctCountEl.textContent = `${correct}/${total}`;
  finalTimeEl.textContent = formatTime(totalMs);
  averageTimeEl.textContent = `${avgSec.toFixed(1)}秒/問`;
  comparisonTextEl.textContent = isPerfect
    ? "全問正解でベスト対象"
    : "ベストは全問正解時のみ更新";

  if (bestUpdated) {
    bestUpdateEl.textContent = "ベスト更新！";
    bestUpdateEl.classList.remove("hidden");
  } else {
    bestUpdateEl.classList.add("hidden");
  }

  speedRatingEl.textContent = `速度評価: ${getSpeedText(avgSec)}`;
  speedRatingEl.classList.remove("hidden");

  updateStats();
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    switchMode(tab.dataset.mode);
  });
});

checkButtonEl.addEventListener("click", checkAnswers);
retryButtonEl.addEventListener("click", () => switchMode(currentMode));

switchMode("daily");
