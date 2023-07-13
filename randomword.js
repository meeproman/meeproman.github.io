var spinButton = document.getElementById('spin-button');
var spinResult = document.getElementById('spin-result');
var listenButton = document.getElementById('listen-button');
var wheel = document.getElementById('wheel');
var arrow = document.createElement('div');
arrow.className = 'arrow';
wheel.appendChild(arrow);

spinButton.addEventListener('click', function() {
    var wordInput = document.getElementById('word-input').value;
    var words = wordInput.split(',').map(function(word) {
        return word.trim();
    });

    if (words.length === 0) {
        spinResult.textContent = "Please enter some words.";
    } else {
        var randomIndex = Math.floor(Math.random() * words.length);
        var randomWord = words[randomIndex];
        spinResult.textContent = randomWord;
        wheel.classList.add('spinning');
        setTimeout(function() {
            wheel.classList.remove('spinning');
        }, 2000);
    }
});

listenButton.addEventListener('click', function() {
    var resultText = spinResult.textContent;
    if ('speechSynthesis' in window && resultText) {
        var speech = new SpeechSynthesisUtterance(resultText);
        speech.lang = 'en-US';
        speech.volume = 1;
        speech.rate = 1;
        speech.pitch = 1;
        window.speechSynthesis.speak(speech);
    }
});

var wordInput = document.getElementById('word-input');
wordInput.addEventListener('input', function() {
    var words = this.value.split(',').map(function(word) {
        return word.trim();
    });
    var wordCount = words.length;
    var angle = 360 / wordCount;
    wheel.innerHTML = '';

    for (var i = 0; i < wordCount; i++) {
        var wordElement = document.createElement('div');
        wordElement.className = 'word';
        wordElement.textContent = words[i] || '';
        wheel.appendChild(wordElement);
    }

    wheel.appendChild(arrow);
});

//speech recognition

let percentage; // declare percentage as a global variable
let result; // declare result as a global variable

function voicereg(callback) {
  return new Promise((resolve, reject) => {
    const recognition = new webkitSpeechRecognition();
    var button = document.getElementById("sent");
    var button2 = document.getElementById("voice-button");
    var randword = spinResult.textContent;
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.start();
    button2.style.backgroundColor = "red";
    button2.textContent = "Listening";
    setTimeout(() => {  // stop the recognition after 10 seconds
      recognition.stop();
      button2.style.backgroundColor = "#ffdeda";
      button2.textContent = "Press to Speak";
    }, 10000);
    recognition.onresult = (event) => {
      result = event.results[0][0].transcript; // assign the value to the global variable
      const answer = randword; 
// replace with your answer string
      const matchCount = getMatchCount(result, answer);
      percentage = matchCount * 100; // assign the value to the global variable
      recognition.stop();

      button2.style.backgroundColor = "#ffdeda";
      button2.textContent = "Press to Speak";
      resolve(percentage.toFixed(2));
      callback(percentage.toFixed(2));
    };
    recognition.onerror = (event) => {
      reject(event.error);
    };
  });
}

//Levenshtein Distance for Measuring Text Similarity
function getMatchCount(str1, str2) {
const m = str1.length;
const n = str2.length;
const d = [];
for (let i = 0; i <= m; i++) {
d[i] = [i];
}
for (let j = 0; j <= n; j++) {
d[0][j] = j;
}
for (let j = 1; j <= n; j++) {
for (let i = 1; i <= m; i++) {
if (str1[i - 1] === str2[j - 1]) {
  d[i][j] = d[i - 1][j - 1];
} else {
  d[i][j] = Math.min(
    d[i - 1][j] + 1, // deletion
    d[i][j - 1] + 1, // insertion
    d[i - 1][j - 1] + 1 // substitution
  );
}
}
}
const distance = d[m][n];
const maxDistance = Math.max(m, n);
return (1 - distance / maxDistance);
}



const button = document.getElementById("voice-button");
const resultDiv = document.getElementById("result");
const resultfield = document.getElementById("result")

button.addEventListener("click", async () => {
try {
  const percentage = await voicereg();
  const resultP = document.createElement("p");
  resultfield.style.display ="block";
  resultP.textContent = `You said " ${result} " Your score is ${percentage}%.`;
  resultDiv.innerHTML = "";
  resultDiv.appendChild(resultP);
  console.log(result)
} catch (error) {
  console.error(error);
}
});
