const MAX_RATING = 5;

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

const normalizers = {
  pearsonNormalizer: (val) => val/2 + 1/2,
  cosineNormalizer: (val) => val,
  euclideanNormalizer: (val, numbOfItems) => (-val / Math.sqrt((MAX_RATING ** 2) * numbOfItems)) + 1
}



export class Recommender {

  /**
   * this.numOfNeighbors: Number of neighbors to consider
   * this.metricName: Metric to use (name)
   * this.predictorName: Prediction method to use (name)
   * this.utilityMatrix: Matrix of califications
   * this.similarityMatrix: Matrix of similarities
   * this.similaritySorter: Function to sort similarities
   */


  constructor() {
    this.numOfNeighbors = 3;

    this.similaritySorter = sorters.decrescent;
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
        const normalizedSim = this.simNormalizer(this.sim(u, v), this.utilityMatrix[0].length);
        similarityMatrix[u].push(normalizedSim);
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
    const iUsers = this.utilityMatrix.map((ratings, u) => ratings[i] === undefined ? undefined : u).filter(u => u !== undefined); // Get all users that have rated item i
    
    const userCalifications = this.utilityMatrix[u];
    if (!userCalifications) throw new Error(`There's not any user at index ${u}`);

    const similarityMatrix = this.similarityMatrix;
    const usersSimilarity = iUsers.map(v => ({index: v, sim: similarityMatrix[u][v]}));

    const result = usersSimilarity.sort((a, b) => this.similaritySorter(a.sim, b.sim)).slice(0, neighborsNum);

    return result;
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
        this.simNormalizer = normalizers.pearsonNormalizer;
        break;

      case metrics.cosine:
        this.sim = this.similarityCalculators.cosine;
        this.simNormalizer = normalizers.cosineNormalizer;
        break;

      case metrics.euclidean:
        this.sim = this.similarityCalculators.euclidean;
        this.simNormalizer = normalizers.euclideanNormalizer;
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


  // Calculate new full matrix (with predictions)
  calculate() {
    return this.utilityMatrix
      .map((califications, u) => califications
        .map((calif, i) => calif !== undefined ? calif : this.predict(u, i)))
  }


  getNeighborLog() {
    return this.emptyItems.map(([u, i]) => {
      const neighborsUsed = this.getNearestNeighbors(u, this.numOfNeighbors, i).map(n => n.index);
      return {
        u,
        i,
        neighborsUsed
      }
    });
  }


  static printMatrix(matrix) {
    return this.formatMatrix(matrix).map(row => row.join(" ")).join("\n");
  }

  static formatMatrix(matrix) {
    return matrix.map((row) => row.map(val => val === undefined ? "-" : val.toFixed(2)));
  }


}
