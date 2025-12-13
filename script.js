document.getElementById("submitBtn").addEventListener("click", async () => {
  const userInput = document.getElementById("userInput").value.trim();
  const recipeOutput = document.getElementById("recipeOutput");
  const ingredientList = document.getElementById("ingredientList");
  const speechBubble = document.getElementById("speechBubble");

  if (!userInput) {
    recipeOutput.textContent = "Please tell Grandma how you're feeling 💛";
    return;
  }

  recipeOutput.textContent = "Loading your special recipe...";
  ingredientList.innerHTML = "";
  speechBubble.innerHTML = "<p>Grandma is thinking...</p>";

  const apiKey = "OPENAPI_KEY_HERE";
  const apiUrl = "https://api.openai.com/v1/responses";

  const prompt = `
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

  // Safely pull text from different possible Responses API shapes
  function extractText(data) {
    // Common convenience field (sometimes present)
    if (typeof data.output_text === "string" && data.output_text.trim()) {
      return data.output_text;
    }

    // Typical structured output: output: [{ content: [{ type: "output_text", text: "..." }, ...] }]
    const outArr = Array.isArray(data.output) ? data.output : [];
    let textParts = [];

    for (const item of outArr) {
      const contentArr = Array.isArray(item.content) ? item.content : [];
      for (const c of contentArr) {
        if (c && typeof c.text === "string") textParts.push(c.text);
        if (c && typeof c.output_text === "string") textParts.push(c.output_text);
      }
    }

    const joined = textParts.join("\n").trim();
    return joined || "";
  }

  function getSection(fullText, label) {
    if (!fullText) return "";
    const re = new RegExp(`${label}:([\\s\\S]*?)(?=\\n[A-Z_]+:|$)`);
    const m = fullText.match(re);
    return m ? m[1].trim() : "";
  }

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: prompt,
      }),
    });

    const rawText = await response.text();
    console.log("STATUS:", response.status);
    console.log("RAW RESPONSE:", rawText);

    if (!response.ok) {
      // Show readable API error on page
      let msg = rawText;
      try {
        const errJson = JSON.parse(rawText);
        msg = errJson?.error?.message || msg;
      } catch {}
      recipeOutput.textContent = `Error ${response.status}: ${msg}`;
      speechBubble.innerHTML = "<p>Grandma ran into a problem — check console 💛</p>";
      return;
    }

    // Parse JSON response
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      recipeOutput.textContent = "Got a response, but it wasn't valid JSON.";
      console.error("JSON parse failed:", e);
      return;
    }

    const fullText = extractText(data);
    if (!fullText) {
      recipeOutput.textContent =
        "I got a response, but couldn't find text in it. Check console output.";
      console.log("PARSED JSON:", data);
      return;
    }

    const grandmaMessage = getSection(fullText, "GRANDMA_MESSAGE") || "Grandma sends you a big hug 💛";
    const recipeName = getSection(fullText, "RECIPE_NAME") || "Grandma's Comfort Cookies";
    const ingredients = getSection(fullText, "INGREDIENTS") || "- Flour\n- Sugar\n- Butter\n- Chocolate chips";
    const instructions = getSection(fullText, "INSTRUCTIONS") || "1) Mix.\n2) Bake.\n3) Enjoy.";

    // Display
    speechBubble.innerHTML = `<p>${grandmaMessage}</p>`;
    recipeOutput.innerHTML = `<h3>${recipeName}</h3><p>${instructions.replace(/\n/g, "<br>")}</p>`;

    ingredientList.innerHTML = "<h3>Ingredients</h3>";
    ingredients
      .split("\n")
      .map(s => s.trim())
      .filter(Boolean)
      .forEach(line => {
        const li = document.createElement("li");
        li.textContent = line.replace(/^[-•]\s*/, "");
        ingredientList.appendChild(li);
      });

  } catch (err) {
    console.error("FETCH FAILED:", err);
    recipeOutput.textContent = `Fetch failed: ${err.message}`;
    speechBubble.innerHTML = "<p>Grandma couldn't reach the oven (network issue) 💛</p>";
  }
});
