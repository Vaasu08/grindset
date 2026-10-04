const fs = require('fs');
const content = fs.readFileSync('src/pages/Home.jsx', 'utf8');
const topicsMatch = content.match(/const NEETCODE_TOPICS = (\{[\s\S]*?\});/);
const subtopicsMatch = content.match(/const NEETCODE_SUBTOPICS = (\{[\s\S]*?\});/);

const topicsStr = topicsMatch[1];
const subtopicsStr = subtopicsMatch[1];

const NEETCODE_TOPICS = eval('(' + topicsStr + ')');
const NEETCODE_SUBTOPICS = eval('(' + subtopicsStr + ')');

let allTagsInHome = new Set();
for (let key in NEETCODE_TOPICS) {
    NEETCODE_TOPICS[key].forEach(tag => allTagsInHome.add(tag));
}
for (let key in NEETCODE_SUBTOPICS) {
    for (let sub in NEETCODE_SUBTOPICS[key]) {
        NEETCODE_SUBTOPICS[key][sub].forEach(tag => allTagsInHome.add(tag));
    }
}

const problems = JSON.parse(fs.readFileSync('temp.json', 'utf8'));
let allTagsInApi = new Set();
problems.forEach(p => {
    if (p.topic_tags) {
        p.topic_tags.forEach(tag => allTagsInApi.add(tag));
    }
});

let missingTags = [];
allTagsInHome.forEach(tag => {
    if (!allTagsInApi.has(tag)) {
        missingTags.push(tag);
    }
});
console.log('Missing Tags in API:', missingTags);

