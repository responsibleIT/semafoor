// more documentation available at
// https://github.com/tensorflow/tfjs-models/tree/master/speech-commands

// the link to your model provided by Teachable Machine export panel
const URL = "https://teachablemachine.withgoogle.com/models/ytj_eWCtE/";

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

const init = async () => {
  // cooldown between triggers in ms
  const COOLDOWN = 1000;
  // threshold for sound probability
  const SOUND_PROBABILITY = 0.7;

  const recognizer = await createModel();

  const elementList = document.querySelectorAll("[data-animated]");
  const animatedElements = Array.from(elementList);
  const [, ...actualSounds] = recognizer.wordLabels(); // skip background
  const minLength = Math.min(actualSounds.length, animatedElements.length);

  // map each sound to its element and store last trigger timestamp
  const soundMap = actualSounds.slice(0, minLength).map((label, i) => ({
    label,
    element: animatedElements[i],
    lastTriggered: 0,
    triggered: false,
  }));

  recognizer.listen(
    (result) => {
      const scores = result.scores;

      soundMap.forEach((soundObj, i) => {
        const now = Date.now();
        // +1 to skip background in scores
        if (
          scores[i + 1] > SOUND_PROBABILITY &&
          !soundObj.triggered &&
          now - soundObj.lastTriggered > COOLDOWN
        ) {
          soundObj.lastTriggered = now;
          soundObj.triggered = true;
          const el = soundObj.element;
          el.dataset.animated = !(el.dataset.animated === "true");
        } else if (scores[i + 1] <= SOUND_PROBABILITY) {
          soundObj.triggered = false;
        }
      });
    },
    {
      includeSpectrogram: false,
      probabilityThreshold: 0.75,
      invokeCallbackOnNoiseAndUnknown: true,
      overlapFactor: 0.5,
    }
  );
};

init();
