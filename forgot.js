renderNav('Forgot Password');

document.getElementById('forgotForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim().toLowerCase();
  const dob = document.getElementById('dob').value;
  const users = getUsers();
  const i = users.findIndex((u) => u.email === email && u.dob === dob);
  if (i === -1) return showAlert('No account matches that email and date of birth.');
  users[i].password = hash(document.getElementById('newPass').value);
  saveUsers(users);
  location.href = 'login.html?reset=1';
});
