// The vending machine is an illustration drawn on a fixed 480 x 772 grid and scaled as one piece to the room it is given
// (like an SVG viewBox), so the numbers below are that grid's units, not screen pixels. Everything around it uses rem.
export const VEND_CSS = `
.vend-name{--fs:max(2.75rem,min(3.6rem,calc((100vw - 2rem) / 4.8),calc((100svh - 30rem) / 2.1)))}
@media (min-width:768px){.vend-name{--fs:max(3.5rem,min(8rem,calc((100svh - 24rem) / 2.4),calc((min(100vw,100vw - 3rem) - clamp(20rem,36vw,31rem) - 2rem) / 4.8)))}}

.vend-skip{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.vend-skip:focus-visible{width:auto;height:auto;margin:0;padding:.5rem 1rem;overflow:visible;clip:auto;left:0;top:.5rem;z-index:50;border-radius:999px;background:var(--ink);color:var(--paper);font-size:.875rem;font-weight:500;line-height:1.2;outline:2px solid var(--cobalt);outline-offset:2px}

.vend-root{position:absolute;inset:0;touch-action:pan-y;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent}
.vend-root[data-off="true"] *{animation-play-state:paused!important}
.vend-root button{font-family:inherit}
.vend-stage{position:absolute;bottom:0;left:50%;width:480px;height:772px;transform-origin:50% 100%;transform:translateX(-50%) scale(var(--s,.4))}
.vend-enter{position:absolute;inset:0;opacity:0;transform:translateY(46px) scale(.965);transform-origin:50% 100%;transition:opacity .5s ease-out,transform 1.15s cubic-bezier(.18,1.15,.32,1)}
[data-entered="true"] .vend-root[data-ready] .vend-enter{opacity:1;transform:none}
.vend-tilt{position:absolute;inset:0;transform:rotate(1.2deg);transform-origin:50% 100%}
.vend-abs{position:absolute}

.vend-floor{position:absolute;left:14px;top:742px;width:452px;height:30px;background:radial-gradient(ellipse at 50% 40%,rgba(10,12,30,.34),rgba(10,12,30,.12) 48%,rgba(10,12,30,0) 72%);filter:blur(2px)}
.vend-foot{position:absolute;top:738px;width:76px;height:16px;border-radius:2px 2px 7px 7px;background:linear-gradient(180deg,#2a2c3c,#0e0f18)}
.vend-body{position:absolute;left:0;top:0;width:480px;height:742px;border-radius:26px;background:
 linear-gradient(90deg,rgba(255,255,255,.2) 0,rgba(255,255,255,0) 5%,rgba(255,255,255,0) 90%,rgba(0,0,0,.2) 100%),
 linear-gradient(180deg,color-mix(in srgb,var(--cobalt) 88%,#fff) 0%,var(--cobalt) 24%,color-mix(in srgb,var(--cobalt) 84%,#000) 100%);
 box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.18),inset 0 -12px 22px rgba(0,0,0,.2),0 2px 0 rgba(0,0,0,.25)}

.vend-sign{position:absolute;left:24px;top:16px;width:432px;height:52px;border-radius:12px;overflow:hidden;display:flex;align-items:center;justify-content:center;gap:14px;color:#12131f;
 background:linear-gradient(180deg,#fffef9,#f0ecda);
 box-shadow:inset 0 0 0 3px #1b1e32,inset 0 0 0 4px rgba(255,255,255,.22),0 0 30px 2px rgba(255,255,255,.3),0 3px 0 rgba(0,0,0,.28)}
.vend-sign b{font-size:21px;font-weight:800;letter-spacing:.07em;line-height:1}
.vend-sign i{width:6px;height:6px;border-radius:50%;background:#e6492a;box-shadow:0 0 6px rgba(230,73,42,.7)}
.vend-sign span{font-size:12px;font-weight:700;letter-spacing:.32em;line-height:1;color:#43476d}
.vend-signdim{position:absolute;inset:0;background:rgba(20,22,44,.55);opacity:1;pointer-events:none}
[data-entered="true"] .vend-root[data-ready] .vend-signdim{animation:vend-flick 1s linear .45s both}

.vend-bezel{position:absolute;left:24px;top:84px;width:310px;height:496px;border-radius:14px;background:linear-gradient(145deg,#3b3e58,#12131f 60%,#242638);box-shadow:0 2px 0 rgba(255,255,255,.25),inset 0 0 0 1px rgba(255,255,255,.12),0 8px 14px -6px rgba(0,0,0,.4)}
.vend-inner{position:absolute;left:29px;top:89px;width:300px;height:486px;border-radius:9px;overflow:hidden;
 background:repeating-linear-gradient(90deg,rgba(255,255,255,0) 0 24px,rgba(40,50,100,.035) 24px 25px),linear-gradient(180deg,#f8f9fd 0%,#e5e7f1 55%,#cfd2e2 100%);
 box-shadow:inset 0 0 18px rgba(60,70,120,.3)}
.vend-dim{position:absolute;inset:0;background:rgba(10,12,34,.42);opacity:1;pointer-events:none;z-index:4;transition:opacity 1s ease .75s}
[data-entered="true"] .vend-root[data-ready] .vend-dim{opacity:0}
.vend-strip{position:absolute;left:0;width:300px;height:3px;background:#fff;box-shadow:0 0 12px 3px rgba(255,255,255,.9)}
.vend-board{position:absolute;left:0;width:300px;height:10px;background:linear-gradient(180deg,#fbfcff,#b9bdce 50%,#7c8199);box-shadow:0 6px 8px rgba(40,45,80,.3)}
.vend-chip{position:absolute;top:142px;width:84px;height:15px;display:flex;align-items:center;justify-content:center;gap:4px;border-radius:3px;
 font-size:8px;font-weight:800;letter-spacing:.07em;line-height:1;color:#12131f;white-space:nowrap;background:linear-gradient(#fff,#e8eaf3);
 box-shadow:0 1px 2px rgba(0,0,0,.3),inset 0 0 0 .5px rgba(0,0,0,.14);transition:background .2s}
.vend-chip[data-lit="1"]{background:linear-gradient(#ffe98f,#ffd24a)}
.vend-chip em{font-style:normal;color:#d03a1c}

.vend-cell{position:absolute;width:100px;height:150px;padding:0;border:0;background:none;cursor:pointer;border-radius:10px;-webkit-appearance:none;appearance:none;z-index:1}
.vend-cell:focus-visible{outline:2.5px solid var(--vermilion);outline-offset:-1px}
.vend-cell::before{content:"";position:absolute;left:-4px;right:-4px;top:-2px;bottom:12px;border-radius:14px;pointer-events:none;
 background:radial-gradient(ellipse at 50% 45%,rgba(255,238,170,.95),rgba(255,238,170,0) 68%);opacity:0;transition:opacity .25s}
.vend-cell:hover::before,.vend-cell:focus-visible::before,.vend-cell[data-lit="1"]::before{opacity:.95}
.vend-coil{position:absolute;left:0;top:94px;width:100px;height:34px;display:block;overflow:hidden}
.vend-coil-spin{animation:vend-coil .2s linear infinite}
.vend-packwrap{position:absolute;left:7px;top:8px;width:86px;height:112px;display:block;transition:transform .3s cubic-bezier(.2,1.6,.4,1)}
.vend-cell:hover .vend-packwrap,.vend-cell:focus-visible .vend-packwrap,.vend-cell[data-lit="1"] .vend-packwrap{transform:translateY(-4px) scale(1.05) rotate(-1deg)}
.vend-cell:active .vend-packwrap{transform:translateY(0) scale(.97);transition-duration:.08s}
.vend-shake{display:block;width:100%;height:100%}
.vend-cell[data-spin="1"] .vend-shake{animation:vend-shake .09s linear infinite}
.vend-packwrap[data-fresh="1"]{animation:vend-in .55s cubic-bezier(.2,1.35,.4,1) both}

.vend-art{position:relative;display:block;width:86px;height:112px;border-radius:5px;overflow:hidden;background:var(--ac,#999);box-shadow:0 8px 10px -5px rgba(10,12,30,.55),0 1px 2px rgba(10,12,30,.4)}
.vend-art img{position:absolute;left:0;top:8px;width:100%;height:98px;object-fit:cover;display:block}
.vend-art::after{content:"";position:absolute;inset:0;z-index:1;pointer-events:none;
 background:linear-gradient(90deg,rgba(0,0,0,.2),rgba(0,0,0,0) 13%,rgba(0,0,0,0) 85%,rgba(0,0,0,.24)),linear-gradient(112deg,rgba(255,255,255,0) 24%,rgba(255,255,255,.3) 40%,rgba(255,255,255,0) 54%)}
.vend-crimp{position:absolute;left:0;right:0;z-index:1;background:repeating-linear-gradient(90deg,rgba(0,0,0,.22) 0 1px,rgba(255,255,255,.2) 1px 2px,rgba(0,0,0,0) 2px 4px),var(--ac,#999)}
.vend-label{position:absolute;z-index:2;left:5px;right:5px;bottom:10px;display:block;padding:3px 4px 4px;border-radius:3px;background:rgba(255,255,255,.95);color:#12131f;box-shadow:0 1px 3px rgba(0,0,0,.3)}
.vend-label-top{display:flex;align-items:center;justify-content:space-between;gap:3px;margin-bottom:2px}
.vend-label-code{font-size:9px;font-weight:800;line-height:1;padding:2px 3px;border-radius:2px;background:#12131f;color:#fff;letter-spacing:.04em}
.vend-label-year{font-size:7px;font-weight:600;line-height:1;color:#5b5e72;font-variant-numeric:tabular-nums}
.vend-label-title{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:9px;font-weight:700;line-height:1.08;letter-spacing:-.01em;text-transform:none}

.vend-glassfx{position:absolute;left:24px;top:84px;width:310px;height:496px;border-radius:14px;overflow:hidden;pointer-events:none;z-index:6;
 background:linear-gradient(180deg,rgba(150,175,255,.1),rgba(120,140,255,.04))}
.vend-refl{position:absolute;top:0;bottom:0;left:-30px;right:-30px;transform:translateX(calc(var(--gx,0) * 14px));transition:transform .25s ease-out;
 background:linear-gradient(112deg,rgba(255,255,255,0) 20%,rgba(255,255,255,.17) 20.5%,rgba(255,255,255,.17) 27%,rgba(255,255,255,0) 27.5%,rgba(255,255,255,0) 32%,rgba(255,255,255,.09) 32.5%,rgba(255,255,255,.09) 35%,rgba(255,255,255,0) 35.5%)}
.vend-glassfx::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 18% 0%,rgba(255,255,255,.28),rgba(255,255,255,0) 50%)}

.vend-panel{position:absolute;left:346px;top:84px;width:110px;height:496px;border-radius:14px;z-index:3;
 background:linear-gradient(180deg,color-mix(in srgb,var(--cobalt) 70%,#000),color-mix(in srgb,var(--cobalt) 62%,#000));
 box-shadow:inset 0 3px 8px rgba(0,0,0,.35),inset 0 0 0 1px rgba(255,255,255,.12),0 1px 0 rgba(255,255,255,.25)}
.vend-display{position:absolute;left:7px;top:7px;width:96px;height:62px;border-radius:8px;overflow:hidden;background:#130d05;color:#ffb21e;
 text-shadow:0 0 6px rgba(255,170,30,.75),0 0 14px rgba(255,150,0,.35);
 box-shadow:inset 0 2px 7px #000,inset 0 0 0 1.5px rgba(255,255,255,.08),0 1px 0 rgba(255,255,255,.28)}
.vend-display::after{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(0,0,0,.3) 0 1px,rgba(0,0,0,0) 1px 3px)}
.vend-d1{position:absolute;left:9px;top:7px;font-size:26px;font-weight:800;line-height:1;letter-spacing:.06em;font-variant-numeric:tabular-nums;white-space:nowrap}
.vend-d2{position:absolute;left:0;right:0;bottom:7px;height:13px;overflow:hidden;font-size:9px;font-weight:700;letter-spacing:.1em;line-height:13px;white-space:nowrap}
.vend-d2 span{display:inline-block;padding:0 9px}
.vend-d2 span.m{padding:0;animation:vend-marquee 10s linear .9s infinite}
.vend-d2 span.m>span{padding:0 28px 0 9px}
.vend-d2.b{animation:vend-blink 1s steps(1,end) infinite}

.vend-key{position:absolute;width:28px;height:28px;padding:0;border:0;border-radius:7px;cursor:pointer;font-size:12px;font-weight:800;line-height:1;color:#1b1d2c;
 background:linear-gradient(180deg,#f7f8fc,#cdd0df);box-shadow:0 3px 0 #8a8fa8,0 5px 6px rgba(0,0,0,.35),inset 0 1px 0 #fff;transition:transform .07s,box-shadow .07s}
.vend-key::after{content:"";position:absolute;inset:-3px}
.vend-key:active{transform:translateY(3px);box-shadow:0 0 0 #8a8fa8,0 1px 2px rgba(0,0,0,.4),inset 0 1px 0 #fff}
.vend-key:focus-visible,.vend-restock:focus-visible{outline:2px solid #fff;outline-offset:2px}
.vend-clr{width:96px;height:22px;font-size:9px;letter-spacing:.14em;border-radius:11px}
.vend-restock{position:absolute;left:7px;top:320px;width:96px;height:28px;padding:0 0 0 22px;border:0;border-radius:14px;cursor:pointer;text-align:left;
 font-size:9px;font-weight:800;letter-spacing:.12em;color:#1b1d2c;line-height:28px;background:linear-gradient(180deg,#f7f8fc,#cdd0df);
 box-shadow:0 3px 0 #8a8fa8,0 5px 6px rgba(0,0,0,.35),inset 0 1px 0 #fff;transition:transform .07s,box-shadow .07s}
.vend-restock::after{content:"";position:absolute;inset:-9px -2px}
.vend-restock:active{transform:translateY(3px);box-shadow:0 0 0 #8a8fa8,0 1px 2px rgba(0,0,0,.4),inset 0 1px 0 #fff}
.vend-restock::before{content:"";position:absolute;left:10px;top:11px;width:6px;height:6px;border-radius:50%;background:#6a6f86;box-shadow:inset 0 1px 1px rgba(0,0,0,.4)}
.vend-restock[data-need="1"]::before{background:#ffb21e;box-shadow:0 0 7px 2px rgba(255,170,30,.85)}

.vend-plate{position:absolute;left:7px;top:186px;width:96px;height:122px;display:block;border-radius:10px;overflow:hidden;color:#1b1d2c;text-decoration:none;
 background:linear-gradient(160deg,#f4f5fa,#bfc3d5 55%,#9ca1b8);
 box-shadow:inset 0 1px 0 #fff,inset 0 0 0 1px rgba(0,0,0,.18),0 3px 0 #6a6f88,0 6px 10px rgba(0,0,0,.35);transition:transform .08s,box-shadow .08s}
.vend-plate:active{transform:translateY(3px);box-shadow:inset 0 1px 0 #fff,inset 0 0 0 1px rgba(0,0,0,.18),0 0 0 #6a6f88,0 1px 3px rgba(0,0,0,.35)}
.vend-plate:focus-visible{outline:2px solid #fff;outline-offset:2px}
.vend-plate b{position:absolute;left:0;right:0;top:11px;text-align:center;font-size:14px;font-weight:800;letter-spacing:.1em;line-height:1}
.vend-plate small{position:absolute;left:0;right:0;text-align:center;font-size:7.5px;font-weight:700;letter-spacing:.12em;line-height:1;color:#4c5068}
.vend-slot{position:absolute;left:44px;top:50px;width:8px;height:40px;border-radius:4px;background:#05060a;box-shadow:0 0 0 3px #dadded,0 0 0 4px rgba(0,0,0,.3),inset 0 0 4px #000;transition:box-shadow .25s}
.vend-plate:hover .vend-slot,.vend-plate:focus-visible .vend-slot{box-shadow:0 0 0 3px #ffd36b,0 0 12px 3px rgba(255,170,30,.75),inset 0 0 4px #000}
.vend-coinclip{position:absolute;left:0;right:0;top:0;height:70px;overflow:hidden;pointer-events:none}
.vend-coin{position:absolute;left:38px;top:0;width:20px;height:20px;opacity:0}
.vend-coin[data-drop="1"]{animation:vend-coinfall .64s cubic-bezier(.45,0,.75,.55) forwards}
.vend-coin i{display:block;width:100%;height:100%;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff1b0,#e9b93e 55%,#a87a1c);box-shadow:inset 0 0 0 2px rgba(120,80,0,.35),0 1px 2px rgba(0,0,0,.4)}
.vend-coin[data-drop="1"] i{animation:vend-coinspin .64s linear forwards}

.vend-sticker{position:absolute;left:11px;top:366px;width:88px;padding:7px 7px 8px;display:block;border-radius:2px;background:#fbf5de;color:#2a2418;transform:rotate(-3deg);
 font-size:8.5px;font-weight:800;line-height:1.18;letter-spacing:.05em;text-transform:uppercase;box-shadow:0 2px 4px rgba(0,0,0,.35)}
.vend-sticker::before{content:"";position:absolute;left:50%;top:-5px;width:26px;height:9px;margin-left:-13px;background:rgba(255,255,255,.55);transform:rotate(2deg)}
.vend-grille{position:absolute;left:7px;top:440px;width:96px;height:46px;border-radius:8px;background:radial-gradient(circle,rgba(0,0,0,.5) 1.4px,rgba(0,0,0,0) 1.9px) 0 0/7px 7px,rgba(255,255,255,.07);box-shadow:inset 0 1px 3px rgba(0,0,0,.4)}

.vend-tray{position:absolute;left:24px;top:592px;width:432px;height:130px;border-radius:16px 16px 12px 12px;z-index:2;
 background:linear-gradient(180deg,#05060d,#13152a 60%,#1c1f36);box-shadow:inset 0 10px 18px rgba(0,0,0,.75),inset 0 0 0 2px rgba(255,255,255,.07),0 1px 0 rgba(255,255,255,.25)}
.vend-hint{position:absolute;left:340px;top:636px;width:112px;text-align:center;font-size:8.5px;font-weight:700;letter-spacing:.14em;line-height:1.6;color:rgba(255,255,255,.5);z-index:3;pointer-events:none}
.vend-fall{position:absolute;left:0;top:0;z-index:5;pointer-events:none;will-change:transform}
.vend-tray-item{position:absolute;left:0;top:0;z-index:8;will-change:transform}
.vend-take{position:relative;display:block;width:86px;height:112px;border-radius:5px;transition:transform .25s cubic-bezier(.2,1.6,.4,1)}
.vend-take:hover,.vend-take:focus-visible{transform:translateY(-4px) scale(1.05)}
.vend-take:focus-visible{outline:2.5px solid #fff;outline-offset:3px}
.vend-tag{position:absolute;z-index:3;left:50%;top:30px;margin-left:-32px;width:64px;text-align:center;padding:5px 0;border-radius:99px;background:var(--vermilion);color:#fff;
 font-size:9.5px;font-weight:800;letter-spacing:.07em;line-height:1;white-space:nowrap;box-shadow:0 3px 8px rgba(0,0,0,.45);transform:rotate(-5deg);animation:vend-bob 1.1s ease-in-out infinite alternate}
.vend-out,.vend-taken{display:block}
.vend-out{animation:vend-out .55s cubic-bezier(.5,0,.9,.5) forwards}
.vend-taken{animation:vend-taken .5s cubic-bezier(.3,0,.5,1) forwards}
.vend-out a,.vend-taken a{pointer-events:none}
.vend-flap{position:absolute;left:30px;top:698px;width:420px;height:18px;border-radius:3px 3px 6px 6px;z-index:9;pointer-events:none;transform-origin:50% 0;
 background:linear-gradient(180deg,rgba(255,255,255,.3),rgba(210,215,240,.12));box-shadow:inset 0 1px 0 rgba(255,255,255,.6),0 -1px 0 rgba(0,0,0,.35)}
.vend-flap[data-swing="1"]{animation:vend-flap .8s ease-out}
.vend-lip{position:absolute;left:14px;top:716px;width:452px;height:14px;border-radius:5px;z-index:10;pointer-events:none;
 background:linear-gradient(180deg,#f5f6fb,#b4b9cc 55%,#8a8fa7);box-shadow:0 3px 5px rgba(0,0,0,.35),inset 0 1px 0 #fff}

/* On a small screen (the drawing is scaled below about 0.7) the print is swapped for a bolder, simpler face. */
.vend-root[data-small] .vend-label{right:auto;bottom:9px;padding:2px}
.vend-root[data-small] .vend-label-top{margin:0}
.vend-root[data-small] .vend-label-year,.vend-root[data-small] .vend-label-title{display:none}
.vend-root[data-small] .vend-label-code{font-size:15px;padding:3px 5px}
.vend-root[data-small] .vend-chip{font-size:10px}
.vend-root[data-small] .vend-chip em{font-size:7px}
.vend-root[data-small] .vend-d2{font-size:11px;letter-spacing:.06em}
.vend-root[data-small] .vend-d2 span{padding:0 8px}
.vend-root[data-small] .vend-d2 span.m{padding:0}
.vend-root[data-small] .vend-d2 span.m>span{padding:0 24px 0 8px}
.vend-root[data-small] .vend-tag{width:80px;margin-left:-40px;padding:6px 0;font-size:12px}

@keyframes vend-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@keyframes vend-blink{0%,55%{opacity:1}56%,100%{opacity:.12}}
@keyframes vend-shake{0%{transform:translate(-1.2px,0) rotate(-.9deg)}50%{transform:translate(1.2px,-.6px) rotate(1deg)}100%{transform:translate(-.6px,.6px) rotate(-.5deg)}}
@keyframes vend-coil{from{transform:translateX(0)}to{transform:translateX(-8px)}}
@keyframes vend-in{from{opacity:0;transform:translateY(-16px) scale(.88)}to{opacity:1;transform:none}}
@keyframes vend-flap{0%{transform:perspective(500px) rotateX(0)}28%{transform:perspective(500px) rotateX(-42deg)}55%{transform:perspective(500px) rotateX(-12deg)}75%{transform:perspective(500px) rotateX(-22deg)}100%{transform:perspective(500px) rotateX(0)}}
@keyframes vend-coinfall{0%{opacity:1;transform:translateY(-26px)}75%{opacity:1;transform:translateY(40px)}100%{opacity:0;transform:translateY(52px)}}
@keyframes vend-coinspin{0%{transform:scaleX(1)}22%{transform:scaleX(.18)}45%{transform:scaleX(1)}68%{transform:scaleX(.2)}85%{transform:scaleX(.9)}100%{transform:scaleX(.06)}}
@keyframes vend-bob{from{transform:rotate(-5deg) translateY(0)}to{transform:rotate(-5deg) translateY(-3px)}}
@keyframes vend-out{to{transform:translateY(80px) rotate(10deg);opacity:0}}
@keyframes vend-taken{to{transform:translateY(-34px) scale(.9);opacity:0}}
@keyframes vend-flick{0%{opacity:1}12%{opacity:.15}20%{opacity:.85}30%{opacity:.1}45%{opacity:.6}60%{opacity:0}75%{opacity:.3}100%{opacity:0}}

@media (prefers-reduced-motion:reduce){
 .vend-enter{opacity:1!important;transform:none!important;transition:none!important}
 .vend-dim,.vend-signdim{display:none}
 .vend-root *,.vend-root *::before,.vend-root *::after{animation:none!important;transition:none!important}
 .vend-refl{transform:none}
 .vend-d2{height:24px;bottom:5px;font-size:8px;line-height:11px;white-space:normal}
 .vend-d2 span.m{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;padding:0 9px;transform:none!important}
 .vend-d2 span.m>span{display:inline;padding:0}
 .vend-d2 span.m>span+span{display:none}
 .vend-root[data-small] .vend-d2 span.m{padding:0 8px}
 .vend-root[data-small] .vend-d2 span.m>span{padding:0}
}
`;
