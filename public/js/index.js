import { Recommender } from "./recommender.js";
import { createTable, createTr } from "./utilty.js";

const recommender = new Recommender();



// Read matrix
let reader = new FileReader()

reader.onload = () => {
  // Remove previous calculated matrix
  document.getElementById('matrix-two-title').hidden = true;
  const newMatrixContainer = document.getElementById('new_matrix_container');
  newMatrixContainer.innerHTML = "";



  // Show new original matrix
  recommender.setUtilityMatrix(reader.result);
  const formattedOriginalMatrix = Recommender.formatMatrix(recommender.utility_matrix);
  const originalMatrixContainer = document.getElementById('matrix_container');
  originalMatrixContainer.innerHTML = "";

  let opts = {
    markedCells: recommender.emptyItems,
    styleClasses: ["text-white", "bg-danger"],
    rowHeaders: "User",
    colHeaders: "Item"
  };

  document.getElementById('matrix-one-title').hidden = false;
  originalMatrixContainer.appendChild(createTable(formattedOriginalMatrix, opts));




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

const file_input = document.getElementById('utility_matrix_input');
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
  const numOfNeighbors = parseInt(document.getElementById('neighbors_number_input').value);
  recommender.numOfNeighbors = numOfNeighbors;

  const newMatrix = recommender.calculate();
  const formattedMatrix = Recommender.formatMatrix(newMatrix);

  const newMatrixContainer = document.getElementById('new_matrix_container');
  newMatrixContainer.innerHTML = "";

  const opts = {
    markedCells: recommender.emptyItems,
    styleClasses: ["text-white", "bg-success"],
    rowHeaders: "User",
    colHeaders: "Item"
  };

  document.getElementById('matrix-two-title').hidden = false;
  newMatrixContainer.appendChild(createTable(formattedMatrix, opts));


  // Show similarity Matrix
  showSimilarityMatrix();
});


const showSimilarityMatrix = () => {
  document.getElementById('matrix-three-title').hidden = false;
  const formattedSimilarityMatrix = Recommender.formatMatrix(recommender.similarityMatrix);
  const similarityMatrixContainer = document.getElementById('similarity_matrix_container');
  similarityMatrixContainer.innerHTML = "";

  const opts = {
    markedCells: "all",
    styleClasses: ["text-white", "bg-dark"],
    rowHeaders: "User",
    colHeaders: "User"
  };

  similarityMatrixContainer.appendChild(createTable(formattedSimilarityMatrix, opts));
}














