const mongoose = require("mongoose")
const Schema = mongoose.Schema
// Essa collection será criada dentro do mesmo database, pois está pré-configurado para ser desta forma em admin
const Evento = new Schema({
    titulo: {
        type: String,
        required: true
    },
    assunto: {
        type: String,
        required: true
    },
    conteudo: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        required: true
    },
    imagem: {
        type: String, // vamos guardar o caminho que levará a imagem e não a imagem em si no Mongoose
        required: true
    },
    date: {
        type: Date,
        default: Date.now()
    }
})

mongoose.model("eventos", Evento) // para conseguir usar em outros módulos.