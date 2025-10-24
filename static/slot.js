const canvas = document.getElementById('slotCanvas');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spinBtn');
const statusText = document.getElementById('statusText');
const resultEl = document.getElementById('result');
const spinsLeftEl = document.getElementById('spinsLeft');
const rewardBox = document.getElementById('reward');
const rewardCodeEl = document.getElementById('rewardCode');
const copyCodeBtn = document.getElementById('copyCodeBtn');

const modal = document.getElementById('emailModal');
const modalTitle = document.getElementById('modalTitle');
const modalDesc = document.getElementById('modalDesc');
const emailForm = document.getElementById('emailForm');
const emailInput = document.getElementById('emailInput');
const nameInput = document.getElementById('nameInput');
const consentInput = document.getElementById('consentInput');
const cancelModalBtn = document.getElementById('cancelModal');
const formError = document.getElementById('formError');

let hasRegistered = false;
let registeredEmail = '';

const SYMBOLS = ['cherry','lemon','bar','seven','diamond'];
const COLORS = {
  cherry: '#ff6b6b',
  lemon: '#ffd166',
  bar: '#a8dadc',
  seven: '#ffd700',
  diamond: '#4dd3ff',
};

function drawGrid(grid) {
  ctx.fillStyle = '#111427';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  const cellW = Math.floor(canvas.width / 3);
  const cellH = Math.floor(canvas.height / 3);
  for (let r=0;r<3;r++) {
    for (let c=0;c<3;c++) {
      const x = c*cellW; const y = r*cellH;
      ctx.strokeStyle = '#2b2f4a';
      ctx.strokeRect(x+0.5,y+0.5,cellW-1,cellH-1);
      const sym = grid[r][c];
      ctx.fillStyle = COLORS[sym] || '#fff';
      ctx.font = 'bold 20px system-ui,Segoe UI,Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sym.toUpperCase(), x+cellW/2, y+cellH/2);
    }
  }
  // highlight midline
  ctx.strokeStyle = '#6c5ce7';
  ctx.lineWidth = 2;
  ctx.strokeRect(0.5, cellH+0.5, canvas.width-1, cellH-1);
}

function animateSpin(finalGrid, onDone) {
  const frames = 24;
  let f = 0;
  const anim = setInterval(() => {
    const grid = Array.from({length:3}, ()=>Array.from({length:3}, ()=>SYMBOLS[(Math.random()*SYMBOLS.length)|0]));
    drawGrid(grid);
    f++;
    if (f >= frames) {
      clearInterval(anim);
      drawGrid(finalGrid);
      onDone();
    }
  }, 40);
}

function showModal(title, desc) {
  modalTitle.textContent = title;
  modalDesc.textContent = desc || '';
  formError.textContent = '';
  modal.classList.remove('hidden');
}

function hideModal() { modal.classList.add('hidden'); }

cancelModalBtn.addEventListener('click', hideModal);

copyCodeBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(rewardCodeEl.textContent);
    copyCodeBtn.textContent = 'Kopieret!';
    setTimeout(()=>copyCodeBtn.textContent='Kopier',1200);
  } catch {}
});

function setSpinsLeft(n) {
  if (n === undefined || n === null) { spinsLeftEl.textContent = ''; return; }
  spinsLeftEl.textContent = `Du har ${n} spins tilbage i dag.`;
}

async function doAnonSpin() {
  statusText.textContent = 'Spinner...';
  rewardBox.classList.add('hidden');
  resultEl.textContent = '';
  try {
    const res = await fetch('/api/slot/spin_anon', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) {
      if (data.error === 'limit_reached') {
        resultEl.textContent = 'Dagens gratis spin er brugt. Indtast e-mail for at fortsætte.';
        showModal('Få ekstra spin', 'Indtast din e-mail for at få flere daglige spins.');
        statusText.textContent = '';
        return;
      }
      throw new Error(data.error || 'Fejl');
    }

    const finalGrid = data.reels;
    const isWin = !!data.is_win;
    const tier = data.tier;
    animateSpin(finalGrid, () => {
      if (isWin) {
        resultEl.textContent = `Du har vundet! (${tier})`;
        showModal('Se din præmie', 'Indtast e-mail for at modtage præmiekode.');
      } else {
        resultEl.textContent = 'Ingen gevinst – få et ekstra spin ved at indtaste e-mail.';
        showModal('Få ekstra spin', 'Indtast e-mail for at få flere daglige spins.');
      }
      // store anon_uuid for registration
      window.__anon_uuid = data.anon_uuid;
      statusText.textContent = '';
    });
  } catch (e) {
    statusText.textContent = e.message || 'Fejl';
  }
}

async function registerFromSpin() {
  formError.textContent = '';
  const email = emailInput.value.trim().toLowerCase();
  if (!email) { formError.textContent = 'Ugyldig e-mail'; return; }
  if (!consentInput.checked) { formError.textContent = 'Samtykke er påkrævet'; return; }
  const name = nameInput.value.trim();
  const anon_uuid = window.__anon_uuid;
  try {
    const res = await fetch('/api/leads/register_from_spin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ anon_uuid, email, name, consent: true }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Fejl');
    hideModal();
    hasRegistered = true;
    registeredEmail = email;
    setSpinsLeft(data.spins_left);
    if (data.is_win) {
      resultEl.textContent = `Tillykke! (${data.tier})`;
      if (data.reward_code) {
        rewardCodeEl.textContent = data.reward_code;
        rewardBox.classList.remove('hidden');
      }
    } else {
      resultEl.textContent = 'Ekstra spin tildelt.';
    }
  } catch (e) {
    formError.textContent = e.message || 'Fejl';
  }
}

emailForm.addEventListener('submit', (e) => { e.preventDefault(); registerFromSpin(); });

async function doRegisteredSpin() {
  statusText.textContent = 'Spinner...';
  rewardBox.classList.add('hidden');
  try {
    const res = await fetch('/api/slot/spin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: registeredEmail }),
    });
    const data = await res.json();
    if (!res.ok) {
      if (data.error === 'limit_reached') {
        resultEl.textContent = 'Daglig grænse nået.';
      } else {
        resultEl.textContent = data.error || 'Fejl';
      }
      statusText.textContent = '';
      return;
    }
    animateSpin(data.reels, () => {
      if (data.is_win) {
        resultEl.textContent = `Du har vundet! (${data.tier})`;
        if (data.reward_code) {
          rewardCodeEl.textContent = data.reward_code;
          rewardBox.classList.remove('hidden');
        }
      } else {
        resultEl.textContent = 'Ingen gevinst denne gang.';
      }
      setSpinsLeft(data.spins_left);
      statusText.textContent = '';
    });
  } catch (e) {
    statusText.textContent = e.message || 'Fejl';
  }
}

spinBtn.addEventListener('click', () => {
  if (!hasRegistered) return doAnonSpin();
  return doRegisteredSpin();
});

// initial blank grid
const blank = Array.from({length:3},()=>Array.from({length:3},()=>''));
for (let r=0;r<3;r++) for (let c=0;c<3;c++) blank[r][c] = SYMBOLS[(Math.random()*SYMBOLS.length)|0];
drawGrid(blank);
