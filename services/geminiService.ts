import { GoogleGenAI, Type, Modality } from '@google/genai';
import type { Recipe, Language } from '../types';
import { GEMINI_MODEL } from '../constants';

// Schema for nutrition data
const nutritionSchema = {
    type: Type.OBJECT,
    properties: {
        calories: { type: Type.STRING, description: 'Estimated calories, e.g., "450 kcal".' },
        protein: { type: Type.STRING, description: 'Estimated protein in grams, e.g., "25 g".' },
        carbs: { type: Type.STRING, description: 'Estimated carbohydrates in grams, e.g., "50 g".' },
        fat: { type: Type.STRING, description: 'Estimated fat in grams, e.g., "15 g".' },
    },
    required: ['calories', 'protein', 'carbs', 'fat'],
};

// Schema for the recipe data (text only)
const recipeDataSchema = {
  type: Type.OBJECT,
  properties: {
    recipeName: { type: Type.STRING, description: 'The name of the recipe.' },
    description: { type: Type.STRING, description: 'A short, appealing description of the dish.' },
    servings: { type: Type.INTEGER, description: 'The default number of people this recipe serves.' },
    cookingTime: { type: Type.STRING, description: 'The total estimated cooking time, e.g., "45 minutes" or "1 hour 20 minutes".' },
    rating: { type: Type.INTEGER, description: 'A rating for the recipe on a scale of 1 to 5.' },
    nutrition: nutritionSchema,
    ingredients: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          quantity: { type: Type.NUMBER },
          unit: { type: Type.STRING, description: 'e.g., grams, ml, tsp, cup' },
        },
        required: ['name', 'quantity', 'unit'],
      },
    },
    standardInstructions: {
      type: Type.ARRAY,
      description: 'Step-by-step cooking instructions for a standard kitchen.',
      items: { type: Type.STRING },
    },
    thermomixInstructions: {
      type: Type.ARRAY,
      description: 'Step-by-step cooking instructions specifically for a Thermomix machine.',
      items: { type: Type.STRING },
    },
  },
  required: ['recipeName', 'description', 'servings', 'cookingTime', 'rating', 'nutrition', 'ingredients', 'standardInstructions', 'thermomixInstructions'],
};

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    recipes: {
      type: Type.ARRAY,
      items: recipeDataSchema,
    },
  },
};

const generateImageForRecipeWithRetry = async (
  recipe: Omit<Recipe, 'imageUrl'>,
  retries = 3
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const imagePrompt = `A delicious and realistic photo of "${recipe.recipeName}". Style: professional food photography, appetizing, high-quality, like photos seen on Pixabay, Unsplash, or Wikimedia Commons. Description for context: ${recipe.description}`;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: imagePrompt }],
        },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64ImageBytes: string = part.inlineData.data;
          return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
        }
      }
      throw new Error('Image data not found in Gemini response.');
    } catch (error) {
      console.error(`Attempt ${i + 1} failed for generating image for ${recipe.recipeName}:`, error);
      if (i === retries - 1) {
        throw error;
      }
    }
  }
  throw new Error(`Failed to generate image for ${recipe.recipeName} after ${retries} attempts.`);
};


export const regenerateRecipeImage = async (recipe: Omit<Recipe, 'imageUrl'>): Promise<string> => {
    try {
        return await generateImageForRecipeWithRetry(recipe, 1);
    } catch (error) {
        console.error('Error regenerating image:', error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('An unknown error occurred while regenerating the image.');
    }
};


export const fetchRecipes = async (prompt: string, language: Language): Promise<Recipe[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Step 1: Get the text data for all recipes
    const systemInstruction = `You are an expert recipe assistant. Generate recipes in ${language}. Ensure the output strictly follows the provided JSON schema. Do not include markdown formatting like \`\`\`json in your response.`;
    
    const textResponse = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
        temperature: 0.7,
      },
    });

    const jsonText = textResponse.text.trim();
    const parsedData = JSON.parse(jsonText);

    if (!parsedData || !Array.isArray(parsedData.recipes)) {
      console.error("Parsed data is not in the expected format:", parsedData);
      throw new Error("Failed to parse recipes from API response.");
    }
    
    const recipesData: Omit<Recipe, 'imageUrl'>[] = parsedData.recipes;
    
    if (recipesData.length === 0) {
        return [];
    }

    // Step 2: Generate an image for each recipe in parallel
    const imagePromises = recipesData.map(recipe =>
        generateImageForRecipeWithRetry(recipe)
            .catch(e => {
                console.error(`Failed to generate image for ${recipe.recipeName}, will use placeholder.`, e);
                return ''; // Return empty string on failure
            })
    );

    const imageUrls = await Promise.all(imagePromises);

    const recipesWithImages: Recipe[] = recipesData.map((recipe, index) => ({
        ...recipe,
        imageUrl: imageUrls[index],
    }));

    return recipesWithImages;

  } catch (error) {
    console.error('Error fetching recipes:', error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error('An unknown error occurred while fetching recipes.');
  }
};