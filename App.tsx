import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { RecipeList } from './components/RecipeList';
import { RecipeDetail } from './components/RecipeDetail';
import { Spinner } from './components/Spinner';
import { SearchBar } from './components/SearchBar';
import type { Recipe, Language } from './types';
import { fetchRecipes as fetchRecipesFromApi } from './services/geminiService';
import { TRANSLATIONS } from './constants';

const FAVORITES_KEY = 'recipe-ai-favorites';

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('en');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (recipeName: string) => {
    setFavorites(prev =>
      prev.includes(recipeName)
        ? prev.filter(name => name !== recipeName)
        : [...prev, recipeName]
    );
  };

  const fetchRecipes = useCallback(async (searchTerm: string = '') => {
    setIsLoading(true);
    setError(null);
    if (!searchTerm) {
      setSelectedRecipe(null);
    }
    try {
      const prompt = searchTerm
        ? TRANSLATIONS[language].searchPrompt(searchTerm)
        : TRANSLATIONS[language].initialPrompt;
      const fetchedRecipes = await fetchRecipesFromApi(prompt, language);
      setRecipes(fetchedRecipes);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      setRecipes([]);
    } finally {
      setIsLoading(false);
    }
  }, [language]);

  useEffect(() => {
    fetchRecipes();
  }, [language, fetchRecipes]);

  const handleSearch = (searchTerm: string) => {
    setFilter('all');
    fetchRecipes(searchTerm);
  };
  
  const handleLogoClick = () => {
    setFilter('all');
    setSelectedRecipe(null);
    fetchRecipes();
  };
  
  const handleUpdateRecipe = (updatedRecipe: Recipe) => {
    setSelectedRecipe(updatedRecipe);
    setRecipes(prevRecipes => 
      prevRecipes.map(r => 
        r.recipeName === updatedRecipe.recipeName ? updatedRecipe : r
      )
    );
  };

  const direction = language === 'ar' ? 'rtl' : 'ltr';

  const filteredRecipes = useMemo(() => {
    if (filter === 'favorites') {
      return recipes.filter(recipe => favorites.includes(recipe.recipeName));
    }
    return recipes;
  }, [recipes, favorites, filter]);

  return (
    <div dir={direction} className={`min-h-screen flex flex-col bg-orange-50 text-gray-800 ${language === 'ar' ? 'font-[Cairo]' : ''}`}>
      <Header language={language} setLanguage={setLanguage} onLogoClick={handleLogoClick} />
      <main className="flex-grow container mx-auto px-4 py-8">
        {selectedRecipe ? (
          <RecipeDetail
            recipe={selectedRecipe}
            onBack={() => setSelectedRecipe(null)}
            language={language}
            isFavorite={favorites.includes(selectedRecipe.recipeName)}
            onToggleFavorite={toggleFavorite}
            onUpdateRecipe={handleUpdateRecipe}
          />
        ) : (
          <>
            <SearchBar onSearch={handleSearch} language={language} />

            <div className="flex justify-center mb-8 border-b">
              <button
                onClick={() => setFilter('all')}
                className={`py-2 px-6 font-semibold transition-colors ${filter === 'all' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-gray-500 hover:text-orange-600'}`}
              >
                {TRANSLATIONS[language].allRecipes}
              </button>
              <button
                onClick={() => setFilter('favorites')}
                className={`py-2 px-6 font-semibold transition-colors ${filter === 'favorites' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-gray-500 hover:text-orange-600'}`}
              >
                {TRANSLATIONS[language].favorites}
              </button>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Spinner />
              </div>
            ) : error ? (
              <div className="text-center text-red-500 bg-red-100 p-4 rounded-lg">
                <p className="font-bold">{TRANSLATIONS[language].errorTitle}</p>
                <p>{error}</p>
              </div>
            ) : (
              <RecipeList
                recipes={filteredRecipes}
                onSelectRecipe={setSelectedRecipe}
                language={language}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                filter={filter}
              />
            )}
          </>
        )}
      </main>
      <Footer language={language} />
    </div>
  );
};

export default App;