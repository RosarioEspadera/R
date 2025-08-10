import { supabase } from "./supabase.js";

document.getElementById("flashcard-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const question = document.getElementById("question").value;
  const answer = document.getElementById("answer").value;
  const imageFile = document.getElementById("image").files[0];
  const statusMsg = document.getElementById("statusMsg");

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    statusMsg.textContent = "Authentication required.";
    return;
  }

  let imageUrl = null;
  if (imageFile) {
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from("flashcard-images")
      .upload(fileName, imageFile);

    if (uploadError) {
      statusMsg.textContent = uploadError.message;
      return;
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
    statusMsg.textContent = insertError.message;
  } else {
    statusMsg.textContent = "Flashcard uploaded successfully!";
    e.target.reset();
  }
});
