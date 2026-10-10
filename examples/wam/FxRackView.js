import {FxChainView} from './FxChainView.js';
import {t,localize,formatDb,applyTranslations,onLanguageChange} from './ui/i18n.js';
const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e;};
// Textes d'une bande d'entrée ou de sortie (A, ou B qui en est une copie) : clés + paramètre {lane},
// retraduits par applyTranslations au changement de langue.
const labelStrip=(panel,side,lane)=>{
  const set=(selector,keys)=>{const node=panel.querySelector(selector);if(node)localize(node,keys,{lane});};
  localize(panel,{ariaLabel:`rack.${side}`},{lane});set('strong',{text:`rack.${side}Title`});
  set('.fx-meter',{ariaLabel:`rack.${side}Level`});set('.fx-gain-reset',{text:'common.reset',ariaLabel:side==='input'?'rack.resetInput':'rack.resetOutput'});
  set('.fx-gain > span',{text:side==='input'?'rack.gain':'rack.volume'});set('.fx-gain input',{ariaLabel:side==='input'?'rack.inputGain':'rack.outputGain'});
  set('.fx-pan input',{ariaLabel:'rack.pan',title:'rack.panTitle'});
  set('[id^="inputChannelRow"] > span',{text:'rack.inputChannel'});
  set('select[id^="inputChannel"]',{title:'rack.inputChannel'});
};
export class FxRackView {
  constructor(rack,report){
    Object.assign(this,{rack,report});this.root=document.querySelector('.fx-rack');localize(this.root,{ariaLabel:'rack.chains'});
    const input=this.root.querySelector('.fx-input-strip'),output=this.root.querySelector('.fx-output-strip'),strip=document.querySelector('#fxChain');
    // Barre d'outils du rack : celle du HTML (#rackToolbar) si elle existe ; ses éléments de droite restent à droite.
    const header=document.getElementById('rackToolbar')||el('div','fx-rack-controls'),aside=header.querySelector('.rack-toolbar-aside'),put=(...nodes)=>aside?aside.before(...nodes):header.append(...nodes);
    this.toggle=el('button');this.toggle.id='toggleChains';this.toggle.setAttribute('aria-expanded','false');
    if(!header.contains(document.getElementById('enableLive')))put(document.getElementById('enableLive'));put(this.toggle);
    for(const id of ['inputDevice','outputDevice']){const label=document.getElementById(id).closest('label');label.className='fx-device-label';put(label);}
    output.querySelector('.fx-endpoint-routing').append(output.querySelector('#chainOutputReset'));
    this.status=el('span','fx-rack-status');put(this.status);if(!header.isConnected)this.root.before(header);
    this.left=el('div','fx-endpoints');this.right=el('div','fx-endpoints');
    const cell=panel=>{const c=el('div','fx-endpoint-cell');c.append(panel);return c;};this.left.append(cell(input));this.right.append(cell(output));
    this.scroller=el('div','fx-scroll');this.track=el('div','fx-track');this.scroller.append(this.track);this.track.append(strip);
    this.gutter=el('div','fx-route-gutter');this.track.append(this.gutter);
    this.bStrip=el('section','fx-chain');this.bStrip.id='fxChainB';localize(this.bStrip,{ariaLabel:'rack.effects'},{lane:'B'});this.track.append(this.bStrip);
    this.svg=document.createElementNS('http://www.w3.org/2000/svg','svg');this.svg.classList.add('fx-route-cable');this.svg.setAttribute('aria-hidden','true');this.track.append(this.svg);
    this.routeLabel=el('button','fx-route-label');this.routeLabel.hidden=true;this.gutter.append(this.routeLabel);
    this.routeLabel.onclick=()=>this.routeMenu(this.rack.route?.index||0,this.routeLabel,true);
    this.root.replaceChildren(this.left,this.scroller,this.right);
    labelStrip(input,'input','A');labelStrip(output,'output','A');
    this.inputB=input.cloneNode(true);this.outputB=output.cloneNode(true);
    const rename=(panel,side)=>{
      for(const node of panel.querySelectorAll('[id]')){
        const old=node.id;node.id=old==='inputChannelRow'?'inputChannelRowB':old==='inputChannel'?'inputChannelB':old.startsWith('sourceTrim')?old.replace('sourceTrim','sourceTrimB'):old.replace('chain','chainB');
      }
      labelStrip(panel,side,'B');
    };rename(this.inputB,'input');rename(this.outputB,'output');
    this.bLeft=cell(this.inputB);this.bRight=cell(this.outputB);this.left.append(this.bLeft);this.right.append(this.bRight);
    this.muteA=localize(el('button','fx-lane-enable'),{text:'rack.mute',ariaLabel:'rack.muteChain'},{lane:'A'});output.querySelector('.fx-endpoint-routing').append(this.muteA);
    this.enableB=localize(el('button','fx-lane-enable'),{text:'rack.mute',ariaLabel:'rack.muteChain'},{lane:'B'});this.outputB.querySelector('.fx-endpoint-routing').append(this.enableB);
    this.dialog=el('dialog','fx-confirm fx-routing-dialog');this.dialog.setAttribute('aria-labelledby','fxRouteTitle');document.body.append(this.dialog);
    this.aView=new FxChainView(rack.a,strip,report,{onRoute:(index,button)=>this.routeMenu(index,button),onLayout:()=>this.scheduleLayout(),onOpen:()=>this.bView?.close()});
    this.toggle.onclick=async()=>{
      this.toggle.disabled=true;this.toggle.textContent=t('common.loading');
      try{await this.act(()=>rack.setVisible(!rack.visible));}finally{this.toggle.disabled=false;this.renderChainToggle();}
    };
    this.enableB.onclick=()=>this.act(()=>rack.setEnabledB(!rack.enabledB));
    this.muteA.onclick=()=>this.act(()=>rack.setMutedA(!rack.mutedA));
    for(const [lane,id] of [['a','chainOutputPan'],['b','chainBOutputPan']]){
      const input=document.getElementById(id);
      input.oninput=()=>rack.setPan(lane,input.value);
      input.ondblclick=()=>rack.setPan(lane,0);
      input.onkeydown=event=>{if(event.key==='Home'){event.preventDefault();rack.setPan(lane,0);}};
    }
    this.inputB.querySelector('#inputChannelB').onchange=event=>this.act(()=>rack.setChannelB(Number(event.target.value)));
    this.inputB.querySelector('#sourceTrimB').oninput=event=>rack.setInputDbB(Number(event.target.value));
    this.inputB.querySelector('#chainBInputReset').onclick=()=>rack.setInputDbB(0);
    this.outputB.querySelector('#chainBOutputGain').oninput=event=>{rack.b.setOutputDb(Number(event.target.value));rack.changed();};
    this.outputB.querySelector('#chainBOutputReset').onclick=()=>{rack.b.setOutputDb(0);rack.changed();};
    rack.addEventListener('change',()=>this.render());rack.addEventListener('error',event=>report(event.detail.message,true));
    this.resize=new ResizeObserver(()=>this.scheduleLayout());this.resize.observe(this.root);this.scroller.addEventListener('scroll',()=>this.positionLabel());
    // Changement de langue : bandes A/B (data-i18n + {lane}), puis textes calculés et étiquette de routage.
    onLanguageChange(()=>{applyTranslations(this.root);applyTranslations(header);this.channelSignature=null;this.render();});
    this.render();this.tick();
  }
  async act(operation){try{await operation();}catch(error){this.report(error.message,true);}}
  renderChainToggle(){
    const two=this.rack.visible;
    this.toggle.replaceChildren('☷  ',el(two?'span':'strong','','1'),' / ',el(two?'strong':'span','','2'),' ',t('rack.chainsWord'));
    this.toggle.setAttribute('aria-label',t('rack.toggleLabel',{count:two?2:1}));
  }
  render(){
    const r=this.rack;
    if(!this.toggle.disabled)this.renderChainToggle();
    this.toggle.hidden=r.uiMode==='beginner';
    if(r.b&&!this.bView)this.bView=new FxChainView(r.b,this.bStrip,this.report,{secondary:true,meterPrefix:'chainB',onLayout:()=>this.scheduleLayout(),onOpen:()=>this.aView.close()});
    this.toggle.setAttribute('aria-expanded',String(r.visible));this.toggle.title=t(r.visible?'rack.hideB':'rack.showB');
    this.bLeft.hidden=this.bRight.hidden=this.bStrip.hidden=this.gutter.hidden=!r.activeB;
    this.inputB.style.visibility=r.route?'hidden':'visible';
    this.root.classList.toggle('has-chain-b',r.activeB);
    this.muteA.setAttribute('aria-pressed',String(r.mutedA));
    this.enableB.setAttribute('aria-pressed',String(!r.enabledB));
    this.status.textContent=t('rack.status',{mode:t(r.visible?(r.route?'rack.split':'rack.independent'):'rack.single'),mix:formatDb(r.mixDb)});
    const selector=this.inputB.querySelector('#inputChannelB'),aOptions=document.querySelector('#inputChannel').options;
    const options=[...aOptions].filter(o=>/^\d+$/.test(o.value));
    const signature=options.map(o=>o.value+o.textContent).join('|');
    if(signature!==this.channelSignature){this.channelSignature=signature;selector.replaceChildren(new Option(t('rack.selectInput'),'-1'),...options.map(o=>new Option(o.textContent,o.value)));}
    selector.value=options.some(o=>Number(o.value)===r.channelB)?String(r.channelB):'-1';
    selector.title=t(r.channelB===r.source.liveInput?.channelIndex?'rack.sharedInput':'rack.bInput');
    selector.disabled=r.source.mode==='file';this.inputB.querySelector('#inputChannelRowB').hidden=false;
    for(const [id,db] of [['sourceTrimB',r.inputDbB],['chainBOutputGain',r.b?.outputDb||0]]){
      const node=document.getElementById(id);node.value=db;node.setAttribute('aria-valuetext',formatDb(db));document.getElementById(id+'Value').textContent=formatDb(db);
    }
    document.querySelector('#chainOutputGain').value=r.a.outputDb;document.querySelector('#chainOutputGainValue').textContent=formatDb(r.a.outputDb);
    for(const [id,pan] of [['chainOutputPan',r.panA],['chainBOutputPan',r.panB]]){
      const input=document.getElementById(id),text=pan===0?'C':`${Math.round(Math.abs(pan)*100)}${pan<0?'L':'R'}`;
      input.value=pan;input.setAttribute('aria-valuetext',pan===0?t('rack.center'):t(pan<0?'rack.left':'rack.right',{value:Math.round(Math.abs(pan)*100)}));document.getElementById(id+'Value').textContent=text;
    }
    this.scheduleLayout();
  }
  scheduleLayout(){if(this.layoutQueued)return;this.layoutQueued=true;requestAnimationFrame(()=>{this.layoutQueued=false;this.layout();});}
  layout(){
    const route=this.preview||this.rack.route;
    const slots=this.aView.container.querySelectorAll('.fx-slot');
    for(const slot of slots){
      const button=slot.querySelector('.fx-route-action');if(!button)continue;
      const index=Number(slot.dataset.index);
      button.hidden=this.rack.activeB&&(index===this.rack.route?.index||index===this.preview?.index);
      if(button.hidden&&document.activeElement===button)slot.querySelector('.fx-add')?.focus();
    }
    this.inputB.style.visibility=route?'hidden':'visible';
    this.bStrip.style.paddingLeft='12px';this.svg.replaceChildren();this.routeLabel.hidden=!route||!this.rack.activeB;
    if(!route||!this.rack.activeB)return;
    const slot=slots[route.index];if(!slot)return;
    const offset=slot.offsetLeft-slots[0].offsetLeft;this.bStrip.style.paddingLeft=`${12+offset}px`;
    const x=slot.offsetLeft+slot.offsetWidth/2,y1=slot.offsetTop+slot.offsetHeight/2,y2=this.bStrip.offsetTop+this.bStrip.querySelector('.fx-slot').offsetTop+13;
    this.svg.setAttribute('width',String(this.track.scrollWidth));this.svg.setAttribute('height',String(this.track.scrollHeight));
    const path=document.createElementNS(this.svg.namespaceURI,'path');path.setAttribute('d',`M${x} ${y1+14} V${y2-20} l-5 -7 m5 7 l5 -7`);path.setAttribute('class',this.preview?'is-preview':'');this.svg.append(path);
    const previous=this.rack.a.entries[route.index-1];this.routeLabel.textContent=t('rack.route.label',{where:previous?t('rack.route.after',{name:previous.record?.name||previous.kind}):t('rack.route.beforeFirst'),mode:t(this.preview?'rack.route.preview':'rack.route.edit')});
    this.labelAnchor=x;this.positionLabel();
  }
  positionLabel(){if(this.routeLabel.hidden)return;const min=this.scroller.scrollLeft+8,max=min+this.scroller.clientWidth-this.routeLabel.offsetWidth-16;this.routeLabel.style.left=`${Math.max(min,Math.min(this.labelAnchor||0,max))}px`;}
  routeMenu(index,trigger,existing=false){
    if(!this.rack.activeB){this.report(t('rack.showBFirst'));return;}
    const order=this.rack.a.entries.map(e=>e.id).join('|');
    this.preview={index};this.layout();this.dialog.replaceChildren();
    const title=el('h3','',t(existing?'rack.route.title':this.rack.route?'rack.route.replace':'rack.route.split'));title.id='fxRouteTitle';
    const text=el('p','',t('rack.route.text'));
    const cancel=el('button','',t('rack.route.cancel')),connect=el('button','',t(existing?'rack.route.keep':'rack.route.connect'));
    const close=()=>{this.preview=null;this.dialog.close();this.layout();trigger?.focus();};
    cancel.onclick=close;this.dialog.oncancel=event=>{event.preventDefault();close();};
    connect.onclick=()=>{close();if(!existing){if(this.rack.a.entries.map(e=>e.id).join('|')!==order)return this.report(t('rack.changed'),true);this.act(()=>this.rack.connectRoute(index));}};
    this.dialog.append(title,text,cancel,connect);
    if(this.rack.route){const remove=el('button','',t('rack.route.remove'));remove.onclick=()=>{close();this.act(()=>this.rack.removeRoute());};this.dialog.append(remove);}
    if(existing){const show=el('button','',t('rack.route.show'));show.onclick=()=>{close();this.scroller.scrollTo({left:Math.max(0,(this.labelAnchor||0)-this.scroller.clientWidth/2),behavior:'smooth'});};this.dialog.append(show);}
    this.dialog.showModal();cancel.focus();
  }
  close(){this.aView.close();this.bView?.close();}
  tick(){
    if(!document.hidden){const value=this.rack.meter.read();if(value.peak>=1)this.clipUntil=performance.now()+1000;this.status.classList.toggle('is-clipping',performance.now()<(this.clipUntil||0));this.status.title=performance.now()<(this.clipUntil||0)?t('rack.clipping'):t('rack.level',{value:formatDb(value.db,{unit:'dBFS'})});}
    this.timer=setTimeout(()=>this.tick(),100);
  }
}
