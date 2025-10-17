import React, { useState, useMemo, useEffect } from 'react';
import type { Recipe, Language, CookMode } from '../types';
import { TRANSLATIONS } from '../constants';
import { BackArrowIcon, MinusIcon, PlusIcon, HeartIcon, FilledHeartIcon, ShareIcon, ClockIcon, StarIcon } from './icons';
import { regenerateRecipeImage } from '../services/geminiService';
import { Spinner } from './Spinner';

interface RecipeDetailProps {
  recipe: Recipe;
  onBack: () => void;
  language: Language;
  isFavorite: boolean;
  onToggleFavorite: (recipeName: string) => void;
  onUpdateRecipe: (updatedRecipe: Recipe) => void;
}

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=2080&auto=format&fit=crop';


export const RecipeDetail: React.FC<RecipeDetailProps> = ({ recipe, onBack, language, isFavorite, onToggleFavorite, onUpdateRecipe }) => {
  const [portions, setPortions] = useState(recipe.servings);
  const [cookMode, setCookMode] = useState<CookMode>('standard');
  const [showCopied, setShowCopied] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    // Reset image error state if recipe image changes (e.g., after successful regeneration)
    setImageError(false);
  }, [recipe.imageUrl]);


  const portionMultiplier = useMemo(() => portions / recipe.servings, [portions, recipe.servings]);

  const adjustedIngredients = useMemo(() => {
    return recipe.ingredients.map(ing => ({
      ...ing,
      quantity: parseFloat((ing.quantity * portionMultiplier).toFixed(2)),
    }));
  }, [recipe.ingredients, portionMultiplier]);
  
  const handleFavoriteClick = () => {
    onToggleFavorite(recipe.recipeName);
  };

  const handleShare = async () => {
    const shareData = {
      title: recipe.recipeName,
      text: `${recipe.description}\n\nCheck out this recipe on Recipe AI!`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      // Fallback to clipboard
      const ingredientsText = adjustedIngredients.map(ing => `- ${ing.quantity} ${ing.unit} ${ing.name}`).join('\n');
      const textToCopy = `${recipe.recipeName}\n\n${TRANSLATIONS[language].ingredients}:\n${ingredientsText}\n\n${recipe.description}\n\nCheck out this recipe on Recipe AI!`;
      navigator.clipboard.writeText(textToCopy).then(() => {
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2500);
      });
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleRegenerateImage = async () => {
    setIsRegenerating(true);
    try {
      const newImageUrl = await regenerateRecipeImage(recipe);
      onUpdateRecipe({ ...recipe, imageUrl: newImageUrl });
    } catch (error) {
      console.error("Failed to regenerate image:", error);
      setImageError(true);
    } finally {
      setIsRegenerating(false);
    }
  };

  const showRegenerateButton = !recipe.imageUrl || imageError;

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden relative">
        <div className="relative w-full h-64 sm:h-80 bg-gray-200">
            <button onClick={onBack} className="absolute top-4 left-4 flex items-center gap-2 z-20 bg-white/70 backdrop-blur-sm py-2 px-4 rounded-full text-gray-800 hover:bg-white font-semibold transition-colors">
                <BackArrowIcon />
                {TRANSLATIONS[language].backButton}
            </button>
            <img
                src={showRegenerateButton ? PLACEHOLDER_IMAGE : recipe.imageUrl}
                alt={recipe.recipeName}
                onError={handleImageError}
                className="w-full h-full object-cover"
            />
             {showRegenerateButton && (
                <div className="absolute inset-0 flex justify-center items-center bg-black bg-opacity-40">
                    <button
                        onClick={handleRegenerateImage}
                        disabled={isRegenerating}
                        className="flex items-center gap-2 bg-orange-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-orange-600 transition-colors disabled:bg-gray-400 disabled:cursor-wait"
                    >
                        {isRegenerating ? (
                            <>
                                <Spinner />
                                {TRANSLATIONS[language].regenerating}
                            </>
                        ) : (
                            TRANSLATIONS[language].regenerateImage
                        )}
                    </button>
                </div>
            )}
        </div>
      <div className="p-6 sm:p-8">
        <div className="mb-8">
          <div className="flex justify-between items-start gap-4 flex-wrap">
              <h1 className="text-4xl font-bold text-gray-800 mb-2 flex-1 min-w-[200px]">{recipe.recipeName}</h1>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 py-2 px-4 rounded-full text-sm font-semibold transition-colors border hover:bg-gray-100 text-gray-600"
                  aria-label={TRANSLATIONS[language].shareRecipe}
                >
                  <ShareIcon className="w-5 h-5"/>
                  <span>{TRANSLATIONS[language].share}</span>
                </button>
                <button
                  onClick={handleFavoriteClick}
                  className="flex items-center gap-2 py-2 px-4 rounded-full text-sm font-semibold transition-colors border hover:bg-gray-100"
                  aria-label={isFavorite ? TRANSLATIONS[language].removeFromFavorites : TRANSLATIONS[language].addToFavorites}
                >
                  {isFavorite
                    ? <FilledHeartIcon className="w-5 h-5 text-red-500" />
                    : <HeartIcon className="w-5 h-5 text-gray-600" />}
                  <span className={isFavorite ? 'text-red-500' : 'text-gray-600'}>{TRANSLATIONS[language].favorites}</span>
                </button>
              </div>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className={`w-6 h-6 ${i < recipe.rating ? 'text-yellow-500' : 'text-gray-300'}`} />
                ))}
            </div>
            <span className="text-gray-600 font-semibold">{recipe.rating.toFixed(1)} / 5</span>
          </div>
          <p className="text-gray-600">{recipe.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Ingredients Section */}
          <div className="md:col-span-1 bg-orange-50 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4 text-orange-800">{TRANSLATIONS[language].ingredients}</h2>
            <div className="space-y-4 mb-4 pb-4 border-b">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700 flex items-center gap-2">
                    <ClockIcon className="w-5 h-5 text-orange-700"/>
                    {TRANSLATIONS[language].cookingTime}
                  </span>
                  <span className="font-bold text-lg text-gray-800">{recipe.cookingTime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">{TRANSLATIONS[language].servings}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPortions(p => Math.max(1, p - 1))} className="p-1 rounded-full bg-orange-200 text-orange-800 hover:bg-orange-300 transition"><MinusIcon /></button>
                    <span className="w-8 text-center font-bold text-lg">{portions}</span>
                    <button onClick={() => setPortions(p => p + 1)} className="p-1 rounded-full bg-orange-200 text-orange-800 hover:bg-orange-300 transition"><PlusIcon /></button>
                  </div>
                </div>
            </div>
            <ul className="space-y-2">
              {adjustedIngredients.map((ing, i) => (
                <li key={i} className="flex justify-between">
                  <span className="flex-1 text-gray-700">{ing.name}</span>
                  <span className="text-gray-900 font-medium">{ing.quantity} {ing.unit}</span>
                </li>
              ))}
            </ul>

            {/* Nutrition Section */}
            <div className="mt-6 pt-4 border-t">
              <h3 className="text-xl font-semibold mb-3 text-orange-800">{TRANSLATIONS[language].nutrition}</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between items-center">
                  <span className="text-gray-600">{TRANSLATIONS[language].calories}</span>
                  <span className="font-medium text-gray-800">{recipe.nutrition.calories}</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-gray-600">{TRANSLATIONS[language].protein}</span>
                  <span className="font-medium text-gray-800">{recipe.nutrition.protein}</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-gray-600">{TRANSLATIONS[language].carbs}</span>
                  <span className="font-medium text-gray-800">{recipe.nutrition.carbs}</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-gray-600">{TRANSLATIONS[language].fat}</span>
                  <span className="font-medium text-gray-800">{recipe.nutrition.fat}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Instructions Section */}
          <div className="md:col-span-2">
            <div className="flex border-b mb-4">
              <button
                onClick={() => setCookMode('standard')}
                className={`py-2 px-4 font-semibold transition-colors ${cookMode === 'standard' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-gray-500 hover:text-orange-600'}`}
              >
                {TRANSLATIONS[language].standardCook}
              </button>
              <button
                onClick={() => setCookMode('thermomix')}
                className={`py-2 px-4 font-semibold transition-colors ${cookMode === 'thermomix' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-gray-500 hover:text-orange-600'}`}
              >
                {TRANSLATIONS[language].thermomixCook}
              </button>
            </div>
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">{TRANSLATIONS[language].instructions}</h2>
              <ol className="space-y-4 list-decimal list-inside text-gray-700 marker:text-orange-600 marker:font-bold">
                {(cookMode === 'standard' ? recipe.standardInstructions : recipe.thermomixInstructions).map((step, i) => (
                  <li key={i} className="pl-2">{step}</li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
       {showCopied && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white py-2 px-4 rounded-full text-sm z-20 animate-fade-in-out">
          {TRANSLATIONS[language].copiedToClipboard}
        </div>
      )}
    </div>
  );
};