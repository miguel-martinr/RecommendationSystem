
export const createTable = (matrix, opts) => {

  const { markedCells, styleClasses, rowHeaders, colHeaders} = opts;

  const table = document.createElement('table');
  table.classList.add('table');
  const thead = document.createElement('thead');

  thead.innerHTML = '<th scope="col">#</th>';


  let getColHeader = undefined;
  if (Array.isArray(colHeaders)) {
    getColHeader = (i) => colHeaders[i];
  } else {
    getColHeader = (i) => colHeaders  + `${i+1}`;
  }
  matrix[0].forEach((_, i) => thead.innerHTML += `<th scope="col">${getColHeader(i)}</th>`);
  table.appendChild(createTr(thead.innerHTML));



  const tbody = document.createElement('tbody');

  const body = matrix.map((row, i) => {
    return row.map((item, j) => {
      const td = document.createElement('td');
      td.innerHTML = item;
      return td;
    });
  });



  if (Array.isArray(markedCells)) {
    markedCells.forEach(([i, j]) => {
      body[i][j].classList.add(...styleClasses);
    });
  } else {
    switch (markedCells) {
      case "all":
        body.forEach(row => row.forEach(item => item.classList.add(...styleClasses)));
        break;
      case "diagonal":
        body.forEach((row, i) => row.forEach((item, j) => {
          if (i === j) item.classList.add(...styleClasses);
        }));
    }
  }


  

  let getRowHeader = undefined;
  if (Array.isArray(rowHeaders)) {
    getRowHeader = (i) => rowHeaders[i];
  } else {
    getRowHeader = (i) => rowHeaders  + `${i+1}`;
  }
  body.forEach((row, i) => {
    const rowHeader = `<th scope="row">${getRowHeader(i)}</th>`;
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

export const createTr = (innerHTML) => {
  const tr = document.createElement('tr');
  tr.innerHTML = innerHTML;
  return tr;
}
