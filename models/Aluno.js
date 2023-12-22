const mongoose = require("mongoose")
const Schema = mongoose.Schema

const Aluno = new Schema({
    nome: {
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true,
        unique: true
    },
    javascript:{
        type: Number, // Number já serve para reconhecer se o valor vai ser int ou float
        required: true,
        default: 0
    },
    html: {
        type: Number,
        required: true,
        default: 0
    },
    css: {
        type: Number,
        required: true,
        default: 0
    },
    node_js:{
        type: Number,
        required: true,
        default: 0
    },
    react: {
        type: Number,
        required: true,
        default: 0
    },
    media: {/*O uso de um valor padrão referenciando outros campos no esquema não é simples no Mongoose. Você não pode fazer referência 
    direta a outros campos no atributo padrão do esquema. No entanto, você pode definir um gancho de pré-salvamento para calcular e preencher
     o campo de mídia antes de salvar os dados no banco de dados. */
        type: Number,
        default: 0
    },
    slug: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now()
    }
})

Aluno.pre('save', function(next){  // Não podemos usar uma arrow function  aqui, pois ela não acessa o this como a função normal de callback faz
    this.media = (this.javascript + this.html + this.css + this.node_js + this.react)/5; // o field media acima será salvo com esse cálculo
    next();
})

/* O chatgpt não recomendou fazer a função abaixo, tendo em vista que funções como pre-save, pois ela é do tipo não promise, que não retornam informações de erro.
COntudo, é possível fazer

Aluno.pre('save', async function(next) {
    try {
        this.media = (this.javascript + this.html + this.css + this.node_js + this.react) / 5;
        next();
    } catch (err) {
        console.log("Erro no pre-save de média: " + err);
        next(err);
    }
});
*/

mongoose.model("alunos", Aluno) // alunos é a collection no MongoDB