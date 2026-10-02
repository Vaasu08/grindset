const https = require('https');
const fs = require('fs');

const fetchAudio = (youtubeUrl, outputPath) => {
  const reqData = JSON.stringify({ url: youtubeUrl, isAudioOnly: true });

  const req = https.request('https://api.cobalt.tools/api/json', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(reqData)
    }
  }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(body);
        if (json.url) {
          console.log('Downloading from:', json.url);
          https.get(json.url, (audioRes) => {
            const fileStream = fs.createWriteStream(outputPath);
            audioRes.pipe(fileStream);
            fileStream.on('finish', () => console.log('Downloaded to', outputPath));
          });
        } else {
          console.log('Cobalt failed for', youtubeUrl, json);
        }
      } catch(e) {
        console.error('Error parsing:', e);
      }
    });
  });

  req.write(reqData);
  req.end();
};

fetchAudio('https://www.youtube.com/watch?v=vXlK_OofN6I', 'public/audio/young_girl_a.mp3');
fetchAudio('https://www.youtube.com/watch?v=W_7P7tV2HqY', 'public/audio/lofi.mp3');
fetchAudio('https://www.youtube.com/watch?v=D-41D17xK2A', 'public/audio/rain.mp3');
fetchAudio('https://www.youtube.com/watch?v=XWb0_aQ453M', 'public/audio/cafe.mp3');
fetchAudio('https://www.youtube.com/watch?v=Q-w72c91wzI', 'public/audio/brown_noise.mp3');
