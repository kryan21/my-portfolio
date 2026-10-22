/* ═══ KRYAN PORTFOLIO — script.js (v10: smooth + stable) ═══ */
(function(){
'use strict';
var $=function(s,c){return (c||document).querySelector(s)};
var $$=function(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))};
function mq(q){try{return (typeof window.matchMedia==='function')?window.matchMedia(q).matches:false}catch(e){return false}}
var reduced=mq('(prefers-reduced-motion: reduce)');
var coarse=mq('(pointer:coarse)');
var WA_NUMBER='917321929869';

/* Shared scroll state — read once per scroll event, never from inside animation frames
   (reading scroll/layout after style writes forces layout and causes stutter). */
var curY=window.pageYOffset||0, maxScroll=0, scrollTarget=0;
function calcMax(){
  var h=document.documentElement;
  maxScroll=Math.max(0,h.scrollHeight-h.clientHeight);
}

/* Decode screenshots off the main thread so scrolling past them doesn't hitch */
$$('.wc-shot').forEach(function(img){ img.decoding='async'; });

/* ── Hero starts immediately (no welcome screen) ── */
var heroBooted=false;
function bootHero(){
  if(heroBooted) return; heroBooted=true;
  if(document.fonts && document.fonts.ready){
    var started=false;
    var go=function(){ if(!started){ started=true; startHero(); } };
    document.fonts.ready.then(go);
    setTimeout(go,500);
  }else{
    startHero();
  }
}

/* ── Hero intro (GSAP word rise — em kept as ONE unit, never split) ── */
var heroStarted=false, heroReady=false;
function markHeroReady(){
  if(heroReady) return; heroReady=true;
  document.body.classList.add('hero-ready');
  scheduleGalaxy(); /* build the WebGL galaxy only AFTER the intro, so the two never compete */
}
function startHero(){
  if(heroStarted) return; heroStarted=true;
  if(window.gsap && !reduced){
    /* y:0 clears the px offset parsed from the CSS transform, so yPercent is the only offset */
    gsap.set('.hero-title .wi',{y:0,yPercent:110});
    /* No clearProps here: removing inline transforms would snap elements back to their CSS start state. */
    gsap.timeline({onComplete:markHeroReady})
      .to('.hero-title .wi',{yPercent:0,duration:.85,stagger:.07,ease:'power4.out'},0)
      .fromTo('.hero .reveal',{opacity:0,y:22},{opacity:1,y:0,duration:.7,stagger:.08,ease:'power3.out'},.2);
    setTimeout(markHeroReady,2600); /* failsafe */
  }else{
    $$('.hero-title .wi').forEach(function(el){el.style.transform='none'});
    $$('.hero .reveal').forEach(function(el){el.style.opacity='1';el.style.transform='none'});
    markHeroReady();
  }
  startCounters();
}

/* ── Counters ── */
var countersDone=false;
function startCounters(){
  if(countersDone) return; countersDone=true;
  $$('[data-count]').forEach(function(el){
    var target=parseInt(el.getAttribute('data-count'),10)||0;
    if(reduced){el.textContent=target+'+';return}
    var obj={v:0};
    if(window.gsap){ gsap.to(obj,{v:target,duration:1.4,ease:'power2.out',onUpdate:function(){el.textContent=Math.round(obj.v)+'+'}}); }
    else{ el.textContent=target+'+'; }
  });
}

/* ── Smooth scrolling (Lenis, desktop wheel only — touch stays native) ── */
var lenis=null;
if(window.Lenis && !reduced){
  try{
    lenis=new Lenis({duration:1.05,easing:function(t){return Math.min(1,1.001-Math.pow(2,-10*t))},smoothWheel:true,syncTouch:false});
    if(window.gsap && window.ScrollTrigger){
      lenis.on('scroll',ScrollTrigger.update);
      gsap.ticker.add(function(time){ lenis.raf(time*1000); });
      gsap.ticker.lagSmoothing(0);
    }else{
      (function loop(t){ lenis.raf(t); requestAnimationFrame(loop); })(0);
    }
  }catch(e){ lenis=null; }
}
function scrollToTarget(href){
  var el=href==='#top'?null:$(href);
  if(href!=='#top'&&!el) return false;
  if(lenis){ lenis.scrollTo(el||0,{offset:el?-16:0,duration:1.1}); return true; }
  return false;
}
document.addEventListener('click',function(e){
  var a=e.target.closest&&e.target.closest('a[href^="#"]');
  if(!a) return;
  var href=a.getAttribute('href');
  if(!href||href==='#') return;
  if(scrollToTarget(href)) e.preventDefault();
});

