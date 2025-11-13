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
    model = await tmPose.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    // Convenience function to setup a webcam
    const size = 400;
    const flip = true; // whether to flip the webcam
    webcam = new tmPose.Webcam(size, size, flip); // width, height, flip
    await webcam.setup(); // request access to the webcam
    await webcam.play();
    window.requestAnimationFrame(loop);

    // append/get elements to the DOM
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

let previousLetter = ""; // Store the previous letter globally

const spellIt = (letter) => {
  if (letter !== previousLetter) {
    // Only update if the letter has changed
    const previousElement = document.querySelector(".previous");
    if (previousElement) {
      previousElement.innerHTML = previousLetter; // Show the previous letter
    }
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        letterContainer.innerHTML = letter; // Show the current letter
        previousLetter = letter; // Update the previous letter
      });
    } else {
      letterContainer.innerHTML = letter; // Show the current letter
      previousLetter = letter; // Update the previous letter
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

    interactieCount++; // Move to the next letter
    return `Correct! Next letter: ${interactieCount < interactie.length ? interactie[interactieCount] : "All done!"}`;
  } else {
    return `Wrong! The expected letter is "${expectedLetter}". Try again.`;
  }
};

init();
