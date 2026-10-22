/* ═══ KRYAN PORTFOLIO — script.js ═══ */
(function(){
'use strict';
var $=function(s,c){return (c||document).querySelector(s)};
var $$=function(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))};
function mq(q){try{return (typeof window.matchMedia==='function')?window.matchMedia(q).matches:false}catch(e){return false}}
var reduced=mq('(prefers-reduced-motion: reduce)');

/* ── Hero starts immediately (no welcome screen) ── */
var heroBooted=false;
function bootHero(){
  if(heroBooted) return; heroBooted=true;
  if(document.fonts && document.fonts.ready){
    var started=false;
    var go=function(){ if(!started){ started=true; startHero(); } };
    document.fonts.ready.then(go);
    setTimeout(go,700);
  }else{
    startHero();
  }
}

/* ── Hero intro (GSAP word rise — em kept as ONE unit, never split) ── */
var heroStarted=false;
function markHeroReady(){ document.body.classList.add('hero-ready'); }
function startHero(){
  if(heroStarted) return; heroStarted=true;
  if(window.gsap && !reduced){
    gsap.to('.hero-title .wi',{y:0,duration:1.05,stagger:.09,ease:'power4.out',clearProps:'transform,opacity,visibility',onComplete:markHeroReady});
    gsap.fromTo('.hero .reveal',{opacity:0,y:26},{opacity:1,y:0,duration:.9,stagger:.1,delay:.25,ease:'power3.out',clearProps:'all'});
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
    if(window.gsap){ gsap.to(obj,{v:target,duration:1.6,ease:'power2.out',onUpdate:function(){el.textContent=Math.round(obj.v)+'+'}}); }
    else{ el.textContent=target+'+'; }
  });
}

/* ── Scroll progress + nav state ── */
var prog=$('#scrollProgress'), nav=$('#topNav');
window.__scrollP=0;
window.addEventListener('scroll',function(){
  var h=document.documentElement;
  var heroH=window.innerHeight||800;
  window.__scrollP=Math.max(0,Math.min(1,(h.scrollTop||window.scrollY||0)/heroH));
  var max=h.scrollHeight-h.clientHeight;
  if(prog) prog.style.width=(max>0?(h.scrollTop/max)*100:0)+'%';
  if(nav) nav.classList.toggle('scrolled',h.scrollTop>30);
},{passive:true});

/* ── Mobile menu ── */
var burger=$('#burger'), mm=$('#mobileMenu');
if(burger&&mm){
  burger.addEventListener('click',function(){mm.classList.toggle('open')});
  $$('a',mm).forEach(function(a){a.addEventListener('click',function(){mm.classList.remove('open')})});
}

/* ── Scroll reveals ── */
if(window.gsap && window.ScrollTrigger && !reduced){
  gsap.registerPlugin(ScrollTrigger);
  $$('.reveal').forEach(function(el){
    if(el.closest('.hero')) return;
    if(el.classList.contains('work-card')||el.classList.contains('ind-card')||el.classList.contains('svc-card')) return;
    gsap.fromTo(el,{opacity:0,y:36},{opacity:1,y:0,duration:.95,ease:'power3.out',clearProps:'transform',
      scrollTrigger:{trigger:el,start:'top 88%',once:true}});
  });

  /* ═══ PREMIUM SCROLL 3D ═══ */
  /* (a) Pinned hero: as you scroll, content lifts away and the galaxy zooms in. */
  var heroSec=$('#heroSection');
  var canPinHero=(window.innerWidth||0)>=760 && !mq('(pointer:coarse)');
  if(heroSec && canPinHero){
    /* Keep the words on their natural grid: fade/lift only. The galaxy zoom is
       handled by the WebGL camera, never by scaling text or the canvas. */
    var pinTl=gsap.timeline({scrollTrigger:{trigger:heroSec,start:'top top',end:'+=72%',scrub:1,pin:true,anticipatePin:1}});
    pinTl.to('.hero-content',{y:-30,opacity:.22,ease:'none'},0)
         .to('.hero-glow',{opacity:.3,ease:'none'},0)
         .to('.scroll-hint',{opacity:0,ease:'none'},0);
  }else if(heroSec){
    gsap.to('.hero-content',{opacity:.3,ease:'none',scrollTrigger:{trigger:heroSec,start:'top top',end:'bottom top',scrub:1}});
  }
  /* (b) 3D entrances: cards unfold out of the screen in perspective as they arrive. */
  $$('.work-card,.ind-card,.svc-card').forEach(function(card,i){
    gsap.fromTo(card,{opacity:0,y:90,rotateX:26,transformPerspective:1100,transformOrigin:'50% 100%'},
      {opacity:1,y:0,rotateX:0,duration:1.05,ease:'power3.out',delay:(i%3)*.09,clearProps:'transform',
       scrollTrigger:{trigger:card,start:'top 92%',once:true}});
  });
  /* (c) Marquee leans with scroll velocity — small, expensive-feeling detail. */
  var mTrack=$('#marqueeTrack');
  if(mTrack){
    ScrollTrigger.create({onUpdate:function(self){
      var v=gsap.utils.clamp(-14,14,self.getVelocity()/-260);
      gsap.to(mTrack,{skewX:v,duration:.35,ease:'power2.out',overwrite:'auto'});
      gsap.to(mTrack,{skewX:0,duration:.7,delay:.35,ease:'power2.out',overwrite:false});
    }});
  }
}else{
  var io=('IntersectionObserver' in window)?new IntersectionObserver(function(es){
    es.forEach(function(e){ if(e.isIntersecting){ e.target.style.opacity='1'; e.target.style.transform='none'; io.unobserve(e.target);} });
  },{threshold:.12}):null;
  $$('.reveal').forEach(function(el){
    if(el.closest('.hero')) return;
    if(io) io.observe(el); else {el.style.opacity='1';el.style.transform='none'}
  });
}

