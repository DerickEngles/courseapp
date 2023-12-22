const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Usuario = new Schema({
    nome:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true
    },
    eAdmin: { // essa variável vai controla, mas especificamente o valor default vai controlar se o user é admin ou não. 0 será admin e 1 será um user comum
        type: Number,
        default: 0 
    },
    senha: {
        type: String,
        required: true
    },
    descricao: {
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
mongoose.model("usuarios", Usuario) // Esse primeiro "usuarios" é o nome que a coleção terá no mongoose

// Este model servirá para termos o cadastramento de usuário. O model alunos é para termos o salvamento das notas desses usuário que se cadastrarem no nosso curso, sendo que faremos a conexão entre aluno e usuário via e-mail.