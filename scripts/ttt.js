const fs = require('fs');
const path = require('path');

const ROOT = process.env.TTT_ROOT || process.cwd();
const REPO = process.env.GITHUB_REPOSITORY || 'prajwal-0706/prajwal-0706';
const STATE_FILE = path.join(ROOT, 'state', 'ttt.json');
const README_FILE = path.join(ROOT, 'README.md');
const START = '<!-- ttt:start -->';
const END = '<!-- ttt:end -->';

const title = (process.env.ISSUE_TITLE || '').trim();
const user = process.env.ISSUE_USER || 'someone';
const issueNumber = process.env.ISSUE_NUMBER;

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return { board: Array(9).fill(''), games: 0, you: 0, me: 0, draws: 0, over: false, status: 'Your move. You are X.', lastPlayer: '' };
  }
}

function saveState(state) {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + '\n');
}

function winner(board) {
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return board.every(Boolean) ? 'draw' : '';
}

function minimax(board, player) {
  const result = winner(board);
  if (result === 'O') return { score: 1 };
  if (result === 'X') return { score: -1 };
  if (result === 'draw') return { score: 0 };
  let best = null;
  for (let i = 0; i < 9; i++) {
    if (board[i]) continue;
    board[i] = player;
    const { score } = minimax(board, player === 'O' ? 'X' : 'O');
    board[i] = '';
    if (!best || (player === 'O' ? score > best.score : score < best.score)) best = { score, move: i };
  }
  return best;
}

function botMove(board) {
  if (board.every((cell) => !cell)) return 4;
  return minimax(board.slice(), 'O').move;
}

function cellMarkup(board, i, over) {
  const mark = board[i];
  if (mark === 'X') return '<img src="assets/ttt/x.svg" width="72" height="72" alt="X" />';
  if (mark === 'O') return '<img src="assets/ttt/o.svg" width="72" height="72" alt="O" />';
  if (over) return '<img src="assets/ttt/empty.svg" width="72" height="72" alt="empty" />';
  const body = encodeURIComponent('Just press "Submit new issue". My profile plays its move within a minute and closes this issue.');
  return `<a href="https://github.com/${REPO}/issues/new?title=ttt%7C${i + 1}&body=${body}"><img src="assets/ttt/empty.svg" width="72" height="72" alt="play square ${i + 1}" /></a>`;
}

function renderSection(state) {
  const rows = [0, 3, 6].map((r) => `    <tr>${[0, 1, 2].map((c) => `<td align="center">${cellMarkup(state.board, r + c, state.over)}</td>`).join('')}</tr>`).join('\n');
  const newGame = `https://github.com/${REPO}/issues/new?title=ttt%7Cnew&body=${encodeURIComponent('Just press "Submit new issue" to reset the board.')}`;
  const again = state.over ? `\n\n[Start a new game](${newGame})` : '';
  return [
    START,
    '<table>',
    rows,
    '</table>',
    '',
    `**${state.status}**${again}`,
    '',
    `Scoreboard: you ${state.you} · me ${state.me} · draws ${state.draws} · games ${state.games}`,
    END,
  ].join('\n');
}

function updateReadme(state) {
  const readme = fs.readFileSync(README_FILE, 'utf8');
  const start = readme.indexOf(START);
  const end = readme.indexOf(END);
  if (start < 0 || end < 0) throw new Error('README markers not found');
  const next = readme.slice(0, start) + renderSection(state) + readme.slice(end + END.length);
  fs.writeFileSync(README_FILE, next);
}

async function closeIssue(comment) {
  const token = process.env.GITHUB_TOKEN;
  if (!token || !issueNumber) {
    console.log('comment:', comment);
    return;
  }
  const base = `https://api.github.com/repos/${REPO}/issues/${issueNumber}`;
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', 'User-Agent': 'ttt-bot' };
  await fetch(`${base}/comments`, { method: 'POST', headers, body: JSON.stringify({ body: comment }) });
  await fetch(base, { method: 'PATCH', headers, body: JSON.stringify({ state: 'closed' }) });
}

async function main() {
  const match = title.match(/^ttt\|(new|[1-9])$/i);
  if (!match) {
    console.log('not a game issue, nothing to do');
    return;
  }
  const state = loadState();
  const command = match[1].toLowerCase();

  if (command === 'new' || state.over) {
    state.board = Array(9).fill('');
    state.over = false;
    state.status = 'Your move. You are X.';
  }

  if (command === 'new') {
    saveState(state);
    updateReadme(state);
    await closeIssue(`Board reset. @${user}, your move: pick an empty square on the profile.`);
    return;
  }

  const idx = Number(command) - 1;
  if (state.board[idx]) {
    await closeIssue(`Square ${command} is already taken, @${user}. Pick an empty one on the profile.`);
    return;
  }

  state.board[idx] = 'X';
  let result = winner(state.board);
  let reply = '';

  if (!result) {
    const move = botMove(state.board);
    state.board[move] = 'O';
    reply = `You played ${command}, I played ${move + 1}.`;
    result = winner(state.board);
  }

  if (result === 'X') {
    state.you += 1;
    state.games += 1;
    state.over = true;
    state.status = `@${user} beat the bot. First one ever.`;
  } else if (result === 'O') {
    state.me += 1;
    state.games += 1;
    state.over = true;
    state.status = `I win this one, @${user}. Good game.`;
  } else if (result === 'draw') {
    state.draws += 1;
    state.games += 1;
    state.over = true;
    state.status = `Draw against @${user}. That is the best anyone has done.`;
  } else {
    state.status = `${reply} Your move, @${user}.`;
  }
  state.lastPlayer = user;

  saveState(state);
  updateReadme(state);
  await closeIssue(`${reply ? reply + ' ' : ''}${state.over ? state.status : 'The board on the profile is updated; your move.'}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