/* ── Marquee (guarded clone — max 3 sets, never loops on 0 width) ── */
(function marquee(){
  var track=$('#marqueeTrack'); if(!track) return;
  var set=track.querySelector('.marquee-set'); if(!set) return;
  function build(){
    var w=set.getBoundingClientRect().width;
    if(!w||w<10){ setTimeout(build,300); return; }
    var need=Math.min(3,Math.max(1,Math.ceil((window.innerWidth*2)/w)));
    for(var i=1;i<need;i++){ track.appendChild(set.cloneNode(true)); }
    animate(w);
  }
  var x=0;
  function animate(w){
    if(reduced) return;
    (function step(){
      x-=1.1; if(-x>=w) x+=w;
      track.style.transform='translateX('+x+'px)';
      requestAnimationFrame(step);
    })();
  }
  if(document.readyState==='complete') build(); else window.addEventListener('load',build);
})();

/* ── 3D tilt cards ── */
if(mq('(hover:hover) and (pointer:fine)') && !reduced){
  $$('[data-tilt]').forEach(function(card){
    card.addEventListener('mousemove',function(e){
      var r=card.getBoundingClientRect();
      var px=(e.clientX-r.left)/r.width-.5, py=(e.clientY-r.top)/r.height-.5;
      card.style.transform='perspective(1000px) rotateY('+(px*7)+'deg) rotateX('+(-py*7)+'deg) translateY(-3px)';
    });
    card.addEventListener('mouseleave',function(){ card.style.transform=''; });
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

/* ── Work filters ── */
$$('.filter').forEach(function(btn){
  btn.addEventListener('click',function(){
    $$('.filter').forEach(function(b){b.classList.remove('active')});
    btn.classList.add('active');
    var f=btn.getAttribute('data-filter');
    $$('.work-card').forEach(function(card){
      var show=(f==='all'||card.getAttribute('data-cat')===f);
      card.classList.toggle('hide',!show);
    });
  });
});

/* ── Enquiry form ── */
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
    ok.textContent='Thanks, '+name.split(' ')[0]+' ✓ Your enquiry is noted. For the fastest reply, message me on WhatsApp — 73219 29869 — I usually respond with demo ideas first.';
    form.reset();
  });
}

bootHero();

