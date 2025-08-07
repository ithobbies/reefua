// A vibrant, reef-themed color palette for category and subcategory badges.
// Each color is chosen for good contrast and visual distinction.
// The hover:bg-* class is added to prevent the default hover effect from the Badge component.
export const categoryColors: { [key: string]: string } = {
  // Main Categories
  livestock: 'bg-green-200 text-green-800 hover:bg-green-200',
  corals: 'bg-rose-200 text-rose-800 hover:bg-rose-200',
  equipment: 'bg-amber-200 text-amber-800 hover:bg-amber-200',
  chemistry: 'bg-sky-200 text-sky-800 hover:bg-sky-200',

  // Subcategories for Livestock
  fish: 'bg-teal-200 text-teal-800 hover:bg-teal-200',
  invertebrates: 'bg-cyan-200 text-cyan-800 hover:bg-cyan-200',

  // Subcategories for Corals
  soft: 'bg-fuchsia-200 text-fuchsia-800 hover:bg-fuchsia-200',
  lps: 'bg-orange-200 text-orange-800 hover:bg-orange-200',
  sps: 'bg-violet-200 text-violet-800 hover:bg-violet-200',
  anemones: 'bg-red-200 text-red-800 hover:bg-red-200',
};
