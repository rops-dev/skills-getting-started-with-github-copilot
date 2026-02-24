document.addEventListener("DOMContentLoaded", async () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();

  // ---- Calorie Calculator ----
  let ingredientOptions = [];

  async function fetchIngredients() {
    try {
      const response = await fetch("/ingredients");
      const data = await response.json();
      ingredientOptions = Object.entries(data).map(([name, cals]) => ({ name, cals }));
    } catch (error) {
      console.error("Error fetching ingredients:", error);
    }
  }

  function createMealRow() {
    const row = document.createElement("div");
    row.className = "meal-row";

    const select = document.createElement("select");
    select.className = "meal-ingredient-select";
    select.innerHTML = `<option value="">-- Select ingredient --</option>` +
      ingredientOptions.map(i => `<option value="${i.name}">${i.name} (${i.cals} kcal/100g)</option>`).join("");

    const gramsInput = document.createElement("input");
    gramsInput.type = "number";
    gramsInput.className = "meal-grams-input";
    gramsInput.placeholder = "Grams";
    gramsInput.min = "0";

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.textContent = "✕";
    removeBtn.className = "remove-meal-row-btn";
    removeBtn.addEventListener("click", () => row.remove());

    row.appendChild(select);
    row.appendChild(gramsInput);
    row.appendChild(removeBtn);
    return row;
  }

  const mealItemsDiv = document.getElementById("meal-items");
  const addIngredientBtn = document.getElementById("add-ingredient-btn");
  const calculateBtn = document.getElementById("calculate-btn");
  const caloriesResult = document.getElementById("calories-result");
  const addIngredientForm = document.getElementById("add-ingredient-form");
  const addIngredientMessage = document.getElementById("add-ingredient-message");

  addIngredientBtn.addEventListener("click", () => {
    mealItemsDiv.appendChild(createMealRow());
  });

  calculateBtn.addEventListener("click", async () => {
    const rows = mealItemsDiv.querySelectorAll(".meal-row");
    const meal = [];
    for (const row of rows) {
      const ingredient = row.querySelector(".meal-ingredient-select").value;
      const grams = parseFloat(row.querySelector(".meal-grams-input").value);
      if (ingredient && grams > 0) {
        meal.push({ ingredient, grams });
      }
    }
    if (meal.length === 0) {
      caloriesResult.textContent = "Please add at least one ingredient with a valid gram amount.";
      caloriesResult.className = "error";
      caloriesResult.classList.remove("hidden");
      return;
    }
    try {
      const response = await fetch("/calories/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(meal),
      });
      const result = await response.json();
      if (response.ok) {
        const lines = result.breakdown.map(
          b => `${b.ingredient}: ${b.grams}g = ${b.calories} kcal`
        );
        caloriesResult.innerHTML =
          lines.join("<br>") + `<br><strong>Total: ${result.total_calories} kcal</strong>`;
        caloriesResult.className = "success";
      } else {
        caloriesResult.textContent = result.detail || "Error calculating calories.";
        caloriesResult.className = "error";
      }
      caloriesResult.classList.remove("hidden");
    } catch (error) {
      caloriesResult.textContent = "Failed to calculate calories. Please try again.";
      caloriesResult.className = "error";
      caloriesResult.classList.remove("hidden");
      console.error("Error calculating calories:", error);
    }
  });

  addIngredientForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = document.getElementById("new-ingredient-name").value.trim();
    const calories = parseInt(document.getElementById("new-ingredient-calories").value, 10);
    try {
      const response = await fetch("/ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, calories_per_100g: calories }),
      });
      const result = await response.json();
      if (response.ok) {
        addIngredientMessage.textContent = result.message;
        addIngredientMessage.className = "success";
        addIngredientForm.reset();
        await fetchIngredients();
      } else {
        addIngredientMessage.textContent = result.detail || "Error adding ingredient.";
        addIngredientMessage.className = "error";
      }
      addIngredientMessage.classList.remove("hidden");
      setTimeout(() => addIngredientMessage.classList.add("hidden"), 5000);
    } catch (error) {
      addIngredientMessage.textContent = "Failed to add ingredient.";
      addIngredientMessage.className = "error";
      addIngredientMessage.classList.remove("hidden");
      console.error("Error adding ingredient:", error);
    }
  });

  await fetchIngredients();
  // Add a default empty row to start
  mealItemsDiv.appendChild(createMealRow());
});
