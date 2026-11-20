renderNav('Student Registration Portal');
document.getElementById('common').innerHTML = commonFields();

document.getElementById('signupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim().toLowerCase();
  const users = getUsers();

  // Duplicate email check (also blocks the admin email)
  if (email === ADMIN.email || users.some((u) => u.email === email)) {
    return showAlert('This email is already registered.');
  }

  const common = readCommon();
  if (!common.gender) return showAlert('Please select a gender.');

  let pdf;
  try {
    pdf = await readPdf(document.getElementById('aadhaar').files[0]);
  } catch (err) {
    return showAlert(err);
  }
  if (!pdf) return showAlert('Please upload your Aadhaar document (PDF).');

  const user = {
    id: nextId(),
    name: document.getElementById('name').value.trim(),
    email,
    password: hash(document.getElementById('password').value),
    ...common,
    ...pdf,
  };
  users.push(user);
  try {
    saveUsers(users);
  } catch (err) {
    return showAlert('Browser storage is full. Use a smaller PDF.');
  }
  location.href = 'login.html?registered=1';
});
