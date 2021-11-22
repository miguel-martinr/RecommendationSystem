import { Recommender } from "./recommender.js";
import { createTable, createTr } from "./utilty.js";

const recommender = new Recommender();
window.recommender = recommender;

// Read matrix
let reader = new FileReader()

reader.onload = () => {
  
  // Show new original matrix
  recommender.setUtilityMatrix(reader.result);
  showOriginalMatrix();

  // Show similarity matrix
  showSimilarityMatrix();
}

const readMatrix = (input_event) => {
  const { target } = input_event;

  if (target.files.length < 1) {
    alert("Debes subir 1 matriz de utilidad");
  }

  const file = file_input.files[0];
  reader.readAsText(file);
}

const file_input = document.getElementById('utilityMatrix_input');
file_input.addEventListener('input', readMatrix);

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

  // Shows new similarity Matrix
  showSimilarityMatrix();
});


const showSimilarityMatrix = () => {
  const formattedSimilarityMatrix = Recommender.formatMatrix(recommender.similarityMatrix);
  
  const opts = {
    markedCells: "diagonal",
    styleClasses: ["text-white", "bg-dark"],
    rowHeaders: "User",
    colHeaders: "User"
  };
  showMatrix('similarity_matrix_container', 'matrix-three-title', opts, formattedSimilarityMatrix)
}

const showCalculatedMatrix = () => {
  const numOfNeighbors = parseInt(document.getElementById('neighbors_number_input').value);
  recommender.numOfNeighbors = numOfNeighbors;
  
  const newMatrix = recommender.calculate();
  const formattedMatrix = Recommender.formatMatrix(newMatrix);
  
  // Removes previos calculated matrix
  removeMatrix('new_matrix_container', 'matrix-two-title');
  
  const opts = {
    markedCells: recommender.emptyItems,
    styleClasses: ["text-white", "bg-success"],
    rowHeaders: "User",
    colHeaders: "Item"
  };
  
  // Shows new calculated matrix
  showMatrix('new_matrix_container', 'matrix-two-title', opts, formattedMatrix);
}

const showOriginalMatrix = () => {
  let opts = {
    markedCells: recommender.emptyItems,
    styleClasses: ["text-white", "bg-danger"],
    rowHeaders: "User",
    colHeaders: "Item"
  };
  showMatrix('matrix_container', 'matrix-one-title', opts, Recommender.formatMatrix(recommender.utilityMatrix));
}






const showMatrix = (matrixContainerId, titleId, opts, matrix) => {
  const matrixContainer = document.getElementById(matrixContainerId);
  matrixContainer.innerHTML = "";

  document.getElementById(titleId).hidden = false;
  matrixContainer.appendChild(createTable(matrix, opts));  
}

const removeMatrix = (matrixContainerId, titleId) => {
  document.getElementById(titleId).hidden = true;
  const matrixContainer = document.getElementById(matrixContainerId);
  matrixContainer.innerHTML = "";
}












