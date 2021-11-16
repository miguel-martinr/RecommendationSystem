console.log("hello")

let reader = new FileReader()


class Recommender {
    constructor() {

        reader.onload = () => {
            recommender.set_utility_matrix(reader.result)
        }
    }

    set_utility_matrix(matrix) {
        const not_value = "-"
        this.utility_matrix = matrix
            .split("\n")
            .map((str_row) => str_row.split(" "))
            .map((row) => row.map((char) => char == not_value ? undefined : parseInt(char)))
    }

    print() {
        let content = "\nRecomendador:\n"

        content += this.utility_matrix.map((row) => row.map(item => item === undefined ? "-" : item.toString()))
        content += "\n"

        console.log(content)
    }
}


// Leer matriz 
const readMatrix = (input_event) => {
    const { target } = input_event

    if (target.files.length < 1) {
        alert("Debes subir 1 matriz de utilidad")
    }

    file = file_input.files[0]
    reader.readAsText(file)
}



const recommender = new Recommender()





const file_input = document.getElementById('utility_matrix_input');
file_input.addEventListener('input', readMatrix)





