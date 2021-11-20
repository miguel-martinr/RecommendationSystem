console.log("hello")

let reader = new FileReader()


class Recommender {
  constructor() {

    reader.onload = () => {
      recommender.set_utility_matrix(reader.result);
    }

    this.sim = this.pearson;
  }

  set_utility_matrix(matrix) {
    const not_value = "-";;
    this.utility_matrix = matrix
      .split("\n")
      .map((str_row) => str_row.split(" "))
      .map((row) => row.map((char) => char == not_value ? undefined : parseInt(char))
        .filter((calif) => calif === undefined || !isNaN(calif)));
  }

  print() {
    let content = "\nRecomendador:\n";

    content += this.utility_matrix.map((row) => row.map(item => item === undefined ? "-" : item.toString()));
    content += "\n";

    console.log(content);
  }

  pearson(u, v) {
    
  }

  getUserMean(user_index) {
    const user_califications = this.utility_matrix[user_index];

    if (!user_califications) throw new Error(`There's not an user at index ${user_index}`);

    let num_of_califications = 0;
    const califications_sum = user_califications.reduce((sum, calif) => {
      if (calif === undefined) return sum;

      num_of_califications++;
      return sum + calif;
    }, 0);
    
    return califications_sum / num_of_califications;
  }
}


// Leer matriz 
const readMatrix = (input_event) => {
  const { target } = input_event;

  if (target.files.length < 1) {
    alert("Debes subir 1 matriz de utilidad");
  }

  file = file_input.files[0];
  reader.readAsText(file);
}



const recommender = new Recommender();





const file_input = document.getElementById('utility_matrix_input');
file_input.addEventListener('input', readMatrix);





