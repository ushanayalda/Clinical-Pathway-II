'use strict';

const CASE_PATH = 'data/cases/case-001.prototype.json';
const STORAGE_KEY = 'clinicalPathwayCase001V22';
const initial = {
  status: 'not_started',
  mode: 'guided',
  beat: 0,
  attemptStarted: null,
  reviewUnlocked: false,
  reviewStage: 0,
  reflection: {},
  selectedDrill: null,
  optional: null,
  modelBeat: 0,
  retry: 'not_set'
};

let data;
let timer;
let state = load();

function load() {
  try { return { ...initial, ...(JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}) }; }
  catch { return { ...initial }; }
}
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function patch(next) { state = { ...state, ...next }; save(); render(); }
function esc(value = '') { return String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;'); }
function route() { const r = location.hash.slice(1) || 'home'; return ['home','library','station','review','journey'].includes(r) ? r : 'home'; }
function format(seconds) { return `${String(Math.floor(seconds / 60)).padStart(2,'0')}:${String(seconds % 60).padStart(2,'0')}`; }
function remaining(start, total) { return start ? Math.max(0, total - Math.floor((Date.now() - start) / 1000)) : total; }

function nav(active) {
  return `<header class="global-header"><a class="brand" href="#home"><span class="brand-mark">CP</span>Clinical Pathway</a><nav aria-label="Primary">${['home','library','station','review','journey'].map(x => `<a href="#${x}" ${active===x?'aria-current="page"':''}>${x[0].toUpperCase()+x.slice(1)}</a>`).join('')}</nav></header>`;
}
function shell(active, body) { return `<main id="app-main" class="shell">${nav(active)}${body}<footer><span>Case 001 prototype</span><span>Clinical release remains HOLD</span></footer></main>`; }
function timerBlock(total, start, label) { return `<div class="timer"><span>${esc(label)}</span><strong data-timer data-total="${total}" data-start="${start || ''}">${format(remaining(start,total))}</strong></div>`; }

function nextMove() {
  if (state.status === 'not_started') return ['Start Station 001','#station','Begin with the reading card.'];
  if (state.status === 'in_progress') return [state.mode==='blind'?'Continue blind repeat':'Continue guided run','#station',`Continue beat ${state.beat+1} of ${data.guided_run.beats.length}.`];
  if (state.reviewStage < data.review.core_stages.length - 1) return ['Continue Review','#review',`Review stage ${state.reviewStage+1} of ${data.review.core_stages.length}.`];
  return ['Open Journey','#journey',state.retry==='completed'?'The guided run, Review and blind repeat are complete.':'Choose a weak drill or blind repeat.'];
}

function home() {
  const [label,href,note] = nextMove();
  return shell('home', `<section class="hero"><div><p class="eyebrow">Clinical station practice</p><h1>Run the station.<br>Understand the road.</h1><p class="lede">Practise a realistic consultation with short, cautious reasoning at each clinical turn. Repair one weak part, then repeat without prompts.</p></div><aside class="next-card"><p class="eyebrow">Next useful move</p><h2>${esc(label)}</h2><p>${esc(note)}</p><div class="pills"><span>Case 001</span><span>${state.status.replaceAll('_',' ')}</span></div><div class="actions"><a class="button primary" href="${href}">${esc(label)}</a><a class="button secondary" href="#library">Open Library</a></div></aside></section>`);
}

function library() {
  const label = state.status==='not_started'?'Start guided run':state.status==='in_progress'?'Continue station':'Open Review';
  const href = state.status==='finished'?'#review':'#station';
  return shell('library', `<section><div class="section-head"><p class="eyebrow">Library</p><h1>Choose the active station</h1></div><article class="route-card"><div class="route"><div><span>Phase</span><strong>${esc(data.tier)}</strong></div><div><span>Pattern</span><strong>${esc(data.pattern)}</strong></div><div><span>Station</span><strong>Station 001</strong></div></div><div class="station-summary"><div><p class="eyebrow">Active prototype</p><h2>${esc(data.title)}</h2><p>Six clinical beats, a cautious Safe Reasoning Guide, and a blind repeat after Review.</p><div class="pills"><span>2 min read</span><span>8 min run</span><span>6 beats</span></div></div><div class="actions"><a class="button primary" href="${href}">${esc(label)}</a><a class="button secondary" href="#journey">View Journey</a></div></div></article></section>`);
}

function reading() {
  return `<main id="app-main" class="station-shell"><header class="attempt-header"><div><p class="eyebrow">Station 001</p><h1>${esc(data.title)}</h1></div><span class="mode-pill">Reading</span>${timerBlock(data.reading_time.duration_seconds, Date.now(), 'Reading time')}</header><div class="reading-layout"><article class="station-card"><p class="eyebrow">Candidate information and tasks</p><h2>${esc(data.title)}</h2><p>${esc(data.visible_station_card.candidate_information)}</p><h3>Your tasks</h3><ol>${data.visible_station_card.tasks.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></article><aside class="reading-panel"><p class="eyebrow">Before entering</p><h2>Plan for danger, not certainty</h2><ul>${data.reading_time.prompts.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><button class="button primary" data-action="start">Start guided run</button></aside></div></main>`;
}

function cueCard(cue) {
  const groups = cue.groups ? `<div class="data-groups">${cue.groups.map(g=>`<section><h3>${esc(g.label)}</h3><ul>${g.items.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>`).join('')}</div>` : '';
  return `<section class="cue ${cue.type==='examiner'?'examiner':''}"><p class="speaker">${esc(cue.speaker)} ${cue.type==='patient'?'says':'gives'}</p><blockquote>${esc(cue.text)}</blockquote>${groups}</section>`;
}

function beat() {
  const item = data.guided_run.beats[state.beat];
  const blind = state.mode === 'blind';
  const progress = Math.round(((state.beat + 1) / data.guided_run.beats.length) * 100);
  return `<main id="app-main" class="station-shell"><header class="attempt-header"><div><p class="eyebrow">Station 001</p><h1>${esc(data.title)}</h1></div><span class="mode-pill">${blind?'Blind repeat':'Guided real run'}</span>${timerBlock(data.guided_run.duration_seconds,state.attemptStarted,'Time remaining')}</header><div class="progress"><span style="width:${progress}%"></span></div><section class="beat-grid">${cueCard(item.cue)}<div class="beat-side">${blind?`<section class="blind-card"><p class="eyebrow">Your turn</p><h2>${esc(item.title)}</h2><p>Respond aloud without seeing the guide or doctor wording.</p></section>`:`<section class="guide"><p class="eyebrow">Safe reasoning guide</p><ul>${item.safe_reasoning_guide.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section><section class="doctor-line"><p class="eyebrow">Doctor says</p><p>${esc(item.doctor_line)}</p></section><p class="instruction">${esc(item.instruction)}</p>`}<button class="button primary sticky-action" data-action="advance">${esc(item.action_label)}</button><p class="beat-count">Clinical beat ${state.beat+1} of ${data.guided_run.beats.length}</p></div></section></main>`;
}

function station() {
  if (state.status === 'not_started') return reading();
  if (state.status === 'in_progress') return beat();
  return `<main id="app-main" class="station-shell"><section class="finished-card"><p class="eyebrow">Station finished</p><h1>Review is open</h1><p>Compare your run with the safer road, repair one weak part, then test yourself without prompts.</p><div class="actions"><a class="button primary" href="#review">Open Review</a><a class="button secondary" href="#journey">View Journey</a></div></section></main>`;
}

function reflection(stage) {
  const choices = ['Yes','Not sure','Missed it'];
  return `<div class="reflection-list">${stage.questions.map((q,i)=>`<article><p>${esc(q)}</p><div>${choices.map(c=>`<button data-action="reflect" data-index="${i}" data-value="${c}" class="choice ${state.reflection[i]===c?'selected':''}">${c}</button>`).join('')}</div></article>`).join('')}</div>`;
}
function road(stage) { return `<div class="road-list">${stage.steps.map((s,i)=>`<article><span>${i+1}</span><div><h3>${esc(s.appeared)}</h3><p><strong>What changed:</strong> ${esc(s.changed)}</p><p><strong>Next safe move:</strong> ${esc(s.next)}</p></div></article>`).join('')}</div>`; }
function modelPlayer() {
  const item = data.guided_run.beats[state.modelBeat];
  return `<section class="model-player"><div class="model-head"><div><p class="eyebrow">Full real run</p><h3>${esc(item.title)}</h3></div><span>${state.modelBeat+1} / ${data.guided_run.beats.length}</span></div>${cueCard(item.cue)}<div class="model-line"><p class="eyebrow">Doctor</p><p>${esc(item.doctor_line)}</p></div><div class="model-controls"><button class="button secondary" data-action="model-prev" ${state.modelBeat===0?'disabled':''}>Previous beat</button><button class="button secondary" data-action="model-next" ${state.modelBeat===data.guided_run.beats.length-1?'disabled':''}>Next beat</button></div></section>`;
}
function practice(stage) {
  const selected = stage.weak_drills.find(d=>d.id===state.selectedDrill);
  let optional = '';
  if (state.optional==='what-if') optional = `<div class="optional-panel what-if">${stage.what_if_paths.map(x=>`<article><h3>${esc(x.question)}</h3><p>${esc(x.answer)}</p></article>`).join('')}</div>`;
  if (state.optional==='examiner') optional = `<div class="optional-panel practice-grid"><article><h3>Strong run</h3><ul>${stage.examiner_criteria.strong_run.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></article><article><h3>Unsafe run</h3><ul>${stage.examiner_criteria.unsafe_run.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></article><article><h3>Immediate management</h3><ul>${stage.immediate_management.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></article></div>`;
  return `<div class="practice-grid"><article><p class="eyebrow">See it</p><h3>Full real run</h3><p>Replay the consultation one clinical beat at a time.</p></article><article><p class="eyebrow">Practise it</p><h3>Repair one weak part</h3><p>Choose only the segment that needs work.</p></article><article><p class="eyebrow">Repeat it</p><h3>Test without prompts</h3><p>Hide the guide and doctor lines.</p><button class="button primary" data-action="blind">Start blind repeat</button></article></div>${modelPlayer()}<div class="drill-picker">${stage.weak_drills.map(d=>`<button data-action="drill" data-drill="${d.id}" class="${state.selectedDrill===d.id?'selected':''}">${esc(d.title)}</button>`).join('')}</div>${selected?`<div class="drill-view"><p class="eyebrow">Prompt</p><h3>${esc(selected.prompt)}</h3><p><strong>Safe model:</strong> ${esc(selected.model)}</p></div>`:''}<div class="optional"><p class="eyebrow">Explore more only when useful</p><div class="actions"><button class="button secondary" data-action="optional" data-view="what-if">What-if paths</button><button class="button secondary" data-action="optional" data-view="examiner">Detailed examiner view</button></div>${optional}</div>`;
}

function review() {
  if (!state.reviewUnlocked) return shell('review', `<article class="locked"><p class="eyebrow">Review locked</p><h1>Finish the station first</h1><p>Review opens only after the attempt is complete.</p><a class="button primary" href="#station">Go to Station</a></article>`);
  const stages = data.review.core_stages;
  const stage = stages[state.reviewStage];
  const body = stage.id==='safety-check'?reflection(stage):stage.id==='road-changed'?road(stage):practice(stage);
  return shell('review', `<section><div class="section-head"><p class="eyebrow">Review</p><h1>Learn only what changes the next run</h1></div><div class="review-layout"><nav class="review-rail">${stages.map((s,i)=>`<button data-action="stage" data-index="${i}" ${i===state.reviewStage?'aria-current="step"':''}>${i+1}. ${esc(s.title)}</button>`).join('')}</nav><article class="review-stage"><p class="eyebrow">Stage ${state.reviewStage+1} of ${stages.length}</p><h2>${esc(stage.title)}</h2><p>${esc(stage.purpose)}</p>${body}<div class="review-actions"><button class="button secondary" data-action="prev" ${state.reviewStage===0?'disabled':''}>Previous</button>${state.reviewStage<stages.length-1?'<button class="button primary" data-action="next">Next stage</button>':'<a class="button secondary" href="#journey">Open Journey</a>'}</div></article></div></section>`);
}

function journey() {
  let step = 1, status = 'Not started', reviewStatus = 'Locked', label = 'Start Station 001', href = '#station';
  if (state.status==='in_progress') { step=2; status=state.mode==='blind'?'Blind repeat in progress':'Guided run in progress'; label='Continue Station 001'; }
  if (state.status==='finished') { step=3; status='Finished'; reviewStatus=state.reviewStage===data.review.core_stages.length-1?'Core Review complete':'Review available'; label=reviewStatus==='Core Review complete'?'Open Review':'Continue Review'; href='#review'; }
  if (state.retry==='completed') step=4;
  const rows = [['Phase and pattern',`${data.journey_metadata.phase} · ${data.journey_metadata.pattern}`],['Station',status],['Review',reviewStatus],['Repeat',state.retry==='completed'?'Blind repeat completed':'Available after Review']];
  return shell('journey', `<section><div class="section-head"><p class="eyebrow">Journey</p><h1>Your current pathway</h1></div><div class="journey-grid"><article class="journey-card"><p class="eyebrow">Current target</p><h2>${esc(data.journey_metadata.confidence_target)}</h2><div class="path-list">${rows.map((r,i)=>`<div class="path-item"><span class="path-icon ${i+1<step?'done':i+1===step?'current':''}">${i+1<step?'✓':i+1}</span><div><strong>${esc(r[0])}</strong><span>${esc(r[1])}</span></div></div>`).join('')}</div></article><aside class="journey-card"><p class="eyebrow">Next useful move</p><h2>${esc(label)}</h2><p>One action only. Continue from the current point.</p><a class="button primary" href="${href}">${esc(label)}</a><button class="button quiet" data-action="reset">Reset prototype</button></aside></div></section>`);
}

function render() {
  clearInterval(timer);
  const r = route();
  const html = r==='home'?home():r==='library'?library():r==='station'?station():r==='review'?review():journey();
  document.getElementById('app').innerHTML = html;
  document.querySelectorAll('[data-action]').forEach(x=>x.addEventListener('click',act));
  const node = document.querySelector('[data-timer]');
  if (node) { const total=Number(node.dataset.total), start=Number(node.dataset.start||Date.now()); const tick=()=>node.textContent=format(remaining(start,total)); tick(); timer=setInterval(tick,1000); }
  document.title = `${r[0].toUpperCase()+r.slice(1)} · Clinical Pathway`;
}

function act(event) {
  const el = event.currentTarget, a = el.dataset.action;
  if (a==='start') return patch({status:'in_progress',mode:'guided',beat:0,attemptStarted:Date.now(),reviewUnlocked:false,reviewStage:0,retry:'not_set'});
  if (a==='advance') {
    if (state.beat < data.guided_run.beats.length-1) return patch({beat:state.beat+1});
    return patch({status:'finished',reviewUnlocked:true,retry:state.mode==='blind'?'completed':state.retry});
  }
  if (a==='reflect') { state.reflection={...state.reflection,[el.dataset.index]:el.dataset.value}; save(); return render(); }
  if (a==='stage') return patch({reviewStage:Number(el.dataset.index),optional:null});
  if (a==='prev') return patch({reviewStage:Math.max(0,state.reviewStage-1),optional:null});
  if (a==='next') return patch({reviewStage:Math.min(data.review.core_stages.length-1,state.reviewStage+1),optional:null});
  if (a==='model-prev') return patch({modelBeat:Math.max(0,state.modelBeat-1)});
  if (a==='model-next') return patch({modelBeat:Math.min(data.guided_run.beats.length-1,state.modelBeat+1)});
  if (a==='drill') return patch({selectedDrill:el.dataset.drill});
  if (a==='optional') return patch({optional:state.optional===el.dataset.view?null:el.dataset.view});
  if (a==='blind') { state={...state,status:'in_progress',mode:'blind',beat:0,attemptStarted:Date.now(),reviewUnlocked:true,retry:'planned'}; save(); location.hash='#station'; return render(); }
  if (a==='reset') { state={...initial}; save(); location.hash='#home'; return render(); }
}

async function init() {
  try {
    const response = await fetch(CASE_PATH,{cache:'no-store'});
    if (!response.ok) throw new Error(`Case data failed to load (${response.status})`);
    data = await response.json();
    window.addEventListener('hashchange',render);
    render();
  } catch (error) {
    document.getElementById('app').innerHTML = `<main class="shell"><article class="locked"><h1>Unable to load Case 001</h1><p>${esc(error.message)}</p><p>Run this site through a web server rather than opening index.html directly.</p></article></main>`;
  }
}

init();