/* ── Scroll progress + nav state (one rAF-throttled handler, no layout reads) ── */
var prog=$('#scrollProgress'), nav=$('#topNav');
var ticking=false;
function onScroll(){
  curY=window.pageYOffset||0;
  if(ticking) return; ticking=true;
  requestAnimationFrame(function(){
    ticking=false;
    var heroH=window.innerHeight||800;
    scrollTarget=Math.max(0,Math.min(1,curY/heroH));
    if(prog) prog.style.transform='scaleX('+(maxScroll>0?Math.min(1,curY/maxScroll):0)+')';
    if(nav) nav.classList.toggle('scrolled',curY>30);
  });
}
window.addEventListener('scroll',onScroll,{passive:true});
calcMax(); onScroll();
window.addEventListener('load',function(){
  calcMax(); onScroll();
  if(window.ScrollTrigger) ScrollTrigger.refresh();
});
(function(){
  var t=0;
  function later(){ clearTimeout(t); t=setTimeout(function(){ calcMax(); onScroll(); },150); }
  window.addEventListener('resize',later);
  if('ResizeObserver' in window){ try{ new ResizeObserver(later).observe(document.body); }catch(e){} }
})();

/* ── Mobile menu ── */
var burger=$('#burger'), mm=$('#mobileMenu');
function setMenu(open){
  mm.classList.toggle('open',open);
  burger.classList.toggle('open',open);
  burger.setAttribute('aria-expanded',open?'true':'false');
  document.body.classList.toggle('menu-open',open);
  if(lenis){ open?lenis.stop():lenis.start(); }
}
if(burger&&mm){
  burger.addEventListener('click',function(){ setMenu(!mm.classList.contains('open')); });
  $$('a',mm).forEach(function(a){a.addEventListener('click',function(){ setMenu(false); })});
}

/* ── Scroll reveals (ONE batched trigger set: fewer observers, grouped staggering, opacity + y only) ── */
if(window.gsap && window.ScrollTrigger && !reduced){
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ignoreMobileResize:true});

  var items=$$('.reveal').filter(function(el){ return !el.closest('.hero'); });
  ScrollTrigger.batch(items,{
    start:'top 94%', once:true, interval:.08, batchMax:8,
    onEnter:function(batch){
      batch.forEach(function(el){ el.classList.add('gs-anim'); });
      /* clearProps only clears transform — the CSS .reveal rule sets opacity only, so nothing snaps back */
      gsap.fromTo(batch,{opacity:0,y:30},{opacity:1,y:0,duration:.6,stagger:.07,ease:'power2.out',overwrite:true,clearProps:'transform',
        onComplete:function(){ batch.forEach(function(el){ el.classList.remove('gs-anim'); }); }});
    }
  });

  /* Hero: content simply lifts and fades as you leave the galaxy (no pin, so no scroll jump). */
  var heroSec=$('#heroSection');
  if(heroSec){
    gsap.to('.hero-content',{y:-40,opacity:.15,ease:'none',force3D:true,
      scrollTrigger:{trigger:heroSec,start:'top top',end:'bottom 25%',scrub:true}});
    gsap.to('.hero-glow',{opacity:.25,ease:'none',
      scrollTrigger:{trigger:heroSec,start:'top top',end:'bottom top',scrub:true}});
    gsap.to('.scroll-hint',{opacity:0,ease:'none',
      scrollTrigger:{trigger:heroSec,start:'top top',end:'20% top',scrub:true}});
  }
}else{
  var io=('IntersectionObserver' in window)?new IntersectionObserver(function(es){
    es.forEach(function(e){ if(e.isIntersecting){ e.target.style.opacity='1'; e.target.style.transform='none'; io.unobserve(e.target);} });
  },{threshold:.1}):null;
  $$('.reveal').forEach(function(el){
    if(el.closest('.hero')) return;
    if(io) io.observe(el); else {el.style.opacity='1';el.style.transform='none'}
  });
}

