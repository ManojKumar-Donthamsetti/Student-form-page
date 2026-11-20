sessionStorage.removeItem(SESSION_KEY);
renderNav('Unified Login');

const q = new URLSearchParams(location.search);
if (q.get('registered')) showAlert('Registration successful. Please log in.', 'success');
if (q.get('denied')) showAlert('Please log in to access that page.', 'warning');
if (q.get('reset')) showAlert('Password updated. Please log in.', 'success');

document.getElementById('loginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim().toLowerCase();
  const pass = document.getElementById('password').value;

  // Admin login -> Admin Dashboard
  if (email === ADMIN.email && pass === ADMIN.password) {
    setSession({ role: 'admin', email });
    return (location.href = 'admin.html');
  }

  // Student login -> Student Dashboard
  const user = getUsers().find((u) => u.email === email && u.password === hash(pass));
  if (!user) return showAlert('Invalid email or password.');
  setSession({ role: 'student', id: user.id, email });
  location.href = 'student.html';
});
