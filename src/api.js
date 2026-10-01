const BASE_URL = 'https://leetcode-api-pied.vercel.app';

export const fetchAllProblems = async () => {
  const res = await fetch(`${BASE_URL}/problems`);
  if (!res.ok) throw new Error('Failed to fetch problems');
  return res.json();
};

export const fetchProblemBySlug = async (slug) => {
  const res = await fetch(`${BASE_URL}/problem/${slug}`);
  if (!res.ok) throw new Error('Failed to fetch problem details');
  return res.json();
};

export const searchProblems = async (query) => {
  const res = await fetch(`${BASE_URL}/search?query=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Failed to search problems');
  return res.json();
};
