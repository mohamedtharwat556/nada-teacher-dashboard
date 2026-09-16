/**
 * أستاذة ندى — Student Tracking & Parent Portal
 * script.js — Data Layer + UI Logic
 *
 * ARCHITECTURE NOTE:
 * All student data lives in the `students` array below.
 * When connecting to a real backend (Supabase / Firebase / Node.js),
 * replace the `students` array with API calls like:
 *   const students = await fetch('/api/students').then(r => r.json())
 * The render functions (renderStudentDashboard, etc.) remain unchanged.
 */

'use strict';

/* =====================================================================
   VIDEO FALLBACK
   ===================================================================== */
document.addEventListener('DOMContentLoaded', function() {
  const video = document.getElementById('videoBg');
  const fallback = document.getElementById('videoFallback');
  
  if (video) {
    video.addEventListener('error', function() {
      console.log('Video failed to load, showing fallback');
      if (fallback) {
        fallback.style.display = 'block';
        video.style.display = 'none';
      }
    });
    
    // Also check if video loads after a timeout
    setTimeout(function() {
      if (video.readyState === 0) { // HAVE_NOTHING
        console.log('Video not loading, showing fallback');
        if (fallback) {
          fallback.style.display = 'block';
          video.style.display = 'none';
        }
      }
    }, 3000);
  }
});

/* =====================================================================
   TEACHER CONFIG
   الكاشف  → رابع ابتدائي — ثالث إعدادي
   سيف الدين → أول إعدادي — أول ثانوي
   ===================================================================== */

const TEACHER_GRADES = {
  'الكاشف': [
    'الصف الرابع الابتدائي',
    'الصف الخامس الابتدائي',
    'الصف السادس الابتدائي',
    'الصف الأول الإعدادي',
    'الصف الثاني الإعدادي',
    'الصف الثالث الإعدادي',
  ],
  'سيف الدين': [
    'الصف الأول الإعدادي',
    'الصف الثاني الإعدادي',
    'الصف الثالث الإعدادي',
    'الصف الأول الثانوي',
  ],
};

/** Currently selected teacher — default: الكاشف */
let selectedTeacher = 'الكاشف';

/**
 * Rebuild the grade <select> options based on the chosen teacher.
 * Keeps the current value if it's still valid.
 */
function syncGradeOptions() {
  const gradeSelect  = document.getElementById('gradeFilter');
  if (!gradeSelect) return;

  const grades    = TEACHER_GRADES[selectedTeacher] || [];
  const prevValue = gradeSelect.value;

  // Rebuild options
  gradeSelect.innerHTML = '<option value="">— كل الصفوف  —</option>';
  grades.forEach(g => {
    const opt = document.createElement('option');
    opt.value = g;
    opt.textContent = g;
    gradeSelect.appendChild(opt);
  });

  // Restore previous selection only if still valid
  if (grades.includes(prevValue)) {
    gradeSelect.value = prevValue;
  }
}

/* =====================================================================
   DATA LAYER — Mock Student Database
   ===================================================================== */

// We load from backend or fallback to empty array
let CACHED_STUDENTS = [];
const getStudents = () => CACHED_STUDENTS;
async function fetchStudents() {
  try {
    const res = await fetch('/api/data');
    if (res.ok) {
      const data = await res.json();
      CACHED_STUDENTS = data.students || [];
    }
  } catch(e) { console.warn('Backend not reachable', e); }
}
document.addEventListener('DOMContentLoaded', fetchStudents);

/* =====================================================================
   HELPER UTILITIES
   ===================================================================== */

/**
 * Get initials from Arabic name (first letter of first two words)
 */
function getInitials(name) {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return parts[0][0] + parts[1][0];
  return parts[0][0];
}

/**
 * Calculate attendance percentage
 */
function calcAttendancePct(att) {
  return att.total > 0 ? Math.round((att.present / att.total) * 100) : 0;
}

/**
 * Calculate homework completion stats
 */
