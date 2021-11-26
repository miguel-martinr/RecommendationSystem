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
    this.numOfNeighbors = 3;

    this.setMetric(metrics.pearson);
    this.setPredictor(predictors.collaborativeFiltering.userBased.meanDiff);
  }

  setUtilityMatrix(matrix) {
    const not_value = "-";;
    this.utilityMatrix = matrix
      .trim()
      .split("\n")
      .map((str_row) => str_row.trim().split(" "))
      .map((row) => row.map((value) => value == not_value ? undefined : parseFloat(value)))

    this.setSimilarityMatrix();
  }

  setSimilarityMatrix(matrix) {
    if (!matrix) this.similarityMatrix = this.calculateSimilarityMatrix();
    else this.similarityMatrix = matrix;
  }

  get emptyItems() {
    const positions = [];
    this.utilityMatrix.forEach((row, i) => {
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

      const uMean = this.getUserMean(u);
      const vMean = this.getUserMean(v);

      for (let i = 0; i < this.utilityMatrix[0].length; i++) {

        // r(u, i)
        const rU = this.utilityMatrix[u][i];
        // r(v, i)
        const rV = this.utilityMatrix[v][i];

        // Work only on Suv set
        if (rU === undefined || rV === undefined) continue;

        const uDiff = rU - uMean;
        const vDiff = rV - vMean;

        A += uDiff * vDiff;

        Bu += uDiff ** 2;
        Bv += vDiff ** 2;
      }


      return A / Math.sqrt(Bu * Bv);
    },

    cosine(u, v) {

      // SUM[r(u, i) * r(v, i)]
      let A = 0;

      // Bx = SUM[r(x, i) ^ 2]
      let Bu = 0;
      let Bv = 0;

      for (let i = 0; i < this.utilityMatrix[0].length; i++) {
        // r(u, i)
        const rU = this.utilityMatrix[u][i];
        // r(v, i)
        const rV = this.utilityMatrix[v][i];

        // Work only on Suv set
        if (rU === undefined || rV === undefined) continue;

        A += rU * rV;
        Bu += rU ** 2;
        Bv += rV ** 2;
      }

      return A / Math.sqrt(Bu * Bv);
    },

    euclidean(u, v) {
      let A = 0;
      for (let i = 0; i < this.utilityMatrix[0].length; i++) {
        // r(u, i)
        const rU = this.utilityMatrix[u][i];
        // r(v, i)
        const rV = this.utilityMatrix[v][i];

        // Work only on Suv set
        if (rU === undefined || rV === undefined) continue;

        A += (rU - rV) ** 2
      }

      return Math.sqrt(A);
    }
  }

  calculateSimilarityMatrix() {
    const similarityMatrix = [];
    for (let u = 0; u < this.utilityMatrix.length; u++) {
      similarityMatrix.push([]);
      for (let v = 0; v < this.utilityMatrix.length; v++) {
        similarityMatrix[u].push(this.sim(u, v));
      }
    }

    return similarityMatrix;
  }

  // Returns userIndex mean of califications
  getUserMean(userIndex) {
    const userCalifications = this.utilityMatrix[userIndex];

    if (!userCalifications) throw new Error(`There's not any user at index ${userIndex}`);

    let numOfCalifications = 0;
    const calificationsSum = userCalifications.reduce((sum, calif) => {
      if (calif === undefined) return sum;

      numOfCalifications++;
      return sum + calif;
    }, 0);

    return calificationsSum / numOfCalifications;
  }



  // Gets k nearest neighbors to userIndex user (according to sim function)
  getNearestNeighbors(u, neighborsNum, i) {
    const userCalifications = this.utilityMatrix[u];

    if (!userCalifications) throw new Error(`There's not any user at index ${u}`);

    const similarityMatrix = this.similarityMatrix;
    const usersSimilarity = similarityMatrix[u].map((sim, index) => ({ index, sim }));

    const sorted = usersSimilarity.sort((a, b) => this.similaritySorter(a.sim, b.sim))
    .slice(1); // Ignores similarity with u itself (1)

    let result = [];
    let j = 0;
    while (result.length < neighborsNum && j < sorted.length) {
      const neighbor = sorted[j++];
      if (this.utilityMatrix[neighbor.index][i] === undefined) continue;
      result.push(neighbor);
    }

    return  result;
  }


  // Prediction methods
  collaborativeFiltering = {
    userBased: {
      simple(u, i) {
        const neighbors = this.getNearestNeighbors(u, this.numOfNeighbors, i);
        // SUM[ sim(u, v) * r(v, i)]
        let A = 0;
        // SUM[ |sim(u, v)|]
        let B = 0;

        neighbors.forEach((neighbor) => {
          const rV = this.utilityMatrix[neighbor.index][i];

          A += neighbor.sim * rV;
          B += Math.abs(neighbor.sim);
        });

        return A / B;
      },

      meanDiff(u, i) {
        const neighbors = this.getNearestNeighbors(u, this.numOfNeighbors, i);
        // SUM[ sim(u, v) * r(v, i)]
        let A = 0;
        // SUM[ |sim(u, v)|]
        let B = 0;


        neighbors.forEach((neighbor) => {
          const rV = this.utilityMatrix[neighbor.index][i];

          if (rV === undefined) return;

          A += neighbor.sim * (rV - this.getUserMean(neighbor.index));
          B += Math.abs(neighbor.sim);
        });

        const uMean = this.getUserMean(u);
        return uMean + A / B;
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

    this.metricName = metricName;
    if (this.utilityMatrix) this.setSimilarityMatrix();
    return;
  }

  setPredictor(predictorName) {
    switch (predictorName) {

      case predictors.collaborativeFiltering.userBased.simple:
        this.predict = this.collaborativeFiltering.userBased.simple;
        break;

      case predictors.collaborativeFiltering.userBased.meanDiff:
        this.predict = this.collaborativeFiltering.userBased.meanDiff;
        break;

      default:
        throw new Error(`Unknown prediction method: ${predictorName}`);

    }

    this.predictorName = predictorName;
  }


  // Calculate new full matrix
  calculate() {
    return this.utilityMatrix
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