/* ── Marquee (time-based, pauses off-screen, leans with scroll speed — no DOM reads per frame) ── */
(function marquee(){
  var track=$('#marqueeTrack'), skewEl=$('#marqueeSkew'), wrap=$('.marquee'); if(!track) return;
  var set=track.querySelector('.marquee-set'); if(!set) return;
  var visible=true, x=0, w=0, last=0, lastY=curY, vel=0, lastSkew=0;
  function build(){
    w=set.getBoundingClientRect().width;
    if(!w||w<10){ setTimeout(build,300); return; }
    var need=Math.min(3,Math.max(1,Math.ceil((window.innerWidth*2)/w)));
    for(var i=1;i<need;i++){ track.appendChild(set.cloneNode(true)); }
    if(reduced) return;
    if(wrap&&'IntersectionObserver' in window){
      new IntersectionObserver(function(en){ visible=en[0].isIntersecting; },{threshold:0}).observe(wrap);
    }
    requestAnimationFrame(step);
  }
  function step(now){
    requestAnimationFrame(step);
    if(!last) last=now;
    var dt=Math.min(50,now-last); last=now;
    if(!visible||document.hidden) { lastY=curY; return; }
    x-=dt*.066; if(-x>=w) x+=w;
    track.style.transform='translate3d('+x.toFixed(2)+'px,0,0)';
    if(skewEl&&!coarse){
      var dy=curY-lastY; lastY=curY;
      vel+=(dy-vel)*.12;
      var s=Math.max(-8,Math.min(8,-vel*.22));
      if(Math.abs(s-lastSkew)>.03){
        lastSkew=s;
        skewEl.style.transform='skewX('+s.toFixed(2)+'deg)';
      }
    }
  }
  if(document.readyState==='complete') build(); else window.addEventListener('load',build);
})();

/* ── 3D tilt cards (rAF, smooth return on leave) ── */
if(mq('(hover:hover) and (pointer:fine)') && !reduced){
  $$('[data-tilt]').forEach(function(card){
    var raf=0, ex=0, ey=0;
    function apply(){
      raf=0;
      var r=card.getBoundingClientRect();
      var px=(ex-r.left)/r.width-.5, py=(ey-r.top)/r.height-.5;
      card.style.transform='perspective(1000px) rotateY('+(px*6)+'deg) rotateX('+(-py*6)+'deg) translateY(-3px)';
    }
    card.addEventListener('mouseenter',function(){ card.classList.add('tilting'); card.style.transition='border-color .25s'; });
    card.addEventListener('mousemove',function(e){ ex=e.clientX; ey=e.clientY; if(!raf) raf=requestAnimationFrame(apply); });
    card.addEventListener('mouseleave',function(){
      card.classList.remove('tilting');
      card.style.transition='transform .4s cubic-bezier(.2,.8,.2,1),border-color .25s';
      card.style.transform='';
    });
  });
}

/* ── Magnetic buttons ── */
if(mq('(hover:hover)') && !reduced){
  $$('.magnetic').forEach(function(btn){
    btn.addEventListener('mousemove',function(e){
      var r=btn.getBoundingClientRect();
      btn.style.transform='translate('+((e.clientX-r.left-r.width/2)*.18)+'px,'+((e.clientY-r.top-r.height/2)*.28)+'px)';
    });
    btn.addEventListener('mouseleave',function(){ btn.style.transform=''; });
  });
}

/* ── Work filters (instant swap + quick pop-in) ── */
var refreshQueued=false;
function queueRefresh(){
  if(refreshQueued) return; refreshQueued=true;
  requestAnimationFrame(function(){
    refreshQueued=false;
    calcMax();
    if(window.ScrollTrigger) ScrollTrigger.refresh();
  });
}
$$('.filter').forEach(function(btn){
  btn.addEventListener('click',function(){
    $$('.filter').forEach(function(b){b.classList.remove('active')});
    btn.classList.add('active');
    var f=btn.getAttribute('data-filter');
    $$('.work-card').forEach(function(card){
      var show=(f==='all'||card.getAttribute('data-cat')===f);
      if(show){
        card.classList.remove('hide');
        card.style.opacity='1';
        card.classList.remove('pop'); void card.offsetWidth; card.classList.add('pop');
      }else{
        card.classList.add('hide');
        card.classList.remove('pop');
      }
    });
    queueRefresh();
  });
});
$$('.work-card').forEach(function(card){
  card.addEventListener('animationend',function(){ card.classList.remove('pop'); });
});

/* ── Enquiry form → opens WhatsApp directly ── */
var form=$('#enquiryForm');
if(form){
  form.addEventListener('submit',function(e){
    e.preventDefault();
    var name=$('#fName').value.trim(), type=$('#fType').value, msg=$('#fMsg').value.trim();
    var err=$('#fError'), ok=$('#fOk');
    err.textContent=''; ok.textContent='';
    if(name.length<2){ err.textContent='Please add your name.'; return; }
    if(!type){ err.textContent='Please select your business type.'; return; }
    if(msg.length<10){ err.textContent='Tell me a little more about what you need (10+ characters).'; return; }
    var text='Hi KRYAN, I\'m '+name+'.\nBusiness type: '+type+'\nWhat I need: '+msg;
    var url='https://wa.me/'+WA_NUMBER+'?text='+encodeURIComponent(text);
    var win=null;
    try{ win=window.open(url,'_blank','noopener'); }catch(x){}
    if(!win){ window.location.href=url; }
    ok.textContent='Thanks, '+name.split(' ')[0]+' ✓ Opening WhatsApp with your message…';
    form.reset();
  });
}