function calcHomeworkStats(homework) {
  const total = homework.length;
  const done  = homework.filter(h => h.status === 'done').length;
  return { done, total };
}

/**
 * Calculate exam average percentage
 */
function calcExamAvg(exams) {
  if (!exams.length) return 0;
  const avg = exams.reduce((sum, e) => sum + (e.score / e.total) * 100, 0) / exams.length;
  return Math.round(avg);
}

/**
 * Map a performance percentage to bar colour class
 */
function perfColor(pct) {
  if (pct >= 85) return 'green';
  if (pct >= 60) return '';    // default blue
  if (pct >= 45) return 'amber';
  return 'red';
}

/**
 * Arabic status label for attendance entries
 */
const attLabels = { present: 'حاضر', absent: 'غائب', late: 'متأخر' };

/**
 * Arabic label and badge class for homework status
 */
function hwBadge(status) {
  if (status === 'done')    return { label: 'مكتمل',         cls: 'badge-success' };
  if (status === 'missing') return { label: 'لم يتم التسليم', cls: 'badge-danger'  };
  if (status === 'late')    return { label: 'متأخر',          cls: 'badge-warning' };
  return { label: status, cls: 'badge-neutral' };
}

/* =====================================================================
   SEARCH LOGIC
   ===================================================================== */

/**
 * Search students by name (full or partial, case-insensitive)
 * and optional grade filter.
 *
 * Replace this function's internals with an API call in production:
 *   const results = await fetch(`/api/students?name=${name}&grade=${grade}`)
 *     .then(r => r.json());
 */
function searchStudents(name, grade) {
  const q = name.trim().toLowerCase();

  return getStudents().filter(s => {
    const nameMatch    = q === '' || s.name.toLowerCase().includes(q);
    const gradeMatch   = grade === '' || s.grade === grade;
    // Only return students that belong to the currently selected teacher.
    // Fall back gracefully: if a student has no `teacher` field, check
    // whether their grade is in the teacher's list.
    const teacherGrades = TEACHER_GRADES[selectedTeacher] || [];
    const teacherMatch  = s.teacher === selectedTeacher
                       || (!s.teacher && teacherGrades.includes(s.grade));
    return nameMatch && gradeMatch && teacherMatch;
  });
}

/* =====================================================================
   RENDER — SEARCH RESULTS
   ===================================================================== */

