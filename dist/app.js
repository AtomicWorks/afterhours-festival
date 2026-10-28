'use strict';
const artists = [
 {id:'nyra',name:'NYRA VEX',country:'DE',genre:'Hypnotic techno',stage:'The Core',day:'23',start:'2027-07-23T22:00:00+02:00',end:'2027-07-23T23:30:00+02:00',bio:'Slow-burning tension. Razor-sharp release. Nyra Vex shapes deep, rolling techno into a room-sized pulse. An imagined selector for the moment the outside world falls away.'},
 {id:'phase',name:'PHASE/01',country:'UK',genre:'Electro / breaks',stage:'Static',day:'23',start:'2027-07-23T22:30:00+02:00',end:'2027-07-24T00:00:00+02:00',bio:'A crooked path through machine funk, restless percussion, and beautifully broken rhythms. PHASE/01 is the fictional side-channel transmission you didn’t know you were looking for.'},
 {id:'velour',name:'VELOUR',country:'FR',genre:'Deep house',stage:'The Core',day:'23',start:'2027-07-24T00:00:00+02:00',end:'2027-07-24T01:30:00+02:00',bio:'Velvet basslines and warm, looping grooves. Velour brings an imagined late-night house set that unfolds slowly and leaves room for everyone.'},
 {id:'soft',name:'SOFT SIGNAL',country:'JP',genre:'Ambient / live',stage:'Drift',day:'23',start:'2027-07-24T01:00:00+02:00',end:'2027-07-24T02:00:00+02:00',bio:'A fictional live project for the spaces between beats. Soft Signal builds luminous textures from patient loops, distant voices, and the feeling of first light.'},
 {id:'null',name:'NULL STATE',country:'DE',genre:'Industrial techno',stage:'The Core',day:'24',start:'2027-07-24T22:00:00+02:00',end:'2027-07-24T23:30:00+02:00',bio:'Hard-edged percussion with a human pulse. This imagined industrial techno project turns pressure into motion, with a set that moves from stark minimalism to full-body release.'},
 {id:'echo',name:'ECHO THEORY',country:'NL',genre:'UK garage / bass',stage:'Static',day:'24',start:'2027-07-24T23:00:00+02:00',end:'2027-07-25T00:30:00+02:00',bio:'Elastic bass and off-centre swing. Echo Theory is an invented meeting point between garage, dub, and the kind of rhythm that changes how you walk out of the room.'},
 {id:'after',name:'AFTERIMAGE',country:'DK',genre:'Melodic techno',stage:'The Core',day:'24',start:'2027-07-25T00:30:00+02:00',end:'2027-07-25T02:00:00+02:00',bio:'A slow rise into something expansive. Afterimage is a fictional melodic techno act built around long arcs, glimmering sequences, and shared moments on a dark floor.'},
 {id:'lune',name:'LUNE FIELD',country:'SE',genre:'Experimental / live',stage:'Drift',day:'24',start:'2027-07-25T01:00:00+02:00',end:'2027-07-25T02:30:00+02:00',bio:'The last light on the horizon. Lune Field’s imagined live performance folds organic textures and scattered rhythms into a gentle landing at the end of the night.'}
];
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const storageKey = 'afterhours-my-night-v1';
let selected = new Set();
try { const saved=JSON.parse(localStorage.getItem(storageKey)||'[]'); if(Array.isArray(saved)) selected=new Set(saved.filter(id=>artists.some(a=>a.id===id))); } catch {}
let dayFilter='all', nightDay='23', detailId=null, toastTimer;
const time = date => new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Berlin',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(date));
const nextDay = a => Number(time(a.start).slice(0,2))<6;
const timing = a => `${time(a.start)}—${time(a.end)}`;
const crosses = (a,b) => a.id!==b.id && new Date(a.start)<new Date(b.end) && new Date(b.start)<new Date(a.end);
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2600);}
function persist(){try{localStorage.setItem(storageKey,JSON.stringify([...selected]));}catch{toast('Saved for this visit. Browser storage is unavailable.');}}
function renderArtists(){
 const visible=artists.filter(a=>dayFilter==='all'||a.day===dayFilter);
 $('#artist-count').textContent=String(visible.length).padStart(2,'0');
 $('#artist-list').innerHTML=visible.map(a=>`<article class="artist-row"><span class="artist-number">${String(artists.indexOf(a)+1).padStart(2,'0')}</span><button class="artist-name" data-artist="${a.id}" aria-label="About ${a.name}">${a.name}<small>${a.country}</small></button><div class="artist-genre">${a.genre}<br>${a.stage}</div><div class="artist-time">${a.day==='23'?'FRI 23':'SAT 24'} · ${time(a.start)}${nextDay(a)?' +1':''}<span>${a.stage.toUpperCase()}</span></div><button class="add-artist ${selected.has(a.id)?'selected':''}" data-add="${a.id}" aria-pressed="${selected.has(a.id)}" aria-label="${selected.has(a.id)?'Remove':'Add'} ${a.name} ${selected.has(a.id)?'from':'to'} My night">${selected.has(a.id)?'✓':'+'}</button></article>`).join('');
}
function syncSelection(){
 $$('.count').forEach(el=>el.textContent=String(selected.size).padStart(2,'0'));
 $$('[data-add]').forEach(button=>{const a=artists.find(a=>a.id===button.dataset.add);const active=selected.has(a.id);button.classList.toggle('selected',active);button.setAttribute('aria-pressed',String(active));button.setAttribute('aria-label',`${active?'Remove':'Add'} ${a.name} ${active?'from':'to'} My night`);if(button.classList.contains('add-artist'))button.textContent=active?'✓':'+';else button.innerHTML=`${active?'Remove from':'Add to'} my night <span>${active?'−':'+'}</span>`;});
}
function toggleArtist(id){const a=artists.find(a=>a.id===id);if(!a)return;selected.has(id)?selected.delete(id):selected.add(id);persist();syncSelection();renderNight();toast(`${a.name} ${selected.has(id)?'added to':'removed from'} your night`);window.dispatchEvent(new Event('afterhours-pulse'));}
function renderNight(){
 const sets=artists.filter(a=>selected.has(a.id)&&a.day===nightDay).sort((a,b)=>new Date(a.start)-new Date(b.start));
 $('#clear-night').disabled=!selected.size;
 $('#night-list').innerHTML=sets.length?sets.map(a=>{const clashes=sets.filter(b=>crosses(a,b));const afterMidnight=Number(time(a.start).slice(0,2))<6;return `<article class="night-item"><div><span class="micro">${timing(a)}${afterMidnight?' · AFTER MIDNIGHT':''}</span><h3>${a.name}</h3><span class="micro">${a.stage.toUpperCase()} / ${a.genre.toUpperCase()}</span>${clashes.length?`<div class="overlap">↔ Overlaps with ${clashes.map(b=>b.name).join(', ')}</div>`:''}</div><button data-remove="${a.id}" aria-label="Remove ${a.name} from My night">−</button></article>`;}).join(''):`<div class="empty-night"><span class="empty-symbol" aria-hidden="true">✳</span><h3>YOUR NIGHT STARTS HERE.</h3><p>No artists saved for ${nightDay==='23'?'Friday':'Saturday'} yet.<br>Find a frequency that feels like you.</p><button class="button acid" id="browse-artists">Explore the lineup <span>↗</span></button></div>`;
}
function showDialog(selector){const dialog=$(selector);if(!dialog.open){dialog.showModal();document.body.style.overflow='hidden';}}
$$('dialog').forEach(dialog=>{dialog.addEventListener('close',()=>{if(!$$('dialog[open]').length)document.body.style.overflow='';});dialog.addEventListener('click',e=>{if(e.target===dialog){const b=dialog.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)dialog.close();}});});
document.addEventListener('click',event=>{
 const close=event.target.closest('[data-close]');if(close)close.closest('dialog').close();
 const night=event.target.closest('[data-night]');if(night){renderNight();showDialog('#night-dialog');}
 const add=event.target.closest('[data-add]');if(add)toggleArtist(add.dataset.add);
 const remove=event.target.closest('[data-remove]');if(remove){const id=remove.dataset.remove;const prev=artists.filter(a=>selected.has(a.id)&&a.day===nightDay);const index=prev.findIndex(a=>a.id===id);toggleArtist(id);const controls=$$('[data-remove]');(controls[Math.min(index,controls.length-1)]||$('#browse-artists')||$('#night-dialog [data-close]')).focus();}
 const filter=event.target.closest('[data-day]');if(filter){dayFilter=filter.dataset.day;$$('[data-day]').forEach(b=>{const active=b===filter;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});renderArtists();}
 const nd=event.target.closest('[data-night-day]');if(nd){nightDay=nd.dataset.nightDay;$$('[data-night-day]').forEach(b=>{b.classList.toggle('active',b===nd);b.setAttribute('aria-pressed',String(b===nd));});renderNight();}
 const artist=event.target.closest('[data-artist]');if(artist){detailId=artist.dataset.artist;const a=artists.find(a=>a.id===detailId);$('#artist-details').innerHTML=`<h2>${a.name}</h2><div class="artist-detail-meta">${a.genre.toUpperCase()} / ${a.country}</div><p>${a.bio}</p><div class="artist-detail-stage">${a.stage} · ${a.day==='23'?'Friday':'Saturday'} night</div><p>${new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Berlin',weekday:'short',day:'numeric',month:'short'}).format(new Date(a.start))} · ${timing(a)} CEST${a.start.slice(0,10)!==a.end.slice(0,10)?' (ends next day)':''}</p><button class="button acid" data-add="${a.id}"></button><p class="micro" style="margin-top:24px">FICTIONAL ARTIST / AFTERHOURS CONCEPT</p>`;syncSelection();showDialog('#artist-dialog');}
 if(event.target.closest('#browse-artists')){$('#night-dialog').close();$('#lineup').scrollIntoView();$('#lineup [data-day]').focus({preventScroll:true});}
});
$('#clear-night').addEventListener('click',()=>{selected.clear();persist();syncSelection();renderNight();$('#night-dialog [data-close]').focus();toast('Your night has been cleared');});
$('#pass-open').addEventListener('click',()=>showDialog('#pass-dialog'));
$('#pass-lineup').addEventListener('click',()=>{$('#pass-dialog').close();$('#lineup').scrollIntoView();$('#lineup [data-day]').focus({preventScroll:true});});
const audio=new Audio();audio.loop=true;audio.volume=.5;let audioUrl=null,audioContext=null,analyser=null,audioSource=null;
window.afterhoursAudio={analyser:null,playing:false};
$('#sound-open').addEventListener('click',()=>showDialog('#sound-dialog'));
function updateAudioUI(){const playing=!audio.paused;window.afterhoursAudio.playing=playing;$('#sound-label').textContent=playing?'Sound on':'Sound off';$('#sound-open').classList.toggle('playing',playing);$('#audio-toggle').textContent=audioUrl?(playing?'Pause sound':'Play sound'):'Load a track first';}
$('#audio-file').addEventListener('change',event=>{const file=event.target.files[0];if(!file)return;audio.pause();if(audioUrl)URL.revokeObjectURL(audioUrl);audioUrl=URL.createObjectURL(file);audio.src=audioUrl;$('#track-name').textContent=file.name;$('#audio-toggle').disabled=false;$('#audio-status').textContent='Track loaded. Press play when you’re ready.';updateAudioUI();});
$('#audio-toggle').addEventListener('click',async()=>{try{if(!audio.paused){audio.pause();return;}if(!audioContext){audioContext=new (window.AudioContext||window.webkitAudioContext)();analyser=audioContext.createAnalyser();analyser.fftSize=256;audioSource=audioContext.createMediaElementSource(audio);audioSource.connect(analyser);analyser.connect(audioContext.destination);window.afterhoursAudio.analyser=analyser;}await audioContext.resume();await audio.play();$('#audio-status').textContent='Playing locally. The sculpture is following your track.';}catch{$('#audio-status').textContent='This track could not play. Try an MP3, WAV, or another supported audio file.';}updateAudioUI();});
audio.addEventListener('play',updateAudioUI);audio.addEventListener('pause',updateAudioUI);audio.addEventListener('error',()=>{$('#audio-status').textContent='This file could not be decoded. Please choose another audio track.';updateAudioUI();});
$('#volume').addEventListener('input',event=>audio.volume=Number(event.target.value));
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');let pausedMotion=reducedMotion.matches;
window.afterhoursMotion={paused:pausedMotion};
function updateMotion(){window.afterhoursMotion.paused=pausedMotion;document.body.classList.toggle('motion-paused',pausedMotion);$('#motion-toggle').textContent=pausedMotion?'Resume motion':'Pause motion';$('#motion-toggle').setAttribute('aria-pressed',String(pausedMotion));window.dispatchEvent(new Event('afterhours-motion'));}
$('#motion-toggle').addEventListener('click',()=>{pausedMotion=!pausedMotion;updateMotion();});
reducedMotion.addEventListener('change',()=>{pausedMotion=reducedMotion.matches;updateMotion();});
if('IntersectionObserver' in window){document.documentElement.classList.add('js-reveals');const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');revealObserver.unobserve(entry.target);}}),{threshold:.08});$$('.reveal').forEach(el=>revealObserver.observe(el));}
renderArtists();syncSelection();renderNight();updateMotion();
