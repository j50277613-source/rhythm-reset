window.addEventListener('DOMContentLoaded',()=>{
try{

const form=document.getElementById('rhythmForm'),resultContent=document.getElementById('resultContent'),placeholder=document.getElementById('placeholder'),resetBtn=document.getElementById('resetBtn'),errorText=document.getElementById('errorText'),aiBox=document.getElementById('aiBox'),aiPrompt=document.getElementById('aiPrompt'),copyState=document.getElementById('copyState');
document.getElementById('year').textContent=new Date().getFullYear();
let lastPlan=null;
function pad(n){return String(n).padStart(2,'0')}
function fmt(min){min=((Math.round(min)%1440)+1440)%1440;return `${pad(Math.floor(min/60))}:${pad(min%60)}`}
function nowMin(){const d=new Date();return d.getHours()*60+d.getMinutes()}
function updateNow(){document.getElementById('nowTime').textContent=fmt(nowMin())}
updateNow();setInterval(updateNow,30000);
function minutesText(min){const abs=Math.abs(Math.round(min));const h=Math.floor(abs/60),m=abs%60;if(h===0)return `${m}분`;if(m===0)return `${h}시간`;return `${h}시간 ${m}분`}
function durationText(min){min=Math.max(0,Math.round(min));const h=Math.floor(min/60),m=min%60;if(h===0)return `${m}분`;if(m===0)return `${h}시간`;return `${h}시간 ${m}분`}
function diffClock(a,b){let d=a-b;if(d>720)d-=1440;if(d<-720)d+=1440;return d}
function parseTime(value){
  if(!value)return null;
  let raw=String(value).trim().toLowerCase().replace(/\s/g,'');
  if(!raw)return null;
  const hasPM=raw.includes('오후')||raw.includes('밤')||raw.includes('저녁');
  const hasAM=raw.includes('오전')||raw.includes('새벽')||raw.includes('아침');
  raw=raw.replace(/오전|오후|새벽|밤|저녁|아침/g,'').replace(/시/g,':').replace(/분/g,'').replace(/[^0-9:]/g,'');
  let h,m;
  if(/^\d{1,2}:\d{0,2}$/.test(raw)){const p=raw.split(':');h=Number(p[0]);m=p[1]===''?0:Number(p[1])}
  else if(/^\d{3,4}$/.test(raw)){const p=raw.padStart(4,'0');h=Number(p.slice(0,2));m=Number(p.slice(2))}
  else if(/^\d{1,2}$/.test(raw)){h=Number(raw);m=0}
  else return null;
  if(Number.isNaN(h)||Number.isNaN(m)||m<0||m>59)return null;
  if(hasPM&&h<12)h+=12;
  if(hasAM&&h===12)h=0;
  if(h<0||h>23)return null;
  return h*60+m;
}
function normalizeInput(el){if(!el.value.trim())return;const parsed=parseTime(el.value);if(parsed!==null)el.value=fmt(parsed)}
document.querySelectorAll('.time-input').forEach(el=>el.addEventListener('blur',()=>normalizeInput(el)));
function timelineAfter(base,clock){let t=clock;while(t<base)t+=1440;return t}
function targetTimelineAfterBed(bedLine,target){let t=target;while(t<=bedLine)t+=1440;return t}
function targetTimelineTomorrow(current,target){let t=target;if(t<=current)t+=1440;return t}
function stepWake(todayWake,target,step){const d=diffClock(target,todayWake);if(Math.abs(d)<=step)return target;return todayWake+(d>0?step:-step)}
function personaName(p){return p==='worker'?'직장인':p==='student'?'학생':'자율 생활형'}
function personaConfig(p){
  if(p==='worker')return{hint:'출근 준비시간과 지각 방지를 우선으로 계산합니다.'};
  if(p==='student')return{hint:'등교 준비시간과 오전 학업 컨디션을 우선으로 계산합니다.'};
  return{hint:'강제 일정이 적어도 리듬이 뒤로 밀리지 않게 계산합니다.'};
}
function updatePersonaHint(){document.getElementById('personaHint').textContent=personaConfig(document.getElementById('persona').value).hint}
document.getElementById('persona').addEventListener('change',updatePersonaHint);updatePersonaHint();
function rhythmDriftText(min){const abs=Math.abs(Math.round(min));if(abs<30)return '목표와 거의 맞음';return `약 ${minutesText(abs)} ${min>0?'뒤로 밀림':'앞당겨짐'}`}
function rhythmScore(drift,sleep,nap,alcohol,caffeineLate,schedule,alarmStyle){let score=100;score-=Math.min(45,Math.abs(drift)/10);if(sleep<360)score-=18;if(sleep<300)score-=12;if(nap==='long'||nap==='late')score-=10;if(alcohol==='yes')score-=8;if(caffeineLate)score-=8;if(schedule==='must'&&sleep<360)score-=8;if(alarmStyle==='miss')score-=10;if(alarmStyle==='bedphone'||alarmStyle==='snooze')score-=6;return Math.max(0,Math.min(100,Math.round(score)))}
function personaMorningLine(persona,recommendedWake){
  if(persona==='worker')return `직장인: ${fmt(recommendedWake+10)} 씻기·출근 준비 시작, 출근길 또는 창가 앞에서 빛 10분, 첫 카페인은 ${fmt(recommendedWake+60)} 이후`;
  if(persona==='student')return `학생: ${fmt(recommendedWake+15)} 씻기·등교 준비, 이동 중 빛 10분, 첫 집중은 ${fmt(recommendedWake+60)} 이후`; 
  return `자율 생활형: ${fmt(recommendedWake+15)}까지 세면·물 마시기, ${fmt(recommendedWake+30)} 전 다시 눕지 않기, 창가·야외 빛 10분`;
}
function alarmGuide(alarmStyle){
  if(alarmStyle==='onTime')return '알람을 잘 듣는 편이라 실제 기상 알람과 예비 알람만으로도 충분합니다.';
  if(alarmStyle==='snooze')return '알람을 미루는 편이면 예열 알람은 짧게, 실제 기상 알람은 침대 밖에 두는 기준이 필요합니다.';
  if(alarmStyle==='miss')return '알람을 잘 못 듣는 편이면 소리·진동을 함께 쓰고, 최후 기상선 알람은 침대에서 끌 수 없게 둬야 합니다.';
  return '알람 끄고 다시 눕는 편이면 폰을 손에 들고 침대로 돌아오는 동선을 끊는 게 핵심입니다.';
}
function decisionText(plan){
  const drift=plan.wakeDelay, sleep=plan.sleepDuration;
  if(plan.schedule==='must')return{title:'기상 고정 우선',body:`내일은 ${plan.targetText} 기상이 고정값입니다. 오늘은 취침을 가능한 범위에서 앞당기고, 수면이 부족해도 최후 기상선 ${plan.finalLine}을 넘기지 않는 쪽이 맞습니다.`};
  if(sleep<300)return{title:'기상 뒤로 조정 우선',body:`확보 수면이 ${plan.sleepText}라 너무 짧습니다. 무조건 목표시간을 맞추기보다 ${plan.wakeText} 기상으로 수면을 조금 더 확보하고, 다음날 다시 당기는 편이 현실적입니다.`};
  if(Math.abs(drift)>180)return{title:'기상 단계 조정 우선',body:`리듬이 ${plan.rhythmDrift} 상태입니다. 취침을 억지로 당기기보다 내일 기상시간을 1~2시간 단위로 먼저 조정하는 쪽이 실패 확률이 낮습니다.`};
  if(plan.preferred!==null&&sleep<420)return{title:'다음날 복구 우선',body:`오늘 원하는 취침시간 기준으로 수면이 충분하지 않습니다. 내일 아침은 계획대로 가되, 내일 밤 취침 기준을 지키는 것이 리듬 복구의 핵심입니다.`};
  return{title:'기상 고정 유지',body:`현재는 큰 충격 없이 맞출 수 있습니다. 오늘은 취침시간을 크게 흔들기보다 ${plan.wakeText} 기상을 고정하는 편이 좋습니다.`};
}
function makePlan(){
  const mode=document.getElementById('mode').value,persona=document.getElementById('persona').value,schedule=document.getElementById('schedule').value;
  const current=nowMin(),wake=parseTime(document.getElementById('wakeTime').value),target=parseTime(document.getElementById('targetWake').value),preferred=parseTime(document.getElementById('preferredBed').value),caffeine=parseTime(document.getElementById('caffeine').value);
  if(wake===null||target===null)return null;
  const nap=document.getElementById('nap').value,alcohol=document.getElementById('alcohol').value,sleepDebt=document.getElementById('sleepDebt').value,alarmStyle=document.getElementById('alarmStyle').value;
  let recommendedWake=target;
  if(schedule==='none')recommendedWake=stepWake(wake,target,60);
  if(schedule==='soft')recommendedWake=stepWake(wake,target,120);
  if(schedule==='must')recommendedWake=target;
  const wakeLine=targetTimelineTomorrow(current,recommendedWake);
  let need=450;if(persona==='student')need=480;if(schedule==='must')need=420;if(sleepDebt==='high')need+=30;
  let bedLine;
  if(preferred!==null)bedLine=timelineAfter(current,preferred);
  else if(mode==='soon')bedLine=current+15;
  else{bedLine=wakeLine-need;if(bedLine<current+45)bedLine=current+45}
  const wakeAfterBed=targetTimelineAfterBed(bedLine,recommendedWake),sleepDuration=wakeAfterBed-bedLine,wakeDelay=diffClock(wake,target);
  const short=sleepDuration<360,veryShort=sleepDuration<300;
  let cls='good',title='목표 기상에 맞출 수 있는 상태';
  if(schedule==='must'&&veryShort){cls='danger';title='기상 우선 응급 조정 상태'}
  else if(short){cls='danger';title='수면 시간이 부족한 상태'}
  else if(Math.abs(wakeDelay)>180&&schedule!=='must'){cls='warn';title='리듬을 단계적으로 맞춰야 하는 상태'}
  else if(nap==='long'||nap==='late'){cls='warn';title='낮잠 영향이 남은 상태'}
  else if(preferred!==null&&sleepDuration<420){cls='warn';title='원하는 취침시간 기준 조정 필요'}
  const alarmA=recommendedWake-(schedule==='must'?20:10),alarmB=recommendedWake,alarmC=recommendedWake+(schedule==='must'?5:15),finalLine=recommendedWake+(schedule==='must'?0:15);
  let caffeineGuide='기상 후 60~90분 뒤 첫 카페인, 14:00 이후 피하기',caffeineLate=false;
  if(caffeine!==null){const toBed=bedLine-timelineAfter(bedLine-1440,caffeine);if(toBed<360){caffeineLate=true;caffeineGuide='오늘 카페인이 늦은 편입니다. 내일은 첫 카페인을 기상 60~90분 뒤로 미루고 13:00 이후는 피하세요.'}}
  if(schedule==='none')caffeineGuide='내일 일정이 없으면 카페인으로 억지 보정하지 말고, 첫 카페인은 기상 60분 뒤로 미루세요.';
  const lightGuide=`${fmt(recommendedWake)}~${fmt(recommendedWake+30)} 사이 창가·야외 빛 10~20분`;
  const score=rhythmScore(wakeDelay,sleepDuration,nap,alcohol,caffeineLate,schedule,alarmStyle);
  const base={mode,persona,schedule,wake,target,recommendedWake,bedLine,preferred,caffeine,nap,alcohol,sleepDebt,alarmStyle,sleepDuration,wakeDelay,rhythmDrift:rhythmDriftText(wakeDelay),score,status:{title,cls},bedText:fmt(bedLine),targetText:fmt(target),wakeText:fmt(recommendedWake),sleepText:durationText(sleepDuration),alarms:`${fmt(alarmA)} / ${fmt(alarmB)} / ${fmt(alarmC)}`,finalLine:fmt(finalLine),caffeineGuide,lightGuide,personaLine:personaMorningLine(persona,recommendedWake),alarmGuide:alarmGuide(alarmStyle)};
  base.decision=decisionText(base);
  base.actions=[];
  if(mode==='soon')base.actions.push(`지금은 추가 계산보다 ${fmt(bedLine)}부터 바로 취침 준비를 시작하세요.`);
  else if(preferred!==null)base.actions.push(`원하는 취침시간 ${fmt(bedLine)} 기준으로 계산했습니다. 이 시간이 늦다면 내일 밤 복구 기준을 반드시 같이 봐야 합니다.`);
  else base.actions.push(`${fmt(bedLine)} 전후를 오늘 잘 시간 기준으로 잡으세요. 이보다 30분 이상 밀리면 알람 실패 여유가 줄어듭니다.`);
  base.actions.push(base.decision.body);
  if(nap==='long'||nap==='late')base.actions.push('오늘 낮잠 영향이 남아 있을 수 있습니다. 잠이 늦게 와도 내일 기상시간을 크게 흔들지 않는 게 우선입니다.');
  if(alcohol==='yes')base.actions.push('술을 마신 날은 수면시간보다 기상 안정성이 흔들릴 수 있습니다. 첫 알람은 침대에서 바로 끄기 어렵게 두세요.');
  base.actions.push(base.alarmGuide);
  base.recovery=[];
  if(schedule==='must'||short||preferred!==null){base.recovery.push(`내일 밤 취침 기준: ${fmt(recommendedWake+16*60)}~${fmt(recommendedWake+17*60)} 사이를 1차 목표로 잡으세요.`);base.recovery.push(`모레 기상 기준: 내일 실제 기상이 ${fmt(recommendedWake+30)} 이후로 밀리면 목표를 바로 당기지 말고 같은 시간대를 한 번 더 고정하세요.`);base.recovery.push('복구 예상: 한 번 크게 밀린 정도면 1~2일, 낮잠·밤샘까지 겹치면 2~3일 잡는 편이 현실적입니다.')}
  else{base.recovery.push(`내일도 ${fmt(recommendedWake)} 전후 기상을 반복하면 리듬이 크게 흔들릴 가능성은 낮습니다.`);base.recovery.push('다음날은 취침시간보다 기상시간을 먼저 고정하세요.')}
  return base;
}
function render(plan){
  lastPlan=plan;placeholder.style.display='none';resultContent.style.display='block';
  const bedLabel=plan.mode==='soon'?'지금부터 취침 준비':'오늘 잘 시간 추천';
  resultContent.innerHTML=`
    <div class="status-box ${plan.status.cls}"><h3>${plan.status.title}</h3><p>${personaName(plan.persona)} · ${document.getElementById('schedule').selectedOptions[0].textContent} 기준으로 계산했습니다.</p></div>
    <div class="score-row">
      <div class="score-card"><span>내 리듬 위치</span><strong>${plan.rhythmDrift}</strong><details><summary>위치 설명</summary><div class="details-body"><p>목표 기상시간과 오늘 기상시간을 비교해, 지금 생활 리듬이 목표보다 늦은 쪽인지 빠른 쪽인지 보여줍니다.</p><p><b>뒤로 밀림</b>이 크면 오늘 억지로 일찍 눕는 것보다 내일 기상시간을 먼저 고정하는 편이 안정적입니다.</p><p><b>앞당겨짐</b>이면 이미 몸이 이른 시간대에 맞춰져 있는 상태라, 밤에 너무 일찍 졸려 리듬이 다시 흔들리지 않게 유지 기준을 봅니다.</p></div></details></div>
      <div class="score-card"><span>리듬 안정 점수</span><strong>${plan.score}점</strong><div class="meter"><i style="width:${plan.score}%"></i></div><details><summary>점수 기준</summary><div class="details-body"><p>리듬 안정 점수는 목표 기상시간과 오늘 기상시간 차이, 확보 수면, 낮잠, 술, 늦은 카페인, 알람 습관을 합쳐 본 생활 리듬 점수입니다.</p><p>80점 이상: 안정권 / 60~79점: 조정 필요 / 40~59점: 리듬 흔들림 큼 / 39점 이하: 무리한 기상 또는 복구 우선 상태입니다.</p></div></details></div>
    </div>
    <div class="result-list">
      <div class="result-item"><span>${bedLabel}</span><strong>${plan.bedText}</strong></div>
      <div class="result-item"><span>내일 일어날 시간 추천</span><strong>${plan.wakeText}</strong></div>
      <div class="result-item"><span>확보 수면</span><strong>${plan.sleepText}</strong></div>
      <div class="result-item"><span>알람 후보</span><strong>${plan.alarms}</strong></div>
      <div class="result-item"><span>내일 아침 기준</span><strong>${plan.personaLine}</strong></div>
    </div>
    <div class="guide"><h4>조정 방향</h4><p><b>${plan.decision.title}</b></p><p>${plan.decision.body}</p></div>
    <div class="upgrade-card"><h4>상세 플랜에서 더 필요한 것</h4><p>기본 계산은 시간을 빠르게 잡는 용도입니다. 실제로 실패를 줄이려면 아래 기준이 더 필요합니다.</p><ul><li>잠이 안 올 때 몇 분 뒤 침대 밖으로 나올지</li><li>알람을 어디에 두고 어떤 역할로 나눌지</li><li>목표 기상에 실패했을 때 낮잠·카페인·오늘 밤 취침을 어떻게 조정할지</li></ul></div>
  `;
  saveTempPlan(plan);renderRecords();
}
function saveTempPlan(plan){localStorage.setItem('rhythmLastPlan',JSON.stringify({at:new Date().toISOString(),bed:plan.bedText,wake:plan.wakeText,target:plan.targetText,sleep:plan.sleepText,status:plan.status.title,score:plan.score}))}
function getRecords(){try{return JSON.parse(localStorage.getItem('rhythmRecords')||'[]')}catch{return[]}}
function setRecords(records){localStorage.setItem('rhythmRecords',JSON.stringify(records.slice(0,8)))}
function renderRecords(){const box=document.getElementById('records'),records=getRecords();if(records.length===0){box.innerHTML='<div class="record">아직 저장된 기록이 없습니다.</div>';return}box.innerHTML=records.map(r=>`<div class="record"><b>${r.date}</b><br>${r.text}</div>`).join('')}
function calculateRhythm(){
  try{
    errorText.style.display='none';
    document.querySelectorAll('.time-input').forEach(normalizeInput);
    const plan=makePlan();
    if(!plan){errorText.style.display='block';return false;}
    render(plan);
    return false;
  }catch(err){
    console.error(err);
    errorText.style.display='block';
    errorText.textContent='계산 중 오류가 났습니다. 입력값을 확인하거나 새로고침 후 다시 시도해주세요.';
    return false;
  }
}
form.addEventListener('submit',e=>{e.preventDefault();calculateRhythm();});
document.getElementById('calculateBtn').addEventListener('click',calculateRhythm);
resetBtn.addEventListener('click',()=>{form.reset();updatePersonaHint();updateNow();resultContent.style.display='none';placeholder.style.display='flex';errorText.style.display='none';errorText.textContent='시간 입력을 확인해주세요. 예: 05:00, 0500, 오후5시';lastPlan=null;aiBox.style.display='none'});
document.getElementById('checkWakeBtn').addEventListener('click',()=>{
  const target=lastPlan?lastPlan.recommendedWake:parseTime(document.getElementById('targetWake').value),actual=parseTime(document.getElementById('actualWake').value),result=document.getElementById('wakeCheckResult');
  if(target===null||actual===null){result.style.display='block';result.innerHTML='<h4>입력 확인</h4><p>실제 기상시간을 먼저 입력해주세요.</p>';return}
  normalizeInput(document.getElementById('actualWake'));
  const snooze=Number(document.getElementById('snooze').value),fog=Number(document.getElementById('fog').value),gap=diffClock(actual,target);
  let title='계획 성공',msg=Math.abs(gap)<=10?'추천 기상시간과 거의 맞았습니다.':`추천보다 ${minutesText(gap)} ${gap>0?'늦었습니다':'빨랐습니다'}.`;
  if(gap>20||snooze>=2){title='기상 성공률 보정 필요';msg+=' 다음 계산에서는 기상 목표를 바로 당기지 말고 같은 시간대를 한 번 더 고정하는 편이 낫습니다.'}
  if(fog>=4)msg+=' 기상 후 멍함이 큰 편이라 오전 첫 30분은 세면·이동·빛 노출 같은 단순 루틴으로 잡으세요.';
  result.style.display='block';result.innerHTML=`<h4>${title}</h4><p>${msg}</p>`;
  const records=getRecords();records.unshift({date:new Date().toLocaleDateString('ko-KR'),text:`기상 ${fmt(actual)} · 알람 ${snooze}회 · 멍함 ${fog}/5`});setRecords(records);renderRecords();
});
document.getElementById('savePlanBtn').addEventListener('click',()=>{if(!lastPlan){alert('먼저 리듬을 계산해주세요.');return}const records=getRecords();records.unshift({date:new Date().toLocaleDateString('ko-KR'),text:`취침 ${lastPlan.bedText} · 추천기상 ${lastPlan.wakeText} · 점수 ${lastPlan.score}점 · 수면 ${lastPlan.sleepText}`});setRecords(records);renderRecords()});
document.getElementById('clearRecordsBtn').addEventListener('click',()=>{localStorage.removeItem('rhythmRecords');renderRecords()});
function buildAiPrompt(){
  const plan=lastPlan||makePlan();if(!plan)return'';
  const records=getRecords().slice(0,5).map((r,i)=>`${i+1}. ${r.date} - ${r.text}`).join('\n') || '아직 저장된 기록 없음';
  return `너는 수면 리듬 관리 코치입니다. 의학적 진단처럼 말하지 말고 생활 리듬 조정 관점으로만 답해주세요. 기본 계산값을 반복하지 말고, 사용자가 실제로 실행할 행동 기준을 우선으로 답해주세요.

[사용자 상황]
- 사용 상황: ${plan.mode==='soon'?'곧 잘 예정':'미리 계획 중'}
- 생활 유형: ${personaName(plan.persona)}
- 내일 일정: ${document.getElementById('schedule').selectedOptions[0].textContent}
- 오늘 일어난 시간: ${fmt(plan.wake)}
- 내일 목표 기상시간: ${plan.targetText}
- 오늘 원하는 취침시간: ${plan.preferred!==null?fmt(plan.preferred):'없음'}
- 오늘 낮잠: ${plan.nap}
- 술: ${plan.alcohol}
- 최근 3일 수면부족: ${plan.sleepDebt}
- 기상 반응: ${document.getElementById('alarmStyle').selectedOptions[0].textContent}
- 오늘 마지막 카페인: ${plan.caffeine!==null?fmt(plan.caffeine):'모름'}

[최근 기록]
${records}

[계산 결과]
- 현재 상태: ${plan.status.title}
- 리듬 척도: ${plan.rhythmDrift}
- 리듬 안정 점수: ${plan.score}점
- 오늘 잘 시간 추천: ${plan.bedText}
- 내일 일어날 시간 추천: ${plan.wakeText}
- 확보 수면: ${plan.sleepText}
- 알람 후보: ${plan.alarms}
- 최후 기상선: ${plan.finalLine}
- 조정 방향: ${plan.decision.title} / ${plan.decision.body}
- 내일 아침 기준: ${plan.personaLine}

[답변 원칙]
- 기본 계산 결과에 이미 나온 시간표만 반복하지 마세요.
- 사용자가 실제로 실패하는 지점, 즉 잠이 안 옴·알람 끄고 다시 눕기·기상 실패·낮잠 과다를 막는 기준을 구체적으로 주세요.
- 최근 기록이 있으면 기록을 반영해서 조정하세요. 기록이 없으면 첫 사용 기준이라고 말하세요.

[답변 형식]
가독성이 중요합니다. 큰 제목은 반드시 1. 3줄 요약처럼 번호를 붙이세요. 세부 항목은 1-1, 2-3 같은 번호를 쓰지 말고, - 판단:, - 행동:, - 기준: 같은 짧은 불릿으로 써주세요. 각 큰 제목 사이에는 빈 줄을 넣고, 한 문단은 2~3줄을 넘기지 마세요.

1. 3줄 요약
- 판단: 지금 가장 중요한 판단 1줄
- 오늘 밤: 오늘 밤 핵심 행동 1줄
- 내일 아침: 실패 방지 기준 1줄

2. 오늘 밤 실행 순서
- 준비: 지금부터 취침 준비 전까지 해야 할 행동
- 씻기: 씻는 시간과 방식
- 세팅: 불 끄기 전 마지막 세팅
- 눕는 기준: 실제로 눕는 기준

3. 씻기 기준
- 물 온도: 찬물/미지근한 물/따뜻한 물 중 무엇이 나은지
- 시간: 샤워 길이와 머리 말리는 기준
- 조정: 몸이 더워지거나 각성될 때 조정법

4. 쉬는 방식
- 위치: 침대에서 쉴지, 의자나 바닥 쿠션에서 쉴지
- 조명: 조명 밝기 기준
- 생각 정리: 생각이 많을 때 처리 방식

5. 취침 전 세팅
- 알람 위치
- 충전 위치
- 물, 조명, 방 온도 느낌
- 알람을 끄고 다시 눕지 않게 하는 장치

6. 알람 역할 분리
- 첫 알람: 몸을 깨우는 역할인지, 생략해도 되는지
- 실제 기상 알람: 반드시 일어나는 기준
- 최후 기상선: 이 시간을 넘기면 안 되는 이유
단, 알람을 많이 맞추라는 식으로 말하지 마세요. 각 알람의 목적을 분리하세요.

7. 잠이 안 올 때 플랜 B
- 제한 시간: 몇 분까지 누워볼지
- 행동: 그 시간이 지나면 무엇을 할지
- 복귀 기준: 다시 눕는 기준
- 다음날 기준: 그래도 못 잤을 때 낮잠과 카페인 기준

8. 실제 기상 실패 시 플랜 B
- 즉시 행동: 목표 기상에 못 일어났을 때 바로 해야 할 것
- 최소 손실: 지각/일정 실패를 줄이는 최소 행동
- 낮잠 기준: 가능 여부와 제한 시간
- 밤 복구: 오늘 밤 취침을 더 당길지, 같은 시간으로 고정할지

9. 기상 후 체크할 것
- 실제 기상시간
- 알람 미룬 횟수
- 기상 후 10분 멍함 점수
- 다음 조정: 체크 결과에 따라 다음날 취침·기상을 어떻게 조정할지

10. ${personaName(plan.persona)} 기준 추가 행동
- 오전 첫 행동
- 카페인/운동/이동 기준

금지 표현: 핸드폰 하지 마세요, 일찍 주무세요, 알람 많이 맞추세요 같은 뻔한 말.
말투는 간결하고 현실적으로 해주세요.`
}
document.getElementById('makeAiPromptBtn').addEventListener('click',()=>{
  document.querySelectorAll('.time-input').forEach(normalizeInput);
  const text=buildAiPrompt();
  if(!text){alert('먼저 시간을 입력해주세요.');return;}
  aiPrompt.value=text;
  aiBox.style.display='block';
  copyState.textContent='프롬프트가 생성되었습니다. 복사해서 직접 테스트할 수 있습니다.';
});
document.getElementById('makeAiPlanBtn').addEventListener('click',async()=>{
  document.querySelectorAll('.time-input').forEach(normalizeInput);
  const text=buildAiPrompt();
  if(!text){alert('먼저 시간을 입력하고 내 리듬 계산하기를 눌러주세요.');return;}
  aiBox.style.display='block';
  aiPrompt.value='AI 상세 플랜을 만드는 중입니다...';
  copyState.textContent='잠시만 기다려주세요.';
  try{
    const response=await fetch('/api/ai-plan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:text})});
    const data=await response.json();
    if(!response.ok) throw new Error(data.error||'AI 플랜 요청에 실패했습니다.');
    aiPrompt.value=data.text||'결과가 비어 있습니다.';
    copyState.textContent='AI 상세 플랜 생성 완료';
  }catch(err){
    aiPrompt.value='AI 플랜 생성 실패: '+(err.message||'알 수 없는 오류')+'\n\n아래 프롬프트 만들기를 눌러 ChatGPT에 직접 붙여넣어 테스트할 수 있습니다.';
    copyState.textContent='오류가 나면 Vercel 환경변수, OpenAI 결제수단, 배포 로그를 확인해야 합니다.';
  }
});
document.getElementById('copyAiPromptBtn').addEventListener('click',async()=>{if(!aiPrompt.value){aiPrompt.value=buildAiPrompt();aiBox.style.display='block'}try{await navigator.clipboard.writeText(aiPrompt.value);copyState.textContent='복사 완료'}catch{copyState.textContent='복사가 안 되면 직접 전체 선택해서 복사해주세요.'}});
renderRecords();

}catch(err){
  console.error(err);
  const e=document.getElementById('errorText');
  if(e){e.style.display='block';e.textContent='페이지 기능을 불러오는 중 오류가 났습니다. 새로고침 후 다시 시도해주세요.';}
}
});