function renderSearchResults(results, query) {
  const section   = document.getElementById('resultsSection');
  const container = document.getElementById('resultsContainer');

  // Hide student dashboard if visible
  document.getElementById('dashboardSection').style.display = 'none';

  if (results.length === 0) {
    container.innerHTML = `
      <div class="state-empty reveal">
        <div class="state-empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
        </div>
        <h3>لم يتم العثور على طالب مطابق للبحث</h3>
        <p>تأكد من الاسم أو اختر صفًا دراسيًا مختلفًا.</p>
      </div>`;
    section.style.display = 'block';
    triggerReveal();
    return;
  }

  const countText = results.length === 1
    ? 'تم العثور على طالب واحد'
    : `تم العثور على ${results.length} طلاب`;

  const cards = results.map(s => {
    const initials = getInitials(s.name);
    const teacherLabel = s.teacher || selectedTeacher;
    return `
      <div class="result-card reveal" data-student-id="${s.id}" role="button" tabindex="0" aria-label="عرض ملف ${s.name}">
        <div class="result-card-info">
          <div class="result-avatar">${initials}</div>
          <div>
            <div class="result-name">${s.name}</div>
            <div class="result-grade">${s.grade}</div>
            <div class="result-teacher-tag">
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
              ${teacherLabel}
            </div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;">
          <span class="result-status-badge">${s.status}</span>
          <span class="result-arrow">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </span>
        </div>
      </div>`;
  }).join('');

  container.innerHTML = `
    <p class="results-title">نتائج البحث <span class="results-count">— ${countText}</span></p>
    <div class="results-grid">${cards}</div>`;

  section.style.display = 'block';

  // Bind click + keyboard events
  container.querySelectorAll('.result-card').forEach(card => {
    const id = parseInt(card.dataset.studentId, 10);
    const select = () => selectStudent(id);
    card.addEventListener('click', select);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') select(); });
  });

  triggerReveal();

  // Smooth scroll to results
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* =====================================================================
   RENDER — STUDENT DASHBOARD
   ===================================================================== */

function selectStudent(id) {
  const student = getStudents().find(s => s.id === id);
  if (!student) return;
  renderStudentDashboard(student);
}

function renderStudentDashboard(student) {
  const section   = document.getElementById("dashboardSection");
  const container = document.getElementById("dashboardContainer");

  // Hide search results
  document.getElementById("resultsSection").style.display = "none";

  const initials = getInitials(student.name);

  container.innerHTML = `
    ${renderStudentHeader(student, initials)}
    ${renderOverviewCards(student)}
    ${student.generalNotes ? `<div style="margin-top:2rem;padding:1.5rem;background:var(--clr-bg-card);border-radius:12px;border:1px solid var(--clr-border);">
      <h3 style="font-size:1.1rem;margin-bottom:1rem;color:var(--clr-text);">ملاحظات المعلم</h3>
      <p style="color:var(--clr-muted);line-height:1.6;">${student.generalNotes}</p>
    </div>` : ""}
    <div class="back-to-search">
      <button class="btn-back" id="backBtn">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
        العودة للبحث
      </button>
    </div>`;

  section.style.display = "block";
  document.getElementById("backBtn").addEventListener("click", backToSearch);
  section.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ---- Student Header ---- */
function renderStudentHeader(student, initials) {
  const teacherLabel = student.teacher || selectedTeacher;
  return `
    <div class="student-header">
      <div class="student-header-inner">
        <div class="student-header-left">
          <div class="student-big-avatar">${initials}</div>
          <div>
            <div class="student-header-name">${student.name}</div>
            <div class="student-header-grade">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
              ${student.grade}
            </div>
          </div>
        </div>
        <div class="student-header-badges">
          <span class="badge-status">${student.status || "منتظم"}</span>
          <span class="student-teacher-badge">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
            ${teacherLabel}
          </span>
        </div>
      </div>
    </div>`;
}

/* ---- Overview Cards ---- */
function renderOverviewCards(student) {
  const payStatus = student.payStatus || "—";
  const payIcon = payStatus === "خالص" ? "green" : payStatus === "متبقي" ? "amber" : payStatus === "لم يتم الدفع" ? "red" : "gray";
  const attPct = student.attRate || "—";
  const hwStats = student.hwCompleted || "—";
  const examAvg = student.examAvg || "—";

  return `
    <div class="overview-grid">
      <div class="overview-card">
        <div class="overview-icon blue">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
        </div>
        <div class="overview-value">${student.grade.replace("الصف ", "")}</div>
        <div class="overview-label">الصف الدراسي</div>
      </div>
      <div class="overview-card">
        <div class="overview-icon sky">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
        <div class="overview-value">${attPct}${attPct !== "—" ? "%" : ""}</div>
        <div class="overview-label">نسبة الحضور</div>
      </div>
      <div class="overview-card">
        <div class="overview-icon green">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        </div>
        <div class="overview-value" style="direction:ltr;">${hwStats}</div>
        <div class="overview-label">الواجبات المكتملة</div>
      </div>
      <div class="overview-card">
        <div class="overview-icon amber">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
        </div>
        <div class="overview-value">${examAvg}${examAvg !== "—" ? "%" : ""}</div>
        <div class="overview-label">متوسط الامتحانات</div>
      </div>
      <div class="overview-card">
        <div class="overview-icon ${payIcon}">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
        </div>
        <div class="overview-value" style="font-size:1.1rem;">${payStatus}</div>
        <div class="overview-label">حالة المصروفات</div>
      </div>
    </div>`;
}

/* ---- Academic Performance ---- */
function renderPerformance(performance) {
  const bars = Object.entries(performance).map(([label, pct]) => {
    const color = perfColor(pct);
    return `
      <div class="perf-item">
        <div class="perf-item-header">
          <span class="perf-item-label">${label}</span>
          <span class="perf-item-value">${pct}%</span>
        </div>
        <div class="perf-bar-bg">
          <div class="perf-bar-fill ${color}" data-width="${pct}" style="width:0%"></div>
        </div>
      </div>`;
  }).join('');

  return `
    <div class="dash-section">
      <div class="dash-section-header">
        <div class="dash-section-icon blue">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
        </div>
        <div>
          <div class="dash-section-title">الأداء الأكاديمي</div>
          <div class="dash-section-sub">مستوى الطالب في مختلف جوانب المادة</div>
        </div>
      </div>
      <div class="perf-list">${bars}</div>
    </div>`;
}

/* ---- Homework ---- */
function renderHomework(homework) {
  const items = homework.map(hw => {
    const badge = hwBadge(hw.status);
    const gradeHtml = hw.grade !== '—'
      ? `<span class="hw-grade">${hw.grade}</span>`
      : `<span class="hw-grade" style="color:var(--text-light)">—</span>`;

    return `
      <div class="hw-item">
        <div>
          <div class="hw-name">${hw.name}</div>
          <div class="hw-meta">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            ${hw.date}
          </div>
          ${hw.note ? `<div class="hw-note">"${hw.note}"</div>` : ''}
        </div>
        <span class="badge ${badge.cls}">${badge.label}</span>
        ${gradeHtml}
      </div>`;
  }).join('');

  return `
    <div class="dash-section">
      <div class="dash-section-header">
        <div class="dash-section-icon amber">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        </div>
        <div>
          <div class="dash-section-title">الواجبات</div>
          <div class="dash-section-sub">سجل الواجبات والتسليمات</div>
        </div>
      </div>
      <div class="hw-list">${items}</div>
    </div>`;
}

/* ---- Exams ---- */
function renderExams(exams) {
  const items = exams.map(ex => {
    const pct = Math.round((ex.score / ex.total) * 100);
    const pctColor = pct >= 85 ? 'var(--success)' : pct >= 60 ? 'var(--primary-light)' : 'var(--danger)';

    return `
      <div class="exam-item">
        <div>
          <div class="exam-name">${ex.name}</div>
          <div class="exam-date">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            ${ex.date}
          </div>
          ${ex.note ? `<div class="exam-note">"${ex.note}"</div>` : ''}
        </div>
        <div class="exam-score-box">
          <div class="exam-score" style="color:${pctColor}">${ex.score}/${ex.total}</div>
          <div class="exam-pct">${pct}%</div>
        </div>
      </div>`;
  }).join('');

  return `
    <div class="dash-section">
      <div class="dash-section-header">
        <div class="dash-section-icon purple">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>
        <div>
          <div class="dash-section-title">الامتحانات</div>
          <div class="dash-section-sub">نتائج الاختبارات والامتحانات الشهرية</div>
        </div>
      </div>
      <div class="exam-list">${items}</div>
    </div>`;
}

/* ---- Attendance ---- */
function renderAttendance(att, attPct) {
  const historyItems = att.history.map(h => `
    <div class="att-item">
      <span class="att-item-date">${h.date}</span>
      <span style="display:flex;align-items:center;gap:8px;">
        <span class="badge ${h.status === 'present' ? 'badge-success' : h.status === 'absent' ? 'badge-danger' : 'badge-warning'}">
          ${attLabels[h.status]}
        </span>
        <span class="att-dot ${h.status}"></span>
      </span>
    </div>`).join('');

  return `
    <div class="dash-section">
      <div class="dash-section-header">
        <div class="dash-section-icon green">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
        <div>
          <div class="dash-section-title">الحضور والغياب</div>
          <div class="dash-section-sub">نسبة الحضور: ${attPct}%</div>
        </div>
      </div>
      <div class="attendance-stats-grid">
        <div class="att-stat-card total">
          <div class="att-stat-num">${att.total}</div>
          <div class="att-stat-label">إجمالي الحصص</div>
        </div>
        <div class="att-stat-card present">
          <div class="att-stat-num">${att.present}</div>
          <div class="att-stat-label">الحضور</div>
        </div>
        <div class="att-stat-card absent">
          <div class="att-stat-num">${att.absent}</div>
          <div class="att-stat-label">الغياب</div>
        </div>
        <div class="att-stat-card late">
          <div class="att-stat-num">${att.late}</div>
          <div class="att-stat-label">التأخير</div>
        </div>
      </div>
      <div class="att-history">
        <div class="att-history-title">سجل الحضور الأخير</div>
        ${historyItems}
      </div>
    </div>`;
}

/* ---- Payments ---- */
function renderPayments(payments) {
  const statusLabel = payments.status === 'paid'    ? 'مدفوع بالكامل'
                    : payments.status === 'partial' ? `متبقي ${payments.remaining} جنيه`
                    : 'لم يتم الدفع';

  const statusIcon = payments.status === 'paid'
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
    : payments.status === 'partial'
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;

  return `
    <div class="dash-section">
      <div class="dash-section-header">
        <div class="dash-section-icon sky">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
        </div>
        <div>
          <div class="dash-section-title">مصاريف الدروس</div>
          <div class="dash-section-sub">متابعة حالة الاشتراك الشهري</div>
        </div>
      </div>
      <div class="payment-summary">
        <div class="payment-item">
          <div class="payment-item-label">قيمة الشهر</div>
          <div class="payment-item-value">${payments.monthly} جنيه</div>
        </div>
        <div class="payment-item">
          <div class="payment-item-label">المبلغ المدفوع</div>
          <div class="payment-item-value paid">${payments.paid} جنيه</div>
        </div>
        <div class="payment-item">
          <div class="payment-item-label">المبلغ المتبقي</div>
          <div class="payment-item-value ${payments.remaining > 0 ? 'unpaid' : 'paid'}">${payments.remaining} جنيه</div>
        </div>
        <div class="payment-item">
          <div class="payment-item-label">آخر دفعة</div>
          <div class="payment-item-value">${payments.lastPayment}</div>
        </div>
      </div>
      <div class="payment-status-bar ${payments.status}">
        ${statusIcon}
        <span>${statusLabel}</span>
      </div>
    </div>`;
}

/* ---- Teacher Notes ---- */
function renderTeacherNotes(notes) {
  const catLabels = {
    academic:   'أكاديمي',
    homework:   'واجبات',
    attendance: 'حضور',
    behavior:   'سلوك',
    general:    'متابعة عامة'
  };

  const cards = notes.map(note => `
    <div class="note-card ${note.category}">
      <div class="note-card-header">
        <span class="note-category ${note.category}">${catLabels[note.category] || note.category}</span>
        <span class="note-date">${note.date}</span>
      </div>
      <p class="note-text">${note.text}</p>
    </div>`).join('');

  return `
    <div class="dash-section">
      <div class="dash-section-header">
        <div class="dash-section-icon blue">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </div>
        <div>
          <div class="dash-section-title">ملاحظات أستاذة ندى</div>
          <div class="dash-section-sub">تعليقات وملاحظات المدرسة على الطالب</div>
        </div>
      </div>
      <div class="notes-list">${cards}</div>
    </div>`;
}

/* =====================================================================
   BACK TO SEARCH
   ===================================================================== */

function backToSearch() {
  document.getElementById('dashboardSection').style.display = 'none';
  document.getElementById('resultsSection').style.display   = 'none';

  // Clear inputs
  document.getElementById('studentName').value = '';
  document.getElementById('gradeFilter').value = '';

  // Re-sync grades (teacher may not have changed, but ensures consistency)
  syncGradeOptions();

  // Scroll to hero/search
  document.getElementById('hero').scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.getElementById('studentName').focus();
}

/* =====================================================================
   NOTIFICATION TOAST
   ===================================================================== */

function showNotification(msg, duration = 3000) {
  const el  = document.getElementById('notification');
  const txt = document.getElementById('notificationMsg');
  txt.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), duration);
}

