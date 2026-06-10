const WORDLIST_FILE = './SpellFinder.txt';
const PLATE_IMAGE_FILE = './Plate.png';

const CONFIG = {
  plateTextColor: '#14377D',
  manualFontSize:70,
  manualLetterSpacingPx:0,
  manualOffsetX: 10,
  manualOffsetY: 50,
  fontFamily: '"Arial Narrow", Bahnschrift, Arial, sans-serif',
  previewMaxWidthPx: 450,
};

const state = {
  words: [],
  wordListLoaded: false,
  plateImage: null,
  currentLetters: '',
  submittedWords: [],
  possibleWords: [],
};

const els = {};

function $(id) {
  return document.getElementById(id);
}

function normalizeWord(word) {
  return (word || '').toLowerCase().replace(/[^a-z]/g, '');
}

function orderedMatch(word, letters) {
  let pos = 0;
  for (const ch of letters) {
    pos = word.indexOf(ch, pos);
    if (pos === -1) return false;
    pos += 1;
  }
  return true;
}

function generateRandomLetters() {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return Array.from({ length: 3 }, () =>
    alphabet[Math.floor(Math.random() * alphabet.length)]
  ).join('');
}

async function loadWords() {
  try {
    const response = await fetch(WORDLIST_FILE, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const text = await response.text();

    const cleaned = [...new Set(
      text
        .split(/\r?\n/)
        .map(normalizeWord)
        .filter(Boolean)
    )].sort();

    state.words = cleaned;
    state.wordListLoaded = cleaned.length > 0;
    return cleaned;
  } catch (error) {
    state.words = [];
    state.wordListLoaded = false;
    setSummary(`Could not load word list (${WORDLIST_FILE}): ${error.message}`);
    return [];
  }
}

function loadPlateImage() {
  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      state.plateImage = img;
      resolve(img);
    };

    img.onerror = () => {
      state.plateImage = null;
      resolve(null);
    };

    img.src = PLATE_IMAGE_FILE;
  });
}

function setSummary(text) {
  els.summary.textContent = text;
}

function updateStatus() {
  const wordStatus = state.wordListLoaded
    ? `Loaded word list: ${WORDLIST_FILE.replace('./', '')} (${state.words.length} words)`
    : `Word list NOT FOUND or empty: ${WORDLIST_FILE.replace('./', '')}`;

  const imageStatus = state.plateImage
    ? ` | Plate image: ${PLATE_IMAGE_FILE.replace('./', '')}`
    : ` | Plate image NOT FOUND: ${PLATE_IMAGE_FILE.replace('./', '')}`;

  els.status.textContent = wordStatus + imageStatus;
}

function getPossibleWordsForLetters(letters) {
  const cleaned = normalizeWord(letters);
  if (cleaned.length !== 3) return [];
  return state.words.filter((word) => orderedMatch(word, cleaned));
}

const canvas = document.getElementById('plateCanvas');

function renderPlateWithLetters(letters) {
  if (!state.plateImage) {
    els.platePreview.hidden = true;
    els.plateFallback.hidden = false;
    els.plateFallback.textContent = 'Plate image not found.';
    setSummary(`Plate image not found: ${PLATE_IMAGE_FILE.replace('./', '')}`);
    return;
  }

  const dataUrl = buildPlateDataUrl(letters);
  if (!dataUrl) {
    els.platePreview.hidden = true;
    els.plateFallback.hidden = false;
    els.plateFallback.textContent = 'Could not render plate.';
    return;
  }

  const canvas = document.getElementById('plateCanvas');
  if (!canvas) {
    els.plateFallback.hidden = false;
    els.platePreview.hidden = true;
    setSummary('Canvas element not found.');
    return;
  }

  const ctx = canvas.getContext('2d');
  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };
  img.src = dataUrl;

  els.platePreview.hidden = false;
  els.plateFallback.hidden = true;
  els.currentLetters.textContent = `Current letters: ${letters}`;
}

