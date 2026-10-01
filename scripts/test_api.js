import { fetchProblemBySlug } from '../src/api.js';

async function test() {
  try {
    const data = await fetchProblemBySlug('two-sum');
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
}
test();
