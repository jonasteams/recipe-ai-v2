import React from 'react';
import type { Recipe } from '../types';
import { HeartIcon, FilledHeartIcon, ClockIcon, FireIcon, StarIcon } from './icons';

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
  isFavorite: boolean;
  onToggleFavorite: (recipeName: string) => void;
}

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=2080&auto=format&fit=crop';

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onClick, isFavorite, onToggleFavorite }) => {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event from firing
    onToggleFavorite(recipe.recipeName);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = PLACEHOLDER_IMAGE;
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-lg cursor-pointer transform hover:-translate-y-1 transition-all duration-300 group overflow-hidden flex flex-col"
    >
      <div className="relative">
        <img
          src={recipe.imageUrl || PLACEHOLDER_IMAGE}
          alt={recipe.recipeName}
          onError={handleImageError}
          className="w-full h-48 object-cover"
        />
        <button
          onClick={handleFavoriteClick}
          className="absolute top-2 right-2 p-2 bg-white/70 backdrop-blur-sm text-red-500 rounded-full hover:bg-white transition-colors"
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavorite ? <FilledHeartIcon className="w-6 h-6" /> : <HeartIcon className="w-6 h-6" />}
        </button>
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">{recipe.recipeName}</h3>
        <p className="text-sm text-gray-600 flex-grow line-clamp-3">{recipe.description}</p>
        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500 flex-wrap gap-x-4 gap-y-2">
            <div className="flex items-center gap-1">
                <ClockIcon className="w-4 h-4" />
                <span>{recipe.cookingTime}</span>
            </div>
             <div className="flex items-center gap-1">
                <FireIcon className="w-4 h-4" />
                <span>{recipe.nutrition.calories}</span>
            </div>
            <div className="flex items-center gap-1">
                <StarIcon className="w-4 h-4 text-yellow-500" />
                <span>{recipe.rating} / 5</span>
            </div>
        </div>
      </div>
    </div>
  );
};