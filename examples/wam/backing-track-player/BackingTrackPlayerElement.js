import {BackingTrackEngine} from './BackingTrackEngine.js';
import {BackingTrackLibrary} from './BackingTrackLibrary.js';
import {t,formatDb,applyTranslations,onLanguageChange} from '../ui/i18n.js';
import {localizeMessage} from '../ui/hostMessages.js';
const time=s=>`${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`;
export class BackingTrackPlayerElement extends HTMLElement {
 constructor(){super();this.attachShadow({mode:'open'});this.shadowRoot.innerHTML=`
 <link rel="stylesheet" href="${new URL('./backing-track-player.css',import.meta.url)}">
 <section aria-label="Backing track player" data-i18n-aria-label="player.section"><button id="expand" aria-expanded="true" aria-controls="transport status body"><span id="expandIcon" aria-hidden="true">▾</span> <span data-i18n="player.toggle">Backing tracks</span></button><header id="transport"><strong id="title" data-i18n="player.choose">Choose a backing track</strong><button id="play" aria-label="Play backing track" data-i18n-aria-label="player.play">▶</button><button id="stop" aria-label="Stop backing track" data-i18n-aria-label="player.stop">■</button><label class="volume"><span data-i18n="player.volume">Volume</span> <input id="volume" type="range" min="-60" max="6" step=".5" value="-12"><output id="volumeValue">−12 dB</output></label><button id="mute" aria-pressed="false" data-i18n="player.mute">Mute</button><span id="mixMeter" role="meter" aria-label="Combined output level" data-i18n-aria-label="player.mixLevel" aria-valuemin="-60" aria-valuemax="0" aria-valuenow="-60"><i></i></span></header>
 <div id="status" role="status" aria-live="polite">Loading library…</div>
 <div id="body"><div class="library"><div class="library-head"><span id="count" data-i18n="player.library">Library</span><button id="import" data-i18n="player.import">Import audio…</button></div><input id="filter" type="search" placeholder="Filter tracks" aria-label="Filter backing tracks" data-i18n-placeholder="player.filter" data-i18n-aria-label="player.filterLabel"><div id="list" role="group" aria-label="Backing tracks" data-i18n-aria-label="player.list"></div></div>
 <div class="track-main"><div class="wave-container"><div id="wave" tabindex="0" role="slider" aria-label="Position in backing track" data-i18n-aria-label="player.position" aria-valuemin="0" aria-valuemax="0" aria-valuenow="0"><canvas></canvas><div id="region"></div><div id="head"></div><span id="clock">0:00 / 0:00</span><span class="hint" data-i18n="player.hint">Click to seek · Drag to loop · Drop audio</span></div><div id="loadProgress" hidden><div id="loadRing" role="progressbar" aria-label="Audio download" data-i18n-aria-label="player.download" aria-valuemin="0" aria-valuemax="100"><svg viewBox="0 0 80 80" aria-hidden="true"><circle class="load-track" cx="40" cy="40" r="33"/><circle id="loadArc" cx="40" cy="40" r="33" pathLength="100"/></svg><strong id="loadPercent">0%</strong></div><span id="loadPhase" data-i18n="player.downloading">Downloading…</span></div></div>
 <div class="tools"><label><span data-i18n="player.speed">Speed</span> <output id="rateValue">100%</output><input id="rate" type="range" min=".7" max="1.3" step=".01" value="1" disabled><button id="rateReset" data-i18n="player.reset">Reset</button></label>
 <label><span data-i18n="player.guitarPan">Guitar global pan</span> <output id="panValue">C</output><input id="pan" type="range" min="-1" max="1" step=".01" value="0"><button id="panReset" data-i18n="player.reset">Reset</button></label>
 <label><span data-i18n="player.balance">Guitar ↔ Backing</span> <output id="balanceValue">50 / 50</output><input id="balance" type="range" min="0" max="1" step=".01" value=".5"><button id="balanceReset" data-i18n="player.reset">Reset</button></label>
 <div class="loop"><label><input id="loop" type="checkbox" checked> <span data-i18n="player.loop">Loop</span></label><label>A <input id="a" type="number" min="0" step=".01" value="0" aria-label="Loop start seconds" data-i18n-aria-label="player.loopStart"></label><label>B <input id="b" type="number" min="0" step=".01" value="0" aria-label="Loop end seconds" data-i18n-aria-label="player.loopEnd"></label><button id="full" data-i18n="player.full">Full track</button></div>
 <div><button id="normalize" aria-pressed="false" data-i18n="player.normalize">Normalize</button><label><input id="auto" type="checkbox" checked> <span data-i18n="player.atLoad">at load</span></label></div></div></div></div>
 <input id="file" type="file" accept="audio/*,.mp3,.wav,.ogg,.m4a,.flac" hidden></section>`;
 this.$=id=>this.shadowRoot.getElementById(id);this.observer=new ResizeObserver(()=>this.draw());
 // Textes : data-i18n* du gabarit + ce que calcule sync()/renderList()/status() (retraduit au changement de langue).
 applyTranslations(this.shadowRoot);this.status(()=>t('player.loadingLibrary'));
 this.stopLanguage=onLanguageChange(()=>{applyTranslations(this.shadowRoot);this.renderStatus();this.relabelProgress();if(this.engine){this.sync();this.renderList();}});
 }
 async initialize({audioContext,library=new BackingTrackLibrary()}){
  if(this.engine)throw Error('Player already initialized');this.library=library;this.engine=new BackingTrackEngine(audioContext,library);this.listeners=new AbortController();
  for(const type of ['track-change','transport-change','load-progress','mix-change','guitar-pan-change','player-error'])this.engine.addEventListener(type,event=>{
   if(type==='track-change'){this.draw();this.renderList();this.status('');}
   if(type==='load-progress'){
    const d=event.detail,complete=d.phase==='decode'||d.phase==='ready';
    const percent=complete?100:d.progress==null?null:Math.round(d.progress*100);
    this.$('loadArc').style.strokeDashoffset=String(100-(percent??0));
    this.$('loadPercent').textContent=percent==null?'…':`${percent}%`;
    if(percent==null)this.$('loadRing').removeAttribute('aria-valuenow');else this.$('loadRing').setAttribute('aria-valuenow',String(percent));
    this.progress={...d,percent};this.relabelProgress();
    this.status(()=>d.error?t('player.loadFailed',{detail:localizeMessage(d.error)}):d.phase==='ready'?'':d.phase==='decode'?t('player.preparingTitle',{title:d.title}):percent==null?t('player.loadingTitle',{title:d.title}):t('player.loadingPercent',{title:d.title,percent}),!!d.error);
   }
   if(type==='player-error')this.status(()=>localizeMessage(event.detail.message),true);
   this.sync();this.dispatchEvent(new CustomEvent(type,{detail:event.detail,bubbles:true,composed:true}));
  },{signal:this.listeners.signal});
  this.bind();await this.engine.initialize();
  try{await library.list();this.renderList();if(this.engine.stretchReady)this.status(()=>t('player.ready'));}catch(error){this.status(()=>localizeMessage(error.message),true);}
  this.sync();this.startAnimation();return this;
 }
 /** message : texte, ou fonction qui le recalcule (retraduit au changement de langue). */
 status(message,error=false){this.statusText=message;this.$('status').classList.toggle('error',error);this.renderStatus();}
 renderStatus(){this.$('status').textContent=typeof this.statusText==='function'?this.statusText():this.statusText??'';}
 relabelProgress(){const d=this.progress;if(d)this.$('loadPhase').textContent=t(d.phase==='decode'?'player.preparing':'player.downloading');}
 act(operation){return Promise.resolve().then(operation).catch(error=>{this.status(()=>localizeMessage(error.message),true);this.sync();this.dispatchEvent(new CustomEvent('player-error',{detail:{message:error.message},bubbles:true,composed:true}));});}
 bind(){
  const e=this.engine,on=(id,event,fn)=>this.$(id).addEventListener(event,()=>this.act(fn),{signal:this.listeners.signal});
  on('play','click',()=>e.playing?e.pause():e.play());on('stop','click',()=>e.stop());
  on('expand','click',()=>{const hide=!this.$('body').hidden;this.$('body').hidden=hide;this.$('transport').hidden=hide;this.$('status').hidden=hide;this.$('expand').setAttribute('aria-expanded',String(!hide));this.$('expandIcon').textContent=hide?'▸':'▾';this.sync();if(!hide)this.draw();});
  on('volume','input',()=>e.setVolumeDb(this.$('volume').value));on('mute','click',()=>e.setMuted(!e.muted));
  for(const [id,setter,reset] of [['rate','setRate',1],['pan','setGuitarPan',0],['balance','setMix',.5]]){on(id,'input',()=>e[setter](this.$(id).value));on(id+'Reset','click',()=>e[setter](reset));}
  for(const id of ['loop','a','b'])on(id,'change',()=>e.setLoop({enabled:this.$('loop').checked,startSeconds:this.$('a').value,endSeconds:this.$('b').value}));
  on('full','click',()=>e.setLoop({startSeconds:0,endSeconds:e.duration}));on('normalize','click',()=>e.setNormalized(!e.normalized));on('auto','change',()=>{e.autoNormalize=this.$('auto').checked;e.changed();});
  on('filter','input',()=>this.renderList());on('import','click',()=>this.$('file').click());on('file','change',()=>{const file=this.$('file').files[0];this.$('file').value='';return file&&e.loadFile(file);});
  const wave=this.$('wave'),coordinate=event=>Math.max(0,Math.min(1,(event.clientX-wave.getBoundingClientRect().left)/wave.clientWidth))*e.duration;
  wave.addEventListener('pointerdown',event=>{if(e.loading||event.button!==0||!e.buffer)return;this.drag={x:event.clientX,start:coordinate(event),end:coordinate(event)};wave.setPointerCapture(event.pointerId);});
  wave.addEventListener('pointermove',event=>{if(this.drag){this.drag.end=coordinate(event);this.updateRegion(this.drag.start,this.drag.end);}});
  wave.addEventListener('pointerup',event=>{if(e.loading||!this.drag)return;const drag=this.drag;this.drag=null;this.act(()=>Math.abs(event.clientX-drag.x)<5?e.seek(coordinate(event)):e.setLoop({enabled:true,startSeconds:drag.start,endSeconds:drag.end}));});
  wave.addEventListener('pointercancel',()=>{this.drag=null;this.sync();});
  wave.addEventListener('keydown',event=>{if(e.loading)return;if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();this.act(()=>e.seek(event.key==='Home'?0:event.key==='End'?e.duration:e.position+(event.key==='ArrowRight'?1:-1)));}});
  for(const type of ['dragover','drop'])wave.addEventListener(type,event=>{event.preventDefault();if(e.loading)return;if(type==='drop'&&event.dataTransfer.files[0])this.act(()=>e.loadFile(event.dataTransfer.files[0]));});
 }
 renderList(){const query=this.$('filter').value.toLocaleLowerCase();const tracks=[...(this.engine.track?.local?[this.engine.track]:[]),...this.library.tracks];this.$('count').textContent=t('player.tracks',{count:tracks.length});this.$('list').replaceChildren();
  for(const track of tracks.filter(t=>t.title.toLocaleLowerCase().includes(query))){const button=document.createElement('button');button.textContent=track.title;button.title=track.title;button.setAttribute('aria-pressed',String(track.id===this.engine.track?.id));button.onclick=()=>this.act(()=>track.local?this.engine.seek(0):this.engine.loadTrack(track.id));this.$('list').append(button);}
 }
 sync(){const e=this.engine;if(!e)return;this.$('title').textContent=e.track?.title||t('player.choose');this.$('play').textContent=e.playing?'Ⅱ':'▶';this.$('play').setAttribute('aria-label',t(e.playing?'player.pause':'player.play'));this.$('play').disabled=!!e.loading||!e.buffer;this.$('loadProgress').hidden=!e.loading||this.$('transport').hidden;this.$('transport').setAttribute('aria-busy',String(!!e.loading));this.$('wave').inert=!!e.loading;this.$('wave').setAttribute('aria-disabled',String(!!e.loading));if(e.loading)this.drag=null;this.$('stop').disabled=!e.buffer;
  for(const [id,value]of [['volume',e.volumeDb],['rate',e.rate],['pan',e.guitarPan],['balance',e.mix],['a',e.loop.startSeconds],['b',e.loop.endSeconds]])if(this.shadowRoot.activeElement!==this.$(id))this.$(id).value=value;
  this.$('rate').disabled=!e.stretchReady;this.$('rateReset').disabled=!e.stretchReady;this.$('rateValue').textContent=`${Math.round(e.rate*100)}%`;this.$('volumeValue').textContent=formatDb(e.volumeDb);this.$('panValue').textContent=Math.abs(e.guitarPan)<.01?'C':`${e.guitarPan<0?'L':'R'} ${Math.round(Math.abs(e.guitarPan)*100)}`;this.$('balanceValue').textContent=`${Math.round((1-e.mix)*100)} / ${Math.round(e.mix*100)}`;
  this.$('loop').checked=e.loop.enabled;this.$('auto').checked=e.autoNormalize;this.$('normalize').setAttribute('aria-pressed',String(e.normalized));this.$('mute').setAttribute('aria-pressed',String(e.muted));this.$('wave').setAttribute('aria-valuemax',e.duration);this.updateRegion(e.loop.startSeconds,e.loop.endSeconds);
 }
 updateRegion(a,b){const duration=this.engine.duration||1;this.$('region').style.left=`${Math.min(a,b)/duration*100}%`;this.$('region').style.width=`${Math.abs(b-a)/duration*100}%`;this.$('region').style.opacity=this.engine.loop.enabled||this.drag?'1':'.2';}
 draw(){const canvas=this.shadowRoot.querySelector('canvas'),width=this.$('wave').clientWidth,height=this.$('wave').clientHeight;if(!width||!height)return;const dpr=globalThis.devicePixelRatio||1;canvas.width=width*dpr;canvas.height=height*dpr;const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);ctx.clearRect(0,0,width,height);const buffer=this.engine?.buffer;if(!buffer)return;const data=buffer.getChannelData(0),step=Math.ceil(data.length/width);ctx.fillStyle=getComputedStyle(this).getPropertyValue('--bt-wave').trim()||'#8fbfb6';for(let x=0;x<width;x++){let low=1,high=-1;for(let i=x*step;i<Math.min(data.length,(x+1)*step);i++){low=Math.min(low,data[i]);high=Math.max(high,data[i]);}ctx.fillRect(x,(1-high)*height/2,1,Math.max(1,(high-low)*height/2));}}
 startAnimation(){if(this.frame||!this.isConnected||this.destroyed)return;const animate=()=>{if(!document.hidden&&this.engine){const e=this.engine;this.$('clock').textContent=`${time(e.position)} / ${time(e.duration)}`;this.$('head').style.left=`${e.position/(e.duration||1)*100}%`;this.$('wave').setAttribute('aria-valuenow',e.position.toFixed(2));if(this.readMixLevel){const value=this.readMixLevel();this.$('mixMeter').style.setProperty('--level',value.level);this.$('mixMeter').setAttribute('aria-valuenow',Math.max(-60,Math.min(0,value.db)).toFixed(1));if(value.peak>=1)this.clipUntil=performance.now()+1000;this.$('mixMeter').classList.toggle('clip',performance.now()<this.clipUntil);}}this.frame=requestAnimationFrame(animate);};this.frame=requestAnimationFrame(animate);}
 connectedCallback(){this.observer.observe(this.$('wave'));this.startAnimation();}
 disconnectedCallback(){this.observer.disconnect();cancelAnimationFrame(this.frame);this.frame=null;}
 getState(){return this.engine.getState();}setState(state){return this.engine.setState(state);}
 destroy(){this.destroyed=true;this.stopLanguage?.();this.disconnectedCallback();this.listeners?.abort();this.engine?.destroy();}
}
if(!customElements.get('backing-track-player'))customElements.define('backing-track-player',BackingTrackPlayerElement);
