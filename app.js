// ===== CBSE SCIENCE APP - Main App Logic =====

let currentFilter = 'all';
let currentChapter = null;
let quizPool = [];
let quizIdx = 0;
let quizScore = 0;
let answered = {};

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  renderGrid(currentFilter);
});

// ---- FILTERING ----
function filterSubject(subject) {
  currentFilter = subject;
  document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
  const map = { physics: 'pill-ph', chemistry: 'pill-ch', biology: 'pill-bi', all: 'pill-all' };
  document.querySelector('.' + map[subject])?.classList.add('active');
  const titles = { physics: '⚡ Physics Chapters', chemistry: '🧪 Chemistry Chapters', biology: '🌿 Biology Chapters', all: '📖 All Chapters' };
  document.getElementById('chapter-section-title').textContent = titles[subject];
  renderGrid(subject);
}

// ---- GRID ----
function renderGrid(filter) {
  const grid = document.getElementById('chapter-grid');
  const list = filter === 'all' ? chapters : chapters.filter(c => c.subject === filter);
  grid.innerHTML = list.map(ch => `
    <div class="chapter-card ${ch.subject}" onclick="openChapter('${ch.id}')">
      <div class="card-icon">${ch.icon}</div>
      <div class="card-tag">${ch.subject.charAt(0).toUpperCase() + ch.subject.slice(1)}</div>
      <div class="card-num">${ch.num}</div>
      <div class="card-title">${ch.title}</div>
      <div class="card-desc">${ch.desc}</div>
      <div class="card-topics">${(ch.topics || []).map(t => `<span class="topic-chip">${t}</span>`).join('')}</div>
    </div>
  `).join('');
}

// ---- CHAPTER VIEW ----
function openChapter(id) {
  currentChapter = chapters.find(c => c.id === id);
  if (!currentChapter) return;
  const ch = currentChapter;

  document.getElementById('chapter-bar-title').textContent = `${ch.icon} ${ch.title}`;
  document.getElementById('chapter-quiz-btn').onclick = () => goQuizChapter(ch.title);

  const themeClass = ch.subject + '-theme';
  const isPhysics = ch.subject === 'physics';

  let html = `<div class="${themeClass}">`;

  // Intro
  if (ch.content?.intro) {
    html += `<p class="ch-intro">${ch.content.intro}</p>`;
  }

  // Sections
  (ch.content?.sections || []).forEach((sec, i) => {
    html += `<div class="ch-section">
      <h3 class="ch-section-heading">
        <span class="num">${i + 1}</span>
        ${sec.heading}
      </h3>`;

    // Explanation
    if (sec.explanation) {
      html += `<p class="ch-explanation">${escHtml(sec.explanation)}</p>`;
    }

    // Formula (Physics only)
    if (sec.formula) {
      html += `<div class="formula-box"><div class="formula-label">📐 Formulae</div>${escHtml(sec.formula)}</div>`;
    }

    // Solved example (Physics only)
    if (sec.solved) {
      html += `<div class="solved-box"><div class="solved-label">✅ Solved Example</div>${escHtml(sec.solved)}</div>`;
    }

    // Q&A
    if (sec.qa && sec.qa.length) {
      html += `<div class="qa-section"><div class="qa-title">💬 Q &amp; A</div>`;
      sec.qa.forEach((qa, qi) => {
        const uid = `qa-${id}-${i}-${qi}`;
        html += `
        <div class="qa-item">
          <div class="qa-question" onclick="toggleQA('${uid}')" id="${uid}-q">
            <span>Q: ${escHtml(qa.q)}</span>
            <span class="q-icon">▼</span>
          </div>
          <div class="qa-answer" id="${uid}-a">${escHtml(qa.a)}</div>
        </div>`;
      });
      html += `</div>`;
    }

    html += `</div>`;
  });

  html += `</div>`;

  document.getElementById('chapter-content').innerHTML = html;
  showPage('page-chapter');
}

function toggleQA(uid) {
  const q = document.getElementById(uid + '-q');
  const a = document.getElementById(uid + '-a');
  q.classList.toggle('open');
  a.classList.toggle('open');
}

// ---- NOTES ----
const notesMap = {
  'ph1': 'light reflection & refraction Handwritten Notes.pdf',
  'ph2': 'Human Eye & Colourful world Handwritten Notes.pdf',
  'ph3': 'Electricity Handwritten Notes.pdf',
  'ph4': 'magnetic Effects of Electric Current Handwritten notes.pdf',
  'ch1': 'Chemical reaction & equations Handwritten Notes.pdf',
  'ch2': 'Acids ,Base and Salt handwritten notes.pdf',
  'ch3': 'Metals and Non metals Handwritten Notes.pdf',
  'ch4': "Carbon and It's Compounds Handwritten Notes.pdf",
  'bi1': 'life processes Handwritten notes.pdf',
  'bi2': 'Control & coordination handwritten notes.pdf',
  'bi3': 'heredity handwritten notes.pdf'
};

