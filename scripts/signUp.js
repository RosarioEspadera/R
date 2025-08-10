import { supabase } from "./supabase.js";

const form = document.getElementById("signup-form");
const errorMsg = document.getElementById("errorMsg");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorMsg.textContent = "";

  const name = form.name.value.trim();
  const age = parseInt(form.age.value);
  const address = form.address.value.trim();
  const email = form.email.value.trim();
  const password = form.password.value;
  const confirmPassword = form.confirmPassword.value;

  if (password !== confirmPassword) {
    return showError("Passwords do not match.");
  }

  try {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) return showError(error.message);

    const userId = data.user?.id;
    if (!userId) {
      return showError("Please check your email to confirm your account.");
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      name,
      age,
      address,
      email
    });

    if (profileError) return showError(profileError.message);

    // Success: redirect to login
    window.location.href = "login.html";
  } catch (err) {
    showError("Something went wrong. Please try again later.");
    console.error("Sign-up error:", err);
  }
});

function showError(message) {
  errorMsg.textContent = message;
  errorMsg.style.opacity = 1;
  errorMsg.style.animation = "fadeIn 0.4s ease-in-out";
}
