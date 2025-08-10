import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://dtrjethplowazsxzhnwn.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0cmpldGhwbG93YXpzeHpobnduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4MDc0MjgsImV4cCI6MjA3MDM4MzQyOH0.pCaRVB8lmipBGwEqBjeGlLbTxE2_IcvYw2yQ15qmxfo"
);


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
  if (error) return console.error("Failed to load sets:", error.message);

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
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from("flashcard_sets").insert({
    user_id: user.id,
    name
  });

  if (!error) {
    setForm.reset();
    loadSets();
  }
});

// ✏️ Edit Set Name
editSetBtn.addEventListener("click", async () => {
  const newName = prompt("Enter new name for the set:");
  if (!newName || !setSelector.value) return;

  await supabase.from("flashcard_sets")
    .update({ name: newName })
    .eq("id", setSelector.value);

  loadSets();
});

// 🗑️ Delete Set
deleteSetBtn.addEventListener("click", async () => {
  if (!setSelector.value || !confirm("Delete this set and all its cards?")) return;

  await supabase.from("flashcards").delete().eq("set_id", setSelector.value);
  await supabase.from("flashcard_sets").delete().eq("id", setSelector.value);

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

  const { data: cards } = await supabase
    .from("flashcards")
    .select("*")
    .eq("set_id", currentSetId);

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

  for (const el of cardEls) {
    const question = el.querySelector("input[placeholder='Question']").value.trim();
    const answer = el.querySelector("input[placeholder='Answer']").value.trim();
    const id = el.dataset.id;

    if (!question || !answer) continue;

    if (id) {
      await supabase.from("flashcards").update({ question, answer }).eq("id", id);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("flashcards").insert({
        user_id: user.id,
        set_id: currentSetId,
        question,
        answer
      });
    }
  }

  setSelector.dispatchEvent(new Event("change")); // Reload cards
});

// 🔄 Initialize
loadSets();