function goNotes() {
  const grid = document.getElementById('notes-grid');
  const filtered = currentFilter === 'all' ? chapters : chapters.filter(c => c.subject === currentFilter);
  grid.innerHTML = filtered.map(ch => {
    const hasPdf = !!notesMap[ch.id];
    return `
      <div class="notes-card ${ch.subject}${hasPdf ? '' : ' no-notes'}" ${hasPdf ? `onclick="openNotesPdf('${ch.id}')"` : ''}>
        <div class="notes-card-icon">${ch.icon}</div>
        <div class="notes-card-tag">${ch.subject.charAt(0).toUpperCase() + ch.subject.slice(1)}</div>
        <div class="notes-card-title">${ch.title}</div>
        <div class="notes-card-num">${ch.num}</div>
        <div class="notes-card-action">${hasPdf ? '📄 View Notes' : '❌ Not Available'}</div>
      </div>`;
  }).join('');
  showPage('page-notes');
}

function openNotesPdf(chapterId) {
  const pdf = notesMap[chapterId];
  if (pdf) {
    window.open('notes/' + encodeURIComponent(pdf), '_blank');
  }
}

// ---- QUIZ ----

function goQuizChapter(chapterTitle) {
  const pool = quizData.filter(q => q.chapter === chapterTitle);
  if (pool.length === 0) {
    alert('No quiz questions found for this chapter.');
    return;
  }
  startQuiz(pool, chapterTitle);
}

function startQuiz(pool, label) {
  quizPool = shuffle([...pool]);
  quizIdx = 0;
  quizScore = 0;
  answered = {};
  document.getElementById('quiz-bar-title').textContent = label ? `Quiz: ${label}` : 'Quiz Session';
  document.getElementById('quiz-score').textContent = '0';
  document.getElementById('quiz-total').textContent = quizPool.length;
  showPage('page-quiz');
  renderQ();
}

function renderQ() {
  const card = document.getElementById('quiz-card');
  if (quizIdx >= quizPool.length) {
    // Done
    const pct = Math.round((quizScore / quizPool.length) * 100);
    const emoji = pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '😅';
    const msg = pct >= 80 ? 'Excellent! You\'re a science star!' : pct >= 50 ? 'Good effort! Keep practicing.' : 'Keep studying — you\'ll get there!';
    card.innerHTML = `
      <div class="quiz-done">
        <div class="big-emoji">${emoji}</div>
        <h2>${pct}% Score</h2>
        <p>${msg}</p>
        <div class="score-circle" style="--pct:${pct}%">${quizScore}/${quizPool.length}</div>
        <button class="quiz-btn" onclick="goQuiz()">🔄 New Quiz</button>
      </div>`;
    document.getElementById('quiz-prev').disabled = true;
    document.getElementById('quiz-next').disabled = true;
    document.getElementById('quiz-counter').textContent = '';
    document.getElementById('quiz-progress').style.width = '100%';
    return;
  }

  const q = quizPool[quizIdx];
  const letters = ['A', 'B', 'C', 'D'];
  const tagClass = 'tag-' + q.subject;
  const tagLabel = q.subject.charAt(0).toUpperCase() + q.subject.slice(1);
  const userAns = answered[quizIdx];
  const isAnswered = userAns !== undefined;

  document.getElementById('quiz-score').textContent = quizScore;
  document.getElementById('quiz-total').textContent = quizPool.length;
  document.getElementById('quiz-counter').textContent = `${quizIdx + 1} / ${quizPool.length}`;
  document.getElementById('quiz-progress').style.width = ((quizIdx / quizPool.length) * 100) + '%';
  document.getElementById('quiz-prev').disabled = quizIdx === 0;
  document.getElementById('quiz-next').disabled = !isAnswered && quizIdx < quizPool.length - 1;

  const optsHtml = q.opts.map((opt, i) => {
    let cls = 'q-opt';
    if (isAnswered) {
      cls += ' disabled';
      if (i === q.ans) cls += ' correct';
      else if (i === userAns) cls += ' wrong';
    }
    return `<div class="${cls}" onclick="answerQ(${i})">
      <span class="opt-letter">${letters[i]}</span>
      <span>${escHtml(opt)}</span>
    </div>`;
  }).join('');

  const expHtml = isAnswered && q.exp ? `<div class="q-explanation">💡 ${escHtml(q.exp)}</div>` : '';

  card.innerHTML = `
    <span class="q-subject-tag ${tagClass}">${tagLabel}</span>
    <div class="q-text">${escHtml(q.q)}</div>
    <div class="q-opts">${optsHtml}</div>
    ${expHtml}
  `;
}

function answerQ(i) {
  if (answered[quizIdx] !== undefined) return;
  const q = quizPool[quizIdx];
  answered[quizIdx] = i;
  if (i === q.ans) quizScore++;
  document.getElementById('quiz-next').disabled = false;
  renderQ();
}

function nextQ() {
  if (answered[quizIdx] !== undefined || quizIdx >= quizPool.length - 1) {
    quizIdx++;
    renderQ();
  }
}

function prevQ() {
  if (quizIdx > 0) {
    quizIdx--;
    renderQ();
  }
}

// ---- NAVIGATION ----
function goHome() {
  showPage('page-home');
}

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

// ---- UTILS ----
function escHtml(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