function refreshSubmittedList() {
  els.submittedList.innerHTML = '';

  if (state.submittedWords.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No correct submitted words yet.';
    els.submittedList.appendChild(li);
    return;
  }

  for (const word of state.submittedWords) {
    const li = document.createElement('li');
    li.textContent = word;
    els.submittedList.appendChild(li);
  }
}

function clearAnswerGrid() {
  els.answerGrid.innerHTML = '';
  els.resultsMeta.textContent = '';
}

function renderAnswerGrid(possibleWords, validSubmitted) {
  clearAnswerGrid();

  els.resultsMeta.textContent =
    `Total possible words: ${possibleWords.length} • Correct submitted words highlighted: ${validSubmitted.size}`;

  for (const word of possibleWords) {
    const div = document.createElement('div');
    div.className = 'answer-item';

    if (validSubmitted.has(word)) {
      div.classList.add('highlight');
    }

    div.textContent = word;
    els.answerGrid.appendChild(div);
  }
}

function loadPlateLetters(letters, source = 'custom') {
  const cleaned = normalizeWord(letters).toUpperCase();

  if (cleaned.length !== 3) {
    setSummary('Plate letters must be exactly 3 letters.');
    return;
  }

  state.currentLetters = cleaned;
  state.submittedWords = [];
  state.possibleWords = getPossibleWordsForLetters(cleaned);

  els.wordInput.value = '';
  clearAnswerGrid();
  refreshSubmittedList();
  renderPlateWithLetters(cleaned);

  if (source === 'random') {
    setSummary(`Generated random plate letters: ${cleaned}`);
  } else if (source === 'lookup') {
    setSummary(`Loaded plate letters from lookup: ${cleaned}`);
  } else {
    setSummary(`Loaded plate letters: ${cleaned}`);
  }
}

function generateLettersAndPlate() {
  const letters = generateRandomLetters();
  els.lookupResult.textContent =
    'Random plate generated. Use 3-Letter Plate Lookup below to check/load a custom plate.';
  loadPlateLetters(letters, 'random');
}

function lookupPlate() {
  const letters = normalizeWord(els.lookupInput.value).toUpperCase();

  if (letters.length !== 3) {
    els.lookupResult.textContent = 'Please enter exactly 3 letters.';
    setSummary('Lookup requires exactly 3 letters.');
    return;
  }

  const possibleWords = getPossibleWordsForLetters(letters);

  if (possibleWords.length > 0) {
    els.lookupResult.textContent =
      `${letters}: YES — words can be formed (${possibleWords.length} possible words). Plate loaded.`;
    loadPlateLetters(letters, 'lookup');
  } else {
    els.lookupResult.textContent = `${letters}: NO — no words can be formed.`;
    setSummary(
      `Lookup checked "${letters}". No possible words were found, so the current plate was not changed.`
    );
  }
}

function submitWord() {
  const userWord = normalizeWord(els.wordInput.value);
  const letters = normalizeWord(state.currentLetters);

  if (letters.length !== 3) {
    setSummary('No valid 3-letter plate is loaded.');
    return;
  }

  if (!userWord) {
    setSummary('Please enter a valid word.');
    return;
  }

  const possibleWords = getPossibleWordsForLetters(letters);
  state.possibleWords = possibleWords;

  if (possibleWords.length === 0) {
    setSummary(`No possible words were found containing '${letters}' in that order.`);
    return;
  }

  if (!possibleWords.includes(userWord)) {
    setSummary(
      `"${userWord}" is NOT a valid answer for plate letters "${letters.toUpperCase()}".`
    );
    els.wordInput.value = '';
    els.wordInput.focus();
    return;
  }

  if (!state.submittedWords.includes(userWord)) {
    state.submittedWords.push(userWord);
    state.submittedWords.sort();
    refreshSubmittedList();
  }

  const userLength = userWord.length;
  const shorterWords = possibleWords.filter((word) => word.length < userLength);
  const percentageShorter =
    possibleWords.length === 0 ? 0 : (shorterWords.length / possibleWords.length) * 100;

  setSummary(
    `"${userWord}" added to Correct Submitted Words. It is longer than ${percentageShorter.toFixed(2)}% of the ${possibleWords.length} possible words.`
  );

  els.wordInput.value = '';
  els.wordInput.focus();
}

