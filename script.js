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

let currentMode = "daily";
let questions = [];
let startTime = Date.now();
let timerId = null;

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

function switchMode(mode) {
  currentMode = mode;

  tabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.mode === mode);
  });

  modeNameEl.textContent = modeConfig[mode].name;
  modeDescriptionEl.textContent = modeConfig[mode].description;
  todayCountEl.textContent = "0回";
  bestTimeEl.textContent = "未記録";
  lastRecordTextEl.textContent = "未記録";

  resultEmptyEl.classList.remove("hidden");
  resultPanelEl.classList.add("hidden");
  bestUpdateEl.classList.add("hidden");
  speedRatingEl.classList.add("hidden");

  generateQuestions();
  renderQuestions();
  startTimer();
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
  const count = modeConfig[currentMode].count;
  const avgSec = totalMs / 1000 / count;

  resultEmptyEl.classList.add("hidden");
  resultPanelEl.classList.remove("hidden");
  correctCountEl.textContent = `${correct}/${count}`;
  finalTimeEl.textContent = formatTime(totalMs);
  averageTimeEl.textContent = `${avgSec.toFixed(1)}秒/問`;
  comparisonTextEl.textContent = "シンプル版で動作確認中";
  speedRatingEl.textContent = "まずは問題表示を確認";
  speedRatingEl.classList.remove("hidden");
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    switchMode(tab.dataset.mode);
  });
});

checkButtonEl.addEventListener("click", checkAnswers);
retryButtonEl.addEventListener("click", () => switchMode(currentMode));

switchMode("daily");
