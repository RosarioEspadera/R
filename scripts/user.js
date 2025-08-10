import { supabase } from "./supabase.js";
import { initTheme } from "./theme.js";
initTheme();

const menuToggle = document.getElementById("menu-toggle");
const menuDropdown = document.getElementById("menu-dropdown");
const logoutBtn = document.getElementById("logout-btn");

// Toggle menu visibility
menuToggle.addEventListener("click", () => {
  const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
  menuDropdown.classList.toggle("hidden");
  menuToggle.setAttribute("aria-expanded", String(!isExpanded));
});

// Close menu when clicking outside
document.addEventListener("click", (e) => {
  if (!menuDropdown.contains(e.target) && e.target !== menuToggle) {
    menuDropdown.classList.add("hidden");
    menuToggle.setAttribute("aria-expanded", "false");
  }
});

// Logout logic
logoutBtn.addEventListener("click", async () => {
  const confirmed = confirm("Are you sure you want to log out?");
  if (!confirmed) return;

  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Logout failed:", error.message);
    return;
  }

  window.location.href = "login.html";
});


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

saveSetBtn.addEventListener("click", () => {
  if (!setSelector.value) {
    // Visual cue
    setSelector.classList.add("warning");

    // Optional toast-style feedback
    showToast("⚠️ Please select a flashcard set before saving changes.");

    setSelector.focus();

    // Remove visual cue after a moment
    setTimeout(() => setSelector.classList.remove("warning"), 1500);
    return;
  }

  // Proceed with saving logic if needed
});

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("visible");
  }, 10);

  setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

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
  cards.forEach(card => {
    const cardEl = Flashcard({
      id: card.id,
      question: card.question,
      answer: card.answer,
      onDelete: async (id) => {
        const { error } = await supabase.from("flashcards").delete().eq("id", id);
        if (error) console.error("Failed to delete card:", error.message);
      },
      onSave: async ({ id, question, answer }) => {
        if (!question || !answer) return;
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return;

        if (id) {
          await supabase.from("flashcards").update({ question, answer }).eq("id", id);
        } else {
          await supabase.from("flashcards").insert([
            { user_id: user.id, set_id: currentSetId, question, answer }
          ]);
        }
      }
    });
    flashcardList.appendChild(cardEl);
  });

  flashcardModal.classList.remove("hidden");
});



// 🧱 Render a Card Row
function Flashcard({ id = "", question = "", answer = "", onDelete, onSave }) {
  const cardEl = document.createElement("div");
  cardEl.className = "flashcard";
  cardEl.dataset.id = id;

 cardEl.innerHTML = `
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <textarea placeholder="Question">${question}</textarea>
    </div>
    <div class="flashcard-back">
      <textarea placeholder="Answer">${answer}</textarea>
    </div>
  </div>
  <div class="save-indicator">💾</div>
  <div class="card-actions">
    <button class="flip-btn">🔄 Flip</button>
    <button class="delete-card-btn">🗑️</button>
  </div>
`;
  
cardEl.querySelectorAll('textarea').forEach(area => {
  area.addEventListener('input', () => {
    area.style.height = 'auto';
    area.style.height = area.scrollHeight + 'px';
  });
});

  const inner = cardEl.querySelector(".flashcard-inner");
  const flipBtn = cardEl.querySelector(".flip-btn");
  const deleteBtn = cardEl.querySelector(".delete-card-btn");
  const questionInput = cardEl.querySelector(".flashcard-front textarea");
  const answerInput = cardEl.querySelector(".flashcard-back textarea");
  const saveIndicator = cardEl.querySelector(".save-indicator");

  flipBtn.addEventListener("click", () => {
    inner.classList.toggle("flipped");
  });

  deleteBtn.addEventListener("click", () => {
    cardEl.remove();
    if (onDelete) onDelete(id);
  });

  function showSaveIndicator() {
    saveIndicator.classList.add("visible");
    cardEl.classList.add("saved");
    setTimeout(() => {
      saveIndicator.classList.remove("visible");
      cardEl.classList.remove("saved");
    }, 800);
  }

  let saveTimeout;
  [questionInput, answerInput].forEach(input => {
    input.addEventListener("input", () => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        const updated = {
          id,
          question: questionInput.value.trim(),
          answer: answerInput.value.trim()
        };
        if (onSave) {
          showSaveIndicator();
          onSave(updated);
        }
      }, 500);
    });
  });

  return cardEl;
}

// ➕ Add New Blank Card
addCardBtn.addEventListener("click", () => {
  const cardEl = Flashcard({
    onSave: async ({ question, answer }) => {
      if (!question || !answer) return;
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return;

      await supabase.from("flashcards").insert([
        { user_id: user.id, set_id: currentSetId, question, answer }
      ]);
    }
  });
  flashcardList.appendChild(cardEl);
});

// 🔄 Initialize
loadSets();