function showAnswers() {
  const letters = normalizeWord(state.currentLetters);
  const possibleWords = getPossibleWordsForLetters(letters);
  state.possibleWords = possibleWords;

  if (letters.length !== 3) {
    setSummary('No valid 3-letter plate is loaded.');
    return;
  }

  if (possibleWords.length === 0) {
    setSummary(`No possible words were found containing '${letters}' in that order.`);
    clearAnswerGrid();
    return;
  }

  const validSubmitted = new Set(
    state.submittedWords.filter((word) => possibleWords.includes(word))
  );

  renderAnswerGrid(possibleWords, validSubmitted);

  setSummary(
    `Showing all ${possibleWords.length} possible words in 4-column responsive layout. ${validSubmitted.size} correct submitted words highlighted.`
  );
}

function clearAll() {
  els.wordInput.value = '';
  els.lookupInput.value = '';
  els.lookupResult.textContent = 'Enter 3 letters to check whether words can be formed.';
  setSummary('Ready.');
  clearAnswerGrid();

  state.submittedWords = [];
  state.possibleWords = [];
  state.currentLetters = '';

  refreshSubmittedList();

  els.platePreview.hidden = true;
  els.platePreview.removeAttribute('src');
  els.plateFallback.hidden = false;
  els.plateFallback.textContent = 'Plate image preview will appear here.';
  els.currentLetters.textContent = 'Current letters: ---';

  els.wordInput.focus();
}

function bindEvents() {
  els.submitBtn.addEventListener('click', submitWord);
  els.answerBtn.addEventListener('click', showAnswers);
  els.generateBtn.addEventListener('click', generateLettersAndPlate);
  els.clearBtn.addEventListener('click', clearAll);
  els.lookupBtn.addEventListener('click', lookupPlate);

  els.wordInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') submitWord();
  });

  els.lookupInput.addEventListener('input', () => {
    els.lookupInput.value = els.lookupInput.value
      .replace(/[^a-z]/gi, '')
      .slice(0, 3)
      .toUpperCase();
  });

  els.lookupInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') lookupPlate();
  });
}

async function init() {
  Object.assign(els, {
    platePreview: $('platePreview'),
    plateFallback: $('plateFallback'),
    currentLetters: $('currentLetters'),
    wordInput: $('wordInput'),
    submitBtn: $('submitBtn'),
    answerBtn: $('answerBtn'),
    generateBtn: $('generateBtn'),
    clearBtn: $('clearBtn'),
    lookupInput: $('lookupInput'),
    lookupBtn: $('lookupBtn'),
    lookupResult: $('lookupResult'),
    summary: $('summary'),
    status: $('status'),
    submittedList: $('submittedList'),
    resultsMeta: $('resultsMeta'),
    answerGrid: $('answerGrid'),
  });

  refreshSubmittedList();
  bindEvents();

  await Promise.all([loadWords(), loadPlateImage()]);
  updateStatus();

  if (!state.wordListLoaded) {
    setSummary('Place SpellFinder.txt next to these files before publishing to GitHub Pages.');
  }

  if (!state.plateImage) {
    if (!state.wordListLoaded) {
      setSummary('Place both SpellFinder.txt and Plate.png next to these files before publishing to GitHub Pages.');
    } else {
      setSummary('Place Plate.png next to these files before publishing to GitHub Pages.');
    }
  }

  if (state.wordListLoaded && state.plateImage) {
    generateLettersAndPlate();
  }

  els.wordInput.focus();
}

document.addEventListener('DOMContentLoaded', init);
