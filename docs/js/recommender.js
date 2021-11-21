const sorters = {
  increscent: (a, b) => a - b,
  decrescent: (a, b) => b - a
}

const predictors = {
  collaborativeFiltering: {
    userBased: {
      simple: "userBased/collaborativeFiltering/simple",
      meanDiff: "userBased/collaborativeFiltering/meanDiff"
    }
  }
}

const metrics = {
  pearson: "pearson",
  cosine: "cosine",
  euclidean: "euclidean"
}



export class Recommender {
  constructor() {
    this.sim = this.pearson;
    this.numOfNeighbors = 3;

    this.setMetric(metrics.pearson);
    this.setPredictor(predictors.collaborativeFiltering.userBased.meanDiff);
  }

  setUtilityMatrix(matrix) {
    const not_value = "-";;
    this.utility_matrix = matrix
      .split("\n")
      .map((str_row) => str_row.trim().split(" "))
      .map((row) => row.map((char) => char == not_value ? undefined : parseFloat(char)))
        
    this.setSimilarityMatrix();
  }

  setSimilarityMatrix(matrix) {
    if (!matrix) this.similarityMatrix = this.calculateSimilarityMatrix();
    else this.similarityMatrix = matrix;
  }

  get emptyItems() {
    const positions = [];
    this.utility_matrix.forEach((row, i) => {
      row.forEach((item, j) => {
        if (item === undefined) positions.push([i, j]);
      });
    });
    return positions;
  }

  // Similarity calculators
  similarityCalculators = {
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
    },

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
    },

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
  }

  calculateSimilarityMatrix() {
    const similarityMatrix = [];
    for(let u = 0; u < this.utility_matrix.length; u++) {
      similarityMatrix.push([]);
      for (let v = 0; v < this.utility_matrix.length; v++) {
        similarityMatrix[u].push(this.sim(u, v));
      }
    }

    return similarityMatrix;
  }

  // Returns user_index mean of califications
  getUserMean(user_index) {
    const user_califications = this.utility_matrix[user_index];

    if (!user_califications) throw new Error(`There's not any user at index ${user_index}`);

    let num_of_califications = 0;
    const califications_sum = user_califications.reduce((sum, calif) => {
      if (calif === undefined) return sum;

      num_of_califications++;
      return sum + calif;
    }, 0);

    return califications_sum / num_of_califications;
  }

  // Gets k nearest neighbors to user_index user (according to sim function)
  getNearestNeighbors(u, neighborsNum) {
    const user_califications = this.utility_matrix[u];

    if (!user_califications) throw new Error(`There's not any user at index ${u}`);

    const similarityMatrix = this.similarityMatrix;
    const users_similarity = similarityMatrix[u].map((sim, index) => ({ index, sim }));

    return users_similarity.sort((a, b) => this.similaritySorter(a.sim, b.sim))
      .slice(1, neighborsNum + 1); // Ignores similarity with u itself (1)
  }


  // Prediction methods
  collaborativeFiltering = {
    userBased: {
      simple(u, i) {
        const neighbors = this.getNearestNeighbors(u, this.numOfNeighbors);
        // SUM[ sim(u, v) * r(v, i)]
        let A = 0;
        // SUM[ |sim(u, v)|]
        let B = 0;

        neighbors.forEach((neighbor) => {
          const r_v = this.utility_matrix[neighbor.index][i];

          if (r_v === undefined) return;

          A += neighbor.sim * r_v;
          B += Math.abs(neighbor.sim);
        });

        return A / B;
      },

      meanDiff(u, i) {
        const neighbors = this.getNearestNeighbors(u, this.numOfNeighbors);
        // SUM[ sim(u, v) * r(v, i)]
        let A = 0;
        // SUM[ |sim(u, v)|]
        let B = 0;


        neighbors.forEach((neighbor) => {
          const r_v = this.utility_matrix[neighbor.index][i];

          if (r_v === undefined) return;

          A += neighbor.sim * (r_v - this.getUserMean(neighbor.index));
          B += Math.abs(neighbor.sim);
        });

        const u_mean = this.getUserMean(u);
        return u_mean + A / B;
      }
    }
  }


  // Setters
  setMetric(metricName) {
    switch (metricName) {
      case metrics.pearson:
        this.sim = this.similarityCalculators.pearson;
        this.similaritySorter = sorters.decrescent;
        break;
      case metrics.cosine:
        this.sim = this.similarityCalculators.cosine;
        this.similaritySorter = sorters.decrescent;
        break;
      case metrics.euclidean:
        this.sim = this.similarityCalculators.euclidean;
        this.similaritySorter = sorters.increscent;
        break;
      default:
        throw new Error(`Unknown metric method: ${metricName}`);
    }

    if (this.utility_matrix) this.setSimilarityMatrix();
    return;
  }

  setPredictor(predictorName) {
    switch (predictorName) {
      case predictors.collaborativeFiltering.userBased.simple:
        this.predict = this.collaborativeFiltering.userBased.simple;
        return;
      case predictors.collaborativeFiltering.userBased.meanDiff:
        this.predict = this.collaborativeFiltering.userBased.meanDiff;
        return;
      default:
        throw new Error(`Unknown prediction method: ${predictorName}`);
    }
  }


  // Calculate new full matrix
  calculate() {
    return this.utility_matrix
      .map((califications, u) => califications
        .map((calif, i) => calif !== undefined ? calif : this.predict(u, i)))
  }


  static printMatrix(matrix) {
    return this.formatMatrix(matrix).map(row => row.join(" ")).join("\n");
  }

  static formatMatrix(matrix) {
    return matrix.map((row) => row.map(val => val === undefined ? "-" : val.toFixed(2)));
  }
}
