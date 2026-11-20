/* ===== Mock database (localStorage) + shared helpers ===== */
const DB_KEY = 'srp_users', ID_KEY = 'srp_next_id', SESSION_KEY = 'srp_session';
const ADMIN = { email: 'admin@portal.com', password: 'admin123', name: 'Admin' };
const QUALS = ['High School', "Bachelor's", "Master's", 'PhD'];
const INTERESTS = ['Coding', 'Design', 'Gaming', 'Sports'];

const getUsers = () => JSON.parse(localStorage.getItem(DB_KEY) || '[]');
const saveUsers = (list) => localStorage.setItem(DB_KEY, JSON.stringify(list));
const nextId = () => { const n = +(localStorage.getItem(ID_KEY) || 0) + 1; localStorage.setItem(ID_KEY, n); return n; };
const fmtId = (n) => 'STU' + String(n).padStart(3, '0');

// simple password hash (demo only - real apps use bcrypt on the server)
const hash = (s) => { let h = 5381; for (const c of s) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0; return 'h' + h; };

const getSession = () => JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
const setSession = (s) => sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
const logout = () => { sessionStorage.removeItem(SESSION_KEY); location.href = 'login.html'; };

// Access control: block direct URL access without the right role
function requireRole(role) {
  const s = getSession();
  if (!s || s.role !== role) { location.replace('login.html?denied=1'); throw new Error('Unauthorized'); }
  return s;
}

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function calcAge(dob) {
  const d = new Date(dob), t = new Date();
  let a = t.getFullYear() - d.getFullYear();
  if (t < new Date(t.getFullYear(), d.getMonth(), d.getDate())) a--;
  return a;
}

function showAlert(msg, type = 'danger') {
  document.getElementById('alertBox').innerHTML =
    `<div class="alert alert-${type} alert-dismissible fade show" role="alert">${esc(msg)}
     <button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`;
}

/* ---- PDF handling ---- */
const uniqueName = () => 'aadhaar_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10) + '.pdf';

async function readPdf(file) {
  if (!file) return null;
  if (!file.name.toLowerCase().endsWith('.pdf') || file.type !== 'application/pdf') throw 'Only PDF files are allowed.';
  if (file.size > 1.5 * 1024 * 1024) throw 'PDF must be under 1.5 MB (browser storage limit).';
  const data = await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = () => rej('Could not read the file.');
    r.readAsDataURL(file);
  });
  if (!data.startsWith('data:application/pdf;base64,JVBER')) throw 'That file is not a valid PDF.';
  return { fileName: uniqueName(), fileData: data }; // renamed so same-named uploads never overwrite
}

function openPdf(dataUrl) {
  const bin = atob(dataUrl.split(',')[1]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  window.open(URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })), '_blank');
}

/* ---- Shared page pieces ---- */
function renderNav(title) {
  const s = getSession();
  document.getElementById('nav').innerHTML = `
  <nav class="navbar navbar-expand navbar-portal px-3">
    <span class="navbar-brand me-3">${title}</span>
    <ul class="navbar-nav me-auto">
      <li class="nav-item"><a class="nav-link" href="${s ? (s.role === 'admin' ? 'admin.html' : 'student.html') : 'signup.html'}">Home</a></li>
      ${s ? '' : '<li class="nav-item"><a class="nav-link" href="signup.html">Signup</a></li><li class="nav-item"><a class="nav-link" href="login.html">Login</a></li>'}
    </ul>
    ${s ? '<button class="btn btn-link nav-link" onclick="logout()">Logout</button>' : ''}
  </nav>`;
  document.getElementById('footer').innerHTML = `Basic Coding Test - 1 | ${title}`;
}

// Fields shared by signup, student edit and admin edit
function commonFields() {
  return `
  <div class="col-md-4"><label class="form-label">Date of Birth</label>
    <input type="date" class="form-control" id="dob" required></div>
  <div class="col-md-4"><label class="form-label d-block">Gender</label>
    ${['Male', 'Female', 'Other'].map((g) => `<div class="form-check form-check-inline">
      <input class="form-check-input" type="radio" name="gender" value="${g}" id="g${g}" required>
      <label class="form-check-label" for="g${g}">${g}</label></div>`).join('')}</div>
  <div class="col-md-4"><label class="form-label">Qualification</label>
    <select class="form-select" id="qualification" required><option value="">Select...</option>
    ${QUALS.map((q) => `<option>${esc(q)}</option>`).join('')}</select></div>
  <div class="col-12"><label class="form-label d-block">Interests</label>
    ${INTERESTS.map((i) => `<div class="form-check form-check-inline">
      <input class="form-check-input" type="checkbox" name="interests" value="${i}" id="i${i}">
      <label class="form-check-label" for="i${i}">${i}</label></div>`).join('')}</div>
  <div class="col-md-4"><label class="form-label">Class</label><input class="form-control" id="cls" required></div>
  <div class="col-md-4"><label class="form-label">Subject</label><input class="form-control" id="subject" required></div>
  <div class="col-md-4"><label class="form-label">Marks</label><input type="number" min="0" class="form-control" id="marks" required></div>`;
}

const readCommon = () => ({
  dob: document.getElementById('dob').value,
  gender: (document.querySelector('input[name=gender]:checked') || {}).value || '',
  qualification: document.getElementById('qualification').value,
  interests: [...document.querySelectorAll('input[name=interests]:checked')].map((c) => c.value),
  cls: document.getElementById('cls').value.trim(),
  subject: document.getElementById('subject').value.trim(),
  marks: Number(document.getElementById('marks').value),
});

function fillCommon(u) {
  document.getElementById('dob').value = u.dob;
  document.querySelectorAll('input[name=gender]').forEach((r) => (r.checked = r.value === u.gender));
  document.getElementById('qualification').value = u.qualification;
  document.querySelectorAll('input[name=interests]').forEach((c) => (c.checked = u.interests.includes(c.value)));
  document.getElementById('cls').value = u.cls;
  document.getElementById('subject').value = u.subject;
  document.getElementById('marks').value = u.marks;
}