/* =====================================================================
   REVEAL ANIMATION ON SCROLL
   ===================================================================== */

function triggerReveal() {
  requestAnimationFrame(() => {
    document.querySelectorAll('.reveal').forEach((el, i) => {
      setTimeout(() => el.classList.add('visible'), i * 60);
    });
  });
}

function initRevealObserver() {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

/* =====================================================================
   NAVBAR SCROLL EFFECT
   ===================================================================== */

function initNavbar() {
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
}

/* =====================================================================
   HAMBURGER MENU
   ===================================================================== */

function initMobileMenu() {
  const btn     = document.getElementById('hamburger');
  const overlay = document.getElementById('mobileNavOverlay');

  const toggle = () => {
    const isOpen = overlay.classList.toggle('open');
    btn.classList.toggle('open', isOpen);
    btn.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  };

  const close = () => {
    overlay.classList.remove('open');
    btn.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  btn.addEventListener('click', toggle);

  document.querySelectorAll('[data-mobile-nav]').forEach(link => {
    link.addEventListener('click', close);
  });

  overlay.addEventListener('click', e => {
    if (e.target === overlay) close();
  });
}

/* =====================================================================
   SEARCH — EVENT BINDING
   ===================================================================== */

function initSearch() {
  const searchBtn  = document.getElementById('searchBtn');
  const nameInput  = document.getElementById('studentName');
  const gradeSelect= document.getElementById('gradeFilter');

  function performSearch() {
    const name  = nameInput.value.trim();
    const grade = gradeSelect.value;

    if (!name && !grade) {
      showNotification('اكتب اسم الطالب للبدء في المتابعة.');
      nameInput.focus();
      return;
    }

    // Show loading state
    const section   = document.getElementById('resultsSection');
    const container = document.getElementById('resultsContainer');
    document.getElementById('dashboardSection').style.display = 'none';
    container.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <span>جاري البحث عن بيانات الطالب...</span>
      </div>`;
    section.style.display = 'block';
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Simulate realistic async delay
    setTimeout(() => {
      const results = searchStudents(name, grade);
      renderSearchResults(results, name);
    }, 650);
  }

  searchBtn.addEventListener('click', performSearch);

  nameInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') performSearch();
  });

  gradeSelect.addEventListener('keydown', e => {
    if (e.key === 'Enter') performSearch();
  });

  // — Teacher selector ———————————————————————————————————————————————
  document.querySelectorAll('.teacher-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.teacher-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedTeacher = btn.dataset.teacher;
      syncGradeOptions();

      // Reset results when teacher changes
      document.getElementById('resultsSection').style.display  = 'none';
      document.getElementById('dashboardSection').style.display = 'none';
    });
  });

  // Build grade options for the default teacher on load
  syncGradeOptions();
}

/* =====================================================================
   SMOOTH SCROLL FOR NAV LINKS
   ===================================================================== */

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

/* =====================================================================
   ACTIVE NAV LINK ON SCROLL
   ===================================================================== */

function initActiveNavLinks() {
  const sections = ['hero', 'about-teacher', 'footer'];
  const links    = document.querySelectorAll('.nav-link[data-section]');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        const id = entry.target.id;
        const match = document.querySelector(`.nav-link[href="#${id}"]`);
        if (match) match.classList.add('active');
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  });
}

/* =====================================================================
   BOOT
   ===================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initMobileMenu();
  initSearch();
  initSmoothScroll();
  initActiveNavLinks();
  initRevealObserver();
});
