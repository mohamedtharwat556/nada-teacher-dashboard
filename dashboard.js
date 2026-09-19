
/* dashboard.js - Teacher Dashboard - استاذة ندى */

const KEYS={students:'students',homework:'homework',exams:'exams',attendance:'attendance',payments:'payments',notes:'notes',activities:'activities',monthlyEvaluations:'monthlyEvaluations',studentMonthlyData:'studentMonthlyData'};
const GRADES=['الصف الرابع الابتدائي','الصف الخامس الابتدائي','الصف السادس الابتدائي','الصف الأول الإعدادي','الصف الثاني الإعدادي','الصف الثالث الإعدادي','الصف الأول الثانوي'];
const CENTERS=['الكاشف','سيف الدين'];
const NOTE_CATS=['أكاديمي','واجبات','حضور','سلوك','متابعة عامة','متميز'];
const MONTHS=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
function genId(){
  // Use Web Crypto API for browser compatibility
  if(typeof crypto!=='undefined' && crypto.randomUUID){
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return '_'+Math.random().toString(36).substr(2,9)+'-'+Date.now().toString(36);
}
function today(){return new Date().toISOString().split('T')[0];}
function now(){return new Date().toISOString();}
function fmtDate(d){return d?new Date(d).toLocaleDateString('ar-EG'):'—';}
function fmtTime(d){return d?new Date(d).toLocaleTimeString('ar-EG',{hour:'2-digit',minute:'2-digit'}):'—';}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function getMonthStart(year, monthIndex){return new Date(year, monthIndex, 1).toISOString().split('T')[0];}
function getMonthEnd(year, monthIndex){return new Date(year, monthIndex + 1, 0).toISOString().split('T')[0];}
function getMonthFromDate(dateStr){const d=new Date(dateStr);return MONTHS[d.getMonth()];}
function getYearFromDate(dateStr){return new Date(dateStr).getFullYear();}
window.APP_DATA = { students: [], homework: [], exams: [], attendance: [], payments: [], notes: [], activities: [], monthlyEvaluations: [], studentMonthlyData: [] };
async function initBackend() {
  try {
    // Load students from improved API
    const studentsRes = await fetch('/api/students');
    const students = studentsRes.ok ? await studentsRes.json() : [];
    
    // Load other data from legacy API
    const res = await fetch('/api/data');
    let otherData = {};
    if (res.ok) {
      const data = await res.json();
      otherData = {
        homework: data.homework || data.nada_homework || [],
        exams: data.exams || data.nada_exams || [],
        attendance: data.attendance || data.nada_attendance || [],
        payments: data.payments || data.nada_payments || [],
        notes: data.notes || data.nada_notes || [],
        activities: data.activities || data.nada_activities || [],
        monthlyEvaluations: data.monthlyEvaluations || data.nada_monthlyEvaluations || [],
        studentMonthlyData: data.studentMonthlyData || data.nada_studentMonthlyData || []
      };
    }
    
    // Also try to load monthly data from dedicated API for latest data
    try {
      const monthlyRes = await fetch('/api/student-monthly-data');
      if (monthlyRes.ok) {
        const monthlyData = await monthlyRes.json();
        otherData.studentMonthlyData = monthlyData;
        console.log('✅ Monthly data loaded from dedicated API:', monthlyData.length);
      }
    } catch(e) {
      console.warn('Could not load monthly data from dedicated API:', e);
    }
    
    window.APP_DATA = {
      students: students,
      ...otherData
    };
    
    console.log('✅ Data loaded - students from improved API, others from legacy');
  } catch(e) { 
    console.warn('Backend not reachable, trying legacy API only', e);
    // Fallback to legacy API for everything
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const data = await res.json();
        window.APP_DATA = {
          students: data.students || data.nada_students || [],
          homework: data.homework || data.nada_homework || [],
          exams: data.exams || data.nada_exams || [],
          attendance: data.attendance || data.nada_attendance || [],
          payments: data.payments || data.nada_payments || [],
          notes: data.notes || data.nada_notes || [],
          activities: data.activities || data.nada_activities || [],
          monthlyEvaluations: data.monthlyEvaluations || data.nada_monthlyEvaluations || [],
          studentMonthlyData: data.studentMonthlyData || data.nada_studentMonthlyData || []
        };
      }
    } catch(legacyError) {
      console.warn('Legacy API also failed', legacyError);
    }
  }
}
async function syncBackend(key, data) {
  window.APP_DATA[key] = data;
  try {
    // Use legacy API for simplicity and reliability
    await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: data })
    });
  } catch(e) { console.error('Failed to save', e); }
}

