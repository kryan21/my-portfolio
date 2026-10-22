/* ═══ KRYAN PORTFOLIO — script.js ═══ */
(function(){
'use strict';
var $=function(s,c){return (c||document).querySelector(s)};
var $$=function(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))};
function mq(q){try{return (typeof window.matchMedia==='function')?window.matchMedia(q).matches:false}catch(e){return false}}
var reduced=mq('(prefers-reduced-motion: reduce)');

/* ── Hero starts immediately (no welcome screen) ── */
function bootHero(){ startHero(); }

/* ── Hero intro (GSAP word rise — em kept as ONE unit, never split) ── */
var heroStarted=false;
function startHero(){
  if(heroStarted) return; heroStarted=true;
  if(window.gsap && !reduced){
    gsap.to('.hero-title .wi',{y:0,duration:1.05,stagger:.09,ease:'power4.out',clearProps:'transform,opacity,visibility'});
    gsap.fromTo('.hero .reveal',{opacity:0,y:26},{opacity:1,y:0,duration:.9,stagger:.1,delay:.25,ease:'power3.out',clearProps:'all'});
  }else{
    $$('.hero-title .wi').forEach(function(el){el.style.transform='none'});
    $$('.hero .reveal').forEach(function(el){el.style.opacity='1';el.style.transform='none'});
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
  if(heroSec){
    var pinTl=gsap.timeline({scrollTrigger:{trigger:heroSec,start:'top top',end:'+=85%',scrub:1,pin:true,anticipatePin:1}});
    pinTl.to('.hero-content',{y:-64,opacity:.3,scale:.97,ease:'none'},0)
         .to('#webgl',{scale:1.22,ease:'none'},0)
         .to('.hero-glow',{opacity:.35,ease:'none'},0);
    pinTl.to('.scroll-hint',{opacity:0,ease:'none'},0);
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
    ok.textContent='Thanks, '+name.split(' ')[0]+' ✓ Your enquiry is noted. For the fastest reply, also reach me on GitHub @kryan21 — I usually respond with demo ideas first.';
    form.reset();
  });
}

bootHero();

/* ═══ WEBGL — revolving spiral GALAXY background (Three.js) ═══ */
(function webgl(){
  var canvas=$('#webgl');
  if(!canvas||!window.THREE||reduced) { if(canvas) canvas.style.display='none'; return; }
  try{
    var renderer=new THREE.WebGLRenderer({canvas:canvas,alpha:true,antialias:true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    var scene=new THREE.Scene();
    var camera=new THREE.PerspectiveCamera(45,1,.1,100);
    camera.position.set(0,1.7,6.4);

    var group=new THREE.Group();
    group.rotation.set(.62,0,.14); /* angled disc — the premium view */
    scene.add(group);

    /* ── spiral galaxy points ── */
    var isSmall=(window.innerWidth||1200)<720;
    var COUNT=isSmall?30000:70000, RADIUS=5.4, BRANCHES=3, SPIN=1.15, RAND=.3, POWER=2.9;
    var positions=new Float32Array(COUNT*3), colors=new Float32Array(COUNT*3);
    var cIn=new THREE.Color(0xffffff), cMid=new THREE.Color(0xbdbdbd), cOut=new THREE.Color(0x4a4a52), tmp=new THREE.Color();
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
      if(tMix<.45) tmp.copy(cIn).lerp(cMid,tMix/.45); else tmp.copy(cMid).lerp(cOut,(tMix-.45)/.55);
      /* sprinkle of bright white-blue stars */
      if(Math.random()>.93) tmp.set(0xffffff);
      colors[i*3]=tmp.r; colors[i*3+1]=tmp.g; colors[i*3+2]=tmp.b;
    }
    var gGeo=new THREE.BufferGeometry();
    gGeo.setAttribute('position',new THREE.BufferAttribute(positions,3));
    gGeo.setAttribute('color',new THREE.BufferAttribute(colors,3));
    var galaxy=new THREE.Points(gGeo,new THREE.PointsMaterial({size:.033,sizeAttenuation:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexColors:true,transparent:true,opacity:.95}));
    group.add(galaxy);

    /* ── glowing core ── */
    function glowTexture(){
      var c=document.createElement('canvas'); c.width=c.height=256;
      var g=c.getContext('2d');
      var grad=g.createRadialGradient(128,128,0,128,128,128);
      grad.addColorStop(0,'rgba(255,255,255,1)');
      grad.addColorStop(.3,'rgba(205,205,205,.55)');
      grad.addColorStop(.65,'rgba(120,120,130,.20)');
      grad.addColorStop(1,'rgba(90,90,100,0)');
      g.fillStyle=grad; g.fillRect(0,0,256,256);
      return new THREE.CanvasTexture(c);
    }
    var core=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture(),depthWrite:false,blending:THREE.AdditiveBlending,transparent:true,opacity:.95}));
    core.scale.set(4.6,4.6,1);
    group.add(core);

    /* ── distant starfield for depth ── */
    var sCount=900, sPos=new Float32Array(sCount*3);
    for(var j=0;j<sCount;j++){
      var th=Math.random()*Math.PI*2, ph=Math.acos(2*Math.random()-1), rr=13+Math.random()*22;
      sPos[j*3]=rr*Math.sin(ph)*Math.cos(th); sPos[j*3+1]=rr*Math.cos(ph)*.6; sPos[j*3+2]=rr*Math.sin(ph)*Math.sin(th);
    }
    var sGeo=new THREE.BufferGeometry();
    sGeo.setAttribute('position',new THREE.BufferAttribute(sPos,3));
    var stars=new THREE.Points(sGeo,new THREE.PointsMaterial({color:0xd9d9d9,size:.06,depthWrite:false,transparent:true,opacity:.7}));
    scene.add(stars);

    var mx=0,my=0,tx=0,ty=0;
    document.addEventListener('mousemove',function(e){ tx=(e.clientX/window.innerWidth-.5); ty=(e.clientY/window.innerHeight-.5); });

    function resize(){
      var w=canvas.clientWidth||window.innerWidth, h=canvas.clientHeight||window.innerHeight;
      renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix();
      group.position.x = w>1100 ? 1.15 : 0;
      group.position.y = w>1100 ? .1 : .9;
    }
    window.addEventListener('resize',resize); resize();

    var clock=new THREE.Clock();
    (function animate(){
      requestAnimationFrame(animate);
      var t=clock.getElapsedTime();
      var sp=window.__scrollP||0;
      mx+=(tx-mx)*.04; my+=(ty-my)*.04;
      /* the revolution: slow majestic spin, faster + tighter as you scroll away */
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
  }catch(err){ canvas.style.display='none'; }
})();
})();
