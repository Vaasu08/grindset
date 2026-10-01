import { fetchAllProblems } from '../src/api.js';

async function test() {
  try {
    const data = await fetchAllProblems();
    // Assuming data is an array or has a specific structure
    console.log("Type of data:", Array.isArray(data) ? 'Array' : typeof data);
    if (Array.isArray(data)) {
        console.log("Total problems:", data.length);
        console.log("First problem structure:", JSON.stringify(data[0], null, 2));
    } else if (data && data.problems) {
        console.log("Total problems:", data.problems.length);
        console.log("First problem structure:", JSON.stringify(data.problems[0], null, 2));
    } else {
        console.log("Data keys:", Object.keys(data));
        console.log("Some value:", data[Object.keys(data)[0]]);
    }
  } catch (err) {
    console.error(err);
  }
}
test();
