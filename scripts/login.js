import { supabase } from './supabase.js';

const form = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorDisplay = document.getElementById('auth-error');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorDisplay.textContent = '';
  errorDisplay.classList.remove('show-error');

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showError('Please enter both email and password');
    return;
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      showError('Invalid login. Please try again.');
    } else {
      animateSuccess(() => {
        window.location.href = 'user.html';
      });
    }

    console.log('Logged in:', data.user);
  } catch (err) {
    showError('Something went wrong. Please try again later.');
    console.error(err);
  }
});

function showError(message) {
  errorDisplay.textContent = message;
  errorDisplay.classList.add('show-error');
}

function animateSuccess(callback) {
  form.classList.add('fade-out');
  setTimeout(callback, 600);
}
