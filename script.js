* {
  box-sizing: border-box;
}

:root {
  --bg: #f3f5f9;
  --card: #ffffff;
  --card-soft: #f8fafc;
  --text: #172033;
  --sub: #6b7280;
  --accent: #0f172a;
  --accent-weak: #e5e7eb;
  --success-bg: #ecfdf3;
  --success-text: #067647;
  --info-bg: #eff6ff;
  --info-text: #1d4ed8;
  --danger-bg: #fef2f2;
  --danger-text: #b42318;
  --shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
  --radius-lg: 22px;
  --radius-md: 16px;
  --radius-sm: 12px;
}

html,
body {
  margin: 0;
  padding: 0;
  background: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Yu Gothic", sans-serif;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

button,
input {
  font: inherit;
}

body {
  min-height: 100vh;
}

.container {
  max-width: 760px;
  margin: 0 auto;
  padding: 24px 16px 56px;
}

.header {
  margin-bottom: 18px;
}

.header h1 {
  margin: 0 0 8px;
  font-size: 34px;
  line-height: 1.15;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.dateText {
  margin: 0;
  font-size: 14px;
  color: var(--sub);
}

.card {
  background: var(--card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  padding: 18px;
  margin-bottom: 16px;
}

.cardHeader {
  margin-bottom: 12px;
}

.card h2 {
  margin: 0 0 6px;
  font-size: 24px;
  line-height: 1.25;
  font-weight: 800;
}

.subText {
  margin: 0;
  color: var(--sub);
  font-size: 14px;
  line-height: 1.5;
}

.modeTabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.singleColumn {
  grid-template-columns: 1fr !important;
}

.modeSelectButton {
  appearance: none;
  border: none;
  border-radius: 16px;
  background: var(--accent);
  color: #ffffff;
  padding: 16px 14px;
  min-height: 58px;
  font-size: 18px;
  font-weight: 800;
  cursor: pointer;
}

.summaryGrid,
.resultGrid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.summaryItem,
.resultItem {
  background: var(--card-soft);
  border-radius: 16px;
  padding: 14px;
  min-height: 92px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.compactGrid {
  margin-bottom: 10px;
}

.compactItem {
  min-height: 80px;
}

.label {
  font-size: 13px;
  color: var(--sub);
  margin-bottom: 6px;
}

.value {
  font-size: 28px;
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.smallValue {
  font-size: 16px;
  line-height: 1.45;
  font-weight: 700;
}

.quizForm {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.questionRow {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  align-items: center;
  background: var(--card-soft);
  border-radius: 18px;
  padding: 14px;
}

.questionLabel {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 28px;
  line-height: 1.2;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.questionNumber {
  width: 100%;
  font-size: 14px;
  line-height: 1.3;
  color: var(--sub);
  font-weight: 700;
}

.answerInput {
  width: 100%;
  min-height: 64px;
  border: 1px solid #d7dce4;
  border-radius: 18px;
  background: #ffffff;
  padding: 10px 12px;
  text-align: center;
  font-size: 28px;
  font-weight: 700;
  color: var(--text);
  outline: none;
}

.answerInput:focus {
  border-color: #94a3b8;
  box-shadow: 0 0 0 4px rgba(148, 163, 184, 0.18);
}

.feedback {
  min-height: 22px;
  font-size: 14px;
  font-weight: 800;
}

.correct {
  color: #067647;
}

.wrong {
  color: #b42318;
}

.buttonRow {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}

button {
  appearance: none;
  border: none;
  border-radius: 14px;
  background: var(--accent);
  color: #ffffff;
  min-height: 52px;
  padding: 14px 18px;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
}

button.secondary {
  background: var(--accent-weak);
  color: var(--text);
}

.notice {
  margin-top: 14px;
  border-radius: 14px;
  padding: 12px 14px;
  font-size: 14px;
  font-weight: 800;
}

.notice:not(.subtle) {
  background: var(--success-bg);
  color: var(--success-text);
}

.notice.subtle {
  background: var(--info-bg);
  color: var(--info-text);
}

.hidden {
  display: none !important;
}

.modal {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(15, 23, 42, 0.42);
  z-index: 1000;
}

.modal.hidden {
  display: none !important;
}

.modalPlayableCard {
  width: 100%;
  max-width: 560px;
  max-height: min(92vh, 820px);
  overflow: hidden;
  background: var(--card);
  border-radius: 22px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.18);
  padding: 18px;
  display: flex;
  flex-direction: column;
}

.modalHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.compactModalHeader {
  margin-bottom: 8px;
}

.modalHeader h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
}

.modalGrid {
  margin-top: 14px;
}

.playStickyHeader {
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--card);
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
}

.playScrollArea {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-top: 12px;
  padding-bottom: 8px;
  min-height: 220px;
  flex: 1 1 auto;
}

.playBlock {
  margin-top: 0;
}

.playTitleGroup {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.playModeName {
  font-size: 20px;
  font-weight: 800;
  line-height: 1.2;
}

.playModeMeta {
  font-size: 13px;
  color: var(--sub);
  font-weight: 700;
}

.limitBlock {
  margin-top: 16px;
  padding: 14px;
  border-radius: 16px;
  background: var(--card-soft);
}

.limitOptions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 10px;
}

.limitOption {
  min-height: 44px;
  padding: 10px 8px;
  border-radius: 12px;
  background: #ffffff;
  color: var(--text);
  border: 1px solid #dde3ea;
  font-size: 14px;
  font-weight: 800;
}

.limitOption.active {
  background: var(--accent);
  color: #ffffff;
  border-color: var(--accent);
}

.limitMeterWrap {
  margin-top: 6px;
}

.limitMeterLabel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: var(--sub);
  font-weight: 700;
  margin-bottom: 6px;
}

.limitMeterTrack {
  width: 100%;
  height: 10px;
  background: #e5e7eb;
  border-radius: 999px;
  overflow: hidden;
}

.limitMeterBar {
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, #ef4444, #f59e0b);
  transform-origin: left center;
  transition: transform 0.1s linear;
}

.iconButton {
  appearance: none;
  border: none;
  border-radius: 12px;
  background: var(--accent-weak);
  color: var(--text);
  width: 42px;
  height: 42px;
  font-size: 24px;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
  min-height: 42px;
}

.judgeOverlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.14);
  z-index: 1100;
  pointer-events: none;
}

.judgeOverlay.hidden {
  display: none !important;
}

.judgeMark {
  font-size: 96px;
  line-height: 1;
  font-weight: 800;
  transform: scale(0.8);
  animation: judgePop 0.38s ease;
}

.judgeOverlay.correct .judgeMark {
  filter: drop-shadow(0 8px 18px rgba(6, 118, 71, 0.28));
}

.judgeOverlay.wrong .judgeMark {
  filter: drop-shadow(0 8px 18px rgba(180, 35, 24, 0.28));
}

@keyframes judgePop {
  0% {
    opacity: 0;
    transform: scale(0.45);
  }
  60% {
    opacity: 1;
    transform: scale(1.08);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@media (max-width: 640px) {
  .container {
    padding: 18px 14px 48px;
  }

  .header h1 {
    font-size: 28px;
  }

  .summaryGrid,
  .resultGrid,
  .limitOptions {
    grid-template-columns: 1fr;
  }

  .buttonRow {
    flex-direction: column;
  }

  button {
    width: 100%;
  }

  .value {
    font-size: 24px;
  }

  .questionLabel {
    font-size: 24px;
  }

  .answerInput {
    font-size: 24px;
  }

  .modal {
    padding: 10px;
    align-items: stretch;
  }

  .modalPlayableCard {
    max-width: none;
    max-height: calc(100vh - 20px);
    border-radius: 18px;
    padding: 14px;
  }
}
