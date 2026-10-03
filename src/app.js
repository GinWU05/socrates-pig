(function(){
  'use strict';
  /* ================= DATA =================
   * 轴 A（a）：+ 苏格拉底（思考追问） / − 猪（享受当下）
   * 轴 B（b）：+ 快乐 / − 痛苦（真实感受）
   * 每个选项可只计一个轴，也可两轴都计；分值 −2…+2。
   */
  var QUESTIONS = [
    {tag:'周末', q:'周六早上自然醒，一整天没有任何安排。你会——', o:[
      ['翻开那本搁置半年的书，顺便想想人生方向', {a:2}],
      ['去一家新开的咖啡馆，边喝边观察路人在想什么', {a:1,b:1}],
      ['约朋友吃顿早午餐，聊点轻松八卦', {a:-1,b:1}],
      ['翻个身继续睡。周末，本来就是拿来浪费的', {a:-2}]]},
    {tag:'醒来', q:'最近一周，你早上醒来的第一感觉更接近——', o:[
      ['期待：今天有想做的事', {b:2}],
      ['平静：还行，过一天算一天', {b:1}],
      ['疲惫：还没开始就想下班', {b:-1}],
      ['沉重：不太想面对这一天', {b:-2}]]},
    {tag:'深夜', q:'凌晨一点，你突然意识到「人终有一死」。接下来——', o:[
      ['越想越慌，彻底睡不着了', {a:2,b:-2}],
      ['有点感慨，想清楚这辈子想怎么过，反而踏实了', {a:2,b:1}],
      ['打开外卖 App：既然如此，先吃顿好的', {a:-2,b:1}],
      ['赶紧刷点短视频把这个念头压下去，但心里有点空', {a:-2,b:-1}]]},
    {tag:'笑', q:'回想过去一个月，你真心笑出声的次数——', o:[
      ['数不过来，我很容易被逗乐', {b:2}],
      ['有一些，主要是和喜欢的人在一起时', {b:1}],
      ['不太记得了，好像没什么特别的', {b:-1}],
      ['好像很久没真正开心过了', {b:-2}]]},
    {tag:'选择', q:'工作稳定但每天重复。有人邀请你去做一件有意义、却很不确定的事——', o:[
      ['心动了：「不确定」才是活着的证据', {a:2,b:1}],
      ['列了一张利弊表，列到第三页，越列越焦虑', {a:2,b:-1}],
      ['稳定就是福气，按时下班也是一种修行', {a:-2,b:1}],
      ['想走又不敢，留下又不甘，一直拧巴着', {a:-1,b:-2}]]},
    {tag:'灵魂拷问', q:'朋友突然问你：「你现在幸福吗？」你的第一反应是——', o:[
      ['「先定义一下什么叫幸福。」然后真聊了一小时，挺开心', {a:2,b:1}],
      ['「……这个问题我不太敢细想。」', {a:1,b:-2}],
      ['「挺幸福的啊，今天奶茶点了全糖。」', {a:-2,b:2}],
      ['「还行吧。」然后换了个话题', {a:-1,b:-1}]]},
    {tag:'争论', q:'你深信不疑的一个观点，被别人有理有据地驳倒了。你——', o:[
      ['竟然有点兴奋：终于有人让我想得更深', {a:2,b:1}],
      ['心里很堵，回家查了一晚上资料，还是睡不好', {a:1,b:-2}],
      ['求同存异嘛，没必要争个输赢', {a:-1,b:1}],
      ['不想聊这些了，好累', {a:-2,b:-1}]]},
    {tag:'思想实验', q:'有一颗药丸：吃下后永远满足、无忧无虑，代价是再也不会思考深刻的问题。你——', o:[
      ['坚决不吃。困惑也是「我」的一部分', {a:2}],
      ['说实话有点想吃……最近想得太累了', {a:1,b:-2}],
      ['不用吃，我现在就挺满足的', {a:-1,b:2}],
      ['还有这种好事？麻烦来两颗', {a:-2}]]},
    {tag:'夜晚', q:'下班到家，你最常见（不是最理想）的夜晚是——', o:[
      ['一个人看书或写点东西，很享受', {a:2,b:1}],
      ['想做点有意义的事，结果瘫着刷手机，然后自责', {a:1,b:-2}],
      ['追剧配零食，大脑放空，舒舒服服', {a:-2,b:1}],
      ['累到什么都不想干，躺着发呆到很晚', {a:-1,b:-1}]]},
    {tag:'被评价', q:'有人对你说：「你就是想太多了。」你心里的第一句话是——', o:[
      ['不是我想太多，是大家想太少', {a:2}],
      ['也许吧……可我就是停不下来，好累', {a:1,b:-2}],
      ['有道理，我是该松弛一点了', {a:-1}],
      ['我？想太多？这辈子头一回听说', {a:-2,b:1}]]},
    {tag:'一顿饭', q:'一顿特别好吃的饭摆在你面前，你通常——', o:[
      ['全情投入，吃到眯眼，世界都安静了', {a:-2,b:2}],
      ['边吃边琢磨这道菜是怎么做出来的，很有意思', {a:1,b:1}],
      ['吃着吃着想起还没做完的事，味道淡了', {a:1,b:-2}],
      ['拍照、吃完，其实没太大感觉', {a:-1,b:-1}]]},
    {tag:'独处', q:'一个人待着、什么也不做的时候，你的感觉通常是——', o:[
      ['自在，像给自己充电', {b:2}],
      ['还好，有点无聊但能接受', {b:1}],
      ['有点慌，总觉得该做点什么', {b:-1}],
      ['孤单，或者很容易难过', {b:-2}]]},
    {tag:'终章', q:'很多年以后，你希望自己的墓志铭上写着——', o:[
      ['「此人一生都在追问，直到最后一刻」', {a:2}],
      ['「认真地想过，也认真地爱过」', {a:1,b:1}],
      ['「此人吃得很好，睡得很香」', {a:-2,b:1}],
      ['「终于可以好好休息了」', {a:-1,b:-2}]]}
  ];

  var QORDER = ['SP','SH','PP','PH'];
  var QUADS = {
    SP:{name:'痛苦的苏格拉底', emoji:'🏛️', illu:'soc-s', short:'想得很深，也常常很累',
      sub:'「未经审视的人生不值得过」——可审视，也真的很累。',
      desc:'你的大脑很少真正下班：别人看见一朵花，你看见无常；别人点完菜，你还在想选择的意义。你的痛苦，很大一部分来自看得太清楚、要求得太高。这份清醒是天赋，也是重量——世界上那些重要的问题，正是被你这样的人问出来的。只是记得，提问不必以折磨自己为代价。',
      tags:['#追问到底','#深夜哲学家','#清醒的代价']},
    SH:{name:'快乐的苏格拉底', emoji:'💡', illu:'soc-h', short:'追问本身就让你快乐',
      sub:'思考对你来说，不是负担，而是一种玩。',
      desc:'你爱追问，而且乐在其中：一个好问题能让你兴奋一整天，想不通的事也不太会把你压垮。你把好奇心当成燃料，而不是鞭子。这是很难得的状态——伊壁鸠鲁和苏格拉底大概都会想请你吃顿饭，然后聊到深夜。',
      tags:['#好奇心旺盛','#想得明白也睡得着','#人间清醒']},
    PP:{name:'痛苦的猪', emoji:'🌧️', illu:'pig-s', short:'不想多想，却也不太开心',
      sub:'没想太多，可日子也没那么好过。',
      desc:'你没有在拼命追问什么，却也没怎么尝到「享受当下」的甜。也许你只是累了：被日程、压力或者一些说不清的东西耗着，想放空却放不下，想开心却提不起劲。这不是你的错，也不代表你就是这样的人——它更像一段需要被好好照顾的时期。',
      tags:['#电量不足','#需要被照顾','#慢慢来也可以']},
    PH:{name:'快乐的猪', emoji:'🐷', illu:'pig-h', short:'活在当下，知足常乐',
      sub:'「满足」本身就是一种天赋。',
      desc:'恭喜你，拥有这个时代最稀缺的能力之一：知足。别人在焦虑意义，你在晒太阳；别人辗转反侧，你一夜好眠。密尔或许会为你惋惜，但庄子大概会对你会心一笑——「子非猪，安知猪之乐？」',
      tags:['#知足常乐','#吃饱睡好','#内耗绝缘体']}
  };

  // 建议：key = 现在>想成为
  var TIPS = {
    'SP>SH':['给追问设一个「下班时间」：比如晚上十点后，脑子里冒出的问题先写进本子，明天白天再审。',
      '把「我为什么做不好」换成「我好奇接下来会怎样」——同样是提问，后者不伤人。',
      '每周做一件只为好玩、不为意义的事（拼图、散步、做饭都行），做完不复盘。',
      '找一个能一起聊想法的人。问题被说出来，往往就轻了一半。'],
    'SP>PP':['你想要的，也许只是「少想一点」。可以先把小决定交给默认值：固定早餐、固定通勤路线，给大脑减负。',
      '不过请留意：痛苦未必来自想太多，停止思考不一定就能止痛。',
      '比起变成「痛苦的猪」，可以先允许自己当一阵「歇着的苏格拉底」：暂时不追问，也不责怪自己。',
      '如果低落持续两周以上，别一个人扛，找信任的人或专业的心理咨询聊聊。'],
    'SP>PH':['从身体开始：睡够、晒太阳、走路二十分钟——快乐有时比「想通」先到。',
      '每天记下一件「不需要意义也很好」的小事，比如一口热汤、一阵好风。',
      '遇到想不通的问题，试着说一句「先放这儿」，然后真的去吃饭。',
      '你不必放弃思考，只是不用每时每刻都在想。'],
    'SH>SP':['你可能觉得快乐显得不够深刻。其实深刻不需要以痛苦为门票。',
      '如果想离问题的锋利处更近，挑一个真正困扰你的议题，允许自己在不舒服里多待一会儿，不急着得出轻松的答案。',
      '读一本让你不舒服的书，或者和观点相反的人认真聊一次。',
      '记得给自己留好退路：好奇心是你的底色，别把它换成自我折磨。'],
    'SH>PP':['也许你只是想让脑子歇一歇。给自己放一个「不思考假期」：一周不读深度内容，只做手上的事。',
      '松弛和快乐可以同时存在，不必为了放下而让自己不开心。',
      '留意一下：是不是有一件需要想清楚的事，你在回避？先面对那一件，再去休息。'],
    'SH>PH':['练习「先享受，后评论」：吃饭、看电影时先专心体验，结束后再分析。',
      '每天留一段完全不需要输出、不需要成长的时间。',
      '把一些问题交给时间，而不是交给自己。'],
    'PP>SP':['痛苦里常常藏着问题：试着把「我好烦」写成一句具体的话——「我在烦什么」。',
      '每周留一小时给一个长内容：一本书、一篇长文、一部纪录片，看完写三句感想。',
      '开始思考时，可能会一时更不舒服，这很正常；但别一个人扛，找个能聊的人。'],
    'PP>SH':['先照顾好状态：睡眠、饮食、动一动，比任何道理都管用。',
      '每天写三行：今天发生了什么、我感觉如何、我想要什么——这就是苏格拉底式的开始。',
      '找一个让你好奇的小问题去追，比如一道菜的做法、一座城市的历史。',
      '允许自己慢一点。从痛苦走到快乐的思考，没有捷径，但每一步都算数。'],
    'PP>PH':['你可能离快乐只差一点「专心」：吃饭时放下手机，散步时不想工作。',
      '减少那些让你更空的「快乐替代品」（无尽的短视频、熬夜），换成真正让你满足的小事。',
      '找回一件小时候就喜欢、但很久没做的事，这周就做一次。',
      '如果疲惫或低落一直挥之不去，和信任的人或专业人士聊聊，这不丢人。'],
    'PH>SP':['你也许向往深刻。可以从一个问题开始，不用急着变痛苦。',
      '找一本经典慢慢读，每章写一句自己的看法，哪怕只有一句。',
      '快乐不是浅薄的证据，别为了「显得深刻」丢掉它。'],
    'PH>SH':['每天问自己一个「为什么」：为什么我喜欢这个？为什么它让我舒服？',
      '把享受变成探索：喜欢吃，就学着做；喜欢旅行，就读读那个地方的历史。',
      '和一个爱思考的朋友约一个固定的聊天时间，比如每月一次长谈。'],
    'PH>PP':['先说一句：快乐本身就很珍贵，不需要为它感到愧疚。',
      '如果你觉得快乐有点「空」，可能是想要更多真实的情绪——允许自己去感受遗憾、悲伤，而不是刻意追求痛苦。',
      '看一部让人哭的电影，或者写一封不寄出的信，让情绪有个出口。'],
    'SP>SP':['清醒值得珍惜，但痛苦不是勋章：给沉思设个上限，比如每天一段固定时间。',
      '找到同类：一个能和你一起想问题的人，会让追问变轻。',
      '留意身体的信号：持续失眠或低落时，请及时寻求专业帮助。'],
    'SH>SH':['保护你的好奇心：每隔一段时间，主动接触一个全新的领域。',
      '别让思考变成 KPI，保留「想着玩」的那部分。',
      '把你的快乐分享出去——告诉身边的人，提问也可以很开心。'],
    'PP>PP':['你愿意接纳此刻的自己，这很难得。只是别把「不开心」当成必须忍受的常态。',
      '每天给自己一点小小的舒适：一杯热饮、早睡半小时、一段喜欢的歌。',
      '如果疲惫长期挥之不去，和信任的人或专业人士聊聊，你值得被照顾。'],
    'PH>PH':['继续守护你的知足，别被别人的焦虑带跑。',
      '偶尔走出舒适区，不是为了变深刻，而是让快乐更有弹性。',
      '把好状态当成资源，照顾一下身边正在辛苦的人。']
  };

  function quadQ(tag, q){
    return {tag:tag, q:q, quad:true, o:QORDER.map(function(k){ return [QUADS[k].name, {q:k}] })};
  }
  var WISH_Q = quadQ('最后一题 · 不计分', '如果可以选，你想成为这四个里的哪一个？');
  var SELF_Q = quadQ('速通 · 自评', '你觉得自己现在是哪一个？');
  var WISH_Q2 = quadQ('速通 · 自评', '你想成为哪一个？');

  // 每题每轴的最大绝对值，用于归一化
  QUESTIONS.forEach(function(q){
    q.ma = Math.max.apply(null, q.o.map(function(o){ return Math.abs(o[1].a||0) }));
    q.mb = Math.max.apply(null, q.o.map(function(o){ return Math.abs(o[1].b||0) }));
  });
  window.__SP = {QUESTIONS:QUESTIONS, QUADS:QUADS, TIPS:TIPS};

  var P = window.POSTER_THEME;
  var $ = function(id){return document.getElementById(id)};
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var screens = {cover:$('cover'), quiz:$('quiz'), result:$('result')};
  var current = 'cover';
  var mode = 'full', list = [], idx = 0, answers = [], order = [], busy = false;
  var FULL_TOTAL = QUESTIONS.length + 1;
  $('metaCount').textContent = FULL_TOTAL;
  $('fullBtn').innerHTML = '📝 做完整版（' + FULL_TOTAL + ' 题）';

  function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t}return a}
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}

  function show(name){
    if(name===current) return;
    var from = screens[current], to = screens[name];
    from.classList.add('leave'); from.classList.remove('active');
    setTimeout(function(){from.classList.remove('leave')}, 650);
    to.classList.add('active');
    current = name; document.body.setAttribute('data-screen', name);
    window.scrollTo({top:0, behavior:'auto'});
  }
  function setQuadTint(k){ if(k) document.body.setAttribute('data-q', k); else document.body.removeAttribute('data-q') }

  function compute(){
    var sa=0, sb=0, da=0, db=0;
    for(var i=0;i<QUESTIONS.length;i++){
      var an = answers[i]; if(!an) continue;
      var q = QUESTIONS[i], v = q.o[an.i][1];
      if(q.ma){ sa += (v.a||0); da += q.ma }
      if(q.mb){ sb += (v.b||0); db += q.mb }
    }
    return {A: da? sa/da : 0, B: db? sb/db : 0};
  }
  function keyOf(A,B){ return (A>=0?'S':'P') + (B>=0?'H':'P') }
  // 坐标：x 左=苏格拉底(A+)，右=猪；y 上=快乐(B+)，下=痛苦
  function pos(A,B){ var c=function(v){return Math.max(.17,Math.min(.83,.5-v*.5))}; return {x:c(A), y:c(B)} }
  var CENTER = {SH:{A:.5,B:.5}, PH:{A:-.5,B:.5}, SP:{A:.5,B:-.5}, PP:{A:-.5,B:-.5}};

  function updateProgress(){
    var done = 0; for(var i=0;i<list.length;i++) if(answers[i]) done++;
    var pct = Math.round(done/list.length*100);
    $('fill').style.width = pct + '%';
    $('track').setAttribute('aria-valuenow', pct);
    $('qNum').textContent = Math.min(idx+1, list.length);
    $('backBtn').setAttribute('aria-label', idx===0 ? '返回首页' : '上一题');
    if(mode==='full'){
      var r = compute(), p = pos(r.A, r.B);
      $('mqDot').style.left = (p.x*100) + '%'; $('mqDot').style.top = (p.y*100) + '%';
    }
  }

  function renderQuestion(dir){
    var stage = $('stage');
    var q = list[idx];
    var old = stage.querySelector('.qcard:not(.out)');
    if(old){
      old.classList.add('out'); if(dir==='back') old.classList.add('back');
      setTimeout(function(){ if(old.parentNode) old.parentNode.removeChild(old) }, reduce?0:350);
    }
    var card = document.createElement('div');
    card.className = 'qcard card in' + (dir==='back'?' back':'');
    var keys = 'ABCD';
    var num = mode==='full' ? (q.quad ? '' : 'Q' + (idx+1) + ' · ') : '';
    var html = '<div class="qhead"><span class="qtag' + (q.quad?' special':'') + '">' + num + esc(q.tag) + '</span><h2 class="qtext">' + esc(q.q) + '</h2></div><ul class="opts" role="list">';
    order[idx].forEach(function(oi, k){
      var picked = answers[idx] && answers[idx].i===oi;
      var o = q.o[oi], inner;
      if(q.quad){ var Qd = QUADS[o[1].q]; inner = '<span class="em" aria-hidden="true">' + Qd.emoji + '</span><span class="txt"><b>' + Qd.name + '</b><small>' + Qd.short + '</small></span>'; }
      else inner = '<span class="key">' + keys[k] + '</span><span class="txt">' + esc(o[0]) + '</span>';
      html += '<li style="display:contents"><button class="opt' + (picked?' picked':'') + '" data-i="' + oi + '"' + (q.quad?' data-q="'+o[1].q+'"':'') + '>' + inner + '</button></li>';
    });
    html += '</ul>';
    card.innerHTML = html;
    card.style.animationDelay = (old && !reduce ? 180 : 0) + 'ms';
    stage.appendChild(card);
    card.querySelectorAll('.opt').forEach(function(b){ b.addEventListener('click', onPick) });
    updateProgress();
    busy = false;
  }

  function onPick(e){
    if(busy) return; busy = true;
    var btn = e.currentTarget, i = +btn.getAttribute('data-i');
    var r = btn.getBoundingClientRect(), size = Math.max(r.width, r.height);
    var rip = document.createElement('span'); rip.className='ripple';
    var x = (e.clientX || r.left + r.width/2) - r.left - size/2, y = (e.clientY || r.top + r.height/2) - r.top - size/2;
    rip.style.cssText = 'width:'+size+'px;height:'+size+'px;left:'+x+'px;top:'+y+'px';
    btn.appendChild(rip);
    btn.parentNode.parentNode.querySelectorAll('.opt').forEach(function(o){ o.classList.toggle('picked', o===btn); o.classList.toggle('dim', o!==btn) });
    answers[idx] = {i:i};
    if(navigator.vibrate) try{navigator.vibrate(8)}catch(_){}
    updateProgress();
    setTimeout(function(){
      if(idx < list.length-1){ idx++; renderQuestion('fwd') }
      else showResult();
    }, reduce ? 120 : 420);
  }

  function start(m){
    mode = m || 'full';
    list = mode==='full' ? QUESTIONS.concat([WISH_Q]) : [SELF_Q, WISH_Q2];
    idx = 0; answers = []; busy = false;
    order = list.map(function(q){ var ix = q.o.map(function(_,i){return i}); return q.quad ? ix : shuffle(ix) });
    $('stage').innerHTML = '';
    $('qTotal').textContent = list.length;
    $('qMode').textContent = mode==='full' ? '完整版' : '⚡ 速通版';
    $('mq').hidden = mode!=='full';
    $('qHint').textContent = mode==='full' ? '没有标准答案，凭第一直觉选 · 可随时返回上一题' : '速通版是自评，不计分 · 想更准可以做完整版';
    $('mqDot').style.left = '50%'; $('mqDot').style.top = '50%';
    setQuadTint(null); closeShare(true); hideConfirm();
    hset('quiz', current==='cover');
    show('quiz');
    renderQuestion('fwd');
  }

  /* ================= RESULT ================= */
  var lastResult = null;
  function makeResult(md, cur, want, A, B){
    return {mode:md, cur:cur, want:want, A:A, B:B, same:cur===want, tips:TIPS[cur + '>' + want],
      think: Math.round((A+1)/2*100), happy: Math.round((B+1)/2*100)};
  }
  function showResult(){
    var cur, want, A, B;
    var wq = list[list.length-1];
    want = wq.o[answers[list.length-1].i][1].q;
    if(mode==='full'){ var r = compute(); A = r.A; B = r.B; cur = keyOf(A,B) }
    else { cur = SELF_Q.o[answers[0].i][1].q; A = CENTER[cur].A; B = CENTER[cur].B }
    lastResult = makeResult(mode, cur, want, A, B);
    var same = lastResult.same, tips = lastResult.tips;
    window.__lastResult = lastResult;
    var Q = QUADS[cur], W = QUADS[want];

    setQuadTint(cur);
    var kick = $('rKicker');
    kick.textContent = mode==='full' ? '你 的 测 试 结 果' : '⚡ 速通版·自评';
    kick.className = 'kicker' + (mode==='full' ? '' : ' speed');
    $('illu').innerHTML = '<div class="halo"></div><div class="disc"></div><svg class="avatar" aria-hidden="true"><use href="#' + Q.illu + '"/></svg>';
    $('rTitle').textContent = Q.emoji + ' ' + Q.name;
    $('rSub').textContent = Q.sub;
    $('rWish').innerHTML = same ? '你现在是 <b>' + Q.name + '</b>，你想成为的，也正是 <b>' + W.name + '</b>'
                                : '你现在是 <b>' + Q.name + '</b>，你想成为 <b>' + W.name + '</b>';
    $('rDesc').textContent = Q.desc;
    $('rTags').innerHTML = Q.tags.map(function(t){return '<span>'+t+'</span>'}).join('');
    var sc = $('rScores');
    sc.className = 'scores' + (mode==='full' ? '' : ' plain');
    sc.innerHTML = mode==='full'
      ? '<span>思考追问 ' + lastResult.think + '% · 享受当下 ' + (100-lastResult.think) + '%</span><span>快乐 ' + lastResult.happy + '% · 痛苦 ' + (100-lastResult.happy) + '%</span>'
      : '<span>速通版为自评结果，不计分；完整版会根据 ' + QUESTIONS.length + ' 道题算出你的真实坐标</span>';
    // tips
    $('tipsTitle').innerHTML = same ? '如何健康地做<span class="nw">「' + Q.name + '」</span>' : '从<span class="nw">「' + Q.name + '」</span>走向<span class="nw">「' + W.name + '」</span>';
    $('tipsSub').textContent = same ? '你喜欢现在的自己——这本身就很好。几个小提醒，帮你把这份状态保持得更久：'
                                    : '不必一步到位，挑一条最容易的，今天就试试：';
    $('tipsList').innerHTML = tips.map(function(t){ return '<li>' + esc(t) + '</li>' }).join('');
    // chart
    chartView = 'quad';
    $('ctabs').hidden = mode!=='full';
    $('fullBtn').hidden = mode==='full';
    $('retryTxt').textContent = mode==='full' ? '再测一次' : '重新速通';
    var rc = $('rcard'); rc.classList.remove('reveal'); void rc.offsetWidth; rc.classList.add('reveal');
    var tp = $('tips'); tp.style.animation='none'; void tp.offsetWidth; tp.style.animation='';
    hset('result', false);
    show('result');
    renderChart(false);
    setTimeout(function(){ renderChart(true) }, reduce ? 0 : 950);
    setTimeout(confetti, reduce ? 0 : 1300);
    prepPoster();
  }

  var chartView = 'quad';
  function renderChart(play){
    var r = lastResult, box = $('cbox');
    box.innerHTML = chartView==='radar' ? SPChart.radarSVG(r) : SPChart.quadSVG(r);
    $('ctabs').querySelectorAll('.ctab').forEach(function(b){ var on = b.getAttribute('data-v')===chartView; b.classList.toggle('on', on); b.setAttribute('aria-selected', on) });
    $('legend').innerHTML = chartView==='radar'
      ? '<span><i class="larea"></i>你的四项得分（%）</span><span>思考 + 享受 = 100 · 快乐 + 痛苦 = 100</span>'
      : '<span><i class="lme"></i>现在的我</span><span><i class="lwant"></i>' + (r.same ? '想继续做' : '想成为') + '</span>' + (r.same ? '' : '<span><i class="larc"></i>成长方向</span>');
    if(play) SPChart.animate(box, r, reduce);
  }
  $('ctabs').addEventListener('click', function(e){
    var b = e.target.closest('.ctab'); if(!b || !lastResult) return;
    var v = b.getAttribute('data-v'); if(v===chartView) return;
    chartView = v; renderChart(true);
  });

  function confetti(){
    if(reduce) return;
    var rc = $('rcard'), cs = getComputedStyle(document.body), cols = [cs.getPropertyValue('--qc').trim()||'#fff', cs.getPropertyValue('--acc').trim(), cs.getPropertyValue('--ink').trim()];
    for(var i=0;i<20;i++){
      var sp = document.createElement('i'); sp.className='spark';
      var ang = Math.random()*Math.PI*2, dist = 80 + Math.random()*110;
      sp.style.setProperty('--x', Math.cos(ang)*dist+'px'); sp.style.setProperty('--y', (Math.sin(ang)*dist - 30)+'px');
      sp.style.setProperty('--r', (Math.random()*540-270)+'deg');
      sp.style.background = cols[i%cols.length]; sp.style.top = '14%';
      sp.style.animationDelay = (Math.random()*.15)+'s';
      rc.appendChild(sp);
      (function(n){ setTimeout(function(){ n.remove() }, 1800) })(sp);
    }
  }

  function toast(msg){
    var t = $('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(function(){ t.classList.remove('show') }, 2000);
  }

  /* ================= SHARE IMAGE (pure canvas) ================= */
  var FONT_T = P.titleFont==='sans' ? '"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC",sans-serif' : '"Songti SC","STSong","Noto Serif CJK SC","Source Han Serif SC",serif';
  var FONT_S = '-apple-system,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC",sans-serif';
  function svgAvatarURL(id){
    var defs = document.querySelector('svg defs').outerHTML;
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="480" height="480">' + defs + document.getElementById(id).innerHTML + '</svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
  function loadImg(src){ return new Promise(function(res, rej){ var im = new Image(); im.onload = function(){res(im)}; im.onerror = rej; im.src = src }) }
  function wrap(ctx, text, maxW){
    // 中文换行：行首禁则（标点、」、——等不出现在行首，悬挂到上一行末）
    var lines = [], line = '', noStart = '，。、；：？！」』）》…—,.;:?!)%';
    for(var i=0;i<text.length;i++){
      var ch = text[i], test = line + ch;
      if(ctx.measureText(test).width > maxW && line){
        if(noStart.indexOf(ch) > -1){
          line = test; while(i+1 < text.length && noStart.indexOf(text[i+1]) > -1){ line += text[++i] }
          lines.push(line); line = ''; continue;
        }
        lines.push(line); line = ch;
      } else line = test;
    }
    if(line) lines.push(line);
    return lines;
  }
  // 均衡换行：行数不变的前提下尽量缩窄，避免最后一行只剩两三个字
  function wrapBal(ctx, text, maxW){
    var base = wrap(ctx, text, maxW); if(base.length < 2) return base;
    var lo = maxW*.4, hi = maxW;
    for(var i=0;i<18;i++){ var mid = (lo+hi)/2; if(wrap(ctx, text, mid).length > base.length) lo = mid; else hi = mid }
    return wrap(ctx, text, hi);
  }
  function rr(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath() }
  function grad(ctx,x0,y0,x1,y1,c){ var g = ctx.createLinearGradient(x0,y0,x1,y1); c.forEach(function(col,i){ g.addColorStop(c.length>1?i/(c.length-1):0, col) }); return g }

  function drawPoster(r){
    var Q = QUADS[r.cur], Wq = QUADS[r.want], W = 1080, PAD = 120, CW = W - 2*PAD;
    var cv = document.createElement('canvas'); cv.width = W; cv.height = 10;
    var ctx = cv.getContext('2d');
    var qc = P.q[r.cur], wc = P.want || P.ink2;
    // ---- 第一遍：测量排版 ----
    var L = {};
    L.head = 150; L.pill = r.mode!=='full' ? 182 : 0;
    L.ay = r.mode!=='full' ? 420 : 390; L.aR = 140;
    L.kick = L.ay + L.aR + 70; L.title = L.kick + 116;
    ctx.font = '400 40px ' + FONT_S; L.subL = wrapBal(ctx, Q.sub, CW).slice(0,2);
    L.sub = L.title + 70; L.wishY = L.sub + (L.subL.length-1)*56 + 44;
    L.wishT = r.same ? '我想成为的，也正是「' + Wq.name + '」' : '我想成为  🎯 ' + Wq.name;
    var CR = 300; L.cy = L.wishY + 92 + 110 + CR; L.CR = CR;
    L.chartEnd = L.cy + CR + 150;                       // 含图例
    L.scores = r.mode==='full'
      ? ['思考追问 ' + r.think + '%  ·  享受当下 ' + (100-r.think) + '%', '快乐 ' + r.happy + '%  ·  痛苦 ' + (100-r.happy) + '%']
      : ['速通版为自评结果，未计分'];
    L.scoreY = L.chartEnd + 40;
    var tipsTop = L.scoreY + L.scores.length*64 + 40;
    var TPAD = 56, TW = W - 2*(PAD-30) - 2*TPAD - 76, LH = 64;
    ctx.font = '800 46px ' + FONT_T;
    // 建议标题按语义断行：放得下就一行，否则「从 X」/「走向 Y」两行
    (function(){
      var full = r.same ? '🧭 如何健康地做「' + Q.name + '」' : '🧭 从「' + Q.name + '」走向「' + Wq.name + '」', mw = W - 2*(PAD-30) - 2*TPAD;
      L.tTitle = ctx.measureText(full).width <= mw ? [full] : (r.same ? ['🧭 如何健康地做', '「' + Q.name + '」'] : ['🧭 从「' + Q.name + '」', '走向「' + Wq.name + '」']);
    })();
    ctx.font = '400 40px ' + FONT_S;
    L.tips = r.tips.map(function(t){ return wrapBal(ctx, t, TW) });
    var tipsH = TPAD + L.tTitle.length*62 + 30 + L.tips.reduce(function(s,l){ return s + l.length*LH + 34 }, 0) + TPAD - 34;
    L.tipsTop = tipsTop; L.tipsH = tipsH;
    var H = tipsTop + tipsH + 300;
    // ---- 第二遍：绘制 ----
    cv.height = H; ctx = cv.getContext('2d');
    ctx.fillStyle = grad(ctx,0,0,W*.4,H,P.bg); ctx.fillRect(0,0,W,H);
    function glow(x,y,rad,col,a){ if(!a) return; var g = ctx.createRadialGradient(x,y,0,x,y,rad); g.addColorStop(0,col); g.addColorStop(1,'rgba(0,0,0,0)'); ctx.globalAlpha=a; ctx.fillStyle=g; ctx.fillRect(0,0,W,H); ctx.globalAlpha=1 }
    var gl = P.glows || [qc, P.acc], G = function(c){ return c==='q' ? qc : c };
    glow(W*.12,H*.06,700,G(gl[0]),P.glow); glow(W*.95,H*.36,620,G(gl[1]),P.glow*.7); glow(W*.25,H*1.0,700,G(gl[0]),P.glow*.6);
    var cx0 = 50, cy0 = 50, cw = W-100, ch = H-100;
    rr(ctx,cx0,cy0,cw,ch,P.radius); ctx.fillStyle = P.panel; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.stroke; ctx.stroke();
    if(P.rule){ ctx.fillStyle = P.acc; ctx.fillRect(cx0, cy0, cw, 14) }
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = P.ink2; ctx.font = '600 36px ' + FONT_S;
    ctx.fillText('你是痛苦的苏格拉底，还是快乐的猪？', W/2, L.head);
    if(L.pill){
      ctx.font = '800 32px ' + FONT_S; var kw = ctx.measureText('⚡ 速通版·自评').width + 56;
      rr(ctx, W/2-kw/2, L.pill, kw, 58, 29); ctx.fillStyle = P.acc; ctx.fill(); ctx.fillStyle = P.accInk; ctx.fillText('⚡ 速通版·自评', W/2, L.pill+41);
    }
    var ax = W/2, ay = L.ay, R = L.aR;
    glow(ax, ay, 280, qc, P.glow*.8);
    ctx.beginPath(); ctx.arc(ax,ay,R,0,Math.PI*2); ctx.fillStyle = P.disc; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = qc; ctx.stroke();
    return loadImg(svgAvatarURL(Q.illu)).then(function(im){ ctx.drawImage(im, ax-112, ay-112, 224, 224) })
    .catch(function(){ ctx.font = '150px ' + FONT_S; ctx.fillText(Q.emoji, ax, ay+52) })
    .then(function(){
      ctx.textAlign = 'center';
      ctx.fillStyle = P.ink2; ctx.font = '600 34px ' + FONT_S; ctx.fillText('我 现 在 是', W/2, L.kick);
      ctx.fillStyle = P.ink; ctx.font = '900 104px ' + FONT_T; ctx.fillText(Q.name, W/2, L.title);
      ctx.fillStyle = P.ink2; ctx.font = '400 40px ' + FONT_S;
      L.subL.forEach(function(l,i){ ctx.fillText(l, W/2, L.sub + i*56) });
      ctx.font = '800 42px ' + FONT_S; var ww = Math.min(CW + 60, ctx.measureText(L.wishT).width + 96);
      rr(ctx, W/2-ww/2, L.wishY, ww, 92, 46); ctx.fillStyle = P.inset; ctx.fill(); ctx.strokeStyle = wc; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = P.ink; ctx.fillText(L.wishT, W/2, L.wishY + 61);
      // 维度图
      SPChart.drawQuad(ctx, W/2, L.cy, L.CR, P, r, FONT_S);
      // 分数
      ctx.font = '600 34px ' + FONT_S;
      L.scores.forEach(function(t, i){
        var y = L.scoreY + i*64, w = ctx.measureText(t).width + 56;
        if(r.mode==='full'){ rr(ctx, W/2-w/2, y, w, 52, 26); ctx.fillStyle = P.inset; ctx.fill(); ctx.strokeStyle = P.stroke; ctx.lineWidth = 2; ctx.stroke() }
        ctx.fillStyle = P.ink2; ctx.fillText(t, W/2, y + 38);
      });
      // 建议
      var tx = PAD-30, tw = W - 2*tx, y0 = L.tipsTop;
      rr(ctx, tx, y0, tw, L.tipsH, 36); ctx.fillStyle = P.inset; ctx.fill(); ctx.strokeStyle = P.stroke; ctx.lineWidth = 2; ctx.stroke();
      ctx.textAlign = 'left'; ctx.fillStyle = P.ink; ctx.font = '800 46px ' + FONT_T;
      var yy = y0 + TPAD + 44;
      L.tTitle.forEach(function(l){ ctx.fillText(l, tx + TPAD, yy); yy += 62 });
      yy += 30 - 62 + 62;
      L.tips.forEach(function(lines, i){
        rr(ctx, tx + TPAD, yy-42, 54, 54, 15); ctx.fillStyle = P.acc; ctx.fill();
        ctx.fillStyle = P.accInk; ctx.font = '800 32px ' + FONT_S; ctx.textAlign='center'; ctx.fillText(String(i+1), tx + TPAD + 27, yy-4);
        ctx.textAlign='left'; ctx.fillStyle = P.ink; ctx.font = '400 40px ' + FONT_S;
        lines.forEach(function(l, j){ ctx.fillText(l, tx + TPAD + 76, yy + j*LH) });
        yy += lines.length*LH + 34;
      });
      // 页脚
      ctx.textAlign = 'center';
      ctx.strokeStyle = P.stroke; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(PAD,H-236); ctx.lineTo(W-PAD,H-236); ctx.stroke();
      ctx.fillStyle = P.ink2; ctx.font = 'italic 400 32px ' + FONT_T;
      ctx.fillText('「做不满足的苏格拉底，胜过做满足的傻瓜。」', W/2, H-170);
      ctx.fillText('—— 密尔', W/2, H-124);
      ctx.fillStyle = P.ink; ctx.font = '700 36px ' + FONT_S;
      ctx.fillText('你是四个里的哪一个？来测测看 →', W/2, H-74);
      return cv;
    });
  }
  window.__SP.posterFor = function(o){ // 测试/预览用：按指定结果生成结果图 dataURL
    var rr0 = makeResult(o.mode||'full', o.cur || keyOf(o.A,o.B), o.want, o.A, o.B);
    return drawPoster(rr0).then(function(cv){ return cv.toDataURL('image/png') });
  };

  var poster = null, posterP = null;
  function prepPoster(){
    poster = null;
    var snap = lastResult;
    posterP = drawPoster(snap).then(function(cv){
      return new Promise(function(res){ cv.toBlob ? cv.toBlob(function(b){ res({cv:cv,b:b}) }, 'image/png') : res({cv:cv,b:null}) });
    }).then(function(o){
      if(snap!==lastResult) return poster;
      var url = o.b ? URL.createObjectURL(o.b) : o.cv.toDataURL('image/png');
      var file = null; try{ if(o.b && typeof File==='function') file = new File([o.b], '苏格拉底还是猪-测试结果.png', {type:'image/png'}) }catch(_){}
      poster = {url:url, file:file};
      return poster;
    });
    posterP.catch(function(err){ console.warn('poster', err) });
    return posterP;
  }
  function canShareFile(f){ try{ return !!(f && navigator.canShare && navigator.share && navigator.canShare({files:[f]})) }catch(_){ return false } }
  function shareNative(p){
    var Q = QUADS[lastResult.cur], Wq = QUADS[lastResult.want];
    return navigator.share({files:[p.file], title:'你是痛苦的苏格拉底，还是快乐的猪？', text:'我现在是「' + Q.name + '」，我想成为「' + Wq.name + '」。你呢？'});
  }
  function onShare(){
    if(!lastResult) return;
    if(poster && canShareFile(poster.file)){
      shareNative(poster).catch(function(e){ if(!e || e.name!=='AbortError') openModal() });
      return;
    }
    openModal();
  }
  var lastFocus = null;
  function openModal(){
    var m = $('shareModal'), img = $('posterImg');
    lastFocus = document.activeElement;
    img.removeAttribute('src'); img.classList.add('loading');
    m.classList.add('open'); $('closeShare').focus();
    hset('result', true, true);
    (poster ? Promise.resolve(poster) : (posterP || prepPoster())).then(function(p){
      if(!p) throw new Error('no poster');
      img.onload = function(){ if(img.naturalWidth) img.style.aspectRatio = img.naturalWidth + ' / ' + img.naturalHeight };
      img.src = p.url; img.classList.remove('loading');
      $('saveBtn').href = p.url;
    }).catch(function(err){ console.warn(err); toast('结果图生成失败，请直接截图'); closeShare() });
  }
  function closeShare(noHist){
    var m = $('shareModal'); if(!m.classList.contains('open')) return;
    m.classList.remove('open');
    if(!noHist && hstate().m){ expectPop++; history.back() }
    if(lastFocus && lastFocus.focus) try{ lastFocus.focus({preventScroll:true}) }catch(_){}
  }
  $('saveBtn').addEventListener('click', function(e){ if(!poster){ e.preventDefault(); return } toast('已开始保存；若无反应，请长按图片保存') });

  $('shareBtn').addEventListener('click', onShare);
  $('closeShare').addEventListener('click', function(){ closeShare() });
  $('shareModal').addEventListener('click', function(e){ if(e.target===this) closeShare() });

  /* ---------- 导航：首页 / 退出确认 / 浏览器与手势返回 ---------- */
  var expectPop = 0;
  function hstate(){ try{ return (history.state && history.state.sp) ? history.state : {sp:'cover'} }catch(_){ return {sp:'cover'} } }
  function hset(sp, push, modal){
    try{ var st = {sp:sp}; if(modal) st.m = 1; history[push ? 'pushState' : 'replaceState'](st, '') }catch(_){}
  }
  function hasProgress(){ if(current!=='quiz') return false; for(var i=0;i<answers.length;i++) if(answers[i]) return true; return false }
  function showCover(){ closeShare(true); hideConfirm(); setQuadTint(null); busy = false; show('cover'); try{ $('startBtn').focus({preventScroll:true}) }catch(_){} }
  // 立即回到首页，并把历史栈退回到首页那一条
  function goHome(){
    var st = hstate(), steps = (st.m ? 1 : 0) + (st.sp!=='cover' ? 1 : 0);
    showCover();
    if(steps){ expectPop++; history.go(-steps) }
  }
  function requestHome(){ if(hasProgress()) askConfirm(); else goHome() }
  var cfReturn = null;
  function askConfirm(){
    cfReturn = document.activeElement;
    $('confirm').classList.add('open'); $('cfStay').focus();
  }
  function hideConfirm(){
    var c = $('confirm'); if(!c.classList.contains('open')) return false;
    c.classList.remove('open');
    if(cfReturn && cfReturn.focus && current==='quiz') try{ cfReturn.focus({preventScroll:true}) }catch(_){}
    return true;
  }
  $('cfStay').addEventListener('click', hideConfirm);
  $('cfExit').addEventListener('click', function(){ hideConfirm(); goHome() });
  $('confirm').addEventListener('click', function(e){ if(e.target===this) hideConfirm() });
  $('quizHomeBtn').addEventListener('click', requestHome);
  window.addEventListener('popstate', function(e){
    if(expectPop > 0){ expectPop--; return }
    var st = (e.state && e.state.sp) ? e.state : {sp:'cover'};
    if($('shareModal').classList.contains('open') && !st.m){ closeShare(true); if(st.sp===current) return }
    if(hideConfirm() && current==='quiz' && st.sp==='cover'){ hset('quiz', true); return } // 确认框打开时再按返回 = 取消
    if(st.sp==='cover'){
      if(current==='quiz' && hasProgress()){ hset('quiz', true); askConfirm(); return } // 留在当前题，询问
      if(current!=='cover') showCover();
      return;
    }
    if(st.sp==='result' && lastResult && current!=='result'){ show('result'); return }
    if(st.sp==='quiz' && current!=='quiz'){ expectPop++; history.back() } // 前进到已结束的答题页：退回
  });
  hset(current, false);

  /* ---------- 禁止页面缩放（iOS Safari 会忽略 user-scalable=no，需要事件兜底） ---------- */
  ['gesturestart','gesturechange','gestureend'].forEach(function(t){ document.addEventListener(t, function(e){ e.preventDefault() }, {passive:false}) });
  document.addEventListener('touchmove', function(e){ if(e.touches && e.touches.length > 1) e.preventDefault() }, {passive:false});
  document.addEventListener('touchstart', function(e){ if(e.touches && e.touches.length > 1) e.preventDefault() }, {passive:false});
  var lastTouchEnd = 0;
  document.addEventListener('touchend', function(e){
    var now = Date.now(), t = e.target;
    // 快速连点非交互区域时阻止双击缩放；按钮/链接上不拦截，保证连续答题点击不丢
    if(now - lastTouchEnd < 320 && !(t.closest && t.closest('button,a,input,select,textarea,label,[role="tab"]'))) e.preventDefault();
    lastTouchEnd = now;
  }, {passive:false});
  document.addEventListener('dblclick', function(e){ e.preventDefault() }, {passive:false});
  $('startBtn').addEventListener('click', function(){ start('full') });
  $('speedBtn').addEventListener('click', function(){ start('speed') });
  $('fullBtn').addEventListener('click', function(){ start('full') });
  $('retryBtn').addEventListener('click', function(){ start(mode) });
  $('homeBtn').addEventListener('click', goHome);
  $('backBtn').addEventListener('click', function(){ if(busy) return; if(idx===0){ requestHome(); return } idx--; renderQuestion('back') });
  document.addEventListener('keydown', function(e){
    if(e.key==='Escape'){ if(!hideConfirm()) closeShare(); return }
    if(current!=='quiz' || $('confirm').classList.contains('open')) return;
    var k = e.key.toUpperCase(), map = {A:0,B:1,C:2,D:3,'1':0,'2':1,'3':2,'4':3};
    if(k in map){ var opts = $('stage').querySelectorAll('.qcard:not(.out) .opt'); if(opts[map[k]]) opts[map[k]].click() }
  });
})();
