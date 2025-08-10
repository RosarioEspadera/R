import { supabase } from "./supabase.js";

document.getElementById("signup-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const age = parseInt(document.getElementById("age").value);
  const address = document.getElementById("address").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const errorMsg = document.getElementById("errorMsg");

const { data, error } = await supabase.auth.signUp({ email, password });

if (error) {
  errorMsg.textContent = error.message;
  return;
}

const userId = data.user?.id;
if (userId) {
  const { error: profileError } = await supabase.from("profiles").insert({
    id: userId,
    name,
    age,
    address,
    email
  });

  if (profileError) {
    errorMsg.textContent = profileError.message;
    return;
  }

  window.location.href = 'login.html';
  return;
}
});