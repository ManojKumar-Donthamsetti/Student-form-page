const session = requireRole('student');
renderNav('Edit Profile');
document.getElementById('common').innerHTML = commonFields();

const user = getUsers().find((x) => x.id === session.id);
if (!user) { sessionStorage.removeItem(SESSION_KEY); location.replace('login.html?denied=1'); throw new Error('User not found'); }

document.getElementById('banner').textContent = `Welcome, ${user.name} (User ID: #${fmtId(user.id)})`;
document.getElementById('name').value = user.name;    // locked
document.getElementById('email').value = user.email;  // locked
fillCommon(user);

document.getElementById('editForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const users = getUsers(), i = users.findIndex((x) => x.id === session.id);
  const common = readCommon();
  if (!common.gender) return showAlert('Please select a gender.');

  let pdf = null;
  try { pdf = await readPdf(document.getElementById('aadhaar').files[0]); }
  catch (err) { return showAlert(err); }

  const newPass = document.getElementById('password').value;
  users[i] = {
    ...users[i], ...common, ...(pdf || {}),
    password: newPass ? hash(newPass) : users[i].password,
  };
  try { saveUsers(users); } catch (err) { return showAlert('Browser storage is full. Use a smaller PDF.'); }
  location.href = 'student.html?updated=1';
});
