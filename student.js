const session = requireRole('student');
renderNav('Student Dashboard');

const u = getUsers().find((x) => x.id === session.id);
if (!u) { sessionStorage.removeItem(SESSION_KEY); location.replace('login.html?denied=1'); throw new Error('User not found'); }

if (new URLSearchParams(location.search).get('updated')) showAlert('Profile updated.', 'success');

document.getElementById('banner').textContent = `Welcome, ${u.name} (User ID: #${fmtId(u.id)})`;
document.getElementById('details').innerHTML = `
  <p><b>Email:</b> ${esc(u.email)} <i class="bi bi-lock-fill text-primary"></i></p>
  <p><b>Date of Birth:</b> ${esc(new Date(u.dob).toLocaleDateString('en-GB'))}</p>
  <p><b>Gender:</b> ${esc(u.gender)}</p>
  <p><b>Qualification:</b> ${esc(u.qualification)}</p>
  <p><b>Interests:</b> ${INTERESTS.map((i) => `${u.interests.includes(i) ? '&#9745;' : '&#9744;'} ${i}`).join(' &nbsp; ')}</p>
  <p><b>Class:</b> ${esc(u.cls)}</p>
  <p><b>Subject:</b> ${esc(u.subject)}</p>
  <p><b>Marks:</b> ${esc(u.marks)}</p>
  <p class="mb-0"><b>Aadhaar Document:</b>
    <button class="pdf-icon" id="openPdf" title="${esc(u.fileName)}"><i class="bi bi-file-earmark-pdf-fill"></i></button></p>`;
document.getElementById('openPdf').addEventListener('click', () => openPdf(u.fileData));
