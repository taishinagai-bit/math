const STORAGE_KEY = "math-training-records-v2";

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
const dateTextEl = document.getElementById("dateText");
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
let finished = false;

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function randInt(seed, min, max) {
  return Math.floor(seededRandom(seed) * (max - min + 1)) + min;
}

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function formatAverage(ms, count) {
  const averageSec = ms / 1000 / count;
  return `${averageSec.toFixed(1)}秒/問`;
}

function getSpeedRating(avgSec) {
  if (avgSec < 1.0) return "かなり速い";
  if (avgSec < 2.0) return "速い";
  if (avgSec < 3.0) return "標準";
  return "伸びしろあり";
}

function loadRecords() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (error) {
    return [];
  }
}

function saveRecord(record) {
  const records = loadRecords();
  records.push(record);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function getModeRecords(mode) {
  return loadRecords().filter((record) => record.mode === mode);
}

function getLastModeRecord(mode) {
  const records = getModeRecords(mode);
  return records.length ? records[records.length - 1] : null;
}

function getBestModeRecord(mode) {
  const records = getModeRecords(mode).filter(
    (record) => record.correct === modeConfig[mode].count
  );

  if (!records.length) return null;

  return records.reduce((best, current) => {
    return current.totalMs < best.totalMs ? current : best;
  });
}

function getTodayModeCount(mode) {
  return loadRecords().filter(
    (record) => record.mode === mode && record.date === todayKey
  ).length;
}

function makeNormalAdd(seed) {
  const a = randInt(seed + 1, 11, 79);
  const b = randInt(seed + 2, 11, 29);
  return { text: `${a} + ${b}`, answer: a + b };
}

function makeNormalSub(seed) {
  const a = randInt(seed + 1, 40, 99);
  const b = randInt(seed + 2, 11, 39);
  const top = Math.max(a, b + 10);
  const bottom = Math.min(b, top - 10);
  return { text: `${top} - ${bottom}`, answer: top - bottom };
}

function makeCarryAdd(seed) {
  let a;
  let b;
  do {
    a = randInt(seed + 1, 15, 79);
    b = randInt(seed + 2, 15, 79);
  } while ((a % 10) + (b % 10) < 10);
  return { text: `${a} + ${b}`, answer: a + b };
}

function makeBorrowSub(seed) {
  let a;
  let b;
  do {
    a = randInt(seed + 1, 30, 99);
    b = randInt(seed + 2, 11, a - 1);
  } while ((a % 10) >= (b % 10));
  return { text: `${a} - ${b}`, answer: a - b };
}

function makeDaily(seed, index) {
  const dailyModes = ["add", "sub", "carry", "borrow", "mix"];
  const type = dailyModes[(seed + index) % dailyModes.length];

  if (type === "add") return makeNormalAdd(seed);
  if (type === "sub") return makeNormalSub(seed);
  if (type === "carry") return makeCarryAdd(seed);
  if (type === "borrow") return makeBorrowSub(seed);

  return seededRandom(seed) < 0.5 ? makeNormalAdd(seed) : makeNormalSub(seed);
}

function createQuestion(seed, mode, index) {
  switch (mode) {
    case "daily":
      return makeDaily(seed, index);
    case "ten":
      return seededRandom(seed) < 0.5 ? makeNormalAdd(seed) : makeNormalSub(seed);
    case "carry":
      return makeCarryAdd(seed);
    case "borrow":
      return makeBorrowSub(seed);
    default:
      return makeNormalAdd(seed);
  }
}

function generateQuestions() {
  const mode = modeConfig[currentMode];
  questions = [];

  for (let i = 0; i < mode.count; i++) {
    const seedBase =
      currentMode === "daily"
        ? dateSeed + i * 17
        : Date.now() + i * 31 + Math.floor(Math.random() * 1000);

    questions.push(createQuestion(seedBase, currentMode, i));
  }
}

function renderQuestions() {
  if (!quizFormEl) return;

  quizFormEl.innerHTML = "";

  questions.forEach((question, index) => {
    const row = document.createElement("div");
    row.className = "questionRow";
    row.innerHTML = `
      <label class="questionLabel" for="answer-${index}">
        <span class="questionNumber">問${index + 1}</span>
        <span>${question.text} = </span>
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
  finished = false;
  startTime = Date.now();

  if (timerEl) {
    timerEl.textContent = "00:00";
  }

  if (timerId) clearInterval(timerId);

  timerId = setInterval(() => {
    if (finished || !timerEl) return;
    timerEl.textContent = formatTime(Date.now() - startTime);
  }, 200);
}

function resetResultView() {
  if (resultEmptyEl) resultEmptyEl.classList.remove("hidden");
  if (resultPanelEl) resultPanelEl.classList.add("hidden");
  if (bestUpdateEl) bestUpdateEl.classList.add("hidden");
  if (speedRatingEl) speedRatingEl.classList.add("hidden");
  if (comparisonTextEl) comparisonTextEl.textContent = "";
}

function updateModeHeader() {
  const config = modeConfig[currentMode];
  if (modeNameEl) modeNameEl.textContent = config.name;
  if (modeDescriptionEl) modeDescriptionEl.textContent = config.description;
}

function updateStatsView() {
  const todayCount = getTodayModeCount(currentMode);
  if (todayCountEl) todayCountEl.textContent = `${todayCount}回`;

  const bestRecord = getBestModeRecord(currentMode);
  if (bestTimeEl) {
    bestTimeEl.textContent = bestRecord ? formatTime(bestRecord.totalMs) : "未記録";
  }

  const lastRecord = getLastModeRecord(currentMode);
  if (!lastRecord) {
    if (lastRecordTextEl) lastRecordTextEl.textContent = "未記録";
    return;
  }

  if (lastRecordTextEl) {
    lastRecordTextEl.textContent =
      `${lastRecord.correct}/${modeConfig[currentMode].count}問正解 ・ ` +
      `${formatTime(lastRecord.totalMs)} ・ ` +
      `${formatAverage(lastRecord.totalMs, modeConfig[currentMode].count)}`;
  }
}

function switchMode(mode) {
  currentMode = mode;

  tabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.mode === mode);
  });

  updateModeHeader();
  updateStatsView();
  resetResultView();
  generateQuestions();
  renderQuestions();
  startTimer();
}

function showResults(correct, totalMs, comparisonMessage, bestUpdated) {
  const count = modeConfig[currentMode].count;
  const avgSec = totalMs / 1000 / count;

  if (resultEmptyEl) resultEmptyEl.classList.add("hidden");
  if (resultPanelEl) resultPanelEl.classList.remove("hidden");
  if (correctCountEl) correctCountEl.textContent = `${correct}/${count}`;
  if (finalTimeEl) finalTimeEl.textContent = formatTime(totalMs);
  if (averageTimeEl) {
    averageTimeEl.textContent = `${formatAverage(totalMs, count)} (${avgSec.toFixed(1)}秒)`;
  }
  if (comparisonTextEl) comparisonTextEl.textContent = comparisonMessage;

  if (bestUpdated && bestUpdateEl) {
    bestUpdateEl.textContent = "ベスト更新！";
    bestUpdateEl.classList.remove("hidden");
  } else if (bestUpdateEl) {
    bestUpdateEl.classList.add("hidden");
  }

  if (speedRatingEl) {
    speedRatingEl.textContent = `速度評価: ${getSpeedRating(avgSec)}`;
    speedRatingEl.classList.remove("hidden");
  }
}

function checkAnswers() {
  let correct = 0;
  const count = modeConfig[currentMode].count;

  questions.forEach((question, index) => {
    const input = document.getElementById(`answer-${index}`);
    const feedback = document.getElementById(`feedback-${index}`);
    const value = Number(input ? input.value : "");

    if (value === question.answer) {
      correct += 1;
      if (feedback) {
        feedback.textContent = "○";
        feedback.className = "feedback correct";
      }
    } else {
      if (feedback) {
        feedback.textContent = `× 正解: ${question.answer}`;
        feedback.className = "feedback wrong";
      }
    }
  });

  finished = true;
  clearInterval(timerId);

  const totalMs = Date.now() - startTime;
  const previousBest = getBestModeRecord(currentMode);
  const previousLast = getLastModeRecord(currentMode);

  let comparisonMessage = "初回記録";
  if (previousLast) {
    const diffMs = totalMs - previousLast.totalMs;
    const diffSec = Math.abs(diffMs / 1000).toFixed(1);

    if (diffMs < 0) {
      comparisonMessage = `前回より速い！ (${diffSec}秒短縮)`;
    } else if (diffMs > 0) {
      comparisonMessage = `前回より少しゆっくり (${diffSec}秒)`;
    } else {
      comparisonMessage = "前回と同じタイム";
    }
  }

  const record = {
    date: todayKey,
    mode: currentMode,
    correct,
    totalMs,
    averageMs: totalMs / count
  };

  saveRecord(record);

  const bestUpdated =
    correct === count &&
    (!previousBest || totalMs < previousBest.totalMs);

  showResults(correct, totalMs, comparisonMessage, bestUpdated);
  updateStatsView();
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

switchMode("daily");
