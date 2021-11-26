import { Recommender } from "./recommender.js";
import { createTable, createTr } from "./utilty.js";

const recommender = new Recommender();
window.recommender = recommender;

// Read matrix
let reader = new FileReader()

const setUtilityMatrix = (rawMatrixText) => {
  // Show new original matrix
  recommender.setUtilityMatrix(rawMatrixText);
  showOriginalMatrix();

  // Show similarity matrix
  showSimilarityMatrix();

  // Show sorted neighbors for every user
  showSortedNeighbors();

}

reader.onload = () => {
  setUtilityMatrix(reader.result);
}


const readMatrix = (input_event) => {
  const { target } = input_event;

  if (target.files.length < 1) {
    alert("Debes subir 1 matriz de utilidad");
  }

  const file = fileInput.files[0];
  reader.readAsText(file);
}

const fileInput = document.getElementById('utilityMatrix_input');
fileInput.addEventListener('input', readMatrix);

// Change similarity metric
document.getElementById('metrics_dropdown').addEventListener('change', (ev) => {
  recommender.setMetric(ev.target.value);
});

// Change prediction method
document.getElementById('prediction_method').addEventListener('change', (ev) => {
  recommender.setPredictor(ev.target.value);
});


// Calculate new matrix
document.getElementById('calc_form').addEventListener('submit', (ev) => {
  ev.preventDefault();

  if (!recommender.utilityMatrix) {
    return alert("Debes subir 1 matriz de utilidad.");
  }

  showCalculatedMatrix();
  showSortedNeighbors();

  // Shows new similarity Matrix
  showSimilarityMatrix();
  document.getElementById("headingThree").scrollIntoView();
  document.getElementById("downloadBtnContainer").hidden = false;
});



// Read matrix from example
const exampleButtonsIds = ["exampleOneBtn", "exampleTwoBtn", "exampleThreeBtn"];
exampleButtonsIds.map(id => document.getElementById(id)).forEach(btn => {
  btn.addEventListener('click', (ev) => {
    const temp = btn.innerHTML;
    btn.innerHTML = "Cargando...";
    const { target } = ev;
    axios.get(target.value).then(res => {
      btn.innerHTML = temp;
      setUtilityMatrix(res.data);
    });
  });
});


// Download report
document.getElementById('downloadBtn').addEventListener('click', () => {

  const reportJson = {
    utilityMatrix: recommender.utilityMatrix,
    similarityMatrix: recommender.similarityMatrix,
    metric: recommender.metricName,
    predictionMethod: recommender.predictorName,
    numOfNeighbors: recommender.numOfNeighbors,
    predictedMatrix: recommender.calculate()
  }



  let tempAnchor = document.createElement('a');

  let stringifiedReport = JSON.stringify(reportJson).replace(/(\d),\n/g, "$1,");
  stringifiedReport = stringifiedReport.replace(/(\"\w*\"):/g, "\n  $1:");
  stringifiedReport = stringifiedReport.replace(/(\"\w*\"):\[/g, "\n  $1:\[");
  stringifiedReport = stringifiedReport.replace(/(\:\[)/g, ":\n  [");
  stringifiedReport = stringifiedReport.replace(/(\[\[)/g, "[\n    [");
  stringifiedReport = stringifiedReport.replace(/(\],)/g, "],\n");
  stringifiedReport = stringifiedReport.replace(/(\],\n\[)/g, "],\n    [");
  stringifiedReport = stringifiedReport.replace(/(\]\])/g, "\]\n  \]");
  stringifiedReport = stringifiedReport.replace(/(\]\})/g, "\]\n\n\}");
  

  tempAnchor.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(stringifiedReport));
  const rows = recommender.utilityMatrix.length;
  const columns = recommender.utilityMatrix[0].length;
  const {metricName, numOfNeighbors} = recommender;
  let predictorName = recommender.predictorName;
  predictorName = predictorName.substring(predictorName.lastIndexOf("/") + 1);


  tempAnchor.setAttribute('download', `matrix-${rows}-${columns}-${metricName}-${numOfNeighbors}-${predictorName}.json`);

  tempAnchor.style.display = 'none';
  document.body.appendChild(tempAnchor);

  tempAnchor.click();

  document.body.removeChild(tempAnchor);
});






// Show sorted neighbors for every user
const showSortedNeighbors = () => {
    
  const simAndIndex = recommender.similarityMatrix.map((sims) => sims.map((sim, v) => ({sim, v})));
  const sorted = simAndIndex.map(row => row.sort((a, b) => recommender.similaritySorter(a.sim, b.sim)).slice(1));
  const text = sorted.map(row => row.map(({sim, v}) => `[${v + 1}]: ${sim.toFixed(2)}`));

  let markedCells = [...Array(text.length).keys()];
  markedCells = markedCells.map(u => [...Array(recommender.numOfNeighbors).keys()].map(n => [u, n])).flat();
  // markedCells = [];
  const opts = {
    markedCells,
    styleClasses: ["text-white", "bg-primary"],
    rowHeaders: "User",
    colHeaders: "",
  }

  showMatrix('sorted_neighbors_container', 'headingFour', opts, text);
}


const showOriginalMatrix = () => {
  let opts = {
    markedCells: recommender.emptyItems,
    styleClasses: ["text-white", "bg-danger"],
    rowHeaders: "User",
    colHeaders: "Item"
  };
  showMatrix('matrix_container', 'headingOne', opts, Recommender.formatMatrix(recommender.utilityMatrix));
}


const showSimilarityMatrix = () => {
  const formattedSimilarityMatrix = Recommender.formatMatrix(recommender.similarityMatrix);

  const opts = {
    markedCells: "diagonal",
    styleClasses: ["text-white", "bg-dark"],
    rowHeaders: "User",
    colHeaders: "User"
  };
  showMatrix('similarity_matrix_container', 'headingTwo', opts, formattedSimilarityMatrix)
}

const showCalculatedMatrix = () => {
  const numOfNeighborsInput = document.getElementById('neighbors_number_input');
  const numOfNeighbors = parseInt(numOfNeighborsInput.value);
  recommender.numOfNeighbors = Math.min(numOfNeighbors, recommender.utilityMatrix.length);
  recommender.numOfNeighbors = Math.min(recommender.numOfNeighbors, recommender.utilityMatrix.length - 1);
  numOfNeighborsInput.value = recommender.numOfNeighbors;

  const newMatrix = recommender.calculate();
  const formattedMatrix = Recommender.formatMatrix(newMatrix);

  // Removes previous calculated matrix
  removeMatrix('new_matrix_container', 'headingThree');

  const opts = {
    markedCells: recommender.emptyItems,
    styleClasses: ["text-white", "bg-success"],
    rowHeaders: "User",
    colHeaders: "Item"
  };

  // Shows new calculated matrix
  showMatrix('new_matrix_container', 'headingThree', opts, formattedMatrix);
}






const showMatrix = (matrixContainerId, headerId, opts, matrix) => {

  const matrixContainer = document.getElementById(matrixContainerId);
  matrixContainer.innerHTML = "";

  document.getElementById(headerId).hidden = false;
  matrixContainer.appendChild(createTable(matrix, opts));
}

const removeMatrix = (matrixContainerId, headerId) => {
  document.getElementById(headerId).hidden = true;
  const matrixContainer = document.getElementById(matrixContainerId);
  matrixContainer.innerHTML = "";
}