/* ═══ WEBGL — blue-white spiral galaxy with round, mobile-safe particles ═══ */
(function webgl(){
  var canvas=$('#webgl');
  if(!canvas||reduced){ if(canvas) canvas.style.display='none'; return; }
  if(!window.THREE) return; /* the CSS blue glow remains as a no-WebGL fallback */
  try{
    var coarsePointer=mq('(pointer:coarse)');
    var isSmall=(window.innerWidth||1200)<760 || coarsePointer;
    var renderer=new THREE.WebGLRenderer({canvas:canvas,alpha:true,antialias:true,powerPreference:isSmall?'default':'high-performance'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,isSmall?1.5:1.8));
    renderer.setClearColor(0x000000,0);
    var scene=new THREE.Scene();
    var camera=new THREE.PerspectiveCamera(45,1,.1,100);
    camera.position.set(0,1.7,6.4);

    var group=new THREE.Group();
    group.rotation.set(.62,0,.14); /* angled disc — the premium view */
    scene.add(group);

    /* A radial sprite turns every point into a soft circular particle. Linear
       filtering (and no mipmaps) prevents the blocky squares seen on mobile. */
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
    var COUNT=isSmall?16000:56000, RADIUS=5.4, BRANCHES=3, SPIN=1.15, RAND=.3, POWER=2.9;
    var positions=new Float32Array(COUNT*3), colors=new Float32Array(COUNT*3);
    var cCore=new THREE.Color(0xffffff), cIn=new THREE.Color(0xd8efff),
        cMid=new THREE.Color(0x74b7ff), cOut=new THREE.Color(0x2b4c9b), tmp=new THREE.Color();
    for(var i=0;i<COUNT;i++){
      var r=Math.pow(Math.random(),1.7)*RADIUS;
      var branch=((i%BRANCHES)/BRANCHES)*Math.PI*2;
      var spinA=r*SPIN;
      function jitter(pw,amp){ return Math.pow(Math.random(),pw)*(Math.random()<.5?1:-1)*amp*r; }
      var x=Math.cos(branch+spinA)*r + jitter(POWER,RAND);
      var z=Math.sin(branch+spinA)*r + jitter(POWER,RAND);
      var y=jitter(POWER,RAND*.55);
      positions[i*3]=x; positions[i*3+1]=y; positions[i*3+2]=z;
      var tMix=r/RADIUS;
      if(tMix<.28) tmp.copy(cCore).lerp(cIn,tMix/.28);
      else if(tMix<.68) tmp.copy(cIn).lerp(cMid,(tMix-.28)/.4);
      else tmp.copy(cMid).lerp(cOut,(tMix-.68)/.32);
      var roll=Math.random();
      if(roll>.993) tmp.set(0xff6b7a);       /* rare rose nebula, as in real galaxies */
      else if(roll>.968) tmp.set(0xffffff);  /* sparse brilliant stars */
      colors[i*3]=tmp.r; colors[i*3+1]=tmp.g; colors[i*3+2]=tmp.b;
    }
    var gGeo=new THREE.BufferGeometry();
    gGeo.setAttribute('position',new THREE.BufferAttribute(positions,3));
    gGeo.setAttribute('color',new THREE.BufferAttribute(colors,3));
    var galaxyMaterial=new THREE.PointsMaterial({
      size:isSmall?.052:.038,
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
    var coreTexture=discTexture(256,[
      [0,'rgba(255,255,255,1)'],
      [.3,'rgba(191,224,255,.62)'],
      [.65,'rgba(80,140,255,.24)'],
      [1,'rgba(43,76,155,0)']
    ]);
    var core=new THREE.Sprite(new THREE.SpriteMaterial({map:coreTexture,depthWrite:false,blending:THREE.AdditiveBlending,transparent:true,opacity:.95}));
    core.scale.set(4.8,4.8,1);
    group.add(core);

    /* ── Distant circular stars for depth ── */
    var sCount=isSmall?420:850, sPos=new Float32Array(sCount*3);
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
    if(!coarsePointer){
      document.addEventListener('mousemove',function(e){ tx=(e.clientX/window.innerWidth-.5); ty=(e.clientY/window.innerHeight-.5); },{passive:true});
    }

    function resize(){
      var w=canvas.clientWidth||window.innerWidth, h=canvas.clientHeight||window.innerHeight;
      renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix();
      group.position.x = w>1100 ? 1.15 : 0;
      group.position.y = w>1100 ? .1 : (isSmall?.55:.9);
    }
    window.addEventListener('resize',resize); resize();

    var heroVisible=true;
    if('IntersectionObserver' in window){
      new IntersectionObserver(function(entries){ heroVisible=entries[0].isIntersecting; },{threshold:0}).observe(canvas);
    }

    var clock=new THREE.Clock();
    (function animate(){
      requestAnimationFrame(animate);
      if(document.hidden||!heroVisible) return;
      var t=clock.getElapsedTime();
      var sp=window.__scrollP||0;
      mx+=(tx-mx)*.04; my+=(ty-my)*.04;
      /* The revolution: slow majestic spin, faster + tighter as you scroll away. */
      group.rotation.y=t*.055 + sp*2.1;
      galaxy.rotation.y=-t*.018;
      stars.rotation.y=t*.006;
      core.material.opacity=.85+Math.sin(t*1.4)*.1;
      camera.position.x=mx*.7;
      camera.position.y=1.7 - my*.5 - sp*.6;
      camera.position.z=6.4 - sp*2.1;
      camera.lookAt(0,0,0);
      renderer.render(scene,camera);
    })();
  }catch(err){ canvas.classList.add('webgl-fallback'); }
})();
})();
