import { supabase } from "./supabase.js";

supabase.auth.getSession().then(({ data: { session } }) => {
  if (!session) {
    window.location.href = "login.html"; // Redirect to login page
  }
});