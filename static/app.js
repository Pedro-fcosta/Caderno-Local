(() => {
  const theme = document.getElementById('theme-toggle');
  theme?.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('study-theme', next); } catch (_) {}
  });

  const overallTimer=document.getElementById('overall-timer');
  if(overallTimer){
    const started=Date.parse(document.querySelector('[data-started]').dataset.started.replace(' ','T')+'Z');
    const show=()=>{const n=Math.max(0,Math.floor((Date.now()-started)/1000));
      overallTimer.textContent=[Math.floor(n/3600),Math.floor(n/60)%60,n%60].map(v=>String(v).padStart(2,'0')).join(':');};
    show();setInterval(show,1000);
  }
  const timer = document.querySelector('#timer');
  const secondsField = document.querySelector('#seconds');
  if (timer && secondsField) {
    const started = Date.now();
    const tick = () => {
      const seconds = Math.min(86400, Math.floor((Date.now() - started) / 1000));
      secondsField.value = seconds;
      timer.textContent = String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
    };
    tick(); setInterval(tick, 1000);
    document.querySelector('#answer-form')?.addEventListener('submit', tick);
  }

  const topicSource = document.getElementById('topic-map');
  if (topicSource) {
    const topics = JSON.parse(topicSource.textContent);
    const macro = document.getElementById('filter-macro');
    const micro = document.getElementById('filter-micro');
    const original = micro.value;
    const refresh = (selected) => {
      const choices = macro.value ? (topics[macro.value] || []) : Object.values(topics).flat();
      micro.replaceChildren(new Option('Todos', ''));
      [...new Set(choices)].sort((a, b) => a.localeCompare(b, 'pt-BR')).forEach(name => micro.add(new Option(name, name)));
      if (choices.includes(selected)) micro.value = selected;
    };
    refresh(original);
    macro.addEventListener('change', () => refresh(''));
  }

  const dialog = document.getElementById('edit-session-dialog');
  if (dialog) {
    const form = document.getElementById('edit-session-form');
    document.querySelectorAll('[data-session-edit]').forEach(button => button.addEventListener('click', () => {
      form.action = `/sessoes/${encodeURIComponent(button.dataset.sessionEdit)}/editar`;
      form.elements.name.value = button.dataset.sessionName || '';
      dialog.showModal(); form.elements.name.focus();
    }));
    dialog.querySelector('[data-close-dialog]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  }

  document.querySelectorAll('[data-card-id]').forEach(button=>button.addEventListener('click',()=>{
    document.getElementById('card-front').value=button.dataset.cardFront;
    document.getElementById('card-back').value=button.dataset.cardBack;
    document.getElementById('card-question-id').value=button.dataset.cardId;
    document.getElementById('cartoes').scrollIntoView({behavior:'smooth'});
    document.getElementById('card-front').focus({preventScroll:true});
  }));

  const countNode = document.getElementById('chart-count');
  if (!countNode) return;
  const rateNode = document.getElementById('chart-rate');
  const contest = document.getElementById('chart-concurso');
  const board = document.getElementById('chart-banca');
  const year = document.getElementById('chart-ano');
  let selectedMacro = '';
  document.getElementById('distribution-back').addEventListener('click',()=>{selectedMacro='';update();});
  const palette = ['#044436','#f0b734','#197da8','#819fc4','#c76c4f','#6eb4a6','#826cb2','#a2ae4e','#aa618a','#297d74','#dd8745','#576a91'];
  const motion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let period = '7d', requestId = 0;
  const svgNS = 'http://www.w3.org/2000/svg';
  const make = (tag, props = {}, parent) => {
    const el = document.createElementNS(svgNS, tag);
    for (const [key, value] of Object.entries(props)) el.setAttribute(key, String(value));
    parent.appendChild(el); return el;
  };
  const label = (raw, monthly = false) => {
    if (raw.endsWith('h')) return raw;
    if (monthly) { const [y, m] = raw.split('-'); return `${m}/${y.slice(2)}`; }
    const [y, m, d] = raw.split('-'); return `${d}/${m}`;
  };
  const plot = (node, values, labels, type, average, trend, monthly) => {
    node.replaceChildren();
    if (!values.length || (type === 'rate' && values.every(v => v === null))) {
      node.textContent = 'Sem questões respondidas neste período.'; node.classList.add('chart-empty'); return;
    }
    node.classList.remove('chart-empty');
    const w = 760, h = 255, left = 44, right = 18, top = 16, bottom = 43;
    const width = w - left - right, height = h - top - bottom;
    const svg = make('svg', { viewBox: `0 0 ${w} ${h}`, role: 'img', 'aria-hidden': 'true' }, node);
    const max = type === 'rate' ? 100 : Math.max(4, ...values.map(v => v || 0)) * 1.13;
    const y = v => top + height * (1 - v / max);
    for (let i = 0; i <= 4; i++) {
      const value = max * i / 4, py = y(value);
      make('line', {x1:left, x2:w-right, y1:py, y2:py, class:'chart-gridline'}, svg);
      const t = make('text', {x:left-9, y:py+4, 'text-anchor':'end', class:'chart-axis'}, svg);
      t.textContent = type === 'rate' ? `${Math.round(value)}%` : String(Math.round(value));
    }
    const x = i => left + (values.length === 1 ? width / 2 : i * width / (values.length - 1));
    const steps = Math.min(6, Math.max(1, values.length - 1));
    const printed = new Set();
    for (let i = 0; i <= steps; i++) {
      const index = Math.round(i * (values.length - 1) / steps);
      if (printed.has(index)) continue; printed.add(index);
      const t = make('text', {x:x(index),y:h-13,'text-anchor':'middle',class:'chart-axis'},svg);
      t.textContent = label(labels[index], monthly);
    }
    if (type === 'count') {
      const barWidth = Math.min(25, width / Math.max(1, values.length) * .65);
      values.forEach((value,i) => {
        const bar = make('rect',{x:x(i)-barWidth/2,y:y(value),width:barWidth,
          height:Math.max(0,top+height-y(value)),rx:Math.min(3,barWidth/4),fill:'#044436',class:'chart-bar'},svg);
        make('title',{},bar).textContent = `${label(labels[i],monthly)}: ${value} questões`;
      });
      const lineY=y(average);
      make('line',{x1:left,x2:w-right,y1:lineY,y2:lineY,stroke:'#f0b734','stroke-width':2.5,'stroke-dasharray':'7 5'},svg);
    } else {
      make('line',{x1:left,x2:w-right,y1:y(80),y2:y(80),stroke:'#708e88','stroke-width':1.5,'stroke-dasharray':'5 5'},svg);
      let segments=[],current=[];
      values.forEach((value,i) => { if (value === null) { if(current.length)segments.push(current);current=[]; }
        else current.push([x(i),y(value)]); });
      if(current.length) segments.push(current);
      segments.forEach(segment => make('path',{d:segment.map(([px,py],i)=>`${i?'L':'M'}${px.toFixed(1)},${py.toFixed(1)}`).join(' '),
        fill:'none',stroke:'#044436','stroke-width':3,'stroke-linecap':'round','stroke-linejoin':'round'},svg));
      if (trend) make('line',{x1:x(trend.start),x2:x(trend.end),y1:y(trend.y1),y2:y(trend.y2),
        stroke:'#f0b734','stroke-width':2.5,'stroke-dasharray':'8 5'},svg);
      values.forEach((value,i) => { if(value === null)return;
        if(values.length > 65 && i % Math.ceil(values.length / 65))return;
        const dot=make('circle',{cx:x(i),cy:y(value),r:values.length>30?2:4,fill:'#044436'},svg);
        make('title',{},dot).textContent=`${label(labels[i],monthly)}: ${Math.round(value)}% de acertos`;
      });
    }
    if(motion){
      const bars=svg.querySelectorAll('.chart-bar');
      if(bars.length>100){
        const container=make('g',{},svg);
        bars.forEach(bar=>container.appendChild(bar));
        container.animate([{clipPath:'inset(100% 0 0 0)',opacity:.6},{clipPath:'inset(0 0 0 0)',opacity:1}],{duration:780,easing:'cubic-bezier(.19,1,.22,1)'});
      } else bars.forEach((bar,i)=>bar.animate([{transform:'scaleY(0)',opacity:.35},{transform:'scaleY(1)',opacity:1}],
           {duration:680,delay:Math.min(i,30)*24,easing:'cubic-bezier(.19,1,.22,1)'}));
      svg.querySelectorAll('path').forEach((path,i)=>{
        const length=path.getTotalLength();
        path.animate([{strokeDasharray:`${length} ${length}`,strokeDashoffset:length},{strokeDasharray:`${length} ${length}`,strokeDashoffset:0}],
           {duration:800,delay:i*90,easing:'ease-out'});
      });
      svg.querySelectorAll('circle').forEach((dot,i)=>dot.animate([{opacity:0,transform:'scale(.4)'},{opacity:1,transform:'scale(1)'}],{duration:380,delay:Math.min(i,35)*18+350}));
    }
  };
  const regression = values => {
    const points=values.map((v,i)=>[i,v]).filter(([,v])=>v!==null);
    if(points.length<2)return null;
    const n=points.length,sx=points.reduce((s,[x])=>s+x,0),sy=points.reduce((s,[,y])=>s+y,0);
    const sxx=points.reduce((s,[x])=>s+x*x,0),sxy=points.reduce((s,[x,y])=>s+x*y,0);
    const slope=(n*sxy-sx*sy)/(n*sxx-sx*sx)||0,intercept=(sy-slope*sx)/n;
    const start=points[0][0],end=points.at(-1)[0];
    return {start,end,y1:Math.max(0,Math.min(100,slope*start+intercept)),y2:Math.max(0,Math.min(100,slope*end+intercept))};
  };
  const donut = entries => {
    const total=entries.reduce((sum,item)=>sum+item.total,0);
    document.getElementById('distribution-total').textContent=`${total} questões`;
    document.getElementById('distribution-title').textContent=selectedMacro ? selectedMacro : 'Questões disponíveis por matéria macro';
    const back=document.getElementById('distribution-back');back.hidden=!selectedMacro;
    const chart=document.getElementById('chart-donut'),legend=document.getElementById('donut-legend');
    legend.replaceChildren();chart.replaceChildren();
    if(!total){chart.style.background='none';chart.classList.add('donut-empty');chart.textContent='Sem questões';return;}
    chart.classList.remove('donut-empty');let offset=0;
    const sections=entries.map((item,i)=>{const next=offset+item.total/total*100;
      const section=`${palette[i%palette.length]} ${offset.toFixed(2)}% ${next.toFixed(2)}%`;
      offset=next;
      const row=document.createElement(selectedMacro?'div':'button');row.className='donut-item';
      if(!selectedMacro){row.type='button';row.addEventListener('click',()=>{selectedMacro=item.label;update();});}
      const dot=document.createElement('i');dot.style.background=palette[i%palette.length];
      const name=document.createElement('span');name.textContent=item.label;
      const value=document.createElement('strong');value.textContent=`${item.total} · ${(item.total/total*100).toFixed(1)}%`;
      row.append(dot,name,value);legend.appendChild(row);
      if(motion)row.animate([{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:380,delay:i*35,fill:'backwards'});
      return section;
    });
    chart.style.background=`conic-gradient(${sections.join(',')})`;
    if(motion) chart.animate([{transform:'scale(.82) rotate(-55deg)',opacity:.2},{transform:'scale(1) rotate(0deg)',opacity:1}],{duration:780,easing:'cubic-bezier(.2,.8,.2,1)'});
    const center=document.createElement('span');center.className='donut-center';center.textContent=selectedMacro?'Assuntos micro':'Matérias macro';chart.appendChild(center);
    if(!selectedMacro){chart.title='Clique em uma fatia para ver os assuntos micro';
      chart.style.cursor='pointer';chart.onclick=event=>{
        const box=chart.getBoundingClientRect(),cx=box.left+box.width/2,cy=box.top+box.height/2;
        const dx=event.clientX-cx,dy=event.clientY-cy;
        if(Math.hypot(dx,dy)<box.width*.25)return;
        const angle=(Math.atan2(dy,dx)*180/Math.PI+450)%360;
        let acc=0;for(const item of entries){acc+=item.total/total*360;if(angle<acc){selectedMacro=item.label;update();break;}}
      };
    } else {chart.title='Distribuição dos assuntos micro';chart.style.cursor='default';chart.onclick=null;}
  };
  async function update() {
    const serial=++requestId;
    const params=new URLSearchParams({period,concurso:contest.value,banca:board.value,ano:year.value,macro:selectedMacro});
    try {
      const response=await fetch(`/api/desempenho?${params}`);
      if(!response.ok)throw new Error(`HTTP ${response.status}`);
      const data=await response.json();if(serial!==requestId)return;
      const sum=data.counts.reduce((a,b)=>a+b,0),correct=data.correct.reduce((a,b)=>a+b,0);
      const average=data.counts.length?sum/data.counts.length:0;
      const rates=data.counts.map((count,i)=>count?100*data.correct[i]/count:null);
      document.getElementById('count-summary').textContent=`${sum} resolvidas`;
      document.getElementById('rate-summary').textContent=sum?`${Math.round(correct/sum*100)}%`:'—';
      plot(countNode,data.counts,data.labels,'count',average,null,data.grouped_monthly);
      plot(rateNode,rates,data.labels,'rate',0,regression(rates),data.grouped_monthly);
      donut(selectedMacro ? data.micro_distribution : data.distribution);
    } catch (_) { countNode.textContent='Não foi possível carregar os gráficos. Atualize a página.'; }
  }
  document.querySelectorAll('[data-period]').forEach(button=>button.addEventListener('click',()=>{
    period=button.dataset.period;
    document.querySelectorAll('[data-period]').forEach(tab=>{
      const active=tab===button;tab.classList.toggle('active',active);tab.setAttribute('aria-pressed',String(active));
    }); update();
  }));
  contest.addEventListener('change',()=>{selectedMacro='';update();});year.addEventListener('change',()=>{selectedMacro='';update();});board.addEventListener('change',()=>{selectedMacro='';update();});update();
})();
