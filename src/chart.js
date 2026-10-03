/* 维度图：象限图 + 雷达图（纯 SVG / canvas，无外部依赖）
 * 归一化坐标：u ∈ [-1,1]，u>0 = 左（苏格拉底）；v ∈ [-1,1]，v>0 = 上（快乐） */
window.SPChart = (function(){
  'use strict';
  var NAMES = {SH:'快乐的苏格拉底', PH:'快乐的猪', SP:'痛苦的苏格拉底', PP:'痛苦的猪'};
  var EMO = {SH:'💡', PH:'🐷', SP:'🏛️', PP:'🌧️'};
  var CENTER = {SH:[.5,.5], PH:[-.5,.5], SP:[.5,-.5], PP:[-.5,-.5]};
  var LIM = .68;
  function clamp(v){ return Math.max(-LIM, Math.min(LIM, v)) }
  // 统一几何（单位：半径 = 1，坐标系 x 向右、y 向下，原点在中心）
  var MIN = .17; // 落在轴上（如 A=0）时，推入它所属的象限，避免点压在分界线/中心
  function geom(r){
    var sx = r.cur.charAt(0)==='S' ? 1 : -1, sy = r.cur.charAt(1)==='H' ? 1 : -1;
    var a = sx*Math.max(MIN, sx*clamp(r.A)), b = sy*Math.max(MIN, sy*clamp(r.B));
    var p = [-a, -b];
    var w = CENTER[r.want]; var d = [-w[0], -w[1]];
    var g = {p:p, d:d, same:r.same};
    // 「想继续做」标签放在点的外侧；离边缘太近则放内侧（永远不与点重叠）
    g.keepBelow = p[1] >= 0 ? (p[1] < .3) : (p[1] < -.3);
    if(!r.same){
      var dx = d[0]-p[0], dy = d[1]-p[1], L = Math.hypot(dx,dy) || 1, ux = dx/L, uy = dy/L;
      var s = [p[0]+ux*.13, p[1]+uy*.13], e = [d[0]-ux*.12, d[1]-uy*.12];
      var m = [(s[0]+e[0])/2, (s[1]+e[1])/2], bend = Math.min(.3, L*.28);
      g.s = s; g.e = e; g.c = [m[0] - uy*bend, m[1] + ux*bend];
    }
    return g;
  }
  var f1 = function(n){ return Math.round(n*10)/10 };

  /* ---------------- SVG：象限图 ---------------- */
  function quadSVG(r){
    var C = 170, R = 132, g = geom(r), X = function(u){ return f1(C + u*R) };
    var o = [];
    o.push('<svg class="qsvg" viewBox="0 0 340 340" role="img" aria-label="维度象限图：你现在是' + NAMES[r.cur] + '，想成为' + NAMES[r.want] + '">');
    o.push('<defs>');
    ['SH','PH','SP','PP'].forEach(function(k){
      o.push('<radialGradient id="cg' + k + '" gradientUnits="userSpaceOnUse" cx="' + C + '" cy="' + C + '" r="' + f1(R*1.42) + '">' +
        '<stop offset="0" style="stop-color:var(--q' + k + ');stop-opacity:0"/>' +
        '<stop offset=".45" style="stop-color:var(--q' + k + ');stop-opacity:' + (k===r.cur?'.16':'.06') + '"/>' +
        '<stop offset="1" style="stop-color:var(--q' + k + ');stop-opacity:' + (k===r.cur?'.55':'.2') + '"/></radialGradient>');
    });
    o.push('<clipPath id="cclip"><rect x="' + (C-R) + '" y="' + (C-R) + '" width="' + 2*R + '" height="' + 2*R + '" rx="16"/></clipPath>');
    o.push('<filter id="cglow" x="-150%" y="-150%" width="400%" height="400%"><feGaussianBlur stdDeviation="6"/></filter>');
    o.push('<marker id="carrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10L3 5z" style="fill:var(--want-c)"/></marker>');
    if(!r.same){
      var dpath = 'M' + X(g.s[0]) + ' ' + X(g.s[1]) + 'Q' + X(g.c[0]) + ' ' + X(g.c[1]) + ' ' + X(g.e[0]) + ' ' + X(g.e[1]);
      o.push('<mask id="cmask" maskUnits="userSpaceOnUse" x="0" y="0" width="340" height="340"><path class="amask" d="' + dpath + '" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100" style="stroke:#fff;stroke-width:16;fill:none;stroke-linecap:round"/></mask>');
    }
    o.push('</defs>');
    // 区域
    o.push('<g clip-path="url(#cclip)">');
    [['SH',-1,-1],['PH',0,-1],['SP',-1,0],['PP',0,0]].forEach(function(q){
      o.push('<rect class="qreg' + (q[0]===r.cur?' cur':'') + '" x="' + (C + q[1]*R) + '" y="' + (C + q[2]*R) + '" width="' + R + '" height="' + R + '" style="fill:url(#cg' + q[0] + ')"/>');
    });
    // 同心环 + 细网格
    [.25,.5,.75,1,1.25].forEach(function(k, i){
      o.push('<circle class="ring" style="animation-delay:' + (i*70) + 'ms" cx="' + C + '" cy="' + C + '" r="' + f1(R*k) + '"' + (k===1?'':' stroke-dasharray="2 4"') + '/>');
    });
    [-.5,.5].forEach(function(k){
      o.push('<line class="fine" x1="' + X(k) + '" y1="' + (C-R) + '" x2="' + X(k) + '" y2="' + (C+R) + '"/><line class="fine" x1="' + (C-R) + '" y1="' + X(k) + '" x2="' + (C+R) + '" y2="' + X(k) + '"/>');
    });
    o.push('</g>');
    o.push('<rect class="frame" x="' + (C-R) + '" y="' + (C-R) + '" width="' + 2*R + '" height="' + 2*R + '" rx="16"/>');
    // 坐标轴 + 刻度
    o.push('<g class="axes">');
    o.push('<line x1="' + (C-R-4) + '" y1="' + C + '" x2="' + (C+R+4) + '" y2="' + C + '"/><line x1="' + C + '" y1="' + (C-R-4) + '" x2="' + C + '" y2="' + (C+R+4) + '"/>');
    for(var t=-1; t<=1.001; t+=.125){
      if(Math.abs(t)<.01) continue;
      var big = Math.abs((t*4) - Math.round(t*4)) < .01, h = big ? 4 : 2;
      o.push('<line class="tick" x1="' + X(t) + '" y1="' + (C-h) + '" x2="' + X(t) + '" y2="' + (C+h) + '"/><line class="tick" x1="' + (C-h) + '" y1="' + X(t) + '" x2="' + (C+h) + '" y2="' + X(t) + '"/>');
    }
    o.push('<path class="ahead" d="M' + C + ' ' + (C-R-9) + 'l-4 7h8z M' + C + ' ' + (C+R+9) + 'l-4 -7h8z M' + (C-R-9) + ' ' + C + 'l7 -4v8z M' + (C+R+9) + ' ' + C + 'l-7 -4v8z"/>');
    o.push('</g>');
    // 轴名
    o.push('<g class="axname">');
    o.push('<text x="' + C + '" y="' + (C-R-15) + '" text-anchor="middle">😊 快乐</text>');
    o.push('<text x="' + C + '" y="' + (C+R+25) + '" text-anchor="middle">😣 痛苦</text>');
    o.push('<text transform="translate(' + (C-R-17) + ' ' + C + ') rotate(-90)" text-anchor="middle" dominant-baseline="central">🏛️ 苏格拉底 · 思考追问</text>');
    o.push('<text transform="translate(' + (C+R+17) + ' ' + C + ') rotate(90)" text-anchor="middle" dominant-baseline="central">🐷 猪 · 享受当下</text>');
    o.push('</g>');
    // 象限名
    [['SH',-1,-1,'start'],['PH',1,-1,'end'],['SP',-1,1,'start'],['PP',1,1,'end']].forEach(function(q){
      var x = C + q[1]*(R-11), y = q[2]<0 ? C-R+21 : C+R-12, cur = q[0]===r.cur;
      o.push('<text class="qname' + (cur?' cur':'') + '" x="' + x + '" y="' + y + '" text-anchor="' + q[3] + '">' + EMO[q[0]] + ' ' + NAMES[q[0]] + '</text>');
    });
    // 想成为
    var dx = X(g.d[0]), dy = X(g.d[1]);
    if(!r.same){
      o.push('<g class="want"><circle class="wring" cx="' + dx + '" cy="' + dy + '" r="15"/>' +
        '<path class="wdia" d="M' + dx + ' ' + (dy-8) + 'l8 8 -8 8 -8 -8z"/>' +
        (function(){ var ty = g.p[1] > g.d[1] ? dy-38 : dy+19; return '<g class="wtag"><rect x="' + (dx-27) + '" y="' + ty + '" width="54" height="19" rx="9.5"/><text x="' + dx + '" y="' + (ty+13.5) + '" text-anchor="middle">想成为</text></g></g>' })());
      o.push('<g mask="url(#cmask)"><path class="arc" d="' + dpath + '" marker-end="url(#carrow)"/></g>');
    }
    // 我
    o.push('<g class="guides"><line id="cgx" x1="' + C + '" y1="' + C + '" x2="' + C + '" y2="' + C + '"/><line id="cgy" x1="' + C + '" y1="' + C + '" x2="' + C + '" y2="' + C + '"/></g>');
    o.push('<g id="cme" class="me" transform="translate(' + C + ' ' + C + ')">' +
      (r.same ? (function(){ var ty = g.keepBelow ? 25 : -44; return '<g class="keep"><circle class="wring" r="20"/><g class="wtag"><rect x="-31" y="' + ty + '" width="62" height="19" rx="9.5"/><text y="' + (ty+13.5) + '" text-anchor="middle">想继续做</text></g></g>' })() : '') +
      '<circle class="rip" r="9"/><circle class="rip" r="9" style="animation-delay:.8s"/><circle class="rip" r="9" style="animation-delay:1.6s"/>' +
      '<circle class="halo" r="16" filter="url(#cglow)"/><circle class="core" r="11"/><text class="metxt" y="4" text-anchor="middle">我</text></g>');
    o.push('</svg>');
    return o.join('');
  }

  /* ---------------- SVG：雷达图 ---------------- */
  function radarSVG(r){
    var C = 170, R = 106, v = {top:r.happy/100, right:(100-r.think)/100, bottom:(100-r.happy)/100, left:r.think/100};
    var pt = function(dir, k){ return dir==='top'?[C, C-k*R]:dir==='right'?[C+k*R, C]:dir==='bottom'?[C, C+k*R]:[C-k*R, C] };
    var dirs = ['top','right','bottom','left'];
    var poly = function(k){ return dirs.map(function(d){ var p = pt(d, typeof k==='number'?k:k[d]); return f1(p[0]) + ',' + f1(p[1]) }).join(' ') };
    var o = ['<svg class="qsvg rsvg" viewBox="0 0 340 340" role="img" aria-label="雷达图：思考 ' + r.think + '%，享受 ' + (100-r.think) + '%，快乐 ' + r.happy + '%，痛苦 ' + (100-r.happy) + '%">'];
    o.push('<defs><radialGradient id="rg" gradientUnits="userSpaceOnUse" cx="' + C + '" cy="' + C + '" r="' + R + '"><stop offset="0" style="stop-color:var(--acc);stop-opacity:.12"/><stop offset="1" style="stop-color:var(--qc);stop-opacity:.55"/></radialGradient>' +
      '<filter id="rglow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4"/></filter></defs>');
    for(var i=5;i>=1;i--) o.push('<polygon class="split' + (i%2?' alt':'') + '" points="' + poly(i/5) + '"/>');
    o.push('<g class="axes">'); dirs.forEach(function(d){ var p = pt(d,1.06); o.push('<line x1="' + C + '" y1="' + C + '" x2="' + f1(p[0]) + '" y2="' + f1(p[1]) + '"/>') }); o.push('</g>');
    [20,40,60,80].forEach(function(n){ o.push('<text class="rtick" x="' + (C+4) + '" y="' + f1(C - n/100*R - 3) + '">' + n + '</text>') });
    o.push('<g class="rshape"><polygon class="rglow" points="' + poly(v) + '" filter="url(#rglow)"/><polygon class="rarea" points="' + poly(v) + '"/>');
    dirs.forEach(function(d){ var p = pt(d, v[d]); o.push('<circle class="rdot" cx="' + f1(p[0]) + '" cy="' + f1(p[1]) + '" r="4.5"/>') });
    o.push('</g>');
    var lab = {top:['😊 快乐', r.happy], right:['🐷 享受', 100-r.think], bottom:['😣 痛苦', 100-r.happy], left:['🏛️ 思考', r.think]};
    dirs.forEach(function(d){
      var p = pt(d, 1.2), x = f1(p[0]), y = f1(p[1]), a = d==='left'?'end':d==='right'?'start':'middle';
      if(d==='left') x = C-R-14; if(d==='right') x = C+R+14;
      var y1 = d==='top' ? y-8 : d==='bottom' ? y+4 : y-4;
      o.push('<text class="rname" x="' + x + '" y="' + y1 + '" text-anchor="' + a + '">' + lab[d][0] + '</text><text class="rval" x="' + x + '" y="' + (y1+17) + '" text-anchor="' + a + '">' + lab[d][1] + '%</text>');
    });
    o.push('</svg>');
    return o.join('');
  }

  /* 入场动画：点从中心飞到目标位置 + 十字参考线 */
  function animate(root, r, reduce){
    var svg = root.querySelector('svg'); if(!svg) return;
    var go = function(){ svg.classList.add('go') };
    if(reduce) go(); else requestAnimationFrame(function(){ requestAnimationFrame(go) });
    var me = root.querySelector('#cme'); if(!me) return;
    var C = 170, R = 132, g = geom(r), tx = C + g.p[0]*R, ty = C + g.p[1]*R;
    var gx = root.querySelector('#cgx'), gy = root.querySelector('#cgy');
    function set(x, y){
      me.setAttribute('transform', 'translate(' + f1(x) + ' ' + f1(y) + ')');
      gx.setAttribute('x1', f1(x)); gx.setAttribute('y1', f1(y)); gx.setAttribute('x2', f1(x)); gx.setAttribute('y2', C);
      gy.setAttribute('x1', f1(x)); gy.setAttribute('y1', f1(y)); gy.setAttribute('x2', C); gy.setAttribute('y2', f1(y));
    }
    if(reduce){ set(tx, ty); return }
    var t0 = null, delay = 650, dur = 1300;
    function step(ts){
      if(!svg.isConnected) return;
      if(t0===null) t0 = ts;
      var k = Math.min(1, Math.max(0, (ts - t0 - delay)/dur));
      var e = k<1 ? 1 + 2.2*Math.pow(k-1,3) + 1.2*Math.pow(k-1,2) : 1; // easeOutBack 风格
      set(C + (tx-C)*e, C + (ty-C)*e);
      if(k<1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---------------- canvas：分享图里的象限图 ---------------- */
  function hexA(hex, a){
    var h = hex.replace('#',''); if(h.length===3) h = h.split('').map(function(c){return c+c}).join('');
    if(!/^[0-9a-f]{6}$/i.test(h)) return hex;
    return 'rgba(' + parseInt(h.slice(0,2),16) + ',' + parseInt(h.slice(2,4),16) + ',' + parseInt(h.slice(4,6),16) + ',' + a + ')';
  }
  function rrect(ctx,x,y,w,h,rad){ ctx.beginPath(); ctx.moveTo(x+rad,y); ctx.arcTo(x+w,y,x+w,y+h,rad); ctx.arcTo(x+w,y+h,x,y+h,rad); ctx.arcTo(x,y+h,x,y,rad); ctx.arcTo(x,y,x+w,y,rad); ctx.closePath() }
  // (cx,cy) 中心，R 半边长（结果图用，按 1080 宽、手机上约 1/3 缩放显示来定字号）
  function drawQuad(ctx, cx, cy, R, P, r, font){
    var g = geom(r), X = function(u){ return cx + u*R }, Y = function(v){ return cy + v*R };
    var qc = P.q[r.cur], wc = P.want || P.ink2, rad = Math.min(40, (P.radius||40)*.75);
    ctx.save();
    rrect(ctx, cx-R, cy-R, 2*R, 2*R, rad); ctx.clip();
    [['SH',-1,-1],['PH',0,-1],['SP',-1,0],['PP',0,0]].forEach(function(q){
      var cur = q[0]===r.cur, gr = ctx.createRadialGradient(cx,cy,0,cx,cy,R*1.42);
      gr.addColorStop(0, hexA(P.q[q[0]], 0)); gr.addColorStop(.45, hexA(P.q[q[0]], cur?.18:.07)); gr.addColorStop(1, hexA(P.q[q[0]], cur?.6:.22));
      ctx.fillStyle = gr; ctx.fillRect(cx + q[1]*R, cy + q[2]*R, R, R);
    });
    ctx.strokeStyle = P.stroke; ctx.lineWidth = 2.4;
    [.25,.5,.75,1,1.25].forEach(function(k){ ctx.setLineDash(k===1?[]:[5,10]); ctx.beginPath(); ctx.arc(cx,cy,R*k,0,Math.PI*2); ctx.stroke() });
    ctx.setLineDash([3,9]); ctx.globalAlpha = .8;
    [-.5,.5].forEach(function(k){ ctx.beginPath(); ctx.moveTo(X(k),cy-R); ctx.lineTo(X(k),cy+R); ctx.moveTo(cx-R,Y(k)); ctx.lineTo(cx+R,Y(k)); ctx.stroke() });
    ctx.setLineDash([]); ctx.globalAlpha = 1;
    ctx.restore();
    rrect(ctx, cx-R, cy-R, 2*R, 2*R, rad); ctx.strokeStyle = P.stroke; ctx.lineWidth = 2.4; ctx.stroke();
    // 轴 + 刻度 + 箭头
    ctx.strokeStyle = P.ink3; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx-R-8,cy); ctx.lineTo(cx+R+8,cy); ctx.moveTo(cx,cy-R-8); ctx.lineTo(cx,cy+R+8); ctx.stroke();
    ctx.lineWidth = 2.4;
    for(var t=-1; t<=1.001; t+=.125){ if(Math.abs(t)<.01) continue; var big = Math.abs(t*4-Math.round(t*4))<.01, h = big?11:6;
      ctx.beginPath(); ctx.moveTo(X(t),cy-h); ctx.lineTo(X(t),cy+h); ctx.moveTo(cx-h,Y(t)); ctx.lineTo(cx+h,Y(t)); ctx.stroke() }
    ctx.fillStyle = P.ink3;
    [[cx,cy-R-24,0,1],[cx,cy+R+24,0,-1],[cx-R-24,cy,1,0],[cx+R+24,cy,-1,0]].forEach(function(a){
      ctx.beginPath(); ctx.moveTo(a[0],a[1]);
      if(a[2]===0){ ctx.lineTo(a[0]-11,a[1]+a[3]*18); ctx.lineTo(a[0]+11,a[1]+a[3]*18) } else { ctx.lineTo(a[0]+a[2]*18,a[1]-11); ctx.lineTo(a[0]+a[2]*18,a[1]+11) }
      ctx.closePath(); ctx.fill();
    });
    // 轴名：上下居中；左右为横排三行（不旋转，手机上可读）
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = P.ink; ctx.font = '700 38px ' + font;
    ctx.fillText('😊 快乐', cx, cy-R-44); ctx.fillText('😣 痛苦', cx, cy+R+78);
    [[-1,'🏛️','苏格拉底','思考追问'],[1,'🐷','猪','享受当下']].forEach(function(s){
      var x = cx + s[0]*(R+100);
      ctx.font = '44px ' + font; ctx.fillStyle = P.ink; ctx.fillText(s[1], x, cy-34);
      ctx.font = '800 32px ' + font; ctx.fillText(s[2], x, cy+16);
      ctx.font = '500 27px ' + font; ctx.fillStyle = P.ink2; ctx.fillText(s[3], x, cy+56);
    });
    // 象限名
    [['SH',-1,-1,'left'],['PH',1,-1,'right'],['SP',-1,1,'left'],['PP',1,1,'right']].forEach(function(q){
      var cur = q[0]===r.cur; ctx.textAlign = q[3]; ctx.fillStyle = cur ? P.ink : P.ink2; ctx.globalAlpha = cur ? 1 : .8;
      ctx.font = (cur?'800 ':'600 ') + '30px ' + font;
      ctx.fillText(EMO[q[0]] + ' ' + NAMES[q[0]], cx + q[1]*(R-26), q[2]<0 ? cy-R+54 : cy+R-30);
      ctx.globalAlpha = 1;
    });
    ctx.textAlign = 'center';
    var px = X(g.p[0]), py = Y(g.p[1]);
    // 十字参考线
    ctx.strokeStyle = hexA(qc, .7); ctx.lineWidth = 2.4; ctx.setLineDash([7,9]);
    ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(px,cy); ctx.moveTo(px,py); ctx.lineTo(cx,py); ctx.stroke(); ctx.setLineDash([]);
    function tag(x, y, txt){ ctx.font = '800 28px ' + font; var w = ctx.measureText(txt).width + 36; rrect(ctx, x-w/2, y, w, 48, 24); ctx.fillStyle = wc; ctx.fill(); ctx.fillStyle = P.wantInk || P.accInk; ctx.fillText(txt, x, y+34) }
    if(!r.same){
      var dx = X(g.d[0]), dy = Y(g.d[1]);
      ctx.strokeStyle = wc; ctx.lineWidth = 3.5; ctx.setLineDash([7,8]); ctx.beginPath(); ctx.arc(dx,dy,40,0,Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
      ctx.save(); ctx.shadowColor = wc; ctx.shadowBlur = 20; ctx.fillStyle = wc; ctx.beginPath(); ctx.moveTo(dx,dy-22); ctx.lineTo(dx+22,dy); ctx.lineTo(dx,dy+22); ctx.lineTo(dx-22,dy); ctx.closePath(); ctx.fill(); ctx.restore();
      tag(dx, g.p[1] > g.d[1] ? dy-92 : dy+44, '想成为');
      var s = [X(g.s[0]),Y(g.s[1])], c = [X(g.c[0]),Y(g.c[1])], e = [X(g.e[0]),Y(g.e[1])];
      ctx.strokeStyle = wc; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.setLineDash([13,11]);
      ctx.beginPath(); ctx.moveTo(s[0],s[1]); ctx.quadraticCurveTo(c[0],c[1],e[0],e[1]); ctx.stroke(); ctx.setLineDash([]); ctx.lineCap = 'butt';
      var ang = Math.atan2(e[1]-c[1], e[0]-c[0]);
      ctx.fillStyle = wc; ctx.beginPath(); ctx.moveTo(e[0]+8*Math.cos(ang), e[1]+8*Math.sin(ang));
      ctx.lineTo(e[0]-24*Math.cos(ang-.5), e[1]-24*Math.sin(ang-.5)); ctx.lineTo(e[0]-14*Math.cos(ang), e[1]-14*Math.sin(ang)); ctx.lineTo(e[0]-24*Math.cos(ang+.5), e[1]-24*Math.sin(ang+.5)); ctx.closePath(); ctx.fill();
    }
    // 点：涟漪 + 光晕 + 核心
    [[56,.10],[46,.18],[37,.3]].forEach(function(a){ ctx.beginPath(); ctx.arc(px,py,a[0],0,Math.PI*2); ctx.strokeStyle = hexA(qc, a[1]*1.7); ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = hexA(qc, a[1]*.5); ctx.fill() });
    if(r.same){ ctx.strokeStyle = wc; ctx.lineWidth = 4; ctx.setLineDash([8,8]); ctx.beginPath(); ctx.arc(px,py,76,0,Math.PI*2); ctx.stroke(); ctx.setLineDash([]) }
    ctx.save(); ctx.shadowColor = qc; ctx.shadowBlur = 36; ctx.beginPath(); ctx.arc(px,py,30,0,Math.PI*2); ctx.fillStyle = P.dot; ctx.fill(); ctx.restore();
    ctx.beginPath(); ctx.arc(px,py,30,0,Math.PI*2); ctx.lineWidth = 7; ctx.strokeStyle = qc; ctx.stroke();
    ctx.fillStyle = P.dotInk; ctx.font = '900 30px ' + font; ctx.fillText('我', px, py+11);
    if(r.same) tag(px, g.keepBelow ? py+86 : py-134, '🎯 想继续做');
    // 图例
    var ly = cy + R + 150, items = [['me','现在的我'], ['want', r.same?'想继续做':'想成为']]; if(!r.same) items.push(['arc','成长方向']);
    ctx.font = '600 30px ' + font;
    var widths = items.map(function(it){ return ctx.measureText(it[1]).width + 56 }), total = widths.reduce(function(a,b){return a+b},0) + 44*(items.length-1), lx = cx - total/2;
    items.forEach(function(it, i){
      var mx = lx + 16;
      if(it[0]==='me'){ ctx.beginPath(); ctx.arc(mx, ly-10, 12, 0, Math.PI*2); ctx.fillStyle = P.dot; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = qc; ctx.stroke() }
      else if(it[0]==='want'){ ctx.fillStyle = wc; ctx.beginPath(); ctx.moveTo(mx,ly-25); ctx.lineTo(mx+15,ly-10); ctx.lineTo(mx,ly+5); ctx.lineTo(mx-15,ly-10); ctx.closePath(); ctx.fill() }
      else { ctx.strokeStyle = wc; ctx.lineWidth = 5; ctx.setLineDash([8,7]); ctx.beginPath(); ctx.moveTo(mx-16, ly-10); ctx.lineTo(mx+20, ly-10); ctx.stroke(); ctx.setLineDash([]) }
      ctx.fillStyle = P.ink2; ctx.textAlign = 'left'; ctx.fillText(it[1], lx + 48, ly); ctx.textAlign = 'center';
      lx += widths[i] + 44;
    });
    return ly + 10;
  }

  return {quadSVG:quadSVG, radarSVG:radarSVG, animate:animate, drawQuad:drawQuad, geom:geom, CENTER:CENTER};
})();
