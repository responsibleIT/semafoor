// more documentation available at
// https://github.com/tensorflow/tfjs-models/tree/master/speech-commands

// PLAK HIER DE LINK NAAR JE MODEL
const URL = "https://teachablemachine.withgoogle.com/models/ytj_eWCtE/";

async function createModel() {
  const checkpointURL = URL + "model.json";
  const metadataURL = URL + "metadata.json";

  const recognizer = speechCommands.create(
    "BROWSER_FFT",
    undefined,
    checkpointURL,
    metadataURL
  );

  await recognizer.ensureModelLoaded();

  return recognizer;
}

const init = async () => {
  // Cooldown tussen triggers
  const COOLDOWN = 1000;

  // Geluids drempel
  const SOUND_PROBABILITY = 0.7;

  const recognizer = await createModel();

  const elementList = document.querySelectorAll("[data-animated]");
  const animatedElements = Array.from(elementList);

  // Hiermee skippen we background noise
  const [, ...actualSounds] = recognizer.wordLabels();
  const minLength = Math.min(actualSounds.length, animatedElements.length);

  // We mappen hier elk geluid aan elk element
  const soundMap = actualSounds.slice(0, minLength).map((label, i) => ({
    label,
    element: animatedElements[i],
    lastTriggered: 0,
    triggered: false,
  }));

  // Luisteren naar geluid...
  recognizer.listen(
    (result) => {
      // Scores per geluid
      const scores = result.scores;

      // Voor elk gegroepeerde item
      soundMap.forEach((soundObj, i) => {
        const now = Date.now();
        // Met +1 skippen we hier background noise weer
        // Ook checken we of het geluid over de drempel komt & of er een cooldown is
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
