// A centralized place to manage the colors for different categories.
// This makes it easy to update colors across the app.

export const categoryColorMap: { [key: string]: string } = {
  // Main Categories
  livestock: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700',
  corals: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-700',
  equipment: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500',

  // Subcategories for Livestock
  fish: 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900 dark:text-sky-300 dark:border-sky-700',
  invertebrates: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900 dark:text-indigo-300 dark:border-indigo-700',
  
  // Subcategories for Corals
  soft: 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900 dark:text-pink-300 dark:border-pink-700',
  lps: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200 dark:bg-fuchsia-900 dark:text-fuchsia-300 dark:border-fuchsia-700',
  sps: 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900 dark:text-violet-300 dark:border-violet-700',
  anemones: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900 dark:text-rose-300 dark:border-rose-700',

  // Default fallback color
  default: 'bg-stone-100 text-stone-800 border-stone-200 dark:bg-stone-700 dark:text-stone-300 dark:border-stone-500',
};

/**
 * Gets the corresponding color class string for a given category/subcategory slug.
 * @param slug The slug of the category or subcategory (e.g., 'corals', 'sps').
 * @returns A string of Tailwind CSS classes for styling.
 */
export const getCategoryColor = (slug?: string): string => {
  if (!slug) return categoryColorMap.default;
  return categoryColorMap[slug] || categoryColorMap.default;
};