/* ═══ WEBGL — blue-white spiral galaxy (lighter particle budget, built after the intro, faded in) ═══ */
var galaxyBooted=false;
function scheduleGalaxy(){
  if(galaxyBooted) return; galaxyBooted=true;
  var idle=window.requestIdleCallback||function(f){ return setTimeout(f,120); };
  idle(initGalaxy,{timeout:900});
}

/* Three.js (~600 KB) is fetched only now — after the intro — so it never blocks first paint. */
function loadThree(ok,fail){
  if(window.THREE){ ok(); return; }
  var s=document.createElement('script');
  s.src='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  s.async=true; s.onload=ok; s.onerror=fail;
  document.head.appendChild(s);
}
function initGalaxy(){
  var canvas=$('#webgl');
  if(!canvas) return;
  if(reduced){ canvas.style.display='none'; return; }
  loadThree(function(){ buildGalaxy(canvas); },function(){ canvas.classList.add('webgl-fallback'); }); /* CSS blue glow remains */
}
function buildGalaxy(canvas){
  if(!window.THREE){ canvas.classList.add('webgl-fallback'); return; }
  try{
    var isSmall=(window.innerWidth||1200)<760 || coarse;
    var renderer=new THREE.WebGLRenderer({canvas:canvas,alpha:true,antialias:false,powerPreference:isSmall?'default':'high-performance'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,isSmall?1.25:1.5));
    renderer.setClearColor(0x000000,0);
    var scene=new THREE.Scene();
    var camera=new THREE.PerspectiveCamera(45,1,.1,100);
    camera.position.set(0,1.7,6.4);

    var group=new THREE.Group();
    group.rotation.set(.62,0,.14); /* angled disc — the premium view */
    scene.add(group);

    /* A radial sprite turns every point into a soft circular particle. */
    function discTexture(size,stops){
      var c=document.createElement('canvas'); c.width=c.height=size;
      var g=c.getContext('2d');
      var grad=g.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);
      stops.forEach(function(stop){ grad.addColorStop(stop[0],stop[1]); });
      g.fillStyle=grad; g.fillRect(0,0,size,size);
      var tex=new THREE.CanvasTexture(c);
      tex.minFilter=THREE.LinearFilter;
      tex.magFilter=THREE.LinearFilter;
      tex.generateMipmaps=false;
      return tex;
    }
    var particleTexture=discTexture(64,[
      [0,'rgba(255,255,255,1)'],
      [.28,'rgba(255,255,255,.96)'],
      [.58,'rgba(191,224,255,.5)'],
      [1,'rgba(116,183,255,0)']
    ]);

    /* ── Spiral galaxy: white core, icy inner arms, blue outer arms ── */
    var COUNT=isSmall?9000:26000, RADIUS=5.4, BRANCHES=3, SPIN=1.15, RAND=.3, POWER=2.9;
    var positions=new Float32Array(COUNT*3), colors=new Float32Array(COUNT*3);
    var cCore=new THREE.Color(0xffffff), cIn=new THREE.Color(0xd8efff),
        cMid=new THREE.Color(0x74b7ff), cOut=new THREE.Color(0x2b4c9b), tmp=new THREE.Color();
    function jitter(pw,amp,r){ return Math.pow(Math.random(),pw)*(Math.random()<.5?1:-1)*amp*r; }
    for(var i=0;i<COUNT;i++){
      var r=Math.pow(Math.random(),1.7)*RADIUS;
      var branch=((i%BRANCHES)/BRANCHES)*Math.PI*2;
      var spinA=r*SPIN;
      var x=Math.cos(branch+spinA)*r + jitter(POWER,RAND,r);
      var z=Math.sin(branch+spinA)*r + jitter(POWER,RAND,r);
      var y=jitter(POWER,RAND*.55,r);
      positions[i*3]=x; positions[i*3+1]=y; positions[i*3+2]=z;
      var tMix=r/RADIUS;
      if(tMix<.28) tmp.copy(cCore).lerp(cIn,tMix/.28);
      else if(tMix<.68) tmp.copy(cIn).lerp(cMid,(tMix-.28)/.4);
      else tmp.copy(cMid).lerp(cOut,(tMix-.68)/.32);
      var roll=Math.random();
      if(roll>.993) tmp.set(0xff6b7a);       /* rare rose nebula */
      else if(roll>.968) tmp.set(0xffffff);  /* sparse brilliant stars */
      colors[i*3]=tmp.r; colors[i*3+1]=tmp.g; colors[i*3+2]=tmp.b;
    }
    var gGeo=new THREE.BufferGeometry();
    gGeo.setAttribute('position',new THREE.BufferAttribute(positions,3));
    gGeo.setAttribute('color',new THREE.BufferAttribute(colors,3));
    var galaxyMaterial=new THREE.PointsMaterial({
      size:isSmall?.07:.05, /* slightly larger points compensate for the lower count */
      map:particleTexture,
      sizeAttenuation:true,
      depthWrite:false,
      blending:THREE.AdditiveBlending,
      vertexColors:true,
      transparent:true,
      opacity:.96,
      alphaTest:.012
    });
    var galaxy=new THREE.Points(gGeo,galaxyMaterial);
    group.add(galaxy);

    /* ── Blue-white glowing core ── */
    var coreTexture=discTexture(128,[
      [0,'rgba(255,255,255,1)'],
      [.3,'rgba(191,224,255,.62)'],
      [.65,'rgba(80,140,255,.24)'],
      [1,'rgba(43,76,155,0)']
    ]);
    var core=new THREE.Sprite(new THREE.SpriteMaterial({map:coreTexture,depthWrite:false,blending:THREE.AdditiveBlending,transparent:true,opacity:.95}));
    core.scale.set(4.8,4.8,1);
    group.add(core);

    /* ── Distant circular stars for depth ── */
    var sCount=isSmall?200:500, sPos=new Float32Array(sCount*3);
    for(var j=0;j<sCount;j++){
      var th=Math.random()*Math.PI*2, ph=Math.acos(2*Math.random()-1), rr=13+Math.random()*22;
      sPos[j*3]=rr*Math.sin(ph)*Math.cos(th); sPos[j*3+1]=rr*Math.cos(ph)*.6; sPos[j*3+2]=rr*Math.sin(ph)*Math.sin(th);
    }
    var sGeo=new THREE.BufferGeometry();
    sGeo.setAttribute('position',new THREE.BufferAttribute(sPos,3));
    var stars=new THREE.Points(sGeo,new THREE.PointsMaterial({
      color:0xd8efff,
      size:isSmall?.085:.07,
      map:particleTexture,
      depthWrite:false,
      transparent:true,
      opacity:.78,
      alphaTest:.012
    }));
    scene.add(stars);

    var mx=0,my=0,tx=0,ty=0;
    if(!coarse){
      document.addEventListener('mousemove',function(e){ tx=(e.clientX/window.innerWidth-.5); ty=(e.clientY/window.innerHeight-.5); },{passive:true});
    }

    /* Only react to real width changes — mobile URL-bar show/hide must not resize the canvas mid-scroll. */
    var lastW=0, lastH=0, rzTimer=0;
    function resize(force){
      var w=canvas.clientWidth||window.innerWidth, h=canvas.clientHeight||window.innerHeight;
      if(!force && w===lastW && Math.abs(h-lastH)<120) return;
      lastW=w; lastH=h;
      renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix();
      group.position.x = w>1100 ? 1.15 : 0;
      group.position.y = w>1100 ? .1 : (isSmall?.55:.9);
    }
    window.addEventListener('resize',function(){ clearTimeout(rzTimer); rzTimer=setTimeout(function(){ resize(false); },120); });
    resize(true);

    var heroVisible=true;
    if('IntersectionObserver' in window){
      new IntersectionObserver(function(entries){ heroVisible=entries[0].isIntersecting; },{threshold:0}).observe(canvas);
    }

    var clock=new THREE.Clock(), sp=0, shown=false;
    (function animate(){
      requestAnimationFrame(animate);
      if(document.hidden||!heroVisible) return;
      var t=clock.getElapsedTime();
      sp+=(scrollTarget-sp)*.09; /* eased scroll value → silky zoom, no stepping */
      mx+=(tx-mx)*.04; my+=(ty-my)*.04;
      group.rotation.y=t*.055 + sp*2.1;
      galaxy.rotation.y=-t*.018;
      stars.rotation.y=t*.006;
      core.material.opacity=.85+Math.sin(t*1.4)*.1;
      camera.position.x=mx*.7;
      camera.position.y=1.7 - my*.5 - sp*.6;
      camera.position.z=6.4 - sp*2.1;
      camera.lookAt(0,0,0);
      renderer.render(scene,camera);
      if(!shown){ shown=true; canvas.classList.add('on'); } /* fade in only after the first frame is ready */
    })();
  }catch(err){ canvas.classList.add('webgl-fallback'); }
}

bootHero();
})();
