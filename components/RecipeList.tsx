import React from 'react';
import { RecipeCard } from './RecipeCard';
import type { Recipe, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface RecipeListProps {
  recipes: Recipe[];
  onSelectRecipe: (recipe: Recipe) => void;
  language: Language;
  favorites: string[];
  onToggleFavorite: (recipeName: string) => void;
  filter: 'all' | 'favorites';
}

export const RecipeList: React.FC<RecipeListProps> = ({ recipes, onSelectRecipe, language, favorites, onToggleFavorite, filter }) => {
  if (recipes.length === 0) {
    const message = filter === 'favorites'
      ? TRANSLATIONS[language].noFavorites
      : TRANSLATIONS[language].noRecipes;
    return (
      <div className="text-center py-16 text-gray-500 max-w-md mx-auto">
        <p>{message}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
      {recipes.map((recipe, index) => (
        <RecipeCard
          key={`${recipe.recipeName}-${index}`}
          recipe={recipe}
          onClick={() => onSelectRecipe(recipe)}
          isFavorite={favorites.includes(recipe.recipeName)}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
};
