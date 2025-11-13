// more documentation available at
// https://github.com/tensorflow/tfjs-models/tree/master/speech-commands

// the link to your model provided by Teachable Machine export panel
const URL = "https://teachablemachine.withgoogle.com/models/qyNNJ7M5T/";

async function createModel() {
  const checkpointURL = URL + "model.json"; // model topology
  const metadataURL = URL + "metadata.json"; // model metadata

  const recognizer = speechCommands.create(
    "BROWSER_FFT", // fourier transform type, not useful to change
    undefined, // speech commands vocabulary feature, not useful for your models
    checkpointURL,
    metadataURL
  );

  // check that model and metadata are loaded via HTTPS requests.
  await recognizer.ensureModelLoaded();

  return recognizer;
}

async function init() {
  const recognizer = await createModel();
  const classLabels = recognizer.wordLabels(); // get class labels

  // listen() takes two arguments:
  // 1. A callback function that is invoked anytime a word is recognized.
  // 2. A configuration object with adjustable fields
  recognizer.listen(
  (result) => {
    const scores = result.scores; // probabilities for each class
    const [bgNoise, sound1, sound2] = scores;

    // Log only when needed to reduce console noise
    console.log({ bgNoise, sound1, sound2 });

    // Use clearer conditional structure
    if (sound1 > 0.7) {
      playingSound(classLabels[1]);
    } else if (sound2 > 0.7) {
      playingSound(classLabels[2]);
    }
  },
  {
    includeSpectrogram: true,
    probabilityThreshold: 0.75,
    invokeCallbackOnNoiseAndUnknown: true,
    overlapFactor: 0.5, // between 0.5–0.75 for smoother recognition
  }
);


//   console.log(classLabels);

  // Stop the recognition in 5 seconds.
  // setTimeout(() => recognizer.stopListening(), 5000);
}

const playingSound = (label) => {
    if(label === "Class 2"){
        console.log("yes");
        cycleBackground();
    }
    
    if(label === "Class 3"){
        console.log("no");

    }
}

const body = document.body
let index = 0;
const cycleBackground = () => {
  index = (index + 1) % 3;
  body.dataset.theme = index === 0 ? "default" : String(index);
};


init();
