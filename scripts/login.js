import { supabase } from './supabase.js';

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorDisplay = document.getElementById('auth-error');

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

if (error) {
    errorMsg.textContent = error.message;
  } else {
    window.location.href = "user.html";
  }
  // Logged in! You can now show upload UI
  console.log('Logged in:', data.user);
});
