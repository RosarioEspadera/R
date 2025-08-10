import { supabase } from "./supabase.js";

const setForm = document.getElementById("set-form");
const setNameInput = document.getElementById("set-name");
const setSelector = document.getElementById("set-selector");
const editSetBtn = document.getElementById("edit-set-btn");
const deleteSetBtn = document.getElementById("delete-set-btn");
const createSetBtn = document.getElementById("create-set-btn");
const setsContainer = document.getElementById("sets-container");

const flashcardModal = document.getElementById("flashcard-modal");
const flashcardList = document.getElementById("flashcard-list");
const addCardBtn = document.getElementById("add-card-btn");
const saveSetBtn = document.getElementById("save-set-btn");

let currentSetId = null;

// 🧩 Load Sets into Dropdown
async function loadSets() {
  const { data: sets, error } = await supabase.from("flashcard_sets").select("*");
  setSelector.innerHTML = `<option value="">Select a set</option>`;
  if (error) {
    console.error("Failed to load sets:", error.message);
    return;
  }

  sets.forEach(set => {
    const option = document.createElement("option");
    option.value = set.id;
    option.textContent = set.name;
    setSelector.appendChild(option);
  });
}

// ➕ Create New Set
setForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = setNameInput.value.trim();
  if (!name) return;

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error("User not authenticated:", authError?.message);
    return;
  }

  const { error } = await supabase.from("flashcard_sets").insert([
    {
      user_id: user.id,
      name
    }
  ]);

  if (error) {
    console.error("Failed to create set:", error.message);
    return;
  }

  setForm.reset();
  loadSets();
});

// ✏️ Edit Set Name
editSetBtn.addEventListener("click", async () => {
  const newName = prompt("Enter new name for the set:");
  if (!newName || !setSelector.value) return;

  const { error } = await supabase.from("flashcard_sets")
    .update({ name: newName })
    .eq("id", setSelector.value);

  if (error) {
    console.error("Failed to update set name:", error.message);
    return;
  }

  loadSets();
});

// 🗑️ Delete Set
deleteSetBtn.addEventListener("click", async () => {
  if (!setSelector.value || !confirm("Delete this set and all its cards?")) return;

  const { error: cardError } = await supabase.from("flashcards").delete().eq("set_id", setSelector.value);
  const { error: setError } = await supabase.from("flashcard_sets").delete().eq("id", setSelector.value);

  if (cardError || setError) {
    console.error("Failed to delete set or cards:", cardError?.message || setError?.message);
    return;
  }

  loadSets();
  flashcardList.innerHTML = "";
  flashcardModal.classList.add("hidden");
});

// ➕ New Set Shortcut
createSetBtn.addEventListener("click", () => {
  setNameInput.focus();
});

// 🃏 Load Cards for Selected Set
setSelector.addEventListener("change", async () => {
  currentSetId = setSelector.value;
  if (!currentSetId) return;

  const { data: cards, error } = await supabase
    .from("flashcards")
    .select("*")
    .eq("set_id", currentSetId);

  if (error) {
    console.error("Failed to load cards:", error.message);
    return;
  }

  flashcardList.innerHTML = "";
  cards.forEach(card => renderCard(card));
  flashcardModal.classList.remove("hidden");
});

// 🧱 Render a Card Row
function renderCard(card = {}) {
  const cardEl = document.createElement("div");
  cardEl.className = "card-row";
  cardEl.innerHTML = `
    <input type="text" placeholder="Question" value="${card.question || ""}" />
    <input type="text" placeholder="Answer" value="${card.answer || ""}" />
    <button class="delete-card-btn">🗑️</button>
  `;
  cardEl.dataset.id = card.id || "";
  flashcardList.appendChild(cardEl);

  cardEl.querySelector(".delete-card-btn").addEventListener("click", () => {
    cardEl.remove();
  });
}

// ➕ Add New Blank Card
addCardBtn.addEventListener("click", () => {
  renderCard();
});

// 💾 Save All Cards
saveSetBtn.addEventListener("click", async () => {
  const cardEls = flashcardList.querySelectorAll(".card-row");
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error("User not authenticated:", authError?.message);
    return;
  }

  for (const el of cardEls) {
    const question = el.querySelector("input[placeholder='Question']").value.trim();
    const answer = el.querySelector("input[placeholder='Answer']").value.trim();
    const id = el.dataset.id;

    if (!question || !answer) continue;

    if (id) {
      const { error } = await supabase.from("flashcards").update({ question, answer }).eq("id", id);
      if (error) console.error("Failed to update card:", error.message);
    } else {
      const { error } = await supabase.from("flashcards").insert([
        {
          user_id: user.id,
          set_id: currentSetId,
          question,
          answer
        }
      ]);
      if (error) console.error("Failed to insert card:", error.message);
    }
  }

  setSelector.dispatchEvent(new Event("change")); // Reload cards
});

// 🔄 Initialize
loadSets();
