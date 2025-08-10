import { supabase } from "./supabase.js";

// Flashcard Upload Logic
const flashcardForm = document.getElementById("flashcard-form");
const statusMsg = document.getElementById("statusMsg");

flashcardForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  statusMsg.textContent = "";

  const question = document.getElementById("question").value.trim();
  const answer = document.getElementById("answer").value.trim();
  const imageFile = document.getElementById("image").files[0];

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return showStatus("Authentication required.");
  }

  let imageUrl = null;
  if (imageFile) {
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase
      .storage
      .from("flashcard-images")
      .upload(fileName, imageFile);

    if (uploadError) {
      return showStatus(uploadError.message);
    }

    const { data: urlData } = supabase
      .storage
      .from("flashcard-images")
      .getPublicUrl(fileName);
    imageUrl = urlData.publicUrl;
  }

  const { error: insertError } = await supabase.from("flashcards").insert({
    user_id: user.id,
    question,
    answer,
    image_url: imageUrl
  });

  if (insertError) {
    showStatus(insertError.message);
  } else {
    showStatus("Flashcard uploaded successfully!");
    e.target.reset();
  }
});

// Menu Toggle & Logout
const menuToggle = document.getElementById("menu-toggle");
const menuDropdown = document.getElementById("menu-dropdown");
const logoutBtn = document.getElementById("logout-btn");

menuToggle?.addEventListener("click", () => {
  menuDropdown.classList.toggle("visible");
  menuDropdown.classList.toggle("hidden");
});

logoutBtn?.addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "login.html";
});

// Helper
function showStatus(message) {
  statusMsg.textContent = message;
  statusMsg.style.opacity = 1;
  statusMsg.style.animation = "fadeIn 0.4s ease-in-out";
}
