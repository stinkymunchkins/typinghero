/**********************
 * Typing Hero — popup, lessons, OSK clicks + Shift
 * + Physical keyboard fixed: uses e.code + live Shift state, reads OSK labels
 **********************/

const SHEET_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbytAqnbvZtvwltcMuHgc38piyngVO0aBIyxaZu2BpBB81AVEfZ58Qm7hdD-6y9ZJD8r/exec';

const $ = id => document.getElementById(id);
const nowIso = () => new Date().toISOString();
function applyTheme(lvl){
  document.body.classList.remove('theme-1','theme-2','theme-3','theme-4','theme-5');
  const i = Math.min(Math.max(parseInt(lvl||1,10),1),5);
  document.body.classList.add(`theme-${i}`);
}
function saveProfile(p){ try{ localStorage.setItem('typingHeroProfile', JSON.stringify(p)); }catch{} }
function loadProfile(){ try{ const r=localStorage.getItem('typingHeroProfile'); return r?JSON.parse(r):null; }catch{ return null; } }
function fmt(sec){const m=String(Math.floor(sec/60)).padStart(2,'0');const s=String(Math.floor(sec%60)).padStart(2,'0');return `${m}:${s}`;}
function getApp(){ return $('app'); }
function isAppVisible(){ const a=getApp(); return !!(a && !a.hidden); }
function ensureSinkFocus(){ if(isAppVisible() && els.inp && document.activeElement!==els.inp) els.inp.focus(); }
function show(el){ if(el) el.hidden=false; }
function hide(el){ if(el) el.hidden=true; }

/* ===== popup ===== */
function ensureModal(){
  if (document.querySelector('#finalModal')) return;
  const style = document.createElement('style');
  style.textContent = `
    #finalModalOverlay{position:fixed;inset:0;background:rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;z-index:9998;opacity:0;transition:.25s;pointer-events:none}
    #finalModal{background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.25);max-width:520px;width:92%;padding:24px;text-align:center}
    #finalModal h2{margin:0 0 8px;font-size:22px}
    #finalModal p{margin:0 0 14px;color:#334155}
    #finalModal .okbtn{background:#16a34a;color:#fff;border:0;border-radius:12px;padding:10px 16px;font-size:16px;cursor:pointer}
    .key.activeShift{background:#fde68a;}
    .key.hint{box-shadow:0 0 0 2px #22c55e inset;}
  `;
  document.head.appendChild(style);
  const overlay = document.createElement('div');
  overlay.id = 'finalModalOverlay';
  overlay.innerHTML = `
    <div id="finalModal" role="dialog" aria-modal="true" aria-labelledby="finalTitle">
      <h2 id="finalTitle">จบทุก Level ทำได้ดีมาก !</h2>
      <p>คุณผ่านแบบฝึกหัดทั้งหมดแล้ว เก่งมาก 👏</p>
      <button class="okbtn" id="finalOk">ตกลง</button>
    </div>
  `;
  overlay.addEventListener('click', (e)=>{ if(e.target.id==='finalModalOverlay'){ hideModal(); }});
  document.body.appendChild(overlay);
}
function showModal(){ ensureModal(); const ov = document.querySelector('#finalModalOverlay'); ov.style.opacity='1'; ov.style.pointerEvents='auto'; }
function hideModal(){ const ov=document.querySelector('#finalModalOverlay'); if(!ov) return; ov.style.opacity='0'; ov.style.pointerEvents='none'; }

/* ===== lessons (UNCHANGED) ===== */
const STAGES = {
  1: ['มา มี ไป หา พา ดู','กิน นอน นั่ง ยืน เดิน วิ่ง','ตา หู ปาก ฟัน มือ เท้า'],
  2: ['เรา เขา เธอ ฉัน ใคร ไหน','พ่อ แม่ พี่ น้อง เพื่อน ครู','กิน ข้าว ดื่ม น้ำ ล้าง มือ'],
  3: ['ไม้ ใหม่ ไม้ ไหม้ ไหม','น้ำ ข้าว เข้า เก้า เก่า','น้อย บ้า บ่า บ๊า บ๋า'],
  4: ['ตลาด สบาย ขนม ดินสอ สมุด หนังสือ','โรงเรียน ห้องเรียน ห้องน้ำ ห้องครัว ห้องสมุด','เวลา ตอนเช้า ตอนเย็น วันนี้ พรุ่งนี้'],
  5: ['สนาม โต๊ะ เก้าอี้ กระเป๋า กล่อง กล้อง','เสื้อผ้า รองเท้า ถุงเท้า หมวก ร่ม','โทรศัพท์ คอมพิวเตอร์ แป้นพิมพ์ เมาส์ จอภาพ']
};

