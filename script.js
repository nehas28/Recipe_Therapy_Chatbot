document.getElementById("submitBtn").addEventListener("click", async () => {
  const userInput = document.getElementById("userInput").value.trim();
  const recipeOutput = document.getElementById("recipeOutput");
  const ingredientList = document.getElementById("ingredientList");
  const speechBubble = document.getElementById("speechBubble");

  if (!userInput) {
    recipeOutput.textContent = "Please tell Grandma how you're feeling 💛";
    return;
  }

  // Reset UI
  recipeOutput.textContent = "Loading your special recipe...";
  ingredientList.innerHTML = "";
  speechBubble.innerHTML = "<p>Grandma is thinking...</p>";

  // 🔒 API key intentionally omitted (add locally only)
  const apiKey = "OPENAI_API_KEY"; 
  const apiUrl = "https://api.openai.com/v1/responses";

  const prompt = `
You are a sweet, kind, caring grandma. 
The user tells you how they are feeling.
Your job is to offer emotional comfort AND suggest ONE comforting recipe.

IMPORTANT CONTEXT:
Your main goal is emotional comfort.
Choose recipes that feel cozy and reassuring.

If the user mentions exams, deadlines, or being very busy,
PREFER quicker and lower-effort recipes (around 15 minutes),
but you may still suggest slightly longer cozy recipes
if they clearly add emotional comfort.

Avoid overly complex or exhausting meals when the user is stressed.



Return EXACTLY in this format:

GRANDMA_MESSAGE:
...

RECIPE_NAME:
...

INGREDIENTS:
- ...
- ...

INSTRUCTIONS:
1) ...
2) ...

User feeling: ${userInput}
`;

  // Safely extract text from Responses API
  function extractText(data) {
    if (typeof data.output_text === "string" && data.output_text.trim()) {
      return data.output_text;
    }

    const outArr = Array.isArray(data.output) ? data.output : [];
    let textParts = [];

    for (const item of outArr) {
      const contentArr = Array.isArray(item.content) ? item.content : [];
      for (const c of contentArr) {
        if (typeof c?.text === "string") textParts.push(c.text);
        if (typeof c?.output_text === "string") textParts.push(c.output_text);
      }
    }

    return textParts.join("\n").trim();
  }

  function getSection(text, label) {
    if (!text) return "";
    const re = new RegExp(`${label}:([\\s\\S]*?)(?=\\n[A-Z_]+:|$)`);
    const match = text.match(re);
    return match ? match[1].trim() : "";
  }

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: prompt
      })
    });

    const rawText = await response.text();
    console.log("STATUS:", response.status);
    console.log("RAW RESPONSE:", rawText);

    if (!response.ok) {
      let msg = rawText;
      try {
        const errJson = JSON.parse(rawText);
        msg = errJson?.error?.message || msg;
      } catch {}
      recipeOutput.textContent = `Error ${response.status}: ${msg}`;
      speechBubble.innerHTML = "<p>Grandma ran into a problem 💛</p>";
      return;
    }

    const data = JSON.parse(rawText);
    const fullText = extractText(data);

    if (!fullText) {
      recipeOutput.textContent =
        "Grandma responded, but the message was empty.";
      return;
    }

    const grandmaMessage =
      getSection(fullText, "GRANDMA_MESSAGE") || "Grandma sends you a warm hug 💛";
    const recipeName =
      getSection(fullText, "RECIPE_NAME") || "Grandma's Comfort Recipe";
    const ingredients =
      getSection(fullText, "INGREDIENTS") || "- (No ingredients provided)";
    const instructions =
      getSection(fullText, "INSTRUCTIONS") || "1) (No instructions provided)";

    // Display output
    speechBubble.innerHTML = `<p>${grandmaMessage}</p>`;
    recipeOutput.innerHTML = `<h3>${recipeName}</h3><p>${instructions.replace(/\n/g, "<br>")}</p>`;

    ingredientList.innerHTML = "<h3>Ingredients</h3>";
    ingredients
      .split("\n")
      .map(line => line.trim())
      .filter(Boolean)
      .forEach(item => {
        const li = document.createElement("li");
        li.textContent = item.replace(/^[-•]\s*/, "");
        ingredientList.appendChild(li);
      });

  } catch (err) {
    console.error("FETCH FAILED:", err);
    recipeOutput.textContent = `Fetch failed: ${err.message}`;
    speechBubble.innerHTML =
      "<p>Grandma couldn't reach the kitchen right now 💛</p>";
  }
});
