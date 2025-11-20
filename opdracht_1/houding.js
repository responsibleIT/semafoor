// PLAK HIER DE LINK NAAR JE MODEL
const URL = "https://teachablemachine.withgoogle.com/models/hier-jouw-code/";

let model, webcam, ctx, maxPredictions, letterContainer;
let retryCount = 0;
let predictionInterval; // Store interval ID

const interactie = ["I", "N", "T", "E", "R", "A", "C", "T", "I", "E"];
let interactieCount = 0;

const init = async () => {
  try {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";
    // load the model and metadata
    // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
    // Note: the pose library adds a tmPose object to your window (window.tmPose)
    try {
      model = await tmPose.load(modelURL, metadataURL);
      maxPredictions = model.getTotalClasses();
    } catch (error) {
      console.log("Heb je wel je URL aangepast?");
      
    }

    // Hoe groot hoort het canvas te zijn
    const size = 400;
    // Flipt de camera
    const flip = true;
    webcam = new tmPose.Webcam(size, size, flip);
    await webcam.setup();
    await webcam.play();
    window.requestAnimationFrame(loop);

    const canvas = document.querySelector("canvas");
    canvas.width = size;
    canvas.height = size;
    ctx = canvas.getContext("2d");
    letterContainer = document.getElementById("letterbox");

    predictionInterval = setInterval(predict, 5000);
  } catch (error) {
    retryCount++;
    setTimeout(() => {
      if (retryCount < 3) {
        console.log(error, "retrying in 2 seconds");
        init();
      }
    }, 2000);
    // retry
  }
};

// Hier wordt bepaald welke letter wordt uitgebeeld
const loop = async (timestamp) => {
  webcam.update(); // update the webcam frame
  await drawPose();
  window.requestAnimationFrame(loop);
};

const predict = async () => {
  if (!model || !webcam) {
    console.warn("Model or webcam not initialized yet");
    return;
  }

  const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);

  const prediction = await model.predict(posenetOutput);
  var result = Math.max(...prediction.map((o) => o.probability));
  var obj = prediction.find((obj) => obj.probability === result);

  const predictedLetter = obj.className;

  spellIt(predictedLetter);
  InteractieSpeller(predictedLetter)
};

// Hier slaan we de letter globaal op
// Globaal houdt in dat alle functies deze kunnen gebruiken
let previousLetter = "";

const spellIt = (letter) => {
  if (letter !== previousLetter) {
    
    const previousElement = document.querySelector(".previous");
    if (previousElement) {
      previousElement.innerHTML = previousLetter;
    }
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        letterContainer.innerHTML = letter;
        previousLetter = letter;
      });
    } else {
      letterContainer.innerHTML = letter;
      previousLetter = letter;
    }
  }
};

const drawPose = async () => {
  const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
  if (webcam.canvas) {
    ctx.drawImage(webcam.canvas, 0, 0);
    // draw the keypoints and skeleton
    if (pose) {
      const minPartConfidence = 0.5;
      tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
      tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
    }
  }
};

const interactieBox = document.querySelector(".interactie");

const InteractieSpeller = (letter) => {
  if (interactieCount >= interactie.length) {
    return "You've already guessed all the letters!";
  }

  const expectedLetter = interactie[interactieCount];
  const normalizedGuess = letter.toUpperCase();

  if (normalizedGuess === expectedLetter) {
    // Create <p><span>letter</span></p>
    const span = document.createElement("span");
    span.textContent = expectedLetter;
    interactieBox.appendChild(span);

    interactieCount++;
    return `Correct! Next letter: ${interactieCount < interactie.length ? interactie[interactieCount] : "All done!"}`;
  } else {
    return `Wrong! The expected letter is "${expectedLetter}". Try again.`;
  }
};

init();
