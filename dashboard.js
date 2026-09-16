
/* dashboard.js - Teacher Dashboard - استاذة ندى */

const KEYS={students:'students',homework:'homework',exams:'exams',attendance:'attendance',payments:'payments',notes:'notes',activities:'activities'};
const GRADES=['الصف الرابع الابتدائي','الصف الخامس الابتدائي','الصف السادس الابتدائي','الصف الأول الإعدادي','الصف الثاني الإعدادي','الصف الثالث الإعدادي','الصف الأول الثانوي'];
const CENTERS=['الكاشف','سيف الدين'];
const NOTE_CATS=['أكاديمي','واجبات','حضور','سلوك','متابعة عامة','متميز'];
function genId(){return '_'+Math.random().toString(36).substr(2,9);}
function today(){return new Date().toISOString().split('T')[0];}
function now(){return new Date().toISOString();}
function fmtDate(d){return d?new Date(d).toLocaleDateString('ar-EG'):'—';}
function fmtTime(d){return d?new Date(d).toLocaleTimeString('ar-EG',{hour:'2-digit',minute:'2-digit'}):'—';}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
window.APP_DATA = { students: [], homework: [], exams: [], attendance: [], payments: [], notes: [], activities: [] };
async function initBackend() {
  try {
    const res = await fetch('/api/data');
    if (res.ok) {
      const data = await res.json();
      // Support both old and new key names for compatibility
      window.APP_DATA = {
        students: data.students || data.nada_students || [],
        homework: data.homework || data.nada_homework || [],
        exams: data.exams || data.nada_exams || [],
        attendance: data.attendance || data.nada_attendance || [],
        payments: data.payments || data.nada_payments || [],
        notes: data.notes || data.nada_notes || [],
        activities: data.activities || data.nada_activities || []
      };
    }
  } catch(e) { console.warn('Backend not reachable', e); }
}
async function syncBackend(key, data) {
  window.APP_DATA[key] = data;
  try {
    // Try to use improved API first
    if (key === 'students') {
      await syncImprovedBackend(key, data);
    } else {
      // Fallback to legacy API
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: data })
      });
    }
  } catch(e) { console.error('Failed to save', e); }
}

// Also sync with the improved server API
async function syncImprovedBackend(key, data) {
  try {
    // Use the improved API endpoints
    if (key === 'students' && Array.isArray(data)) {
      // For array of students, use upsert
      await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } else if (key === 'students' && typeof data === 'object') {
      // For single student
      await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    }
  } catch(e) { console.error('Failed to sync with improved API', e); }
}
function load(key) { return window.APP_DATA[key] || []; }
function save(key, data) {
  console.log('💾 Saving data:', key, data.length || 'single item');
  syncBackend(key, data);
}
function logActivity(studentName, action) { const a = load('activities'); a.push({id:genId(), studentName, action, timestamp:now()}); save('activities', a); }
function getStudent(id){return load('students').find(s=>s.id===id)||{};}
function getStudentName(id){return getStudent(id).name||'—';}
function calcAttendanceRate(id){const r=load('attendance').filter(a=>a.studentId===id);if(!r.length)return 100;return Math.round((r.filter(a=>a.status==='حاضر'||a.status==='متأخر').length/r.length)*100);}
function calcExamAvg(id){const e=load('exams').filter(e=>e.studentId===id);if(!e.length)return '—';return Math.round(e.reduce((s,x)=>s+(x.score/x.maxScore)*100,0)/e.length);}
function calcHomeworkRate(id){const h=load('homework').filter(h=>h.studentId===id);if(!h.length)return 100;return Math.round((h.filter(h=>h.status==='مكتمل').length/h.length)*100);}
function paymentStatus(p){if(p.remaining===0)return{label:'مدفوع',cls:'badge-green'};if(p.paid===0)return{label:'غير مدفوع',cls:'badge-red'};return{label:'جزئي',cls:'badge-yellow'};}

function showToast(msg,type='success'){
  const wrap=document.getElementById('toastWrap');
  const t=document.createElement('div');t.className='toast '+type;t.textContent=msg;wrap.appendChild(t);
  setTimeout(()=>{t.style.opacity='0';},2500);setTimeout(()=>t.remove(),3000);
}
function openModal(html){
  const ov=document.getElementById('modalOverlay');const box=document.getElementById('modalBox');
  box.innerHTML=html;ov.classList.remove('hidden');
  box.querySelector('.modal-close')?.addEventListener('click',closeModal);
}
function closeModal(){document.getElementById('modalOverlay').classList.add('hidden');document.getElementById('modalBox').innerHTML='';}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});
function confirmDel(msg,cb){
  openModal('<div class="modal-header"><h3>تأكيد الحذف</h3><button class="modal-close">✕</button></div><div class="modal-body"><p>'+msg+'</p></div><div class="modal-footer"><button class="btn btn-danger" id="cdYes">حذف</button><button class="btn btn-ghost" id="cdNo">إلغاء</button></div>');
  document.getElementById('cdYes').onclick=()=>{cb();closeModal();};
  document.getElementById('cdNo').onclick=closeModal;
}

// Function to clear all data
async function clearAllData() {
  try {
    // Clear local data
    window.APP_DATA = {
      students: [],
      homework: [],
      exams: [],
      attendance: [],
      payments: [],
      notes: [],
      activities: []
    };

    // Clear backend data
    await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        students: [],
        homework: [],
        exams: [],
        attendance: [],
        payments: [],
        notes: [],
        activities: []
      })
    });

    showToast('تم مسح جميع البيانات بنجاح', 'success');

    // Reload current section
    const currentSection = document.querySelector('.page-section:not(.hidden)');
    if (currentSection) {
      const sectionId = currentSection.id;
      if (sectionId === 'studentsSection') renderStudents();
      else if (sectionId === 'homeworkSection') renderHomework();
      else if (sectionId === 'examsSection') renderExams();
      else if (sectionId === 'attendanceSection') renderAttendance();
      else if (sectionId === 'paymentsSection') renderPayments();
      else if (sectionId === 'notesSection') renderNotes();
    }

  } catch (error) {
    console.error('Error clearing data:', error);
    showToast('حدث خطأ أثناء مسح البيانات', 'error');
  }
}

// Function to show clear data confirmation
function showClearDataConfirmation() {
  confirmDel(
    'هل أنت متأكد من مسح جميع البيانات؟<br><br>⚠️ هذا الإجراء سيحذف:<br>• جميع الطلاب<br>• جميع الواجبات<br>• جميع الامتحانات<br>• جميع سجلات الحضور<br>• جميع المدفوعات<br>• جميع الملاحظات<br><br>لا يمكن التراجع عن هذا الإجراء!',
    clearAllData
  );
}

// Function to check database status
async function checkDatabaseStatus() {
  try {
    const res = await fetch('/api/health');
    if (res.ok) {
      const data = await res.json();
      const dbStatusEl = document.getElementById('dbStatus');
      if (dbStatusEl) {
        if (data.supabase === 'connected') {
          dbStatusEl.textContent = 'متصل ✓';
          dbStatusEl.style.color = 'var(--clr-success)';
        } else {
          dbStatusEl.textContent = 'غير متصل ✗';
          dbStatusEl.style.color = 'var(--clr-danger)';
        }
      }
    }
  } catch (error) {
    const dbStatusEl = document.getElementById('dbStatus');
    if (dbStatusEl) {
      dbStatusEl.textContent = 'خطأ في الاتصال ✗';
      dbStatusEl.style.color = 'var(--clr-danger)';
    }
  }
}

