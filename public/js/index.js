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

    // SUM [(r(u, i) - mean(u)) * (r(v, i) - mean(v))]
    let A = 0;

    // Cx = SUM[(r(x, i) - mean(x))^2]
    let Bu = 0;
    let Bv = 0;

    const u_mean = this.getUserMean(u);
    const v_mean = this.getUserMean(v);

    for (let i = 0; i < this.utility_matrix[0].length; i++) {

      // r(u, i)
      const r_u = this.utility_matrix[u][i];
      // r(v, i)
      const r_v = this.utility_matrix[v][i];

      // Work only on Suv set
      if (r_u === undefined || r_v === undefined) continue;

      const u_diff = r_u - u_mean;
      const v_diff = r_v - v_mean;

      A += u_diff * v_diff;

      Bu += u_diff ** 2;
      Bv += v_diff ** 2;
    }


    return A / Math.sqrt(Bu * Bv);
  }

  cosine(u, v) {

    // SUM[r(u, i) * r(v, i)]
    let A = 0;

    // Bx = SUM[r(x, i) ^ 2]
    let Bu = 0;
    let Bv = 0;

    for (let i = 0; i < this.utility_matrix[0].length; i++) {
      // r(u, i)
      const r_u = this.utility_matrix[u][i];
      // r(v, i)
      const r_v = this.utility_matrix[v][i];

      // Work only on Suv set
      if (r_u === undefined || r_v === undefined) continue;

      A += r_u * r_v;
      Bu += r_u ** 2;
      Bv += r_v ** 2;
    }

    return A / Math.sqrt(Bu * Bv);
  }

  euclidean(u, v) {
    let A = 0;
    for (let i = 0; i < this.utility_matrix[0].length; i++) {
      // r(u, i)
      const r_u = this.utility_matrix[u][i];
      // r(v, i)
      const r_v = this.utility_matrix[v][i];

      // Work only on Suv set
      if (r_u === undefined || r_v === undefined) continue;

      A += (r_u - r_v) ** 2
    }

    return Math.sqrt(A);
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





