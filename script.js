document.getElementById("submitBtn").addEventListener("click", async () => {
    const userInput = document.getElementById("userInput").value;
    const recipeOutput = document.getElementById("recipeOutput");
    const ingredientList = document.getElementById("ingredientList");
    const speechBubble = document.getElementById("speechBubble");

    // Clear previous outputs
    recipeOutput.textContent = "Loading your special recipe...";
    ingredientList.innerHTML = "";
    speechBubble.innerHTML = "<p>Grandma is thinking...</p>";

    // OpenAI API call
    const apiKey = "OPENAI_API_KEY"; // Replace with your API key
    const prompt = `You are a sweet, kind, caring grandma. Respond with a heartwarming message and provide a comforting cookie recipe based on: ${userInput}. Ensure the response includes the recipe name, ingredients, and recipe instructions clearly separated. Grandma's Message: An encouraging message. 
Find these: A name for the recipe, a list of ingredients for a matching cookie recipe, and clear instructions for the recipe.`;

    const apiUrl = "https://api.openai.com/v1/chat/completions";

    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }]
            })
        });

        if (response.ok) {
            const data = await response.json();
            const fullResponse = data.choices[0].message.content;

            // Split response into grandma's message, recipe name, ingredients, and instructions
            const [grandmaMessage, recipeName, ingredients, instructions] = fullResponse.split(/\n\n+/);

            speechBubble.innerHTML = `<p>${grandmaMessage}</p>`;

            // Display the recipe name before the instructions in the recipe output
            recipeOutput.innerHTML = `<h3>${recipeName}</h3><p>${instructions.trim()}</p>`;

            // Extract ingredients and display them as a list
            const ingredientArray = ingredients.split(/\n/).filter(line => line.trim() !== "");
            ingredientList.innerHTML = "";
            
            // Add the ingredients heading formatted like the recipe name
            ingredientList.innerHTML = "<h3>Ingredients</h3>"; // Heading for ingredients

            ingredientArray.forEach(ingredient => {
                const li = document.createElement("li");
                li.textContent = ingredient.replace(/^-+\s*/, ''); 
                ingredientList.appendChild(li);
            });
        } else {
            throw new Error("Failed to fetch recipe");
        }
    } catch (error) {
        recipeOutput.textContent = "Oh dear, I couldn't fetch a recipe right now. But there's always time for cookies!";
        speechBubble.innerHTML = "<p>Don't worry, sweetheart! Grandma will always be here for you!</p>";
    }
});