/* ===== state ===== */
let els = {};
let S = { level:1, stage:0, text:'', i:0, ok:0, bad:0, t0:null, timer:null };

/* ===== toast ===== */
function showToast(msg, ok=true){
  let t = document.querySelector('.toast');
  if(!t){
    t = document.createElement('div');
    t.className = 'toast';
    t.style.cssText = 'position:fixed;left:50%;bottom:22px;transform:translateX(-50%);padding:10px 14px;border-radius:10px;font-size:14px;color:#fff;background:#16a34a;box-shadow:0 6px 16px rgba(0,0,0,.2);z-index:9999;opacity:0;transition:.25s';
    document.body.appendChild(t);
  }
  t.style.background = ok ? '#16a34a' : '#ef4444';
  t.textContent = msg;
  requestAnimationFrame(()=>{ t.style.opacity='1'; });
  setTimeout(()=>{ t.style.opacity='0'; }, 1600);
}

/* ===== key hint ===== */
function updateKeyHint(){
  document.querySelectorAll('.key').forEach(k=>k.classList.remove('hint'));
  const exp = S.text?.[S.i] || '';
  if (!exp) return;
  if (exp === ' ') { document.querySelector('[data-special="space"]')?.classList.add('hint'); return; }
  let btn = document.querySelector(`#osk .key[data-th="${CSS.escape(exp)}"]`);
  if (!btn) btn = document.querySelector(`#osk .key[data-th-shift="${CSS.escape(exp)}"]`);
  if (btn) btn.classList.add('hint');
}

/* ===== transitions & landing ===== */
function playTransition(fromId,toId,d=420){
  const f=$(fromId), t=$(toId); if(!t) return;
  document.body.classList.add('is-transitioning');
  if (f) f.classList.add('pageOut');
  setTimeout(()=>{
    if (f){ f.hidden=true; f.classList.remove('pageOut'); }
    t.hidden=false; void t.offsetWidth; t.classList.add('pageIn');
    setTimeout(()=>{ t.classList.remove('pageIn'); document.body.classList.remove('is-transitioning'); ensureSinkFocus(); }, d);
  }, d);
}
function goStart(){
  const first=($('firstName')?.value||'').trim();
  const last =($('lastName') ?.value||'').trim();
  const num  =($('number')   ?.value||'').trim();
  const room =($('room')     ?.value||'').trim();
  if(!first||!last||!num||!room){ alert('กรอกให้ครบ'); return; }
  saveProfile({firstName:first,lastName:last,number:num,room});
  applyTheme(1);
  playTransition('landing','app');
}
window.goStart = goStart;

/* ===== render & metrics ===== */
function render(){
  if (!els.box) return;
  els.box.innerHTML='';
  [...S.text].forEach((c,k)=>{
    const sp=document.createElement('span');
    sp.textContent=c;
    if(k===S.i) sp.classList.add('current');
    els.box.appendChild(sp);
  });
  updateKeyHint();
}
function metrics(){
  if (!els.cpm || !els.acc || !els.time || !els.bar) return;
  const t=S.t0?(Date.now()-S.t0)/1000:0, typed=S.ok+S.bad;
  els.cpm.textContent= t? Math.round((S.ok/t)*60):0;
  els.acc.textContent= typed? Math.round((S.ok/typed)*100)+'%':'100%';
  els.time.textContent=fmt(t);
  els.bar.style.width=(S.text.length? (S.i/S.text.length)*100:0)+'%';
}