// Function to update last update time
function updateLastUpdateTime() {
  const lastUpdateEl = document.getElementById('lastUpdate');
  if (lastUpdateEl) {
    const now = new Date();
    lastUpdateEl.textContent = now.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

function seedDemoData(){
  if(load('students').length > 0) return;
  save('students',[
    {id:'s1',name:'محمد أحمد',grade:'الصف السادس الابتدائي',center:'الكاشف',status:'منتظم',attRate:90,hwCompleted:'4/5',examAvg:85,payStatus:'خالص',generalNotes:''},
    {id:'s2',name:'سارة محمود',grade:'الصف الأول الإعدادي',center:'سيف الدين',status:'يحتاج متابعة',attRate:70,hwCompleted:'2/5',examAvg:60,payStatus:'متبقي',generalNotes:''},
    {id:'s3',name:'يوسف علي',grade:'الصف الثاني الإعدادي',center:'الكاشف',status:'منتظم',attRate:95,hwCompleted:'5/5',examAvg:90,payStatus:'خالص',generalNotes:''},
    {id:'s4',name:'مريم حسن',grade:'الصف الثالث الإعدادي',center:'سيف الدين',status:'يحتاج متابعة',attRate:60,hwCompleted:'1/5',examAvg:50,payStatus:'لم يتم الدفع',generalNotes:''},
    {id:'s5',name:'علي صالح',grade:'الصف السادس الابتدائي',center:'الكاشف',status:'منتظم',attRate:100,hwCompleted:'5/5',examAvg:95,payStatus:'خالص',generalNotes:''}
  ]);
  save('homework',[
    {id:'h1',studentId:'s1',title:'واجب الخلية',date:'2026-09-10',maxScore:10,score:9,status:'مكتمل',note:'ممتاز'},
    {id:'h2',studentId:'s2',title:'واجب الهضم',date:'2026-09-10',maxScore:10,score:0,status:'لم يتم التسليم',note:''},
    {id:'h3',studentId:'s3',title:'واجب الضوء',date:'2026-09-11',maxScore:10,score:7,status:'مكتمل',note:'جيد'},
    {id:'h4',studentId:'s4',title:'واجب الكيمياء',date:'2026-09-11',maxScore:10,score:4,status:'متأخر',note:'تسليم متأخر'},
    {id:'h5',studentId:'s5',title:'واجب الخلية',date:'2026-09-10',maxScore:10,score:10,status:'مكتمل',note:''},
    {id:'h6',studentId:'s6',title:'واجب الهضم',date:'2026-09-10',maxScore:10,score:8,status:'مكتمل',note:''},
    {id:'h7',studentId:'s7',title:'واجب الضوء',date:'2026-09-11',maxScore:10,score:0,status:'لم يتم التسليم',note:''},
    {id:'h8',studentId:'s8',title:'واجب الكيمياء',date:'2026-09-11',maxScore:10,score:9,status:'مكتمل',note:''},
    {id:'h9',studentId:'s9',title:'واجب الخلية',date:'2026-09-10',maxScore:10,score:6,status:'مكتمل',note:''},
    {id:'h10',studentId:'s10',title:'واجب الهضم',date:'2026-09-10',maxScore:10,score:0,status:'لم يتم التسليم',note:''}
  ]);
  save('exams',[
    {id:'e1',studentId:'s1',title:'اختبار شهري أول',date:'2026-09-01',maxScore:20,score:18,note:'ممتاز'},
    {id:'e2',studentId:'s2',title:'اختبار شهري أول',date:'2026-09-01',maxScore:20,score:10,note:''},
    {id:'e3',studentId:'s3',title:'اختبار شهري أول',date:'2026-09-01',maxScore:20,score:16,note:'جيد جداً'},
    {id:'e4',studentId:'s4',title:'اختبار شهري أول',date:'2026-09-01',maxScore:20,score:9,note:'يحتاج تقوية'},
    {id:'e5',studentId:'s5',title:'اختبار شهري أول',date:'2026-09-01',maxScore:20,score:20,note:'متفوق'},
    {id:'e6',studentId:'s6',title:'اختبار شهري أول',date:'2026-09-01',maxScore:20,score:14,note:''},
    {id:'e7',studentId:'s7',title:'اختبار شهري أول',date:'2026-09-01',maxScore:20,score:8,note:'ضعيف'},
    {id:'e8',studentId:'s8',title:'اختبار شهري أول',date:'2026-09-01',maxScore:20,score:17,note:''},
    {id:'e9',studentId:'s9',title:'اختبار شهري أول',date:'2026-09-01',maxScore:20,score:15,note:''},
    {id:'e10',studentId:'s10',title:'اختبار شهري أول',date:'2026-09-01',maxScore:20,score:11,note:''}
  ]);
  save('attendance',[
    {id:'a1',studentId:'s1',date:'2026-09-16',status:'حاضر'},
    {id:'a2',studentId:'s2',date:'2026-09-16',status:'غائب'},
    {id:'a3',studentId:'s3',date:'2026-09-16',status:'حاضر'},
    {id:'a4',studentId:'s4',date:'2026-09-16',status:'متأخر'},
    {id:'a5',studentId:'s5',date:'2026-09-16',status:'حاضر'},
    {id:'a6',studentId:'s6',date:'2026-09-16',status:'حاضر'},
    {id:'a7',studentId:'s7',date:'2026-09-16',status:'غائب'},
    {id:'a8',studentId:'s8',date:'2026-09-16',status:'حاضر'},
    {id:'a9',studentId:'s9',date:'2026-09-16',status:'حاضر'},
    {id:'a10',studentId:'s10',date:'2026-09-16',status:'غائب'}
  ]);
  save('payments',[
    {id:'p1',studentId:'s1',month:'سبتمبر 2026',total:300,paid:300,remaining:0,date:'2026-09-01',note:''},
    {id:'p2',studentId:'s2',month:'سبتمبر 2026',total:300,paid:150,remaining:150,date:'2026-09-05',note:''},
    {id:'p3',studentId:'s3',month:'سبتمبر 2026',total:300,paid:300,remaining:0,date:'2026-09-01',note:''},
    {id:'p4',studentId:'s4',month:'سبتمبر 2026',total:300,paid:0,remaining:300,date:'',note:'لم يدفع'},
    {id:'p5',studentId:'s5',month:'سبتمبر 2026',total:300,paid:300,remaining:0,date:'2026-09-01',note:''},
    {id:'p6',studentId:'s6',month:'سبتمبر 2026',total:300,paid:200,remaining:100,date:'2026-09-10',note:''},
    {id:'p7',studentId:'s7',month:'سبتمبر 2026',total:300,paid:0,remaining:300,date:'',note:''},
    {id:'p8',studentId:'s8',month:'سبتمبر 2026',total:300,paid:300,remaining:0,date:'2026-09-02',note:''},
    {id:'p9',studentId:'s9',month:'سبتمبر 2026',total:300,paid:300,remaining:0,date:'2026-09-01',note:''},
    {id:'p10',studentId:'s10',month:'سبتمبر 2026',total:300,paid:100,remaining:200,date:'2026-09-08',note:''}
  ]);
  save('notes',[
    {id:'n1',studentId:'s1',category:'متميز',content:'طالب متفوق، مشارك في الحصة بشكل دائم.',date:'2026-09-12'},
    {id:'n2',studentId:'s2',category:'متابعة عامة',content:'تحتاج متابعة مستمرة في الواجبات.',date:'2026-09-12'},
    {id:'n3',studentId:'s4',category:'أكاديمي',content:'مستوى الاختبارات ضعيف، يُنصح بالمراجعة.',date:'2026-09-13'},
    {id:'n4',studentId:'s7',category:'حضور',content:'غياب متكرر بدون عذر.',date:'2026-09-14'}
  ]);
  save('activities',[
    {id:'act1',studentName:'محمد أحمد',action:'تم تسجيل نتيجة امتحان',timestamp:'2026-09-14T09:00:00.000Z'},
    {id:'act2',studentName:'سارة محمود',action:'تم تسجيل غياب',timestamp:'2026-09-15T08:30:00.000Z'},
    {id:'act3',studentName:'مريم حسن',action:'تمت إضافة ملاحظة',timestamp:'2026-09-15T10:00:00.000Z'}
  ]);
}


// ROUTER
const PAGES={home:{title:'الرئيسية',render:renderHome},students:{title:'الطلاب',render:renderStudents},homework:{title:'الواجبات',render:renderHomework},exams:{title:'الامتحانات',render:renderExams},attendance:{title:'الحضور والغياب',render:renderAttendance},payments:{title:'المصروفات',render:renderPayments},performance:{title:'مستوى الطلاب',render:renderPerformance},notes:{title:'الملاحظات',render:renderNotes},settings:{title:'الإعدادات',render:function(){checkDatabaseStatus();updateLastUpdateTime();}}};
function navigate(sec){
  document.querySelectorAll('.page-section').forEach(s=>s.classList.add('hidden'));
  document.querySelectorAll('.nav-link').forEach(a=>a.classList.toggle('active',a.dataset.section===sec));
  const el=document.getElementById(sec+'Section');if(el)el.classList.remove('hidden');
  const p=PAGES[sec]||PAGES.home;
  document.getElementById('pageTitle').textContent=p.title;
  if(p.render)p.render();
  closeSidebar();
  history.replaceState(null,'','#'+sec);
}
function handleHash(){const h=(location.hash||'#home').replace('#','');navigate(Object.keys(PAGES).includes(h)?h:'home');}

// HOME
function renderHome(){
  const sec=document.getElementById('homeSection');
  const students=load('students');const todayStr=today();
  const att=load('attendance').filter(a=>a.date===todayStr);
  const present=att.filter(a=>a.status==='حاضر').length;
  const absent=att.filter(a=>a.status==='غائب').length;
  const pendingHw=load('homework').filter(h=>h.status!=='مكتمل').length;
  const totalDue=load('payments').reduce((s,p)=>s+(p.remaining||0),0);
  const activities=load('activities').slice(-6).reverse();
  sec.innerHTML='<div class="welcome-block"><h2>أهلاً بكِ، أستاذة ندى</h2><p>إليكِ ملخص متابعة الطلاب اليوم — '+new Date().toLocaleDateString('ar-EG',{weekday:'long',year:'numeric',month:'long',day:'numeric'})+'</p></div>'
  +'<div class="stats-grid">'
  +'<div class="stat-card"><div class="stat-num">'+students.length+'</div><div class="stat-lbl">إجمالي الطلاب</div></div>'
  +'<div class="stat-card"><div class="stat-num">'+present+'</div><div class="stat-lbl">حاضر اليوم</div></div>'
  +'<div class="stat-card"><div class="stat-num">'+absent+'</div><div class="stat-lbl">غائب اليوم</div></div>'
  +'<div class="stat-card"><div class="stat-num">'+pendingHw+'</div><div class="stat-lbl">واجبات تحتاج متابعة</div></div>'
  +'<div class="stat-card"><div class="stat-num">'+totalDue.toLocaleString('ar-EG')+'</div><div class="stat-lbl">مبالغ مستحقة (جنيه)</div></div>'
  +'</div>'
  +'<div><div class="quick-actions-title" style="margin-bottom:.6rem">إجراءات سريعة</div>'
  +'<div class="quick-actions-grid">'
  +'<button class="qbtn" id="qa1">+ إضافة طالب</button>'
  +'<button class="qbtn" id="qa2">+ تسجيل واجب</button>'
  +'<button class="qbtn" id="qa3">+ نتيجة امتحان</button>'
  +'<button class="qbtn" id="qa4">+ تسجيل حضور</button>'
  +'<button class="qbtn" id="qa5">+ تسجيل دفعة</button>'
  +'<button class="qbtn" id="qa6">+ إضافة ملاحظة</button>'
  +'</div></div>'
  +'<div class="activity-card"><div class="activity-card-title">آخر التحديثات</div><ul class="activity-list">'
  +(activities.length?activities.map(function(a){return '<li class="activity-item"><span><strong>'+esc(a.studentName)+'</strong> — '+esc(a.action)+'</span><span class="activity-time">'+fmtDate(a.timestamp)+' '+fmtTime(a.timestamp)+'</span></li>';}).join(''):'<li class="activity-item" style="color:var(--clr-muted)">لا توجد أنشطة.</li>')
  +'</ul></div>';
  document.getElementById('qa1').onclick=function(){openAddStudentModal();};
  document.getElementById('qa2').onclick=function(){navigate('homework');};
  document.getElementById('qa3').onclick=function(){navigate('exams');};
  document.getElementById('qa4').onclick=function(){navigate('attendance');};
  document.getElementById('qa5').onclick=function(){navigate('payments');};
  document.getElementById('qa6').onclick=function(){navigate('notes');};
  updateNotifications();
}


// STUDENTS
function renderStudents(){
  var sec=document.getElementById('studentsSection');
  sec.innerHTML='<div class="section-header"><h2>الطلاب</h2><button class="btn btn-accent" id="addStuBtn">+ إضافة طالب</button></div>'
  +'<div class="table-card"><div class="table-toolbar">'
  +'<input type="text" class="form-input" id="stuSearch" placeholder="ابحث باسم الطالب..." style="max-width:220px"/>'
  +'<select class="form-select" id="stuGrade" style="max-width:220px"><option value="">— كل الصفوف —</option>'+GRADES.map(function(g){return '<option value="'+esc(g)+'">'+g+'</option>';}).join('')+'</select>'
  +'<select class="form-select" id="stuCenter" style="max-width:160px"><option value="">— المدرس / السنتر —</option>'+CENTERS.map(function(c){return '<option value="'+esc(c)+'">'+c+'</option>';}).join('')+'</select>'
  +'<select class="form-select" id="stuStatus" style="max-width:160px"><option value="">— الحالة —</option><option>منتظم</option><option>يحتاج متابعة</option></select>'
  +'</div><div style="overflow-x:auto"><table class="data-table"><thead><tr><th>اسم الطالب</th><th>الصف</th><th>السنتر</th><th>الحضور</th><th>الامتحانات</th><th>المصروفات</th><th>الحالة</th><th>الإجراءات</th></tr></thead><tbody id="stuTbody"></tbody></table></div></div>';
  document.getElementById('addStuBtn').onclick=function(){openAddStudentModal();};
  document.getElementById('stuSearch').oninput=renderStudentRows;
  document.getElementById('stuGrade').onchange=renderStudentRows;
  document.getElementById('stuCenter').onchange=renderStudentRows;
  document.getElementById('stuStatus').onchange=renderStudentRows;
  renderStudentRows();
}
function renderStudentRows(){
  var tbody=document.getElementById('stuTbody');if(!tbody)return;
  var q=(document.getElementById('stuSearch')?document.getElementById('stuSearch').value:'').trim().toLowerCase();
  var g=document.getElementById('stuGrade')?document.getElementById('stuGrade').value:'';
  var c=document.getElementById('stuCenter')?document.getElementById('stuCenter').value:'';
  var st=document.getElementById('stuStatus')?document.getElementById('stuStatus').value:'';
  var all=load('students').filter(function(s){return(!q||s.name.toLowerCase().includes(q))&&(!g||s.grade===g)&&(!c||s.center===c)&&(!st||s.status===st);});
  if(!all.length){tbody.innerHTML='<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--clr-muted)">لا توجد بيانات طلاب.</td></tr>';return;}
  tbody.innerHTML=all.map(function(s){
    var att=s.attRate||calcAttendanceRate(s.id);var exam=s.examAvg||calcExamAvg(s.id);
    var cls=s.status==='منتظم'?'badge-green':'badge-yellow';
    var payCls=s.payStatus==='خالص'?'badge-green':s.payStatus==='متبقي'?'badge-yellow':'badge-red';
    return '<tr><td style="font-weight:600">'+esc(s.name)+'</td><td>'+esc(s.grade)+'</td><td><span class="badge badge-blue">'+esc(s.center||'—')+'</span></td><td>'+att+'%</td><td>'+(exam==='—'?'—':exam+'%')+'</td><td><span class="badge '+payCls+'">'+esc(s.payStatus||'—')+'</span></td><td><span class="badge '+cls+'">'+esc(s.status)+'</span></td>'
    +'<td><div class="actions-cell"><button class="act-btn act-btn-view" data-id="'+s.id+'">عرض</button><button class="act-btn act-btn-edit" data-id="'+s.id+'">تعديل</button><button class="act-btn act-btn-delete" data-id="'+s.id+'">حذف</button></div></td></tr>';
  }).join('');
  tbody.querySelectorAll('.act-btn-view').forEach(function(b){b.onclick=function(){openStudentProfile(b.dataset.id);};});
  tbody.querySelectorAll('.act-btn-edit').forEach(function(b){b.onclick=function(){openEditStudentModal(b.dataset.id);};});
  tbody.querySelectorAll('.act-btn-delete').forEach(function(b){b.onclick=function(){confirmDel('هل أنتِ متأكدة من حذف هذا الطالب؟',function(){deleteStudent(b.dataset.id);});};});
}
function studentFormHtml(s){
  return '<div class="form-group"><label class="form-label">اسم الطالب *</label><input class="form-input" name="name" value="'+esc(s.name||'')+'"/></div>'
  +'<div class="form-group"><label class="form-label">الصف الدراسي *</label><select class="form-select" name="grade"><option value="">اختر الصف</option>'+GRADES.map(function(g){return '<option value="'+esc(g)+'"'+(s.grade===g?' selected':'')+'>'+g+'</option>';}).join('')+'</select></div>'
  +'<div class="form-group"><label class="form-label">المدرس / السنتر *</label><select class="form-select" name="center"><option value="">اختر السنتر</option>'+CENTERS.map(function(c){return '<option value="'+esc(c)+'"'+(s.center===c?' selected':'')+'>'+c+'</option>';}).join('')+'</select></div>'
  +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">'
  +'<div class="form-group"><label class="form-label">نسبة الحضور (%)</label><input class="form-input" type="number" name="attRate" value="'+esc(s.attRate||'')+'" placeholder="مثال: 90"/></div>'
  +'<div class="form-group"><label class="form-label">متوسط الامتحانات (%)</label><input class="form-input" type="number" name="examAvg" value="'+esc(s.examAvg||'')+'" placeholder="مثال: 85"/></div>'
  +'<div class="form-group"><label class="form-label">الواجبات المكتملة</label><input class="form-input" type="text" name="hwCompleted" value="'+esc(s.hwCompleted||'')+'" placeholder="مثال: 4/5 أو 80%"/></div>'
  +'<div class="form-group"><label class="form-label">حالة المصروفات</label><select class="form-select" name="payStatus"><option value="خالص"'+(s.payStatus==='خالص'?' selected':'')+'>خالص</option><option value="متبقي"'+(s.payStatus==='متبقي'?' selected':'')+'>متبقي</option><option value="لم يتم الدفع"'+(s.payStatus==='لم يتم الدفع'?' selected':'')+'>لم يتم الدفع</option></select></div>'
  +'</div>'
  +'<div class="form-group"><label class="form-label">الحالة</label><select class="form-select" name="status"><option value="منتظم"'+((s.status||'منتظم')==='منتظم'?' selected':'')+'>منتظم</option><option value="يحتاج متابعة"'+(s.status==='يحتاج متابعة'?' selected':'')+'>يحتاج متابعة</option></select></div>'
  +'<div class="form-group"><label class="form-label">ملاحظات عامة</label><textarea class="form-textarea" name="generalNotes">'+esc(s.generalNotes||'')+'</textarea></div>';
}
function openAddStudentModal(){
  openModal('<div class="modal-header"><h3>إضافة طالب جديد</h3><button class="modal-close">✕</button></div><div class="modal-body"><form id="stuForm">'+studentFormHtml({})+'</form></div><div class="modal-footer"><button class="btn btn-accent" id="stuSaveBtn">حفظ الطالب</button><button class="btn btn-ghost" onclick="closeModal()">إلغاء</button></div>');
  document.getElementById('stuSaveBtn').onclick=function(){
    var f=document.getElementById('stuForm');var data=Object.fromEntries(new FormData(f));
    if(!data.name.trim()){showToast('من فضلك أدخل اسم الطالب.','error');return;}
    if(!data.grade){showToast('من فضلك اختر الصف الدراسي.','error');return;}
    if(!data.center){showToast('من فضلك اختر السنتر (الكاشف / سيف الدين).','error');return;}
    // Add teacher field for compatibility with search functionality
    data.teacher = data.center;
    var students=load('students');students.push(Object.assign({id:genId()},data));save('students',students);
    logActivity(data.name,'تمت إضافة طالب');showToast('تمت إضافة الطالب بنجاح');closeModal();renderStudents();updateNotifications();
  };
}
function openEditStudentModal(id){
  var students=load('students');var s=students.find(function(x){return x.id===id;});if(!s)return;
  openModal('<div class="modal-header"><h3>تعديل بيانات الطالب</h3><button class="modal-close">✕</button></div><div class="modal-body"><form id="stuForm">'+studentFormHtml(s)+'</form></div><div class="modal-footer"><button class="btn btn-accent" id="stuSaveBtn">حفظ التغييرات</button><button class="btn btn-ghost" onclick="closeModal()">إلغاء</button></div>');
  document.getElementById('stuSaveBtn').onclick=function(){
    var f=document.getElementById('stuForm');var data=Object.fromEntries(new FormData(f));
    if(!data.name.trim()){showToast('من فضلك أدخل اسم الطالب.','error');return;}
    if(!data.grade){showToast('من فضلك اختر الصف الدراسي.','error');return;}
    if(!data.center){showToast('من فضلك اختر السنتر.','error');return;}
    // Update teacher field for compatibility with search functionality
    data.teacher = data.center;
    var idx=students.findIndex(function(x){return x.id===id;});
    students[idx]=Object.assign({},s,data);save('students',students);
    logActivity(data.name,'تم تعديل بيانات الطالب');showToast('تم تحديث بيانات الطالب');closeModal();renderStudents();
  };
}
function deleteStudent(id){
  var students=load('students');var s=students.find(function(x){return x.id===id;});
  save('students',students.filter(function(x){return x.id!==id;}));
  logActivity(s.name,'تم حذف الطالب');showToast('تم حذف الطالب','error');renderStudents();updateNotifications();
}
function openStudentProfile(id){
  var s=getStudent(id);var att=s.attRate||calcAttendanceRate(id);var exam=s.examAvg||calcExamAvg(id);var hw=s.hwCompleted||(calcHomeworkRate(id)+'%');
  var payText = s.payStatus||'—';
  var lastNote=load('notes').filter(function(n){return n.studentId===id;}).slice(-1)[0];
  var ovHtml='<div class="overview-grid"><div class="ov-card"><div class="ov-num">'+att+'%</div><div class="ov-lbl">نسبة الحضور</div></div><div class="ov-card"><div class="ov-num">'+(exam==='—'?'—':exam+'%')+'</div><div class="ov-lbl">متوسط الامتحانات</div></div><div class="ov-card"><div class="ov-num">'+hw+'</div><div class="ov-lbl">إنجاز الواجبات</div></div><div class="ov-card"><div class="ov-num">'+payText+'</div><div class="ov-lbl">حالة المصروفات</div></div></div>'+(lastNote?'<div style="margin-top:1rem;padding:.8rem;background:#fffbf0;border-radius:8px;border:1px solid #f0d9a0"><strong>آخر ملاحظة:</strong> '+esc(lastNote.content)+'</div>':'');
  openModal('<div class="modal-header"><div><h3 style="font-size:1.1rem">'+esc(s.name)+'</h3><span style="font-size:.8rem;color:var(--clr-muted)">'+esc(s.grade)+' — '+esc(s.center||'غير محدد')+'</span></div><button class="modal-close">✕</button></div><div class="modal-body">'+ovHtml+'</div>');
}


// HOMEWORK
function renderHomework(){
  var sec=document.getElementById('homeworkSection');
  sec.innerHTML='<div class="section-header"><h2>إدارة الواجبات</h2><button class="btn btn-accent" id="addHwBtn">+ إضافة واجب</button></div>'
  +'<div class="table-card"><div class="table-toolbar"><input type="text" class="form-input" id="hwSearch" placeholder="بحث..." style="max-width:200px"/><select class="form-select" id="hwGrade" style="max-width:200px"><option value="">— كل الصفوف —</option>'+GRADES.map(function(g){return '<option value="'+esc(g)+'">'+g+'</option>';}).join('')+'</select><select class="form-select" id="hwStatus" style="max-width:160px"><option value="">— الحالة —</option><option>مكتمل</option><option>متأخر</option><option>لم يتم التسليم</option></select></div>'
  +'<div style="overflow-x:auto"><table class="data-table"><thead><tr><th>الطالب</th><th>الواجب</th><th>التاريخ</th><th>الدرجة</th><th>الحالة</th><th>الملاحظة</th><th>الإجراءات</th></tr></thead><tbody id="hwTbody"></tbody></table></div></div>';
  document.getElementById('addHwBtn').onclick=function(){openAddHwModal();};
  ['hwSearch','hwGrade','hwStatus'].forEach(function(id){var el=document.getElementById(id);if(el){el.oninput=renderHwRows;el.onchange=renderHwRows;}});
  renderHwRows();
}
function renderHwRows(){
  var tbody=document.getElementById('hwTbody');if(!tbody)return;
  var q=(document.getElementById('hwSearch')?document.getElementById('hwSearch').value:'').toLowerCase();
  var g=document.getElementById('hwGrade')?document.getElementById('hwGrade').value:'';
  var st=document.getElementById('hwStatus')?document.getElementById('hwStatus').value:'';
  var students=load('students');
  var all=load('homework').filter(function(h){var stu=students.find(function(s){return s.id===h.studentId;});var nm=stu?stu.name.toLowerCase():'';return(!q||nm.includes(q)||h.title.toLowerCase().includes(q))&&(!g||stu&&stu.grade===g)&&(!st||h.status===st);});
  if(!all.length){tbody.innerHTML='<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--clr-muted)">لا توجد واجبات.</td></tr>';return;}
  tbody.innerHTML=all.map(function(h){var cls=h.status==='مكتمل'?'badge-green':h.status==='متأخر'?'badge-yellow':'badge-red';return '<tr><td>'+esc(getStudentName(h.studentId))+'</td><td>'+esc(h.title)+'</td><td>'+fmtDate(h.date)+'</td><td>'+h.score+'/'+h.maxScore+'</td><td><span class="badge '+cls+'">'+esc(h.status)+'</span></td><td>'+esc(h.note||'—')+'</td><td><div class="actions-cell"><button class="act-btn act-btn-edit" data-id="'+h.id+'">تعديل</button><button class="act-btn act-btn-delete" data-id="'+h.id+'">حذف</button></div></td></tr>';}).join('');
  tbody.querySelectorAll('.act-btn-edit').forEach(function(b){b.onclick=function(){openEditHwModal(b.dataset.id);};});
  tbody.querySelectorAll('.act-btn-delete').forEach(function(b){b.onclick=function(){confirmDel('هل أنتِ متأكدة من حذف هذا الواجب؟',function(){save('homework',load('homework').filter(function(h){return h.id!==b.dataset.id;}));showToast('تم حذف الواجب','error');renderHwRows();});};});
}
function hwFormHtml(h){var students=load('students');return '<div class="form-group"><label class="form-label">الطالب *</label><select class="form-select" name="studentId"><option value="">اختر الطالب</option>'+students.map(function(s){return '<option value="'+s.id+'"'+(h.studentId===s.id?' selected':'')+'>'+esc(s.name)+' — '+esc(s.grade)+'</option>';}).join('')+'</select></div><div class="form-group"><label class="form-label">اسم الواجب *</label><input class="form-input" name="title" value="'+esc(h.title||'')+'"/></div><div class="form-group"><label class="form-label">التاريخ</label><input class="form-input" type="date" name="date" value="'+(h.date||today())+'"/></div><div class="form-group"><label class="form-label">الدرجة النهائية</label><input class="form-input" type="number" name="maxScore" min="0" value="'+(h.maxScore||10)+'"/></div><div class="form-group"><label class="form-label">درجة الطالب</label><input class="form-input" type="number" name="score" min="0" value="'+(h.score||0)+'"/></div><div class="form-group"><label class="form-label">الحالة</label><select class="form-select" name="status"><option value="مكتمل"'+(h.status==='مكتمل'?' selected':'')+'>مكتمل</option><option value="متأخر"'+(h.status==='متأخر'?' selected':'')+'>متأخر</option><option value="لم يتم التسليم"'+(h.status==='لم يتم التسليم'?' selected':'')+'>لم يتم التسليم</option></select></div><div class="form-group"><label class="form-label">ملاحظة</label><input class="form-input" name="note" value="'+esc(h.note||'')+'"/></div>';}
function openAddHwModal(){openModal('<div class="modal-header"><h3>إضافة واجب</h3><button class="modal-close">✕</button></div><div class="modal-body"><form id="hwForm">'+hwFormHtml({})+'</form></div><div class="modal-footer"><button class="btn btn-accent" id="hwSaveBtn">حفظ الواجب</button><button class="btn btn-ghost" onclick="closeModal()">إلغاء</button></div>');document.getElementById('hwSaveBtn').onclick=function(){saveHw(null);};}
function openEditHwModal(id){var h=load('homework').find(function(x){return x.id===id;});if(!h)return;openModal('<div class="modal-header"><h3>تعديل الواجب</h3><button class="modal-close">✕</button></div><div class="modal-body"><form id="hwForm">'+hwFormHtml(h)+'</form></div><div class="modal-footer"><button class="btn btn-accent" id="hwSaveBtn">حفظ التغييرات</button><button class="btn btn-ghost" onclick="closeModal()">إلغاء</button></div>');document.getElementById('hwSaveBtn').onclick=function(){saveHw(id);};}
function saveHw(id){var f=document.getElementById('hwForm');var d=Object.fromEntries(new FormData(f));if(!d.studentId){showToast('من فضلك اختر الطالب.','error');return;}if(!d.title.trim()){showToast('من فضلك أدخل اسم الواجب.','error');return;}d.maxScore=Number(d.maxScore);d.score=Number(d.score);if(d.score<0){showToast('الدرجة لا يمكن أن تكون سالبة.','error');return;}if(d.score>d.maxScore){showToast('درجة الطالب لا يمكن أن تكون أكبر من الدرجة النهائية.','error');return;}var hws=load('homework');if(id){var i=hws.findIndex(function(x){return x.id===id;});hws[i]=Object.assign({},hws[i],d);}else hws.push(Object.assign({id:genId()},d));save('homework',hws);logActivity(getStudentName(d.studentId),id?'تم تعديل واجب':'تمت إضافة واجب');showToast(id?'تم تحديث الواجب':'تمت إضافة الواجب بنجاح');closeModal();renderHwRows();}

// EXAMS
function renderExams(){
  var sec=document.getElementById('examsSection');
  sec.innerHTML='<div class="section-header"><h2>إدارة الامتحانات</h2><button class="btn btn-accent" id="addExamBtn">+ إضافة نتيجة</button></div>'
  +'<div class="table-card"><div class="table-toolbar"><input type="text" class="form-input" id="exSearch" placeholder="بحث..." style="max-width:200px"/><select class="form-select" id="exGrade" style="max-width:200px"><option value="">— كل الصفوف —</option>'+GRADES.map(function(g){return '<option value="'+esc(g)+'">'+g+'</option>';}).join('')+'</select></div>'
  +'<div style="overflow-x:auto"><table class="data-table"><thead><tr><th>الطالب</th><th>الامتحان</th><th>التاريخ</th><th>الدرجة</th><th>النسبة</th><th>التقييم</th><th>الإجراءات</th></tr></thead><tbody id="exTbody"></tbody></table></div></div>';
  document.getElementById('addExamBtn').onclick=function(){openAddExamModal();};
  ['exSearch','exGrade'].forEach(function(id){var el=document.getElementById(id);if(el){el.oninput=renderExamRows;el.onchange=renderExamRows;}});
  renderExamRows();
}
function evalGrade(pct){if(pct>=90)return{label:'ممتاز',cls:'badge-green'};if(pct>=75)return{label:'جيد جداً',cls:'badge-blue'};if(pct>=60)return{label:'جيد',cls:'badge-yellow'};return{label:'يحتاج تحسين',cls:'badge-red'};}
function renderExamRows(){
  var tbody=document.getElementById('exTbody');if(!tbody)return;
  var q=(document.getElementById('exSearch')?document.getElementById('exSearch').value:'').toLowerCase();
  var g=document.getElementById('exGrade')?document.getElementById('exGrade').value:'';
  var students=load('students');
  var all=load('exams').filter(function(e){var stu=students.find(function(s){return s.id===e.studentId;});var nm=stu?stu.name.toLowerCase():'';return(!q||nm.includes(q)||e.title.toLowerCase().includes(q))&&(!g||stu&&stu.grade===g);});
  if(!all.length){tbody.innerHTML='<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--clr-muted)">لا توجد نتائج امتحانات.</td></tr>';return;}
  tbody.innerHTML=all.map(function(e){var pct=Math.round((e.score/e.maxScore)*100);var ev=evalGrade(pct);return '<tr><td>'+esc(getStudentName(e.studentId))+'</td><td>'+esc(e.title)+'</td><td>'+fmtDate(e.date)+'</td><td>'+e.score+'/'+e.maxScore+'</td><td>'+pct+'%</td><td><span class="badge '+ev.cls+'">'+ev.label+'</span></td><td><div class="actions-cell"><button class="act-btn act-btn-edit" data-id="'+e.id+'">تعديل</button><button class="act-btn act-btn-delete" data-id="'+e.id+'">حذف</button></div></td></tr>';}).join('');
  tbody.querySelectorAll('.act-btn-edit').forEach(function(b){b.onclick=function(){openEditExamModal(b.dataset.id);};});
  tbody.querySelectorAll('.act-btn-delete').forEach(function(b){b.onclick=function(){confirmDel('هل أنتِ متأكدة من حذف هذه النتيجة؟',function(){save('exams',load('exams').filter(function(e){return e.id!==b.dataset.id;}));showToast('تم حذف النتيجة','error');renderExamRows();});};});
}
function examFormHtml(e){var students=load('students');return '<div class="form-group"><label class="form-label">الطالب *</label><select class="form-select" name="studentId"><option value="">اختر الطالب</option>'+students.map(function(s){return '<option value="'+s.id+'"'+(e.studentId===s.id?' selected':'')+'>'+esc(s.name)+' — '+esc(s.grade)+'</option>';}).join('')+'</select></div><div class="form-group"><label class="form-label">اسم الامتحان *</label><input class="form-input" name="title" value="'+esc(e.title||'')+'"/></div><div class="form-group"><label class="form-label">التاريخ</label><input class="form-input" type="date" name="date" value="'+(e.date||today())+'"/></div><div class="form-group"><label class="form-label">الدرجة النهائية</label><input class="form-input" type="number" name="maxScore" min="1" value="'+(e.maxScore||20)+'"/></div><div class="form-group"><label class="form-label">درجة الطالب</label><input class="form-input" type="number" name="score" min="0" value="'+(e.score||0)+'"/></div><div class="form-group"><label class="form-label">ملاحظات</label><textarea class="form-textarea" name="note">'+esc(e.note||'')+'</textarea></div>';}
function openAddExamModal(){openModal('<div class="modal-header"><h3>إضافة نتيجة امتحان</h3><button class="modal-close">✕</button></div><div class="modal-body"><form id="exForm">'+examFormHtml({})+'</form></div><div class="modal-footer"><button class="btn btn-accent" id="exSaveBtn">حفظ النتيجة</button><button class="btn btn-ghost" onclick="closeModal()">إلغاء</button></div>');document.getElementById('exSaveBtn').onclick=function(){saveExam(null);};}
function openEditExamModal(id){var e=load('exams').find(function(x){return x.id===id;});if(!e)return;openModal('<div class="modal-header"><h3>تعديل نتيجة امتحان</h3><button class="modal-close">✕</button></div><div class="modal-body"><form id="exForm">'+examFormHtml(e)+'</form></div><div class="modal-footer"><button class="btn btn-accent" id="exSaveBtn">حفظ التغييرات</button><button class="btn btn-ghost" onclick="closeModal()">إلغاء</button></div>');document.getElementById('exSaveBtn').onclick=function(){saveExam(id);};}
function saveExam(id){var f=document.getElementById('exForm');var d=Object.fromEntries(new FormData(f));if(!d.studentId){showToast('من فضلك اختر الطالب.','error');return;}if(!d.title.trim()){showToast('من فضلك أدخل اسم الامتحان.','error');return;}d.maxScore=Number(d.maxScore);d.score=Number(d.score);if(d.score<0){showToast('درجة الطالب لا يمكن أن تكون سالبة.','error');return;}if(d.score>d.maxScore){showToast('درجة الطالب لا يمكن أن تكون أكبر من الدرجة النهائية.','error');return;}var exams=load('exams');if(id){var i=exams.findIndex(function(x){return x.id===id;});exams[i]=Object.assign({},exams[i],d);}else exams.push(Object.assign({id:genId()},d));save('exams',exams);logActivity(getStudentName(d.studentId),id?'تم تعديل نتيجة امتحان':'تم تسجيل نتيجة امتحان');showToast(id?'تم تحديث النتيجة':'تم حفظ نتيجة الامتحان');closeModal();renderExamRows();}


// ATTENDANCE
function renderAttendance(){
  var sec=document.getElementById('attendanceSection');
  sec.innerHTML='<div class="section-header"><h2>الحضور والغياب</h2></div>'
  +'<div class="table-card"><div class="attend-toolbar"><div class="form-group" style="margin:0"><label class="form-label">التاريخ</label><input type="date" class="form-input" id="attDate" value="'+today()+'" style="max-width:180px"/></div><div class="form-group" style="margin:0"><label class="form-label">الصف</label><select class="form-select" id="attGrade" style="max-width:220px"><option value="">— كل الصفوف —</option>'+GRADES.map(function(g){return '<option value="'+esc(g)+'">'+g+'</option>';}).join('')+'</select></div><div class="form-group" style="margin:0"><label class="form-label">بحث</label><input type="text" class="form-input" id="attSearch" placeholder="اسم الطالب..." style="max-width:180px"/></div></div>'
  +'<div id="attendList"></div><div style="padding:1rem;border-top:1px solid var(--clr-border);display:flex;justify-content:flex-end"><button class="btn btn-accent" id="saveAttBtn">حفظ الحضور</button></div></div>'
  +'<div class="stats-grid" id="attStats" style="margin-top:1rem"></div>';
  ['attDate','attGrade','attSearch'].forEach(function(id){var el=document.getElementById(id);if(el){el.onchange=renderAttList;el.oninput=renderAttList;}});
  document.getElementById('saveAttBtn').onclick=saveAttendance;
  renderAttList();
}
function renderAttList(){
  var container=document.getElementById('attendList');if(!container)return;
  var d=document.getElementById('attDate')?document.getElementById('attDate').value:today();
  var g=document.getElementById('attGrade')?document.getElementById('attGrade').value:'';
  var q=(document.getElementById('attSearch')?document.getElementById('attSearch').value:'').toLowerCase();
  var students=load('students').filter(function(s){return(!g||s.grade===g)&&(!q||s.name.toLowerCase().includes(q));});
  var existing=load('attendance').filter(function(a){return a.date===d;});
  container.innerHTML=students.map(function(s){var rec=existing.find(function(a){return a.studentId===s.id;});var status=rec?rec.status:'حاضر';return '<div class="attend-row"><span class="attend-name">'+esc(s.name)+' — <span style="font-size:.8rem;color:var(--clr-muted)">'+esc(s.grade)+'</span></span><div class="attend-radios">'+['حاضر','غائب','متأخر'].map(function(st){return '<label class="attend-radio"><input type="radio" name="att_'+s.id+'" value="'+st+'"'+(status===st?' checked':'')+'/><span class="badge '+(st==='حاضر'?'badge-green':st==='متأخر'?'badge-yellow':'badge-red')+'">'+st+'</span></label>';}).join('')+'</div></div>';}).join('')||'<div style="padding:1.5rem;text-align:center;color:var(--clr-muted)">لا توجد طلاب.</div>';
  renderAttStats(d);
}
function renderAttStats(d){
  var container=document.getElementById('attStats');if(!container)return;
  var recs=load('attendance').filter(function(a){return a.date===d;});
  var present=recs.filter(function(a){return a.status==='حاضر';}).length;
  var absent=recs.filter(function(a){return a.status==='غائب';}).length;
  var late=recs.filter(function(a){return a.status==='متأخر';}).length;
  var total=present+absent+late;var rate=total?Math.round((present+late)/total*100):0;
  container.innerHTML='<div class="stat-card"><div class="stat-num">'+total+'</div><div class="stat-lbl">إجمالي المسجلين</div></div><div class="stat-card"><div class="stat-num">'+present+'</div><div class="stat-lbl">حاضر</div></div><div class="stat-card"><div class="stat-num">'+absent+'</div><div class="stat-lbl">غائب</div></div><div class="stat-card"><div class="stat-num">'+late+'</div><div class="stat-lbl">متأخر</div></div><div class="stat-card"><div class="stat-num">'+rate+'%</div><div class="stat-lbl">نسبة الحضور</div></div>';
}
function saveAttendance(){
  var d=document.getElementById('attDate')?document.getElementById('attDate').value:today();
  var g=document.getElementById('attGrade')?document.getElementById('attGrade').value:'';
  var q=(document.getElementById('attSearch')?document.getElementById('attSearch').value:'').toLowerCase();
  var students=load('students').filter(function(s){return(!g||s.grade===g)&&(!q||s.name.toLowerCase().includes(q));});
  var att=load('attendance').filter(function(a){return!(a.date===d&&students.some(function(s){return s.id===a.studentId;}));});
  students.forEach(function(s){var radios=document.querySelectorAll('input[name="att_'+s.id+'"]');var checked=Array.from(radios).find(function(r){return r.checked;});if(checked)att.push({id:genId(),studentId:s.id,date:d,status:checked.value});});
  save('attendance',att);logActivity('المجموعة','تم تسجيل الحضور');showToast('تم تسجيل الحضور بنجاح');renderAttStats(d);updateNotifications();
}

// PAYMENTS
function renderPayments(){
  var sec=document.getElementById('paymentsSection');
  var payments=load('payments');
  var totalPaid=payments.reduce(function(s,p){return s+p.paid;},0);
  var totalDue=payments.reduce(function(s,p){return s+(p.remaining||0);},0);
  var lateCount=payments.filter(function(p){return p.remaining>0;}).length;
  sec.innerHTML='<div class="section-header"><h2>مصاريف الدروس</h2><button class="btn btn-accent" id="addPayBtn">+ تسجيل دفعة</button></div>'
  +'<div class="stats-grid"><div class="stat-card"><div class="stat-num">'+totalPaid.toLocaleString('ar-EG')+' ج</div><div class="stat-lbl">إجمالي المدفوع</div></div><div class="stat-card"><div class="stat-num">'+totalDue.toLocaleString('ar-EG')+' ج</div><div class="stat-lbl">إجمالي المتبقي</div></div><div class="stat-card"><div class="stat-num">'+lateCount+'</div><div class="stat-lbl">لديهم مبالغ متبقية</div></div></div>'
  +'<div class="table-card"><div class="table-toolbar"><input type="text" class="form-input" id="paySearch" placeholder="بحث باسم الطالب..." style="max-width:220px"/></div>'
  +'<div style="overflow-x:auto"><table class="data-table"><thead><tr><th>الطالب</th><th>الشهر</th><th>الاشتراك</th><th>المدفوع</th><th>المتبقي</th><th>الحالة</th><th>تاريخ الدفع</th><th>الإجراءات</th></tr></thead><tbody id="payTbody"></tbody></table></div></div>';
  document.getElementById('addPayBtn').onclick=function(){openAddPaymentModal();};
  document.getElementById('paySearch').oninput=renderPayRows;
  renderPayRows();
}
function renderPayRows(){
  var tbody=document.getElementById('payTbody');if(!tbody)return;
  var q=(document.getElementById('paySearch')?document.getElementById('paySearch').value:'').toLowerCase();
  var all=load('payments').filter(function(p){return!q||getStudentName(p.studentId).toLowerCase().includes(q);});
  if(!all.length){tbody.innerHTML='<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--clr-muted)">لا توجد دفعات.</td></tr>';return;}
  tbody.innerHTML=all.map(function(p){var ps=paymentStatus(p);return '<tr><td style="font-weight:600">'+esc(getStudentName(p.studentId))+'</td><td>'+esc(p.month)+'</td><td>'+p.total+' ج</td><td>'+p.paid+' ج</td><td>'+p.remaining+' ج</td><td><span class="badge '+ps.cls+'">'+ps.label+'</span></td><td>'+(p.date?fmtDate(p.date):'—')+'</td><td><div class="actions-cell"><button class="act-btn act-btn-edit" data-id="'+p.id+'">تعديل</button><button class="act-btn act-btn-delete" data-id="'+p.id+'">حذف</button></div></td></tr>';}).join('');
  tbody.querySelectorAll('.act-btn-edit').forEach(function(b){b.onclick=function(){openEditPaymentModal(b.dataset.id);};});
  tbody.querySelectorAll('.act-btn-delete').forEach(function(b){b.onclick=function(){confirmDel('هل أنتِ متأكدة من حذف هذه الدفعة؟',function(){save('payments',load('payments').filter(function(p){return p.id!==b.dataset.id;}));showToast('تم حذف الدفعة','error');renderPayRows();updateNotifications();});};});
}
function payFormHtml(p){var students=load('students');return '<div class="form-group"><label class="form-label">الطالب *</label><select class="form-select" name="studentId"><option value="">اختر الطالب</option>'+students.map(function(s){return '<option value="'+s.id+'"'+(p.studentId===s.id?' selected':'')+'>'+esc(s.name)+'</option>';}).join('')+'</select></div><div class="form-group"><label class="form-label">الشهر *</label><input class="form-input" name="month" value="'+esc(p.month||'')+'"/></div><div class="form-group"><label class="form-label">قيمة الاشتراك</label><input class="form-input" type="number" name="total" min="0" value="'+(p.total||300)+'"/></div><div class="form-group"><label class="form-label">المبلغ المدفوع</label><input class="form-input" type="number" name="paid" min="0" value="'+(p.paid||0)+'"/></div><div class="form-group"><label class="form-label">تاريخ الدفع</label><input class="form-input" type="date" name="date" value="'+(p.date||today())+'"/></div><div class="form-group"><label class="form-label">ملاحظة</label><input class="form-input" name="note" value="'+esc(p.note||'')+'"/></div>';}
function openAddPaymentModal(){openModal('<div class="modal-header"><h3>تسجيل دفعة</h3><button class="modal-close">✕</button></div><div class="modal-body"><form id="payForm">'+payFormHtml({})+'</form></div><div class="modal-footer"><button class="btn btn-accent" id="paySaveBtn">تسجيل الدفعة</button><button class="btn btn-ghost" onclick="closeModal()">إلغاء</button></div>');document.getElementById('paySaveBtn').onclick=function(){savePayment(null);};}
function openEditPaymentModal(id){var p=load('payments').find(function(x){return x.id===id;});if(!p)return;openModal('<div class="modal-header"><h3>تعديل الدفعة</h3><button class="modal-close">✕</button></div><div class="modal-body"><form id="payForm">'+payFormHtml(p)+'</form></div><div class="modal-footer"><button class="btn btn-accent" id="paySaveBtn">حفظ التغييرات</button><button class="btn btn-ghost" onclick="closeModal()">إلغاء</button></div>');document.getElementById('paySaveBtn').onclick=function(){savePayment(id);};}
function savePayment(id){var f=document.getElementById('payForm');var d=Object.fromEntries(new FormData(f));if(!d.studentId){showToast('من فضلك اختر الطالب.','error');return;}if(!d.month.trim()){showToast('من فضلك أدخل الشهر.','error');return;}d.total=Number(d.total);d.paid=Number(d.paid);if(d.paid<0){showToast('المبلغ المدفوع لا يمكن أن يكون سالبًا.','error');return;}if(d.paid>d.total){showToast('المبلغ المدفوع أكبر من قيمة الاشتراك.','error');return;}d.remaining=d.total-d.paid;var pays=load('payments');if(id){var i=pays.findIndex(function(x){return x.id===id;});pays[i]=Object.assign({},pays[i],d);}else pays.push(Object.assign({id:genId()},d));save('payments',pays);logActivity(getStudentName(d.studentId),id?'تم تعديل دفعة':'تم تسجيل دفعة');showToast(id?'تم تحديث الدفعة':'تم تسجيل الدفعة بنجاح');closeModal();renderPayRows();updateNotifications();}


// NOTES
function renderNotes(){
  var sec=document.getElementById('notesSection');
  sec.innerHTML='<div class="section-header"><h2>ملاحظات الطلاب</h2><button class="btn btn-accent" id="addNoteBtn">+ إضافة ملاحظة</button></div>'
  +'<div class="table-toolbar" style="background:var(--clr-card);border:1px solid var(--clr-border);border-radius:var(--radius-lg);margin-bottom:1rem;padding:1rem;display:flex;gap:.7rem;flex-wrap:wrap">'
  +'<input type="text" class="form-input" id="noteSearch" placeholder="بحث باسم الطالب..." style="max-width:220px"/>'
  +'<select class="form-select" id="noteCat" style="max-width:200px"><option value="">— كل التصنيفات —</option>'+NOTE_CATS.map(function(c){return '<option value="'+c+'">'+c+'</option>';}).join('')+'</select>'
  +'</div><div class="notes-grid" id="notesGrid"></div>';
  document.getElementById('addNoteBtn').onclick=function(){openAddNoteModal();};
  ['noteSearch','noteCat'].forEach(function(id){var el=document.getElementById(id);if(el){el.oninput=renderNoteCards;el.onchange=renderNoteCards;}});
  renderNoteCards();
}
function renderNoteCards(){
  var grid=document.getElementById('notesGrid');if(!grid)return;
  var q=(document.getElementById('noteSearch')?document.getElementById('noteSearch').value:'').toLowerCase();
  var cat=document.getElementById('noteCat')?document.getElementById('noteCat').value:'';
  var catColors={أكاديمي:'badge-blue',واجبات:'badge-yellow',حضور:'badge-gray',سلوك:'badge-red',متميز:'badge-green','متابعة عامة':'badge-gray'};
  var all=load('notes').filter(function(n){return(!q||getStudentName(n.studentId).toLowerCase().includes(q))&&(!cat||n.category===cat);}).reverse();
  if(!all.length){grid.innerHTML='<div class="empty-state-card"><p>لا توجد ملاحظات.</p></div>';return;}
  grid.innerHTML=all.map(function(n){return '<div class="note-card"><div class="note-card-top"><span class="note-student">'+esc(getStudentName(n.studentId))+'</span><span class="badge '+(catColors[n.category]||'badge-gray')+'">'+esc(n.category)+'</span></div><p class="note-text">'+esc(n.content)+'</p><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:.78rem;color:var(--clr-muted)">'+fmtDate(n.date)+'</span><div class="note-actions"><button class="act-btn act-btn-edit" data-id="'+n.id+'">تعديل</button><button class="act-btn act-btn-delete" data-id="'+n.id+'">حذف</button></div></div></div>';}).join('');
  grid.querySelectorAll('.act-btn-edit').forEach(function(b){b.onclick=function(){openEditNoteModal(b.dataset.id);};});
  grid.querySelectorAll('.act-btn-delete').forEach(function(b){b.onclick=function(){confirmDel('هل أنتِ متأكدة من حذف هذه الملاحظة؟',function(){save('notes',load('notes').filter(function(n){return n.id!==b.dataset.id;}));showToast('تم حذف الملاحظة','error');renderNoteCards();});};});
}
function noteFormHtml(n){var students=load('students');return '<div class="form-group"><label class="form-label">الطالب *</label><select class="form-select" name="studentId"><option value="">اختر الطالب</option>'+students.map(function(s){return '<option value="'+s.id+'"'+(n.studentId===s.id?' selected':'')+'>'+esc(s.name)+'</option>';}).join('')+'</select></div><div class="form-group"><label class="form-label">نوع الملاحظة</label><select class="form-select" name="category">'+NOTE_CATS.map(function(c){return '<option value="'+c+'"'+(n.category===c?' selected':'')+'>'+c+'</option>';}).join('')+'</select></div><div class="form-group"><label class="form-label">الملاحظة *</label><textarea class="form-textarea" name="content">'+esc(n.content||'')+'</textarea></div><div class="form-group"><label class="form-label">التاريخ</label><input class="form-input" type="date" name="date" value="'+(n.date||today())+'"/></div>';}
function openAddNoteModal(){openModal('<div class="modal-header"><h3>إضافة ملاحظة</h3><button class="modal-close">✕</button></div><div class="modal-body"><form id="noteForm">'+noteFormHtml({})+'</form></div><div class="modal-footer"><button class="btn btn-accent" id="noteSaveBtn">حفظ الملاحظة</button><button class="btn btn-ghost" onclick="closeModal()">إلغاء</button></div>');document.getElementById('noteSaveBtn').onclick=function(){saveNote(null);};}
function openEditNoteModal(id){var n=load('notes').find(function(x){return x.id===id;});if(!n)return;openModal('<div class="modal-header"><h3>تعديل الملاحظة</h3><button class="modal-close">✕</button></div><div class="modal-body"><form id="noteForm">'+noteFormHtml(n)+'</form></div><div class="modal-footer"><button class="btn btn-accent" id="noteSaveBtn">حفظ التغييرات</button><button class="btn btn-ghost" onclick="closeModal()">إلغاء</button></div>');document.getElementById('noteSaveBtn').onclick=function(){saveNote(id);};}
function saveNote(id){var f=document.getElementById('noteForm');var d=Object.fromEntries(new FormData(f));if(!d.studentId){showToast('من فضلك اختر الطالب.','error');return;}if(!d.content.trim()){showToast('من فضلك أدخل الملاحظة.','error');return;}var notes=load('notes');if(id){var i=notes.findIndex(function(x){return x.id===id;});notes[i]=Object.assign({},notes[i],d);}else notes.push(Object.assign({id:genId()},d));save('notes',notes);logActivity(getStudentName(d.studentId),id?'تم تعديل ملاحظة':'تمت إضافة ملاحظة');showToast(id?'تم تحديث الملاحظة':'تمت إضافة الملاحظة');closeModal();renderNoteCards();}

// PERFORMANCE
function renderPerformance(){
  var sec=document.getElementById('performanceSection');
  var students=load('students');
  var allHw=load('homework');
  var totalExamSum=0;var countExam=0;
  students.forEach(function(s){var a=calcExamAvg(s.id);if(a!=='—'){totalExamSum+=Number(a);countExam++;}});
  var globalExamAvg=countExam?Math.round(totalExamSum/countExam):0;
  var hwDone=allHw.filter(function(h){return h.status==='مكتمل';}).length;
  var hwRate=allHw.length?Math.round((hwDone/allHw.length)*100):0;
  var needsFollow=students.filter(function(s){return calcAttendanceRate(s.id)<75||calcHomeworkRate(s.id)<60||(calcExamAvg(s.id)!=='—'&&Number(calcExamAvg(s.id))<60)||load('payments').some(function(p){return p.studentId===s.id&&p.remaining>0;});});
  function barColor(v){return v>=75?'bar-green':v>=50?'bar-yellow':'bar-red';}
  sec.innerHTML='<div class="section-header"><h2>مستوى الطلاب</h2></div>'
  +'<div class="stats-grid"><div class="stat-card"><div class="stat-num">'+globalExamAvg+'%</div><div class="stat-lbl">متوسط الامتحانات الكلي</div></div><div class="stat-card"><div class="stat-num">'+hwRate+'%</div><div class="stat-lbl">نسبة إنجاز الواجبات</div></div><div class="stat-card"><div class="stat-num">'+needsFollow.length+'</div><div class="stat-lbl">يحتاجون متابعة</div></div></div>'
  +(needsFollow.length?'<div class="table-card"><div class="activity-card-title" style="padding:.9rem 1.2rem;border-bottom:1px solid var(--clr-border)">طلاب يحتاجون متابعة</div><table class="data-table"><thead><tr><th>الطالب</th><th>الصف</th><th>أسباب المتابعة</th></tr></thead><tbody>'+needsFollow.map(function(s){var reasons=[];if(calcAttendanceRate(s.id)<75)reasons.push('نسبة حضور منخفضة');if(calcHomeworkRate(s.id)<60)reasons.push('إنجاز واجبات منخفض');if(calcExamAvg(s.id)!=='—'&&Number(calcExamAvg(s.id))<60)reasons.push('متوسط امتحانات منخفض');if(load('payments').some(function(p){return p.studentId===s.id&&p.remaining>0;}))reasons.push('مبالغ متبقية');return '<tr><td style="font-weight:600">'+esc(s.name)+'</td><td>'+esc(s.grade)+'</td><td>'+reasons.map(function(r){return '<span class="badge badge-yellow" style="margin-left:.3rem">'+r+'</span>';}).join('')+'</td></tr>';}).join('')+'</tbody></table></div>':'')
  +'<div class="perf-grid">'+students.map(function(s){var att=calcAttendanceRate(s.id);var exam=calcExamAvg(s.id);var hw=calcHomeworkRate(s.id);var nf=needsFollow.some(function(ns){return ns.id===s.id;});return '<div class="perf-student-card'+(nf?' needs-follow':'')+'"><div class="perf-name">'+esc(s.name)+'<br><span style="font-size:.76rem;color:var(--clr-muted);font-weight:400">'+esc(s.grade)+'</span></div><div class="perf-row"><span>الحضور</span><div class="perf-bar-wrap"><div class="perf-bar '+barColor(att)+'" style="width:'+att+'%"></div></div><span>'+att+'%</span></div><div class="perf-row"><span>الامتحانات</span><div class="perf-bar-wrap"><div class="perf-bar '+(exam==='—'?'bar-yellow':barColor(Number(exam)))+'" style="width:'+(exam==='—'?0:exam)+'%"></div></div><span>'+(exam==='—'?'—':exam+'%')+'</span></div><div class="perf-row"><span>الواجبات</span><div class="perf-bar-wrap"><div class="perf-bar '+barColor(hw)+'" style="width:'+hw+'%"></div></div><span>'+hw+'%</span></div></div>';}).join('')+'</div>';
}

// NOTIFICATIONS
function updateNotifications(){
  var pendingHw=load('homework').filter(function(h){return h.status!=='مكتمل';}).length;
  var dueStudents=load('payments').filter(function(p){return p.remaining>0;}).length;
  var todayAtt=load('attendance').filter(function(a){return a.date===today()&&a.status==='غائب';}).length;
  var notifs=[];
  if(pendingHw>0)notifs.push({msg:pendingHw+' واجب لم يُكتمل',section:'homework'});
  if(dueStudents>0)notifs.push({msg:dueStudents+' طالب لديهم مبالغ مستحقة',section:'payments'});
  if(todayAtt>0)notifs.push({msg:todayAtt+' حالة غياب اليوم',section:'attendance'});
  var badge=document.getElementById('notifBadge');if(badge)badge.textContent=notifs.length||'';
  var drop=document.getElementById('notifDropdown');
  if(drop){drop.innerHTML=notifs.length?notifs.map(function(n){return '<div class="notif-item" data-sec="'+n.section+'">'+n.msg+'</div>';}).join(''):'<div class="notif-item">لا توجد إشعارات جديدة</div>';drop.querySelectorAll('.notif-item[data-sec]').forEach(function(it){it.onclick=function(){navigate(it.dataset.sec);drop.classList.add('hidden');};});}
}
document.getElementById('notifBtn').addEventListener('click',function(){document.getElementById('notifDropdown').classList.toggle('hidden');});

// GLOBAL SEARCH
var gsEl=document.getElementById('globalSearchInput');var srEl=document.getElementById('searchResults');
gsEl.addEventListener('input',function(){
  var q=gsEl.value.trim().toLowerCase();
  if(q.length<2){srEl.classList.remove('visible');srEl.innerHTML='';return;}
  var students=load('students').filter(function(s){return s.name.toLowerCase().includes(q)||s.grade.toLowerCase().includes(q);});
  srEl.innerHTML=students.length?students.map(function(s){return '<div class="search-result-item" data-sid="'+s.id+'">'+esc(s.name)+' — '+esc(s.grade)+'</div>';}).join(''):'<div class="search-result-item" style="color:var(--clr-muted)">لا توجد نتائج</div>';
  srEl.classList.add('visible');
  srEl.querySelectorAll('[data-sid]').forEach(function(el){el.onclick=function(){gsEl.value='';srEl.classList.remove('visible');navigate('students');setTimeout(function(){var si=document.getElementById('stuSearch');if(si){si.value=el.textContent.split('—')[0].trim();renderStudentRows();}},100);};});
});
document.addEventListener('click',function(e){if(!e.target.closest('.global-search-wrap'))srEl.classList.remove('visible');if(!e.target.closest('.notif-wrap'))document.getElementById('notifDropdown')?.classList.add('hidden');});

// SIDEBAR MOBILE
function closeSidebar(){if(window.innerWidth<=1024){document.getElementById('sidebar').classList.remove('open');document.getElementById('sidebarOverlay').classList.remove('open');}}
document.getElementById('hamburgerBtn').addEventListener('click',function(){document.getElementById('sidebar').classList.toggle('open');document.getElementById('sidebarOverlay').classList.toggle('open');});
document.getElementById('sidebarOverlay').addEventListener('click',closeSidebar);

// MODAL close on overlay click
document.getElementById('modalOverlay').addEventListener('click',function(e){if(e.target===this)closeModal();});

// INIT
window.addEventListener('DOMContentLoaded', async function(){
  await initBackend();
  seedDemoData();
  handleHash();
  updateNotifications();
});
window.addEventListener('hashchange',handleHash);
