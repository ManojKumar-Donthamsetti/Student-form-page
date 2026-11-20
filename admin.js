requireRole('admin');
renderNav('Admin Dashboard');
document.getElementById('common').innerHTML = commonFields();

const fName = document.getElementById('fName'), fClass = document.getElementById('fClass');
const fMin = document.getElementById('fMin'), fMax = document.getElementById('fMax');
const modal = new bootstrap.Modal(document.getElementById('editModal'));
let editingId = null;

// Fill the class dropdown from the data, keeping the current selection
function loadClasses() {
  const keep = fClass.value;
  const classes = [...new Set(getUsers().map((u) => u.cls))].sort();
  fClass.innerHTML = '<option value="">All classes</option>' +
    classes.map((c) => `<option>${esc(c)}</option>`).join('');
  fClass.value = classes.includes(keep) ? keep : '';
}

// Draw the table - runs on every keystroke so filters update instantly
function draw() {
  const n = fName.value.trim().toLowerCase(), c = fClass.value;
  const mn = fMin.value, mx = fMax.value;
  const rows = getUsers().filter((u) => {
    const age = calcAge(u.dob);
    return u.name.toLowerCase().includes(n) && (!c || u.cls === c) &&
      (mn === '' || age >= +mn) && (mx === '' || age <= +mx);
  });
  document.getElementById('rows').innerHTML = rows.length
    ? rows.map((u) => `<tr>
        <td>${fmtId(u.id)}</td><td>${esc(u.name)}</td><td>${esc(u.email)}</td>
        <td>${esc(u.cls)}</td><td>${calcAge(u.dob)}</td>
        <td><button class="pdf-icon" title="${esc(u.fileName)}" data-act="open" data-id="${u.id}"><i class="bi bi-file-earmark-pdf-fill"></i></button></td>
        <td><button class="btn btn-sm btn-info text-white" data-act="edit" data-id="${u.id}">Edit</button>
            <button class="btn btn-sm btn-danger" data-act="del" data-id="${u.id}">Delete</button></td>
      </tr>`).join('')
    : '<tr><td colspan="7" class="text-center text-muted py-4">No students found.</td></tr>';
}

[fName, fClass, fMin, fMax].forEach((el) => el.addEventListener('input', draw));

// One click handler for open / edit / delete buttons
document.getElementById('rows').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  const id = +b.dataset.id, users = getUsers(), u = users.find((x) => x.id === id);
  if (!u) return;

  if (b.dataset.act === 'open') openPdf(u.fileData);

  if (b.dataset.act === 'del' && confirm(`Delete ${u.name}?`)) {
    saveUsers(users.filter((x) => x.id !== id));
    loadClasses(); draw();
    showAlert('Student deleted.', 'success');
  }

  if (b.dataset.act === 'edit') {
    editingId = id;
    document.getElementById('eName').value = u.name;    // locked
    document.getElementById('eEmail').value = u.email;  // locked
    fillCommon(u);
    document.getElementById('aadhaar').value = '';
    modal.show();
  }
});

document.getElementById('editForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const users = getUsers(), i = users.findIndex((x) => x.id === editingId);
  if (i === -1) return;
  let pdf = null;
  try { pdf = await readPdf(document.getElementById('aadhaar').files[0]); }
  catch (err) { modal.hide(); return showAlert(err); }

  // Only non-locked fields are changed; name and email are never touched
  users[i] = { ...users[i], ...readCommon(), ...(pdf || {}) };
  try { saveUsers(users); } catch (err) { modal.hide(); return showAlert('Browser storage is full.'); }
  modal.hide();
  loadClasses(); draw();
  showAlert('Student updated.', 'success');
});

loadClasses();
draw();