/* ===== Sheets logging ===== */
async function sendResult(){
  const profile = loadProfile() || {};
  const payload = {
    firstName: profile.firstName || '',
    lastName : profile.lastName  || '',
    number   : profile.number    || '',
    room     : profile.room      || '',
    level    : S.level,
    stage    : S.stage,
    cpm      : Number(els.cpm?.textContent || 0) || 0,
    accuracy : Number((els.acc?.textContent || '').replace('%','')) || 0,
    timeText : els.time?.textContent || '00:00',
    clientTs : nowIso(),
    ua       : navigator.userAgent || ''
  };
  try {
    await fetch(SHEET_WEBAPP_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type':'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    showToast('บันทึกผลแล้ว', true);
  } catch (err) {
    console.error('[TypingHero] sendResult failed:', err);
    showToast('บันทึกล้มเหลว', false);
  }
}

/* ===== stage / level control ===== */
function loadStage(level, stage){
  const arr = STAGES[level] || STAGES[1];
  const sIdx = Math.max(0, Math.min(stage ?? 0, arr.length-1));
  S.level = level; S.stage = sIdx;
  applyTheme(S.level);

  S.text = (arr[sIdx] || '').replace(/\s+/g,' ').trim();
  S.i=0; S.ok=0; S.bad=0; S.t0=Date.now();
  if (S.timer) clearInterval(S.timer);
  render();
  if (els.inp){ els.inp.value=''; ensureSinkFocus(); }
  S.timer = setInterval(metrics, 160); metrics();

  hide(els.next);
}
function startLevel(){
  const lvl = parseInt(els.level?.value || S.level || 1, 10);
  loadStage(lvl, 0);
}
window.startLevel = startLevel;

function nextLevel(){
  const nextLvl = Math.min(5, S.level + 1);
  if (nextLvl === S.level) { hide(els.next); return; }
  if (els.level) els.level.value = String(nextLvl);
  loadStage(nextLvl, 0);
  hide(els.next);
}

/* ===== typing & backspace ===== */
function handle(ch){
  if(!S.t0 || S.i>=S.text.length) return;
  const spans=els.box?.querySelectorAll('span'); if(!spans) return;
  const exp=S.text[S.i];
  if(ch===exp){ S.ok++; spans[S.i]?.classList.add('ok'); S.i++; spans.forEach(s=>s.classList.remove('current')); spans[S.i]?.classList.add('current'); }
  else{ S.bad++; spans[S.i]?.classList.add('bad'); }
  if(S.i>=S.text.length){
    clearInterval(S.timer); metrics(); sendResult();
    const arr = STAGES[S.level] || STAGES[1];
    const isLastSubStage = (S.stage >= arr.length - 1);
    if (isLastSubStage){ if (S.level < 5){ show(els.next); } else { showModal(); } }
    else { setTimeout(()=> loadStage(S.level, S.stage + 1), 300); }
    return;
  }
  metrics(); updateKeyHint();
}
function handleBackspace(){
  if (!S.t0) return;
  const spans = els.box?.querySelectorAll('span'); if(!spans) return;
  const cur = spans[S.i];
  if (cur && cur.classList.contains('bad')){ cur.classList.remove('bad'); metrics(); updateKeyHint(); return; }
  if (S.i <= 0){ spans.forEach(s=>s.classList.remove('current')); spans[0]?.classList.add('current'); metrics(); updateKeyHint(); return; }
  const prev = S.i - 1;
  if (spans[prev]?.classList.contains('ok')) S.ok = Math.max(0, S.ok - 1);
  spans[prev]?.classList.remove('ok','bad');
  spans.forEach(s=>s.classList.remove('current')); S.i = prev; spans[S.i]?.classList.add('current');
  metrics(); updateKeyHint();
}

/* =========================================================
   KEYBOARD FIX — map by physical key (e.code) using your OSK labels
   ========================================================= */
let physShiftHeld = false;    // live state of physical Shift
let oskShift = false;         // on-screen Shift toggle (independent)

const CODE_TO_BASE_EN = {
  Backquote:'`',
  Digit1:'1', Digit2:'2', Digit3:'3', Digit4:'4', Digit5:'5',
  Digit6:'6', Digit7:'7', Digit8:'8', Digit9:'9', Digit0:'0',
  Minus:'-', Equal:'=',
  KeyQ:'q', KeyW:'w', KeyE:'e', KeyR:'r', KeyT:'t',
  KeyY:'y', KeyU:'u', KeyI:'i', KeyO:'o', KeyP:'p',
  BracketLeft:'[', BracketRight:']', Backslash:'\\', IntlBackslash:'\\',
  KeyA:'a', KeyS:'s', KeyD:'d', KeyF:'f', KeyG:'g',
  KeyH:'h', KeyJ:'j', KeyK:'k', KeyL:'l',
  Semicolon:';', Quote:'\'',
  KeyZ:'z', KeyX:'x', KeyC:'c', KeyV:'v', KeyB:'b',
  KeyN:'n', KeyM:'m',
  Comma:',', Period:'.', Slash:'/',
  Space:' '
};

// find the OSK button by its unshifted EN label
function getOSKButtonByBaseEn(baseEn){
  if (!baseEn) return null;
  // matches data-en exactly as in your HTML
  return document.querySelector(`#osk .key[data-en="${CSS.escape(baseEn)}"]`);
}

// choose Thai char from that OSK button using either physical-Shift or on-screen Shift
function thaiFromOSKByCode(e){
  const baseEn = CODE_TO_BASE_EN[e.code];
  if (!baseEn) return '';

  const btn = getOSKButtonByBaseEn(baseEn);
  if (!btn) return '';

  const thBase  = btn.dataset.th || '';
  const thShift = btn.dataset.thShift || btn.dataset.thshift || '';

  const useShift = physShiftHeld || oskShift;
  return (useShift && thShift) ? thShift : thBase;
}

/* ===== OSK visuals & clicks ===== */
function refreshOSKLabels(){
  document.querySelectorAll('#osk .key[data-th]').forEach(btn=>{
    const base = btn.dataset.th || '';
    const shift = btn.dataset.thShift || btn.dataset.thshift || '';
    const showChar = (oskShift ? (shift || base) : base);
    const span = btn.querySelector('span');
    if (span) span.textContent = showChar || base;
  });
  document.querySelectorAll('#osk .key[data-special="shift"]').forEach(b=>{
    b.classList.toggle('activeShift', oskShift || physShiftHeld);
  });
}
function clickCharFromKey(btn){
  if (!btn) return;
  const base = btn.dataset.th || '';
  const shift = btn.dataset.thShift || btn.dataset.thshift || '';
  const out = ((oskShift || physShiftHeld) && shift) ? shift : base;
  if (out) handle(out);
}
function wireOSK(){
  const osk = $('osk');
  if (!osk) return;

  osk.addEventListener('click', (e)=>{
    const btn = e.target.closest('.key');
    if (!btn) return;
    e.preventDefault();
    ensureSinkFocus();

    const special = btn.dataset.special;
    if (special === 'backspace'){ handleBackspace(); return; }
    if (special === 'space'){ handle(' '); return; }
    if (special === 'shift'){ oskShift = !oskShift; refreshOSKLabels(); return; }
    if (special === 'tab' || special === 'caps' || special === 'enter') return;

    clickCharFromKey(btn);
  });

  refreshOSKLabels();
}

/* ===== init ===== */
window.addEventListener('DOMContentLoaded', ()=>{
  els = {
    level: $('levelSelect'),
    start: $('startBtn'),
    reset: $('resetBtn'),
    next:  $('nextLevelBtn'),
    go:    $('goBtn'),
    inp:   $('hiddenInput'),
    box:   $('textDisplay'),
    cpm:   $('cpm'),
    acc:   $('acc'),
    time:  $('time'),
    bar:   $('progressBar')
  };

  applyTheme(1);
  wireOSK();
  ensureModal();
  $('finalOk')?.addEventListener('click', hideModal);

  els.start?.addEventListener('click', startLevel);
  els.reset?.addEventListener('click', ()=> loadStage(S.level, S.stage));
  els.next?.addEventListener('click', nextLevel);
  els.level?.addEventListener('change', ()=>{
    S.level = parseInt(els.level.value,10)||1; S.stage=0; applyTheme(S.level);
    if(S.t0){ loadStage(S.level,0); }
  });
  $('goBtn')?.addEventListener('click', goStart);

  // sink for IME/OSK text
  els.inp?.addEventListener('input', (e)=>{
    const val = els.inp.value;
    const ch = (e.data && e.data.length===1) ? e.data : (val ? val.slice(-1) : '');
    els.inp.value = '';
    if (ch) handle(ch);
  });

  document.addEventListener('click', (ev)=>{
    const app = getApp();
    if (app && !app.hidden && ev.target && app.contains(ev.target)) ensureSinkFocus();
  });

  /* ===== physical keyboard typing with live Shift ===== */
  window.addEventListener('keydown', (e)=>{
    if (!isAppVisible()) return;

    const t=e.target, tag=t && t.tagName;
    const isField = tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'||(t && t.isContentEditable);
    if (isField && t !== els.inp) return;

    // track Shift state
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight'){
      physShiftHeld = true;
      refreshOSKLabels();
      return; // only state change/visual
    }

    // controls
    if (e.key === 'Backspace'){ e.preventDefault(); ensureSinkFocus(); handleBackspace(); return; }
    if (e.key === 'Enter'){ e.preventDefault(); ensureSinkFocus(); return; }
    if (e.code === 'Space' || e.key === ' '){ e.preventDefault(); ensureSinkFocus(); handle(' '); return; }

    // IME Thai direct
    if (e.key && e.key.length === 1 && e.key.charCodeAt(0) > 127){
      e.preventDefault(); ensureSinkFocus(); handle(e.key); return;
    }

    // Map by physical key using OSK labels + live Shift state
    const out = thaiFromOSKByCode(e);
    if (out){
      e.preventDefault();
      ensureSinkFocus();
      handle(out);
      return;
    }
    // else: let unknown keys pass
  }, { capture:true });

  window.addEventListener('keyup', (e)=>{
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight'){
      physShiftHeld = false;
      refreshOSKLabels();
    }
  }, { capture:true });

  document.body.classList.remove('is-transitioning');
});