// Sync with the improved server API
async function syncImprovedBackend(key, data) {
  try {
    // For now, we only sync students through individual operations
    // Other data types will use the legacy API for simplicity
    if (key === 'students') {
      // Students are handled individually in add/edit/delete functions
      return;
    }
    
    // For other data types, use legacy API
    await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: data })
    });
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
function calcMonthlyAttendanceRate(id, monthIndex, year){
  var monthlyEvals=load('monthlyEvaluations')||[];
  var manualEval=monthlyEvals.find(function(e){return e.studentId===id&&e.monthIndex===monthIndex&&e.year===year&&e.isManual});
  if(manualEval&&manualEval.attendanceRate!==undefined)return manualEval.attendanceRate;
  var monthStart=getMonthStart(year, parseInt(monthIndex));
  var monthEnd=getMonthEnd(year, parseInt(monthIndex));
  var r=load('attendance').filter(function(a){return a.studentId===id&&a.date>=monthStart&&a.date<=monthEnd;});
  if(!r.length)return 100;
  return Math.round((r.filter(function(a){return a.status==='حاضر'||a.status==='متأخر';}).length/r.length)*100);
}
function calcMonthlyExamAvg(id, monthIndex, year){
  var monthlyEvals=load('monthlyEvaluations')||[];
  var manualEval=monthlyEvals.find(function(e){return e.studentId===id&&e.monthIndex===monthIndex&&e.year===year&&e.isManual});
  if(manualEval&&manualEval.examAvg!==null)return manualEval.examAvg;
  var monthStart=getMonthStart(year, parseInt(monthIndex));
  var monthEnd=getMonthEnd(year, parseInt(monthIndex));
  var e=load('exams').filter(function(ex){return ex.studentId===id&&ex.date>=monthStart&&ex.date<=monthEnd;});
  if(!e.length)return '—';
  return Math.round(e.reduce(function(s,x){return s+(x.score/x.maxScore)*100;},0)/e.length);
}
function calcMonthlyHomeworkRate(id, monthIndex, year){
  var monthlyEvals=load('monthlyEvaluations')||[];
  var manualEval=monthlyEvals.find(function(e){return e.studentId===id&&e.monthIndex===monthIndex&&e.year===year&&e.isManual});
  if(manualEval&&manualEval.homeworkRate!==undefined)return manualEval.homeworkRate;
  var monthStart=getMonthStart(year, parseInt(monthIndex));
  var monthEnd=getMonthEnd(year, parseInt(monthIndex));
  var h=load('homework').filter(function(hw){return hw.studentId===id&&hw.date>=monthStart&&hw.date<=monthEnd;});
  if(!h.length)return 100;
  return Math.round((h.filter(function(hw){return hw.status==='مكتمل';}).length/h.length)*100);
}
function calcMonthlyPaymentStatus(id, monthIndex, year){
  var monthlyEvals=load('monthlyEvaluations')||[];
  var manualEval=monthlyEvals.find(function(e){return e.studentId===id&&e.monthIndex===monthIndex&&e.year===year&&e.isManual});
  if(manualEval&&manualEval.paymentStatus)return manualEval.paymentStatus;
  var monthName=MONTHS[parseInt(monthIndex)];
  var p=load('payments').filter(function(pay){return pay.studentId===id&&pay.month.includes(monthName)&&pay.month.includes(year);});
  if(!p.length)return 'غير مسجل';
  var totalPaid=p.reduce(function(sum,pay){return sum+pay.paid;},0);
  var totalRemaining=p.reduce(function(sum,pay){return sum+(pay.remaining||0);},0);
  if(totalRemaining===0)return 'مدفوع بالكامل';
  if(totalPaid===0)return 'لم يتم الدفع';
  return 'جزئي';
}
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
      activities: [],
      monthlyEvaluations: [],
      studentMonthlyData: []
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
        activities: [],
        monthlyEvaluations: [],
        studentMonthlyData: []
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
    'هل أنت متأكد من مسح جميع البيانات؟<br><br>⚠️ هذا الإجراء سيحذف:<br>• جميع الطلاب<br>• جميع الواجبات<br>• جميع الامتحانات<br>• جميع سجلات الحضور<br>• جميع المدفوعات<br>• جميع الملاحظات<br>• جميع التقييمات الشهرية<br><br>لا يمكن التراجع عن هذا الإجراء!',
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
  save('monthlyEvaluations',[]);
  save('studentMonthlyData',[
    {id:'md1',studentId:'s1',monthIndex:9,year:2026,attendanceRate:90,homeworkCompleted:'4/5',examAvg:85,paymentStatus:'خالص',status:'منتظم',generalNotes:''},
    {id:'md2',studentId:'s2',monthIndex:9,year:2026,attendanceRate:70,homeworkCompleted:'2/5',examAvg:60,paymentStatus:'متبقي',status:'يحتاج متابعة',generalNotes:''},
    {id:'md3',studentId:'s3',monthIndex:9,year:2026,attendanceRate:95,homeworkCompleted:'5/5',examAvg:90,paymentStatus:'خالص',status:'منتظم',generalNotes:''},
    {id:'md4',studentId:'s4',monthIndex:9,year:2026,attendanceRate:60,homeworkCompleted:'1/5',examAvg:50,paymentStatus:'لم يتم الدفع',status:'يحتاج متابعة',generalNotes:''},
    {id:'md5',studentId:'s5',monthIndex:9,year:2026,attendanceRate:100,homeworkCompleted:'5/5',examAvg:95,paymentStatus:'خالص',status:'منتظم',generalNotes:''}
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
  var currentYear=new Date().getFullYear();
  var currentMonth=new Date().getMonth();
  sec.innerHTML='<div class="section-header"><h2>الطلاب</h2><div><button class="btn btn-danger" id="deleteAllBtn" style="margin-left:0.5rem">حذف الكل</button><button class="btn btn-accent" id="addStuBtn">+ إضافة طالب</button></div></div>'
  +'<div class="table-card"><div class="table-toolbar">'
  +'<input type="text" class="form-input" id="stuSearch" placeholder="ابحث باسم الطالب..." style="max-width:220px"/>'
  +'<select class="form-select" id="stuMonth" style="max-width:160px"><option value="">— الكل —</option>'+MONTHS.map(function(m,i){return '<option value="'+i+'"'+(i===currentMonth?' selected':'')+'>'+m+'</option>';}).join('')+'</select>'
  +'<select class="form-select" id="stuYear" style="max-width:120px"><option value="2025">2025</option><option value="2026" selected>2026</option><option value="2027">2027</option></select>'
  +'<select class="form-select" id="stuGrade" style="max-width:220px"><option value="">— كل الصفوف —</option>'+GRADES.map(function(g){return '<option value="'+esc(g)+'">'+g+'</option>';}).join('')+'</select>'
  +'<select class="form-select" id="stuCenter" style="max-width:160px"><option value="">— المدرس / السنتر —</option>'+CENTERS.map(function(c){return '<option value="'+esc(c)+'">'+c+'</option>';}).join('')+'</select>'
  +'<select class="form-select" id="stuStatus" style="max-width:160px"><option value="">— الحالة —</option><option>منتظم</option><option>يحتاج متابعة</option></select>'
  +'</div><div style="overflow-x:auto"><table class="data-table"><thead><tr><th>اسم الطالب</th><th>الصف</th><th>السنتر</th><th>الشهر الحالي</th><th>الحضور</th><th>الامتحانات</th><th>المصروفات</th><th>الحالة</th><th>الإجراءات</th></tr></thead><tbody id="stuTbody"></tbody></table></div></div>'
  +'<div class="table-card" style="margin-top:1rem"><div class="activity-card-title" style="padding:.9rem 1.2rem;border-bottom:1px solid var(--clr-border)">السجل الشهري الكامل - جميع الأشهر لكل طالب</div><div style="overflow-x:auto"><table class="data-table"><thead><tr><th>الطالب</th><th>الشهر</th><th>السنة</th><th>الحضور</th><th>الواجبات</th><th>الامتحانات</th><th>المصروفات</th><th>الحالة</th><th>الإجراءات</th></tr></thead><tbody id="stuAllMonthlyTable"></tbody></table></div></div>';
  document.getElementById('addStuBtn').onclick=function(){openAddStudentModal();};
  document.getElementById('deleteAllBtn').onclick=function(){showClearDataConfirmation();};
  document.getElementById('stuSearch').oninput=renderStudentRows;
  document.getElementById('stuGrade').onchange=renderStudentRows;
  document.getElementById('stuCenter').onchange=renderStudentRows;
  document.getElementById('stuStatus').onchange=renderStudentRows;
  ['stuMonth','stuYear'].forEach(function(id){var el=document.getElementById(id);if(el){el.onchange=function(){renderStudentRows();};}});
  renderStudentRows();
  renderAllMonthlyData();
}
function renderStudentRows(){
  var tbody=document.getElementById('stuTbody');if(!tbody)return;
  var q=(document.getElementById('stuSearch')?document.getElementById('stuSearch').value:'').trim().toLowerCase();
  var g=document.getElementById('stuGrade')?document.getElementById('stuGrade').value:'';
  var c=document.getElementById('stuCenter')?document.getElementById('stuCenter').value:'';
  var st=document.getElementById('stuStatus')?document.getElementById('stuStatus').value:'';
  var monthIndex=document.getElementById('stuMonth')?document.getElementById('stuMonth').value:'';
  var year=document.getElementById('stuYear')?document.getElementById('stuYear').value:'2026';
  var all=load('students').filter(function(s){return(!q||s.name.toLowerCase().includes(q))&&(!g||s.grade===g)&&(!c||s.center===c)&&(!st||s.status===st);});
  var monthlyData=load('studentMonthlyData');
  
  if(!all.length){tbody.innerHTML='<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--clr-muted)">لا توجد بيانات طلاب.</td></tr>';return;}
  tbody.innerHTML=all.map(function(s){
    // Get monthly data for selected month
    var selectedMonthData=monthlyData.find(function(m){return m.studentId===s.id&&m.monthIndex===parseInt(monthIndex)&&m.year===parseInt(year)});
    
    // Use monthly data if available, otherwise fall back to student data
    var att=selectedMonthData?selectedMonthData.attendanceRate:(s.attRate||calcAttendanceRate(s.id));
    var exam=selectedMonthData?selectedMonthData.examAvg:(s.examAvg||calcExamAvg(s.id));
    var hw=selectedMonthData?selectedMonthData.homeworkCompleted:(s.hwCompleted||s.homeworkCompleted||'—');
    var status=selectedMonthData?selectedMonthData.status:(s.status||'منتظم');
    var payStatus=selectedMonthData?selectedMonthData.paymentStatus:(s.payStatus||'—');
    
    var cls=status==='منتظم'?'badge-green':'badge-yellow';
    var payCls=payStatus==='خالص'?'badge-green':payStatus==='متبقي'?'badge-yellow':'badge-red';
    var currentMonth=monthIndex!==''?MONTHS[parseInt(monthIndex)]:(s.currentMonth!==undefined?MONTHS[s.currentMonth]:'—');
    var currentYear=year!==''?year:(s.currentYear||'—');
    var monthDisplay=currentMonth!=='—'?currentMonth+' '+currentYear:'—';
    
    return '<tr><td style="font-weight:600">'+esc(s.name)+'</td><td>'+esc(s.grade)+'</td><td><span class="badge badge-blue">'+esc(s.center||'—')+'</span></td><td>'+monthDisplay+'</td><td>'+att+'%</td><td>'+(exam==='—'?'—':exam+'%')+'</td><td><span class="badge '+payCls+'">'+esc(payStatus)+'</span></td><td><span class="badge '+cls+'">'+esc(status)+'</span></td>'
    +'<td><div class="actions-cell"><button class="act-btn act-btn-view" data-id="'+s.id+'">عرض</button><button class="act-btn act-btn-edit" data-id="'+s.id+'">تعديل</button><button class="act-btn act-btn-delete" data-id="'+s.id+'">حذف</button></div></td></tr>';
  }).join('');
  tbody.querySelectorAll('.act-btn-view').forEach(function(b){b.onclick=function(){openStudentProfile(b.dataset.id);};});
  tbody.querySelectorAll('.act-btn-edit').forEach(function(b){b.onclick=function(){openEditStudentModal(b.dataset.id);};});
  tbody.querySelectorAll('.act-btn-delete').forEach(function(b){b.onclick=function(){confirmDel('هل أنتِ متأكدة من حذف هذا الطالب؟',function(){deleteStudent(b.dataset.id);});};});
}
function renderAllMonthlyData(){
  var tbody=document.getElementById('stuAllMonthlyTable');if(!tbody)return;
  var q=(document.getElementById('stuSearch')?document.getElementById('stuSearch').value:'').trim().toLowerCase();
  var g=document.getElementById('stuGrade')?document.getElementById('stuGrade').value:'';
  var c=document.getElementById('stuCenter')?document.getElementById('stuCenter').value:'';
  var st=document.getElementById('stuStatus')?document.getElementById('stuStatus').value:'';
  var monthFilter=document.getElementById('stuMonth')?document.getElementById('stuMonth').value:'';
  var yearFilter=document.getElementById('stuYear')?document.getElementById('stuYear').value:'2026';
  
  var students=load('students').filter(function(s){return(!q||s.name.toLowerCase().includes(q))&&(!g||s.grade===g)&&(!c||s.center===c)&&(!st||s.status===st);});
  var monthlyData=load('studentMonthlyData');
  
  // Filter monthly data based on student filters only (show all months)
  var filteredMonthlyData=monthlyData.filter(function(m){
    var student=students.find(function(s){return s.id===m.studentId;});
    return student; // Only filter by student, show all months for each student
  });
  
  // Sort by student name, then year and month (newest first)
  filteredMonthlyData.sort(function(a,b){
    var studentA=students.find(function(s){return s.id===a.studentId;});
    var studentB=students.find(function(s){return s.id===b.studentId;});
    var nameA=studentA?studentA.name:'';
    var nameB=studentB?studentB.name:'';
    
    if(nameA!==nameB)return nameA.localeCompare(nameB);
    if(b.year!==a.year)return b.year-a.year;
    return b.monthIndex-a.monthIndex;
  });
  
  if(!filteredMonthlyData.length){
    tbody.innerHTML='<tr><td colspan="9" style="text-align:center;padding:2rem;color:var(--clr-muted)">لا توجد بيانات شهرية.</td></tr>';
    return;
  }
  
  tbody.innerHTML=filteredMonthlyData.map(function(m){
    var student=students.find(function(s){return s.id===m.studentId;});
    if(!student)return '';
    
    var cls=m.status==='منتظم'?'badge-green':'badge-yellow';
    var payCls=m.paymentStatus==='خالص'?'badge-green':m.paymentStatus==='متبقي'?'badge-yellow':'badge-red';
    var monthName=MONTHS[m.monthIndex];
    
    return '<tr><td style="font-weight:600">'+esc(student.name)+'</td><td>'+esc(monthName)+'</td><td>'+m.year+'</td><td>'+m.attendanceRate+'%</td><td>'+esc(m.homeworkCompleted)+'</td><td>'+(m.examAvg||'—')+'%</td><td><span class="badge '+payCls+'">'+esc(m.paymentStatus)+'</span></td><td><span class="badge '+cls+'">'+esc(m.status)+'</span></td>'
    +'<td><div class="actions-cell"><button class="act-btn act-btn-edit" data-student-id="'+m.studentId+'" data-month="'+m.monthIndex+'" data-year="'+m.year+'">تعديل</button></div></td></tr>';
  }).join('');
  
  tbody.querySelectorAll('.act-btn-edit').forEach(function(b){
    b.onclick=function(){
      openEditStudentModal(b.dataset.studentId);
      // Set the month and year in the modal after it opens
      setTimeout(function(){
        var monthSelect=document.getElementById('monthSelect');
        var yearSelect=document.getElementById('yearSelect');
        if(monthSelect)monthSelect.value=b.dataset.month;
        if(yearSelect)yearSelect.value=b.dataset.year;
        // Trigger change to load the data
        monthSelect.dispatchEvent(new Event('change'));
      },100);
    };
  });
}
function studentFormHtml(s, currentMonthData){
  var currentMonth=new Date().getMonth();
  var currentYear=new Date().getFullYear();
  var monthData=currentMonthData||{};
  
  return '<div class="form-group"><label class="form-label">اسم الطالب *</label><input class="form-input" name="name" value="'+esc(s.name||'')+'"/></div>'
  +'<div class="form-group"><label class="form-label">الصف الدراسي *</label><select class="form-select" name="grade"><option value="">اختر الصف</option>'+GRADES.map(function(g){return '<option value="'+esc(g)+'"'+(s.grade===g?' selected':'')+'>'+g+'</option>';}).join('')+'</select></div>'
  +'<div class="form-group"><label class="form-label">المدرس / السنتر *</label><select class="form-select" name="center"><option value="">اختر السنتر</option>'+CENTERS.map(function(c){return '<option value="'+esc(c)+'"'+(s.center===c?' selected':'')+'>'+c+'</option>';}).join('')+'</select></div>'
  +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">'
  +'<div class="form-group"><label class="form-label">الشهر الحالي</label><select class="form-select" name="currentMonth" id="monthSelect"><option value="">اختر الشهر</option>'+MONTHS.map(function(m,i){return '<option value="'+i+'"'+((s.currentMonth!==undefined&&s.currentMonth===i)?' selected':(i===currentMonth?' selected':''))+'>'+m+'</option>';}).join('')+'</select></div>'
  +'<div class="form-group"><label class="form-label">السنة</label><select class="form-select" name="currentYear" id="yearSelect"><option value="2025">2025</option><option value="2026"'+((s.currentYear!==undefined&&s.currentYear===2026)||currentYear===2026?' selected':'')+'>2026</option><option value="2027">2027</option></select></div>'
  +'<div class="form-group"><label class="form-label">نسبة الحضور (%)</label><input class="form-input" type="number" name="attendanceRate" value="'+esc(monthData.attendanceRate||s.attRate||'')+'" placeholder="مثال: 90"/></div>'
  +'<div class="form-group"><label class="form-label">متوسط الامتحانات (%)</label><input class="form-input" type="number" name="examAvg" value="'+esc(monthData.examAvg||s.examAvg||'')+'" placeholder="مثال: 85"/></div>'
  +'<div class="form-group"><label class="form-label">الواجبات المكتملة</label><input class="form-input" type="text" name="homeworkCompleted" value="'+esc(monthData.homeworkCompleted||s.hwCompleted||s.homeworkCompleted||'')+'" placeholder="مثال: 4/5 أو 80%"/></div>'
  +'<div class="form-group"><label class="form-label">حالة المصروفات</label><select class="form-select" name="paymentStatus"><option value="خالص"'+((monthData.paymentStatus||s.payStatus)==='خالص'?' selected':'')+'>خالص</option><option value="متبقي"'+((monthData.paymentStatus||s.payStatus)==='متبقي'?' selected':'')+'>متبقي</option><option value="لم يتم الدفع"'+((monthData.paymentStatus||s.payStatus)==='لم يتم الدفع'?' selected':'')+'>لم يتم الدفع</option></select></div>'
  +'</div>'
  +'<div class="form-group"><label class="form-label">الحالة</label><select class="form-select" name="status"><option value="منتظم"'+((monthData.status||s.status||'منتظم')==='منتظم'?' selected':'')+'>منتظم</option><option value="يحتاج متابعة"'+((monthData.status||s.status)==='يحتاج متابعة'?' selected':'')+'>يحتاج متابعة</option></select></div>'
  +'<div class="form-group"><label class="form-label">ملاحظات عامة</label><textarea class="form-textarea" name="generalNotes">'+esc(monthData.generalNotes||s.generalNotes||'')+'</textarea></div>'
  +'<div class="form-group" style="margin-top:1rem;padding:1rem;background:var(--clr-bg-light);border-radius:8px;border:1px solid var(--clr-border);">'
  +'<label class="form-label" style="font-weight:600;color:var(--clr-text);">إدارة البيانات الشهرية</label>'
  +'<p style="font-size:0.85rem;color:var(--clr-muted);margin-bottom:0.5rem;">يمكنك التنقل بين الأشهر وتعديل البيانات الحالية</p>'
  +'<div style="display:flex;gap:0.5rem;align-items:center;">'
  +'<button type="button" class="btn btn-ghost" id="prevMonthBtn" style="font-size:0.9rem;padding:0.5rem 1rem;">◀ الشهر السابق</button>'
  +'<button type="button" class="btn btn-accent" id="nextMonthBtn" style="font-size:0.9rem;padding:0.5rem 1rem;">الشهر التالي ▶</button>'
  +'</div>'
  +'<p style="font-size:0.75rem;color:var(--clr-muted);margin-top:0.5rem;">البيانات تحفظ تلقائياً في قاعدة البيانات عند الحفظ</p>'
  +'</div>';
}
function openAddStudentModal(){
  openModal('<div class="modal-header"><h3>إضافة طالب جديد</h3><button class="modal-close">✕</button></div><div class="modal-body"><form id="stuForm">'+studentFormHtml({})+'</form></div><div class="modal-footer"><button class="btn btn-accent" id="stuSaveBtn">حفظ الطالب</button><button class="btn btn-ghost" onclick="closeModal()">إلغاء</button></div>');
  document.getElementById('stuSaveBtn').onclick=async function(){
    var f=document.getElementById('stuForm');var data=Object.fromEntries(new FormData(f));
    if(!data.name.trim()){showToast('من فضلك أدخل اسم الطالب.','error');return;}
    if(!data.grade){showToast('من فضلك اختر الصف الدراسي.','error');return;}
    if(!data.center){showToast('من فضلك اختر السنتر (الكاشف / سيف الدين).','error');return;}
    data.currentMonth=parseInt(data.currentMonth)||new Date().getMonth();
    data.currentYear=parseInt(data.currentYear)||new Date().getFullYear();
    
    try {
      // Save to backend
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (res.ok) {
        const newStudent = await res.json();
        // Update local data
        var students=load('students');students.push(newStudent);window.APP_DATA.students = students;
        
        // Create initial monthly data for the new student
        var allMonthlyData=load('studentMonthlyData');
        var initialMonthData={
          id:genId(), // Now generates proper UUID using crypto.randomUUID()
          studentId:newStudent.id,
          monthIndex:parseInt(data.currentMonth)||new Date().getMonth(),
          year:parseInt(data.currentYear)||new Date().getFullYear(),
          attendanceRate:parseInt(data.attRate)||100,
          homeworkCompleted:data.homeworkCompleted||'0/0',
          examAvg:parseInt(data.examAvg)||0,
          paymentStatus:data.payStatus||'لم يتم الدفع',
          status:data.status||'منتظم',
          generalNotes:data.generalNotes||''
        };
        allMonthlyData.push(initialMonthData);
        save('studentMonthlyData',allMonthlyData);
        
        // Also save to Supabase
        try {
          const supabaseRes = await fetch('/api/student-monthly-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentMonthlyData: allMonthlyData })
          });
          if (supabaseRes.ok) {
            console.log('Monthly data saved to Supabase successfully');
          } else {
            const errorText = await supabaseRes.text();
            console.error('Supabase save failed:', supabaseRes.status, errorText);
          }
        } catch(e) {
          console.error('Could not save monthly data to Supabase:', e);
        }
        
        logActivity(data.name,'تمت إضافة طالب');showToast('تمت إضافة الطالب بنجاح - البيانات محفوظة في قاعدة البيانات');closeModal();renderStudents();renderAllMonthlyData();updateNotifications();
      } else {
        showToast('حدث خطأ أثناء حفظ الطالب','error');
      }
    } catch(e) {
      console.error('Error saving student:', e);
      showToast('حدث خطأ أثناء الاتصال بالسيرفر','error');
    }
  };
}
function openEditStudentModal(id){
  var students=load('students');var s=students.find(function(x){return x.id===id;});if(!s)return;
  
  // Get monthly data for this student
  var monthlyData=load('studentMonthlyData').filter(function(m){return m.studentId===id;});
  var currentMonthData=monthlyData.find(function(m){return m.monthIndex===s.currentMonth&&m.year===s.currentYear});
  
  openModal('<div class="modal-header"><h3>تعديل بيانات الطالب</h3><button class="modal-close">✕</button></div><div class="modal-body"><form id="stuForm">'+studentFormHtml(s, currentMonthData)+'</form></div><div class="modal-footer"><button class="btn btn-accent" id="stuSaveBtn">حفظ التغييرات</button><button class="btn btn-ghost" onclick="closeModal()">إلغاء</button></div>');
  
  // Add new month button functionality
  var prevMonthBtn=document.getElementById('prevMonthBtn');
  var nextMonthBtn=document.getElementById('nextMonthBtn');
  
  if(prevMonthBtn){
    prevMonthBtn.onclick=function(){
      var monthSelect=document.getElementById('monthSelect');
      var yearSelect=document.getElementById('yearSelect');
      var currentMonth=parseInt(monthSelect.value);
      var currentYear=parseInt(yearSelect.value);
      
      // Calculate previous month
      var prevMonth=currentMonth-1;
      var prevYear=currentYear;
      if(prevMonth<0){
        prevMonth=11;
        prevYear--;
      }
      
      // Load data for previous month
      monthSelect.value=prevMonth;
      yearSelect.value=prevYear;
      monthSelect.dispatchEvent(new Event('change'));
      showToast('تم الانتقال إلى شهر '+MONTHS[prevMonth]+' '+prevYear);
    };
  }
  
  if(nextMonthBtn){
    nextMonthBtn.onclick=function(){
      var monthSelect=document.getElementById('monthSelect');
      var yearSelect=document.getElementById('yearSelect');
      var currentMonth=parseInt(monthSelect.value);
      var currentYear=parseInt(yearSelect.value);
      
      // Calculate next month
      var nextMonth=currentMonth+1;
      var nextYear=currentYear;
      if(nextMonth>11){
        nextMonth=0;
        nextYear++;
      }
      
      // Load data for next month
      monthSelect.value=nextMonth;
      yearSelect.value=nextYear;
      monthSelect.dispatchEvent(new Event('change'));
      showToast('تم الانتقال إلى شهر '+MONTHS[nextMonth]+' '+nextYear);
    };
  }
  
  // Handle month/year change to load existing data
  var monthSelect=document.getElementById('monthSelect');
  var yearSelect=document.getElementById('yearSelect');
  
  function loadMonthData(){
    var selectedMonth=parseInt(monthSelect.value);
    var selectedYear=parseInt(yearSelect.value);
    var selectedMonthData=monthlyData.find(function(m){return m.monthIndex===selectedMonth&&m.year===selectedYear});
    
    if(selectedMonthData){
      document.querySelector('[name="attendanceRate"]').value=selectedMonthData.attendanceRate||'';
      document.querySelector('[name="homeworkCompleted"]').value=selectedMonthData.homeworkCompleted||'';
      document.querySelector('[name="examAvg"]').value=selectedMonthData.examAvg||'';
      document.querySelector('[name="paymentStatus"]').value=selectedMonthData.paymentStatus||'غير مسجل';
      document.querySelector('[name="status"]').value=selectedMonthData.status||'منتظم';
      document.querySelector('[name="generalNotes"]').value=selectedMonthData.generalNotes||'';
    }else{
      document.querySelector('[name="attendanceRate"]').value='';
      document.querySelector('[name="homeworkCompleted"]').value='';
      document.querySelector('[name="examAvg"]').value='';
      document.querySelector('[name="paymentStatus"]').value='غير مسجل';
      document.querySelector('[name="status"]').value='منتظم';
      document.querySelector('[name="generalNotes"]').value='';
      console.log('No existing data for month, using empty values');
    }
  }
  
  monthSelect.addEventListener('change',loadMonthData);
  yearSelect.addEventListener('change',loadMonthData);
  
  document.getElementById('stuSaveBtn').onclick=async function(){
    var f=document.getElementById('stuForm');var data=Object.fromEntries(new FormData(f));
    if(!data.name.trim()){showToast('من فضلك أدخل اسم الطالب.','error');return;}
    if(!data.grade){showToast('من فضلك اختر الصف الدراسي.','error');return;}
    if(!data.center){showToast('من فضلك اختر السنتر.','error');return;}
    data.currentMonth=parseInt(data.currentMonth)||new Date().getMonth();
    data.currentYear=parseInt(data.currentYear)||new Date().getFullYear();
    
    console.log('Form data before save:', data);
    console.log('Homework completed from form:', data.homeworkCompleted);
    
    try {
      // Update student basic info
      const res = await fetch(`/api/students?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (res.ok) {
        const updatedStudent = await res.json();
        // Update local data
        var idx=students.findIndex(function(x){return x.id===id;});
        students[idx]=updatedStudent;window.APP_DATA.students = students;
        
        // Update or create monthly data
        var allMonthlyData=load('studentMonthlyData');
        var existingMonthIndex=allMonthlyData.findIndex(function(m){return m.studentId===id&&m.monthIndex===data.currentMonth&&m.year===data.currentYear});
        
        var monthData={
          id:existingMonthIndex>=0?allMonthlyData[existingMonthIndex].id:genId(), // Always generate proper UUID
          studentId:id,
          monthIndex:parseInt(data.currentMonth),
          year:parseInt(data.currentYear),
          attendanceRate:parseInt(data.attendanceRate)||0,
          homeworkCompleted:(data.homeworkCompleted&&data.homeworkCompleted.trim())?data.homeworkCompleted.trim():'0/0',
          examAvg:parseInt(data.examAvg)||0,
          paymentStatus:data.paymentStatus||'غير مسجل',
          status:data.status||'منتظم',
          generalNotes:data.generalNotes||''
        };
        
        console.log('Saving monthly data:', monthData);
        console.log('Homework completed value:', data.homeworkCompleted);
        
        if(existingMonthIndex>=0){
          allMonthlyData[existingMonthIndex]=monthData;
        }else{
          allMonthlyData.push(monthData);
        }
        
        save('studentMonthlyData',allMonthlyData);
        
        // Also save to Supabase
        try {
          const supabaseRes = await fetch('/api/student-monthly-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentMonthlyData: allMonthlyData })
          });
          if (supabaseRes.ok) {
            console.log('Monthly data saved to Supabase successfully');
          } else {
            const errorText = await supabaseRes.text();
            console.error('Supabase save failed:', supabaseRes.status, errorText);
          }
        } catch(e) {
          console.error('Could not save monthly data to Supabase:', e);
        }
        
        logActivity(data.name,'تم تعديل بيانات الطالب');showToast('تم تحديث بيانات الطالب - البيانات محفوظة في قاعدة البيانات');closeModal();renderStudents();renderAllMonthlyData();
      } else {
        showToast('حدث خطأ أثناء تحديث الطالب','error');
      }
    } catch(e) {
      console.error('Error updating student:', e);
      showToast('حدث خطأ أثناء الاتصال بالسيرفر','error');
    }
  };
}
function deleteStudent(id){
  var students=load('students');var s=students.find(function(x){return x.id===id;});
  
  fetch(`/api/students?id=${id}`, {
    method: 'DELETE'
  }).then(res => {
    if (res.ok) {
      // Update local data
      window.APP_DATA.students = students.filter(function(x){return x.id!==id;});
      logActivity(s.name,'تم حذف الطالب');showToast('تم حذف الطالب','error');renderStudents();updateNotifications();
    } else {
      showToast('حدث خطأ أثناء حذف الطالب','error');
    }
  }).catch(e => {
    console.error('Error deleting student:', e);
    showToast('حدث خطأ أثناء الاتصال بالسيرفر','error');
  });
}
function openStudentProfile(id){
  var s=getStudent(id);var att=s.attRate||calcAttendanceRate(id);var exam=s.examAvg||calcExamAvg(id);var hw=s.hwCompleted||s.homeworkCompleted||(calcHomeworkRate(id)+'%');
  var payText = s.payStatus||'—';
  var lastNote=load('notes').filter(function(n){return n.studentId===id;}).slice(-1)[0];
  var ovHtml='<div class="overview-grid"><div class="ov-card"><div class="ov-num">'+att+'%</div><div class="ov-lbl">نسبة الحضور</div></div><div class="ov-card"><div class="ov-num">'+(exam==='—'?'—':exam+'%')+'</div><div class="ov-lbl">متوسط الامتحانات</div></div><div class="ov-card"><div class="ov-num">'+hw+'</div><div class="ov-lbl">إنجاز الواجبات</div></div><div class="ov-card"><div class="ov-num">'+payText+'</div><div class="ov-lbl">حالة المصروفات</div></div></div>'+(lastNote?'<div style="margin-top:1rem;padding:.8rem;background:#fffbf0;border-radius:8px;border:1px solid #f0d9a0"><strong>آخر ملاحظة:</strong> '+esc(lastNote.content)+'</div>':'');
  openModal('<div class="modal-header"><div><h3 style="font-size:1.1rem">'+esc(s.name)+'</h3><span style="font-size:.8rem;color:var(--clr-muted)">'+esc(s.grade)+' — '+esc(s.center||'غير محدد')+'</span></div><button class="modal-close">✕</button></div><div class="modal-body">'+ovHtml+'</div>');
}
function renderMonthlyStudentEvaluation(){
  var tbody=document.getElementById('stuMonthlyTable');if(!tbody)return;
  var monthIndex=document.getElementById('stuMonth')?document.getElementById('stuMonth').value:'';
  var year=document.getElementById('stuYear')?document.getElementById('stuYear').value:'2026';
  var g=document.getElementById('stuGrade')?document.getElementById('stuGrade').value:'';
  var c=document.getElementById('stuCenter')?document.getElementById('stuCenter').value:'';
  var st=document.getElementById('stuStatus')?document.getElementById('stuStatus').value:'';
  var q=(document.getElementById('stuSearch')?document.getElementById('stuSearch').value:'').trim().toLowerCase();
  var students=load('students').filter(function(s){return(!q||s.name.toLowerCase().includes(q))&&(!g||s.grade===g)&&(!c||s.center===c)&&(!st||s.status===st);});
  if(!students.length){tbody.innerHTML='<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--clr-muted)">لا توجد بيانات.</td></tr>';return;}
  if(monthIndex===''){
    tbody.innerHTML='<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--clr-muted)">اختر شهر لعرض التقييم الشهري.</td></tr>';return;
  }
  tbody.innerHTML=students.map(function(s){
    var att=calcMonthlyAttendanceRate(s.id, monthIndex, year);
    var hw=calcMonthlyHomeworkRate(s.id, monthIndex, year);
    var exam=calcMonthlyExamAvg(s.id, monthIndex, year);
    var pay=calcMonthlyPaymentStatus(s.id, monthIndex, year);
    var overallScore=0;
    var count=0;
    if(att!==100){overallScore+=att;count++;}
    if(hw!==100){overallScore+=hw;count++;}
    if(exam!=='—'){overallScore+=Number(exam);count++;}
    var avgRate=count?Math.round(overallScore/count):0;
    var payColor=pay==='مدفوع بالكامل'?'badge-green':pay==='لم يتم الدفع'?'badge-red':'badge-yellow';
    var overallColor=avgRate>=75?'badge-green':avgRate>=50?'badge-yellow':'badge-red';
    var overallLabel=avgRate>=75?'ممتاز':avgRate>=50?'جيد':'يحتاج تحسين';
    return '<tr><td style="font-weight:600">'+esc(s.name)+'</td><td>'+esc(s.grade)+'</td><td><span class="badge '+(att>=75?'badge-green':att>=50?'badge-yellow':'badge-red')+'">'+att+'%</span></td><td><span class="badge '+(hw>=75?'badge-green':hw>=50?'badge-yellow':'badge-red')+'">'+hw+'%</span></td><td><span class="badge '+(exam==='—'?'badge-gray':Number(exam)>=75?'badge-green':Number(exam)>=50?'badge-yellow':'badge-red')+'">'+(exam==='—'?'—':exam+'%')+'</span></td><td><span class="badge '+payColor+'">'+pay+'</span></td><td><span class="badge '+overallColor+'">'+overallLabel+'</span></td><td><div class="actions-cell"><button class="act-btn act-btn-edit" data-id="'+s.id+'">تعديل</button></div></td></tr>';
  }).join('');
  tbody.querySelectorAll('.act-btn-edit').forEach(function(b){b.onclick=function(){openEditStudentModal(b.dataset.id);};});
}
function openEditMonthlyEvaluationModal(studentId, monthIndex, year){
  var s=getStudent(studentId);
  var monthName=MONTHS[parseInt(monthIndex)];
  var att=calcMonthlyAttendanceRate(studentId, monthIndex, year);
  var hw=calcMonthlyHomeworkRate(studentId, monthIndex, year);
  var exam=calcMonthlyExamAvg(studentId, monthIndex, year);
  var pay=calcMonthlyPaymentStatus(studentId, monthIndex, year);
  openModal('<div class="modal-header"><h3>تعديل التقييم الشهري</h3><button class="modal-close">✕</button></div><div class="modal-body"><p style="margin-bottom:1rem;color:var(--clr-muted)"><strong>الطالب:</strong> '+esc(s.name)+' | <strong>الشهر:</strong> '+monthName+' '+year+'</p><form id="monthlyEvalForm"><div class="form-group"><label class="form-label">نسبة الحضور الشهري (%)</label><input class="form-input" type="number" name="manualAtt" value="'+att+'" min="0" max="100"/></div><div class="form-group"><label class="form-label">نسبة الواجبات الشهرية (%)</label><input class="form-input" type="number" name="manualHw" value="'+hw+'" min="0" max="100"/></div><div class="form-group"><label class="form-label">متوسط الامتحانات الشهرية (%)</label><input class="form-input" type="number" name="manualExam" value="'+(exam==='—'?'':exam)+'" min="0" max="100" placeholder="اتركه فارغاً إذا لا توجد امتحانات"/></div><div class="form-group"><label class="form-label">حالة المدفوعات الشهرية</label><select class="form-select" name="manualPay"><option value="مدفوع بالكامل"'+(pay==='مدفوع بالكامل'?' selected':'')+'>مدفوع بالكامل</option><option value="جزئي"'+(pay==='جزئي'?' selected':'')+'>جزئي</option><option value="لم يتم الدفع"'+(pay==='لم يتم الدفع'?' selected':'')+'>لم يتم الدفع</option><option value="غير مسجل"'+(pay==='غير مسجل'?' selected':'')+'>غير مسجل</option></select></div><div class="form-group"><label class="form-label">ملاحظات التقييم الشهري</label><textarea class="form-textarea" name="monthlyNotes" placeholder="أضف ملاحظات إضافية عن التقييم الشهري..."></textarea></div></form></div><div class="modal-footer"><button class="btn btn-accent" id="saveMonthlyEvalBtn">حفظ التقييم</button><button class="btn btn-ghost" onclick="closeModal()">إلغاء</button></div>');
  document.getElementById('saveMonthlyEvalBtn').onclick=function(){
    var f=document.getElementById('monthlyEvalForm');
    var d=Object.fromEntries(new FormData(f));
    d.manualAtt=Number(d.manualAtt);
    d.manualHw=Number(d.manualHw);
    d.manualExam=d.manualExam?Number(d.manualExam):null;
    var monthlyEvaluations=load('monthlyEvaluations')||[];
    var existingIndex=monthlyEvaluations.findIndex(function(e){return e.studentId===studentId&&e.monthIndex===monthIndex&&e.year===year;});
    var evaluationData={
      id:existingIndex>=0?monthlyEvaluations[existingIndex].id:genId(),
      studentId:studentId,
      monthIndex:monthIndex,
      year:year,
      attendanceRate:d.manualAtt,
      homeworkRate:d.manualHw,
      examAvg:d.manualExam,
      paymentStatus:d.manualPay,
      notes:d.monthlyNotes,
      isManual:true,
      timestamp:now()
    };
    if(existingIndex>=0){
      monthlyEvaluations[existingIndex]=evaluationData;
    }else{
      monthlyEvaluations.push(evaluationData);
    }
    if(!window.APP_DATA.monthlyEvaluations){
      window.APP_DATA.monthlyEvaluations=[];
    }
    window.APP_DATA.monthlyEvaluations=monthlyEvaluations;
    save('monthlyEvaluations',monthlyEvaluations);
    logActivity(s.name,'تم تعديل التقييم الشهري لشهر '+monthName);
    showToast('تم حفظ التقييم الشهري بنجاح');
    closeModal();
    renderAllMonthlyData();
  };
}


// HOMEWORK
function renderHomework(){
  var sec=document.getElementById('homeworkSection');
  var currentYear=new Date().getFullYear();
  var currentMonth=new Date().getMonth();
  sec.innerHTML='<div class="section-header"><h2>إدارة الواجبات</h2><button class="btn btn-accent" id="addHwBtn">+ إضافة واجب</button></div>'
  +'<div class="table-card"><div class="table-toolbar"><input type="text" class="form-input" id="hwSearch" placeholder="بحث..." style="max-width:200px"/><select class="form-select" id="hwMonth" style="max-width:160px"><option value="">— الكل —</option>'+MONTHS.map(function(m,i){return '<option value="'+i+'"'+(i===currentMonth?' selected':'')+'>'+m+'</option>';}).join('')+'</select><select class="form-select" id="hwYear" style="max-width:120px"><option value="2025">2025</option><option value="2026" selected>2026</option><option value="2027">2027</option></select><select class="form-select" id="hwGrade" style="max-width:200px"><option value="">— كل الصفوف —</option>'+GRADES.map(function(g){return '<option value="'+esc(g)+'">'+g+'</option>';}).join('')+'</select><select class="form-select" id="hwStatus" style="max-width:160px"><option value="">— الحالة —</option><option>مكتمل</option><option>متأخر</option><option>لم يتم التسليم</option></select></div>'
  +'<div style="overflow-x:auto"><table class="data-table"><thead><tr><th>الطالب</th><th>الواجب</th><th>التاريخ</th><th>الدرجة</th><th>الحالة</th><th>الملاحظة</th><th>الإجراءات</th></tr></thead><tbody id="hwTbody"></tbody></table></div></div>'
  +'<div class="table-card" style="margin-top:1rem"><div class="activity-card-title" style="padding:.9rem 1.2rem;border-bottom:1px solid var(--clr-border)">التقييم الشهري للواجبات</div><div style="overflow-x:auto"><table class="data-table"><thead><tr><th>الطالب</th><th>الصف</th><th>الواجبات المكتملة</th><th>الواجبات المتأخرة</th><th>لم يتم التسليم</th><th>نسبة الإنجاز</th></tr></thead><tbody id="hwMonthlyTable"></tbody></table></div></div>';
  document.getElementById('addHwBtn').onclick=function(){openAddHwModal();};
  ['hwSearch','hwGrade','hwStatus'].forEach(function(id){var el=document.getElementById(id);if(el){el.oninput=renderHwRows;el.onchange=renderHwRows;}});
  ['hwMonth','hwYear'].forEach(function(id){var el=document.getElementById(id);if(el){el.onchange=function(){renderHwRows();renderMonthlyHomework();};}});
  renderHwRows();
  renderMonthlyHomework();
}
function renderHwRows(){
  var tbody=document.getElementById('hwTbody');if(!tbody)return;
  var q=(document.getElementById('hwSearch')?document.getElementById('hwSearch').value:'').toLowerCase();
  var g=document.getElementById('hwGrade')?document.getElementById('hwGrade').value:'';
  var st=document.getElementById('hwStatus')?document.getElementById('hwStatus').value:'';
  var monthIndex=document.getElementById('hwMonth')?document.getElementById('hwMonth').value:'';
  var year=document.getElementById('hwYear')?document.getElementById('hwYear').value:'2026';
  var students=load('students');
  var all=load('homework');
  if(monthIndex!==''){
    var monthStart=getMonthStart(year, parseInt(monthIndex));
    var monthEnd=getMonthEnd(year, parseInt(monthIndex));
    all=all.filter(function(h){return h.date>=monthStart&&h.date<=monthEnd;});
  }
  all=all.filter(function(h){var stu=students.find(function(s){return s.id===h.studentId;});var nm=stu?stu.name.toLowerCase():'';return(!q||nm.includes(q)||h.title.toLowerCase().includes(q))&&(!g||stu&&stu.grade===g)&&(!st||h.status===st);});
  if(!all.length){tbody.innerHTML='<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--clr-muted)">لا توجد واجبات.</td></tr>';return;}
  tbody.innerHTML=all.map(function(h){var cls=h.status==='مكتمل'?'badge-green':h.status==='متأخر'?'badge-yellow':'badge-red';return '<tr><td>'+esc(getStudentName(h.studentId))+'</td><td>'+esc(h.title)+'</td><td>'+fmtDate(h.date)+'</td><td>'+h.score+'/'+h.maxScore+'</td><td><span class="badge '+cls+'">'+esc(h.status)+'</span></td><td>'+esc(h.note||'—')+'</td><td><div class="actions-cell"><button class="act-btn act-btn-edit" data-id="'+h.id+'">تعديل</button><button class="act-btn act-btn-delete" data-id="'+h.id+'">حذف</button></div></td></tr>';}).join('');
  tbody.querySelectorAll('.act-btn-edit').forEach(function(b){b.onclick=function(){openEditHwModal(b.dataset.id);};});
  tbody.querySelectorAll('.act-btn-delete').forEach(function(b){b.onclick=function(){confirmDel('هل أنتِ متأكدة من حذف هذا الواجب؟',function(){save('homework',load('homework').filter(function(h){return h.id!==b.dataset.id;}));showToast('تم حذف الواجب','error');renderHwRows();renderMonthlyHomework();});};});
}
function hwFormHtml(h){var students=load('students');return '<div class="form-group"><label class="form-label">الطالب *</label><select class="form-select" name="studentId"><option value="">اختر الطالب</option>'+students.map(function(s){return '<option value="'+s.id+'"'+(h.studentId===s.id?' selected':'')+'>'+esc(s.name)+' — '+esc(s.grade)+'</option>';}).join('')+'</select></div><div class="form-group"><label class="form-label">اسم الواجب *</label><input class="form-input" name="title" value="'+esc(h.title||'')+'"/></div><div class="form-group"><label class="form-label">التاريخ</label><input class="form-input" type="date" name="date" value="'+(h.date||today())+'"/></div><div class="form-group"><label class="form-label">الدرجة النهائية</label><input class="form-input" type="number" name="maxScore" min="0" value="'+(h.maxScore||10)+'"/></div><div class="form-group"><label class="form-label">درجة الطالب</label><input class="form-input" type="number" name="score" min="0" value="'+(h.score||0)+'"/></div><div class="form-group"><label class="form-label">الحالة</label><select class="form-select" name="status"><option value="مكتمل"'+(h.status==='مكتمل'?' selected':'')+'>مكتمل</option><option value="متأخر"'+(h.status==='متأخر'?' selected':'')+'>متأخر</option><option value="لم يتم التسليم"'+(h.status==='لم يتم التسليم'?' selected':'')+'>لم يتم التسليم</option></select></div><div class="form-group"><label class="form-label">ملاحظة</label><input class="form-input" name="note" value="'+esc(h.note||'')+'"/></div>';}
function openAddHwModal(){openModal('<div class="modal-header"><h3>إضافة واجب</h3><button class="modal-close">✕</button></div><div class="modal-body"><form id="hwForm">'+hwFormHtml({})+'</form></div><div class="modal-footer"><button class="btn btn-accent" id="hwSaveBtn">حفظ الواجب</button><button class="btn btn-ghost" onclick="closeModal()">إلغاء</button></div>');document.getElementById('hwSaveBtn').onclick=function(){saveHw(null);};}
function openEditHwModal(id){var h=load('homework').find(function(x){return x.id===id;});if(!h)return;openModal('<div class="modal-header"><h3>تعديل الواجب</h3><button class="modal-close">✕</button></div><div class="modal-body"><form id="hwForm">'+hwFormHtml(h)+'</form></div><div class="modal-footer"><button class="btn btn-accent" id="hwSaveBtn">حفظ التغييرات</button><button class="btn btn-ghost" onclick="closeModal()">إلغاء</button></div>');document.getElementById('hwSaveBtn').onclick=function(){saveHw(id);};}
function saveHw(id){var f=document.getElementById('hwForm');var d=Object.fromEntries(new FormData(f));if(!d.studentId){showToast('من فضلك اختر الطالب.','error');return;}if(!d.title.trim()){showToast('من فضلك أدخل اسم الواجب.','error');return;}d.maxScore=Number(d.maxScore);d.score=Number(d.score);if(d.score<0){showToast('الدرجة لا يمكن أن تكون سالبة.','error');return;}if(d.score>d.maxScore){showToast('درجة الطالب لا يمكن أن تكون أكبر من الدرجة النهائية.','error');return;}var hws=load('homework');if(id){var i=hws.findIndex(function(x){return x.id===id;});hws[i]=Object.assign({},hws[i],d);}else hws.push(Object.assign({id:genId()},d));save('homework',hws);logActivity(getStudentName(d.studentId),id?'تم تعديل واجب':'تمت إضافة واجب');showToast(id?'تم تحديث الواجب':'تمت إضافة الواجب بنجاح');closeModal();renderHwRows();renderMonthlyHomework();}
function renderMonthlyHomework(){
  var tbody=document.getElementById('hwMonthlyTable');if(!tbody)return;
  var monthIndex=document.getElementById('hwMonth')?document.getElementById('hwMonth').value:'';
  var year=document.getElementById('hwYear')?document.getElementById('hwYear').value:'2026';
  var g=document.getElementById('hwGrade')?document.getElementById('hwGrade').value:'';
  var q=(document.getElementById('hwSearch')?document.getElementById('hwSearch').value:'').toLowerCase();
  var students=load('students').filter(function(s){return(!g||s.grade===g)&&(!q||s.name.toLowerCase().includes(q));});
  var allHomework=load('homework');
  if(monthIndex!==''){
    var monthStart=getMonthStart(year, parseInt(monthIndex));
    var monthEnd=getMonthEnd(year, parseInt(monthIndex));
    allHomework=allHomework.filter(function(h){return h.date>=monthStart&&h.date<=monthEnd;});
  }
  if(!students.length){tbody.innerHTML='<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--clr-muted)">لا توجد بيانات.</td></tr>';return;}
  tbody.innerHTML=students.map(function(s){
    var studentHw=allHomework.filter(function(h){return h.studentId===s.id;});
    var completed=studentHw.filter(function(h){return h.status==='مكتمل';}).length;
    var late=studentHw.filter(function(h){return h.status==='متأخر';}).length;
    var notSubmitted=studentHw.filter(function(h){return h.status==='لم يتم التسليم';}).length;
    var total=completed+late+notSubmitted;
    var rate=total?Math.round((completed/total)*100):0;
    var rateColor=rate>=75?'badge-green':rate>=50?'badge-yellow':'badge-red';
    return '<tr><td style="font-weight:600">'+esc(s.name)+'</td><td>'+esc(s.grade)+'</td><td>'+completed+'</td><td>'+late+'</td><td>'+notSubmitted+'</td><td><span class="badge '+rateColor+'">'+rate+'%</span></td></tr>';
  }).join('');
}

// EXAMS
function renderExams(){
  var sec=document.getElementById('examsSection');
  var currentYear=new Date().getFullYear();
  var currentMonth=new Date().getMonth();
  sec.innerHTML='<div class="section-header"><h2>إدارة الامتحانات</h2><button class="btn btn-accent" id="addExamBtn">+ إضافة نتيجة</button></div>'
  +'<div class="table-card"><div class="table-toolbar"><input type="text" class="form-input" id="exSearch" placeholder="بحث..." style="max-width:200px"/><select class="form-select" id="exMonth" style="max-width:160px"><option value="">— الكل —</option>'+MONTHS.map(function(m,i){return '<option value="'+i+'"'+(i===currentMonth?' selected':'')+'>'+m+'</option>';}).join('')+'</select><select class="form-select" id="exYear" style="max-width:120px"><option value="2025">2025</option><option value="2026" selected>2026</option><option value="2027">2027</option></select><select class="form-select" id="exGrade" style="max-width:200px"><option value="">— كل الصفوف —</option>'+GRADES.map(function(g){return '<option value="'+esc(g)+'">'+g+'</option>';}).join('')+'</select></div>'
  +'<div style="overflow-x:auto"><table class="data-table"><thead><tr><th>الطالب</th><th>الامتحان</th><th>التاريخ</th><th>الدرجة</th><th>النسبة</th><th>التقييم</th><th>الإجراءات</th></tr></thead><tbody id="exTbody"></tbody></table></div></div>'
  +'<div class="table-card" style="margin-top:1rem"><div class="activity-card-title" style="padding:.9rem 1.2rem;border-bottom:1px solid var(--clr-border)">التقييم الشهري للامتحانات</div><div style="overflow-x:auto"><table class="data-table"><thead><tr><th>الطالب</th><th>الصف</th><th>عدد الامتحانات</th><th>متوسط الدرجات</th><th>أعلى درجة</th><th>أدنى درجة</th></tr></thead><tbody id="exMonthlyTable"></tbody></table></div></div>';
  document.getElementById('addExamBtn').onclick=function(){openAddExamModal();};
  ['exSearch','exGrade'].forEach(function(id){var el=document.getElementById(id);if(el){el.oninput=renderExamRows;el.onchange=renderExamRows;}});
  ['exMonth','exYear'].forEach(function(id){var el=document.getElementById(id);if(el){el.onchange=function(){renderExamRows();renderMonthlyExams();};}});
  renderExamRows();
  renderMonthlyExams();
}
function evalGrade(pct){if(pct>=90)return{label:'ممتاز',cls:'badge-green'};if(pct>=75)return{label:'جيد جداً',cls:'badge-blue'};if(pct>=60)return{label:'جيد',cls:'badge-yellow'};return{label:'يحتاج تحسين',cls:'badge-red'};}
function renderExamRows(){
  var tbody=document.getElementById('exTbody');if(!tbody)return;
  var q=(document.getElementById('exSearch')?document.getElementById('exSearch').value:'').toLowerCase();
  var g=document.getElementById('exGrade')?document.getElementById('exGrade').value:'';
  var monthIndex=document.getElementById('exMonth')?document.getElementById('exMonth').value:'';
  var year=document.getElementById('exYear')?document.getElementById('exYear').value:'2026';
  var students=load('students');
  var all=load('exams');
  if(monthIndex!==''){
    var monthStart=getMonthStart(year, parseInt(monthIndex));
    var monthEnd=getMonthEnd(year, parseInt(monthIndex));
    all=all.filter(function(e){return e.date>=monthStart&&e.date<=monthEnd;});
  }
  all=all.filter(function(e){var stu=students.find(function(s){return s.id===e.studentId;});var nm=stu?stu.name.toLowerCase():'';return(!q||nm.includes(q)||e.title.toLowerCase().includes(q))&&(!g||stu&&stu.grade===g);});
  if(!all.length){tbody.innerHTML='<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--clr-muted)">لا توجد نتائج امتحانات.</td></tr>';return;}
  tbody.innerHTML=all.map(function(e){var pct=Math.round((e.score/e.maxScore)*100);var ev=evalGrade(pct);return '<tr><td>'+esc(getStudentName(e.studentId))+'</td><td>'+esc(e.title)+'</td><td>'+fmtDate(e.date)+'</td><td>'+e.score+'/'+e.maxScore+'</td><td>'+pct+'%</td><td><span class="badge '+ev.cls+'">'+ev.label+'</span></td><td><div class="actions-cell"><button class="act-btn act-btn-edit" data-id="'+e.id+'">تعديل</button><button class="act-btn act-btn-delete" data-id="'+e.id+'">حذف</button></div></td></tr>';}).join('');
  tbody.querySelectorAll('.act-btn-edit').forEach(function(b){b.onclick=function(){openEditExamModal(b.dataset.id);};});
  tbody.querySelectorAll('.act-btn-delete').forEach(function(b){b.onclick=function(){confirmDel('هل أنتِ متأكدة من حذف هذه النتيجة؟',function(){save('exams',load('exams').filter(function(e){return e.id!==b.dataset.id;}));showToast('تم حذف النتيجة','error');renderExamRows();renderMonthlyExams();});};});
}
function examFormHtml(e){var students=load('students');return '<div class="form-group"><label class="form-label">الطالب *</label><select class="form-select" name="studentId"><option value="">اختر الطالب</option>'+students.map(function(s){return '<option value="'+s.id+'"'+(e.studentId===s.id?' selected':'')+'>'+esc(s.name)+' — '+esc(s.grade)+'</option>';}).join('')+'</select></div><div class="form-group"><label class="form-label">اسم الامتحان *</label><input class="form-input" name="title" value="'+esc(e.title||'')+'"/></div><div class="form-group"><label class="form-label">التاريخ</label><input class="form-input" type="date" name="date" value="'+(e.date||today())+'"/></div><div class="form-group"><label class="form-label">الدرجة النهائية</label><input class="form-input" type="number" name="maxScore" min="1" value="'+(e.maxScore||20)+'"/></div><div class="form-group"><label class="form-label">درجة الطالب</label><input class="form-input" type="number" name="score" min="0" value="'+(e.score||0)+'"/></div><div class="form-group"><label class="form-label">ملاحظات</label><textarea class="form-textarea" name="note">'+esc(e.note||'')+'</textarea></div>';}
function openAddExamModal(){openModal('<div class="modal-header"><h3>إضافة نتيجة امتحان</h3><button class="modal-close">✕</button></div><div class="modal-body"><form id="exForm">'+examFormHtml({})+'</form></div><div class="modal-footer"><button class="btn btn-accent" id="exSaveBtn">حفظ النتيجة</button><button class="btn btn-ghost" onclick="closeModal()">إلغاء</button></div>');document.getElementById('exSaveBtn').onclick=function(){saveExam(null);};}
function openEditExamModal(id){var e=load('exams').find(function(x){return x.id===id;});if(!e)return;openModal('<div class="modal-header"><h3>تعديل نتيجة امتحان</h3><button class="modal-close">✕</button></div><div class="modal-body"><form id="exForm">'+examFormHtml(e)+'</form></div><div class="modal-footer"><button class="btn btn-accent" id="exSaveBtn">حفظ التغييرات</button><button class="btn btn-ghost" onclick="closeModal()">إلغاء</button></div>');document.getElementById('exSaveBtn').onclick=function(){saveExam(id);};}
function saveExam(id){var f=document.getElementById('exForm');var d=Object.fromEntries(new FormData(f));if(!d.studentId){showToast('من فضلك اختر الطالب.','error');return;}if(!d.title.trim()){showToast('من فضلك أدخل اسم الامتحان.','error');return;}d.maxScore=Number(d.maxScore);d.score=Number(d.score);if(d.score<0){showToast('درجة الطالب لا يمكن أن تكون سالبة.','error');return;}if(d.score>d.maxScore){showToast('درجة الطالب لا يمكن أن تكون أكبر من الدرجة النهائية.','error');return;}var exams=load('exams');if(id){var i=exams.findIndex(function(x){return x.id===id;});exams[i]=Object.assign({},exams[i],d);}else exams.push(Object.assign({id:genId()},d));save('exams',exams);logActivity(getStudentName(d.studentId),id?'تم تعديل نتيجة امتحان':'تم تسجيل نتيجة امتحان');showToast(id?'تم تحديث النتيجة':'تم حفظ نتيجة الامتحان');closeModal();renderExamRows();renderMonthlyExams();}
function renderMonthlyExams(){
  var tbody=document.getElementById('exMonthlyTable');if(!tbody)return;
  var monthIndex=document.getElementById('exMonth')?document.getElementById('exMonth').value:'';
  var year=document.getElementById('exYear')?document.getElementById('exYear').value:'2026';
  var g=document.getElementById('exGrade')?document.getElementById('exGrade').value:'';
  var q=(document.getElementById('exSearch')?document.getElementById('exSearch').value:'').toLowerCase();
  var students=load('students').filter(function(s){return(!g||s.grade===g)&&(!q||s.name.toLowerCase().includes(q));});
  var allExams=load('exams');
  if(monthIndex!==''){
    var monthStart=getMonthStart(year, parseInt(monthIndex));
    var monthEnd=getMonthEnd(year, parseInt(monthIndex));
    allExams=allExams.filter(function(e){return e.date>=monthStart&&e.date<=monthEnd;});
  }
  if(!students.length){tbody.innerHTML='<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--clr-muted)">لا توجد بيانات.</td></tr>';return;}
  tbody.innerHTML=students.map(function(s){
    var studentExams=allExams.filter(function(e){return e.studentId===s.id;});
    var count=studentExams.length;
    if(count===0){
      return '<tr><td style="font-weight:600">'+esc(s.name)+'</td><td>'+esc(s.grade)+'</td><td>0</td><td>—</td><td>—</td><td>—</td></tr>';
    }
    var avgPct=studentExams.reduce(function(sum,e){return sum+(e.score/e.maxScore)*100;},0)/count;
    var scores=studentExams.map(function(e){return e.score;});
    var maxScore=Math.max.apply(null,scores);
    var minScore=Math.min.apply(null,scores);
    var avgColor=avgPct>=75?'badge-green':avgPct>=50?'badge-yellow':'badge-red';
    return '<tr><td style="font-weight:600">'+esc(s.name)+'</td><td>'+esc(s.grade)+'</td><td>'+count+'</td><td><span class="badge '+avgColor+'">'+Math.round(avgPct)+'%</span></td><td>'+maxScore+'</td><td>'+minScore+'</td></tr>';
  }).join('');
}


// ATTENDANCE
function renderAttendance(){
  var sec=document.getElementById('attendanceSection');
  var currentYear=new Date().getFullYear();
  var currentMonth=new Date().getMonth();
  sec.innerHTML='<div class="section-header"><h2>الحضور والغياب</h2></div>'
  +'<div class="table-card"><div class="attend-toolbar"><div class="form-group" style="margin:0"><label class="form-label">التاريخ</label><input type="date" class="form-input" id="attDate" value="'+today()+'" style="max-width:180px"/></div><div class="form-group" style="margin:0"><label class="form-label">الشهر</label><select class="form-select" id="attMonth" style="max-width:160px"><option value="">— الكل —</option>'+MONTHS.map(function(m,i){return '<option value="'+i+'"'+(i===currentMonth?' selected':'')+'>'+m+'</option>';}).join('')+'</select></div><div class="form-group" style="margin:0"><label class="form-label">السنة</label><select class="form-select" id="attYear" style="max-width:120px"><option value="2025">2025</option><option value="2026" selected>2026</option><option value="2027">2027</option></select></div><div class="form-group" style="margin:0"><label class="form-label">الصف</label><select class="form-select" id="attGrade" style="max-width:220px"><option value="">— كل الصفوف —</option>'+GRADES.map(function(g){return '<option value="'+esc(g)+'">'+g+'</option>';}).join('')+'</select></div><div class="form-group" style="margin:0"><label class="form-label">بحث</label><input type="text" class="form-input" id="attSearch" placeholder="اسم الطالب..." style="max-width:180px"/></div></div>'
  +'<div id="attendList"></div><div style="padding:1rem;border-top:1px solid var(--clr-border);display:flex;justify-content:flex-end"><button class="btn btn-accent" id="saveAttBtn">حفظ الحضور</button></div></div>'
  +'<div class="stats-grid" id="attStats" style="margin-top:1rem"></div>'
  +'<div class="table-card" style="margin-top:1rem"><div class="activity-card-title" style="padding:.9rem 1.2rem;border-bottom:1px solid var(--clr-border)">التقييم الشهري للحضور</div><div style="overflow-x:auto"><table class="data-table"><thead><tr><th>الطالب</th><th>الصف</th><th>أيام الحضور</th><th>أيام الغياب</th><th>أيام التأخر</th><th>نسبة الحضور</th></tr></thead><tbody id="attMonthlyTable"></tbody></table></div></div>';
  ['attDate','attGrade','attSearch'].forEach(function(id){var el=document.getElementById(id);if(el){el.onchange=renderAttList;el.oninput=renderAttList;}});
  ['attMonth','attYear'].forEach(function(id){var el=document.getElementById(id);if(el){el.onchange=function(){renderAttList();renderMonthlyAttendance();};}});
  document.getElementById('saveAttBtn').onclick=saveAttendance;
  renderAttList();
  renderMonthlyAttendance();
}
function renderAttList(){
  var container=document.getElementById('attendList');if(!container)return;
  var d=document.getElementById('attDate')?document.getElementById('attDate').value:today();
  var g=document.getElementById('attGrade')?document.getElementById('attGrade').value:'';
  var q=(document.getElementById('attSearch')?document.getElementById('attSearch').value:'').toLowerCase();
  var monthIndex=document.getElementById('attMonth')?document.getElementById('attMonth').value:'';
  var year=document.getElementById('attYear')?document.getElementById('attYear').value:'2026';
  var students=load('students').filter(function(s){return(!g||s.grade===g)&&(!q||s.name.toLowerCase().includes(q));});
  var allAttendance=load('attendance');
  var existing=allAttendance.filter(function(a){return a.date===d;});
  container.innerHTML=students.map(function(s){var rec=existing.find(function(a){return a.studentId===s.id;});var status=rec?rec.status:'حاضر';return '<div class="attend-row"><span class="attend-name">'+esc(s.name)+' — <span style="font-size:.8rem;color:var(--clr-muted)">'+esc(s.grade)+'</span></span><div class="attend-radios">'+['حاضر','غائب','متأخر'].map(function(st){return '<label class="attend-radio"><input type="radio" name="att_'+s.id+'" value="'+st+'"'+(status===st?' checked':'')+'/><span class="badge '+(st==='حاضر'?'badge-green':st==='متأخر'?'badge-yellow':'badge-red')+'">'+st+'</span></label>';}).join('')+'</div></div>';}).join('')||'<div style="padding:1.5rem;text-align:center;color:var(--clr-muted)">لا توجد طلاب.</div>';
  renderAttStats(d, monthIndex, year);
  renderMonthlyAttendance();
}
function renderAttStats(d, monthIndex, year){
  var container=document.getElementById('attStats');if(!container)return;
  var recs=load('attendance');
  if(monthIndex!==''){
    var monthStart=getMonthStart(year, parseInt(monthIndex));
    var monthEnd=getMonthEnd(year, parseInt(monthIndex));
    recs=recs.filter(function(a){return a.date>=monthStart&&a.date<=monthEnd;});
  }else{
    recs=recs.filter(function(a){return a.date===d;});
  }
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
  save('attendance',att);logActivity('المجموعة','تم تسجيل الحضور');showToast('تم تسجيل الحضور بنجاح');renderAttStats(d, document.getElementById('attMonth').value, document.getElementById('attYear').value);renderMonthlyAttendance();updateNotifications();
}
function renderMonthlyAttendance(){
  var tbody=document.getElementById('attMonthlyTable');if(!tbody)return;
  var monthIndex=document.getElementById('attMonth')?document.getElementById('attMonth').value:'';
  var year=document.getElementById('attYear')?document.getElementById('attYear').value:'2026';
  var g=document.getElementById('attGrade')?document.getElementById('attGrade').value:'';
  var q=(document.getElementById('attSearch')?document.getElementById('attSearch').value:'').toLowerCase();
  var students=load('students').filter(function(s){return(!g||s.grade===g)&&(!q||s.name.toLowerCase().includes(q));});
  var allAttendance=load('attendance');
  if(monthIndex!==''){
    var monthStart=getMonthStart(year, parseInt(monthIndex));
    var monthEnd=getMonthEnd(year, parseInt(monthIndex));
    allAttendance=allAttendance.filter(function(a){return a.date>=monthStart&&a.date<=monthEnd;});
  }
  if(!students.length){tbody.innerHTML='<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--clr-muted)">لا توجد بيانات.</td></tr>';return;}
  tbody.innerHTML=students.map(function(s){
    var studentAtt=allAttendance.filter(function(a){return a.studentId===s.id;});
    var present=studentAtt.filter(function(a){return a.status==='حاضر';}).length;
    var absent=studentAtt.filter(function(a){return a.status==='غائب';}).length;
    var late=studentAtt.filter(function(a){return a.status==='متأخر';}).length;
    var total=present+absent+late;
    var rate=total?Math.round((present+late)/total*100):0;
    var rateColor=rate>=75?'badge-green':rate>=50?'badge-yellow':'badge-red';
    return '<tr><td style="font-weight:600">'+esc(s.name)+'</td><td>'+esc(s.grade)+'</td><td>'+present+'</td><td>'+absent+'</td><td>'+late+'</td><td><span class="badge '+rateColor+'">'+rate+'%</span></td></tr>';
  }).join('');
}

// PAYMENTS
function renderPayments(){
  var sec=document.getElementById('paymentsSection');
  var currentYear=new Date().getFullYear();
  var currentMonth=new Date().getMonth();
  var payments=load('payments');
  var totalPaid=payments.reduce(function(s,p){return s+p.paid;},0);
  var totalDue=payments.reduce(function(s,p){return s+(p.remaining||0);},0);
  var lateCount=payments.filter(function(p){return p.remaining>0;}).length;
  sec.innerHTML='<div class="section-header"><h2>مصاريف الدروس</h2><button class="btn btn-accent" id="addPayBtn">+ تسجيل دفعة</button></div>'
  +'<div class="stats-grid"><div class="stat-card"><div class="stat-num">'+totalPaid.toLocaleString('ar-EG')+' ج</div><div class="stat-lbl">إجمالي المدفوع</div></div><div class="stat-card"><div class="stat-num">'+totalDue.toLocaleString('ar-EG')+' ج</div><div class="stat-lbl">إجمالي المتبقي</div></div><div class="stat-card"><div class="stat-num">'+lateCount+'</div><div class="stat-lbl">لديهم مبالغ متبقية</div></div></div>'
  +'<div class="table-card"><div class="table-toolbar"><input type="text" class="form-input" id="paySearch" placeholder="بحث باسم الطالب..." style="max-width:220px"/><select class="form-select" id="payMonth" style="max-width:160px"><option value="">— الكل —</option>'+MONTHS.map(function(m,i){return '<option value="'+i+'"'+(i===currentMonth?' selected':'')+'>'+m+'</option>';}).join('')+'</select><select class="form-select" id="payYear" style="max-width:120px"><option value="2025">2025</option><option value="2026" selected>2026</option><option value="2027">2027</option></select></div>'
  +'<div style="overflow-x:auto"><table class="data-table"><thead><tr><th>الطالب</th><th>الشهر</th><th>الاشتراك</th><th>المدفوع</th><th>المتبقي</th><th>الحالة</th><th>تاريخ الدفع</th><th>الإجراءات</th></tr></thead><tbody id="payTbody"></tbody></table></div></div>'
  +'<div class="table-card" style="margin-top:1rem"><div class="activity-card-title" style="padding:.9rem 1.2rem;border-bottom:1px solid var(--clr-border)">التقييم الشهري للمدفوعات</div><div style="overflow-x:auto"><table class="data-table"><thead><tr><th>الطالب</th><th>الصف</th><th>المبلغ المدفوع</th><th>المبلغ المتبقي</th><th>الحالة</th></tr></thead><tbody id="payMonthlyTable"></tbody></table></div></div>';
  document.getElementById('addPayBtn').onclick=function(){openAddPaymentModal();};
  document.getElementById('paySearch').oninput=renderPayRows;
  ['payMonth','payYear'].forEach(function(id){var el=document.getElementById(id);if(el){el.onchange=function(){renderPayRows();renderMonthlyPayments();};}});
  renderPayRows();
  renderMonthlyPayments();
}
function renderPayRows(){
  var tbody=document.getElementById('payTbody');if(!tbody)return;
  var q=(document.getElementById('paySearch')?document.getElementById('paySearch').value:'').toLowerCase();
  var monthIndex=document.getElementById('payMonth')?document.getElementById('payMonth').value:'';
  var year=document.getElementById('payYear')?document.getElementById('payYear').value:'2026';
  var all=load('payments');
  if(monthIndex!==''){
    var monthName=MONTHS[parseInt(monthIndex)];
    all=all.filter(function(p){return p.month.includes(monthName)&&p.month.includes(year);});
  }
  all=all.filter(function(p){return!q||getStudentName(p.studentId).toLowerCase().includes(q);});
  if(!all.length){tbody.innerHTML='<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--clr-muted)">لا توجد دفعات.</td></tr>';return;}
  tbody.innerHTML=all.map(function(p){var ps=paymentStatus(p);return '<tr><td style="font-weight:600">'+esc(getStudentName(p.studentId))+'</td><td>'+esc(p.month)+'</td><td>'+p.total+' ج</td><td>'+p.paid+' ج</td><td>'+p.remaining+' ج</td><td><span class="badge '+ps.cls+'">'+ps.label+'</span></td><td>'+(p.date?fmtDate(p.date):'—')+'</td><td><div class="actions-cell"><button class="act-btn act-btn-edit" data-id="'+p.id+'">تعديل</button><button class="act-btn act-btn-delete" data-id="'+p.id+'">حذف</button></div></td></tr>';}).join('');
  tbody.querySelectorAll('.act-btn-edit').forEach(function(b){b.onclick=function(){openEditPaymentModal(b.dataset.id);};});
  tbody.querySelectorAll('.act-btn-delete').forEach(function(b){b.onclick=function(){confirmDel('هل أنتِ متأكدة من حذف هذه الدفعة؟',function(){save('payments',load('payments').filter(function(p){return p.id!==b.dataset.id;}));showToast('تم حذف الدفعة','error');renderPayRows();renderMonthlyPayments();updateNotifications();});};});
}
function payFormHtml(p){var students=load('students');return '<div class="form-group"><label class="form-label">الطالب *</label><select class="form-select" name="studentId"><option value="">اختر الطالب</option>'+students.map(function(s){return '<option value="'+s.id+'"'+(p.studentId===s.id?' selected':'')+'>'+esc(s.name)+'</option>';}).join('')+'</select></div><div class="form-group"><label class="form-label">الشهر *</label><input class="form-input" name="month" value="'+esc(p.month||'')+'"/></div><div class="form-group"><label class="form-label">قيمة الاشتراك</label><input class="form-input" type="number" name="total" min="0" value="'+(p.total||300)+'"/></div><div class="form-group"><label class="form-label">المبلغ المدفوع</label><input class="form-input" type="number" name="paid" min="0" value="'+(p.paid||0)+'"/></div><div class="form-group"><label class="form-label">تاريخ الدفع</label><input class="form-input" type="date" name="date" value="'+(p.date||today())+'"/></div><div class="form-group"><label class="form-label">ملاحظة</label><input class="form-input" name="note" value="'+esc(p.note||'')+'"/></div>';}
function openAddPaymentModal(){openModal('<div class="modal-header"><h3>تسجيل دفعة</h3><button class="modal-close">✕</button></div><div class="modal-body"><form id="payForm">'+payFormHtml({})+'</form></div><div class="modal-footer"><button class="btn btn-accent" id="paySaveBtn">تسجيل الدفعة</button><button class="btn btn-ghost" onclick="closeModal()">إلغاء</button></div>');document.getElementById('paySaveBtn').onclick=function(){savePayment(null);};}
function openEditPaymentModal(id){var p=load('payments').find(function(x){return x.id===id;});if(!p)return;openModal('<div class="modal-header"><h3>تعديل الدفعة</h3><button class="modal-close">✕</button></div><div class="modal-body"><form id="payForm">'+payFormHtml(p)+'</form></div><div class="modal-footer"><button class="btn btn-accent" id="paySaveBtn">حفظ التغييرات</button><button class="btn btn-ghost" onclick="closeModal()">إلغاء</button></div>');document.getElementById('paySaveBtn').onclick=function(){savePayment(id);};}
function savePayment(id){var f=document.getElementById('payForm');var d=Object.fromEntries(new FormData(f));if(!d.studentId){showToast('من فضلك اختر الطالب.','error');return;}if(!d.month.trim()){showToast('من فضلك أدخل الشهر.','error');return;}d.total=Number(d.total);d.paid=Number(d.paid);if(d.paid<0){showToast('المبلغ المدفوع لا يمكن أن يكون سالبًا.','error');return;}if(d.paid>d.total){showToast('المبلغ المدفوع أكبر من قيمة الاشتراك.','error');return;}d.remaining=d.total-d.paid;var pays=load('payments');if(id){var i=pays.findIndex(function(x){return x.id===id;});pays[i]=Object.assign({},pays[i],d);}else pays.push(Object.assign({id:genId()},d));save('payments',pays);logActivity(getStudentName(d.studentId),id?'تم تعديل دفعة':'تم تسجيل دفعة');showToast(id?'تم تحديث الدفعة':'تم تسجيل الدفعة بنجاح');closeModal();renderPayRows();renderMonthlyPayments();updateNotifications();}
function renderMonthlyPayments(){
  var tbody=document.getElementById('payMonthlyTable');if(!tbody)return;
  var monthIndex=document.getElementById('payMonth')?document.getElementById('payMonth').value:'';
  var year=document.getElementById('payYear')?document.getElementById('payYear').value:'2026';
  var q=(document.getElementById('paySearch')?document.getElementById('paySearch').value:'').toLowerCase();
  var students=load('students').filter(function(s){return!q||s.name.toLowerCase().includes(q);});
  var allPayments=load('payments');
  if(monthIndex!==''){
    var monthName=MONTHS[parseInt(monthIndex)];
    allPayments=allPayments.filter(function(p){return p.month.includes(monthName)&&p.month.includes(year);});
  }
  if(!students.length){tbody.innerHTML='<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--clr-muted)">لا توجد بيانات.</td></tr>';return;}
  tbody.innerHTML=students.map(function(s){
    var studentPayments=allPayments.filter(function(p){return p.studentId===s.id;});
    var totalPaid=studentPayments.reduce(function(sum,p){return sum+p.paid;},0);
    var totalRemaining=studentPayments.reduce(function(sum,p){return sum+(p.remaining||0);},0);
    var status=totalRemaining===0?'مدفوع بالكامل':totalPaid===0?'لم يتم الدفع':'جزئي';
    var statusColor=status==='مدفوع بالكامل'?'badge-green':status==='لم يتم الدفع'?'badge-red':'badge-yellow';
    return '<tr><td style="font-weight:600">'+esc(s.name)+'</td><td>'+esc(s.grade)+'</td><td>'+totalPaid+' ج</td><td>'+totalRemaining+' ج</td><td><span class="badge '+statusColor+'">'+status+'</span></td></tr>';
  }).join('');
}


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
