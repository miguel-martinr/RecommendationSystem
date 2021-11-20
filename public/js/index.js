import { Recommender } from "./recommender.js";

const recommender = new Recommender();



// Read matrix
let reader = new FileReader()

reader.onload = () => {
  recommender.setUtilityMatrix(reader.result);

  const formattedMatrix = Recommender.formatMatrix(recommender.utility_matrix);
  
  const matrixContainer = document.getElementById('matrix_container');
  matrixContainer.innerHTML = "";

  
  // Remove previous calculated matrix
  document.getElementById('matrix-two-title').hidden = true;
  const newMatrixContainer = document.getElementById('new_matrix_container');
  newMatrixContainer.innerHTML = "";
  
  // Show new original matrix
  const opts = { 
    markedCells: recommender.emptyItems, 
    styleClasses: ["text-white", "bg-danger"] 
  };
  document.getElementById('matrix-one-title').hidden = false;
  matrixContainer.appendChild(createTable(formattedMatrix, opts));
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
    styleClasses: ["text-white", "bg-success"] 
  };

  document.getElementById('matrix-two-title').hidden = false;
  newMatrixContainer.appendChild(createTable(formattedMatrix, opts));
});




const createTable = (matrix, opts) => {

  const { markedCells, styleClasses } = opts;

  const table = document.createElement('table');
  table.classList.add('table');
  const thead = document.createElement('thead');

  thead.innerHTML = '<th scope="col">#</th>';

  matrix[0].forEach((_, i) => thead.innerHTML += `<th scope="col">Item ${i + 1}</th>`);
  table.appendChild(createTr(thead.innerHTML));



  const tbody = document.createElement('tbody');

  const body = matrix.map((row, i) => {
    return row.map((item, j) => {
      const td = document.createElement('td');
      td.innerHTML = item;
      return td;
    });
  });

  markedCells.forEach(([i, j]) => {
    body[i][j].classList.add(...styleClasses);
  });

  body.forEach((row, i) => {
    const rowHeader = `<th scope="row">User ${i + 1}</th>`;
    const tr = document.createElement('tr');
    tr.innerHTML = rowHeader;
    row.forEach((_, j) => {
      tr.appendChild(body[i][j]);
      tbody.appendChild(tr);
    });
  });

  table.appendChild(tbody);
  return table;
}

const createTr = (innerHTML) => {
  const tr = document.createElement('tr');
  tr.innerHTML = innerHTML;
  return tr;
}












