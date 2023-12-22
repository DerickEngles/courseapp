const express = require("express") // 1
const router = express.Router() // 1 - Router é uma função express para criar rotas fora do arquivo principal
const mongoose = require("mongoose")
require("../models/Aluno")  // Aqui estou importando o model Aluno e abaixo estou salvando o em uma variável.
const Aluno = mongoose.model("alunos") // 4 alunos é o nome da collection no banco de dados. Variável salva uma referência do model na variável.
require("../models/Evento")
const Evento = mongoose.model("eventos")
const multer = require("multer") // importando o multer para o projeto
// const {eventosUpload} = require("../app")  o programa precisa sair do módulo admin, dps da pasta routes e ir até app.js - NÃO FUNCIONOU - Foi nossa tentativa de utilizar o multer do app.js
const {eAdmin} = require("../helpers/eAdmin") /* Dessa forma que foi criado, quer dizer que de dentro do módulo eAdmin, queremos apenas a função
eAdmin. Nisso, o programa cria uma variável para nós com o mesmo nome eADmin. Agora basta que carreguemos o nas rotas que desejamos proteger.*/


// Configuração do multer aqui:
const storageEventos = multer.diskStorage({ // a função diskStorage serve para manipularmos os arquivos após o upload. No caso, vamos usar para modificar o nome e extensão com a qual o arquivo é salvo
    destination: function(req, file, cb){ // aqui temos atríbutos da função diskStorage presente em multer 
        cb(null, 'public/img/eventos');// cb é de calback - destination controla onde o arquivo será salvo
    },
    filename: function(req, file, cb){ // essa função é para gerar um nome único para imagem que será salva
        // cb(null, file.originalname); - Seria para salvar a imagem com o nome original, mas corrigimos o problema do salvamento não estar salvando, tornando esse comando desnecessário
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) /* Aqui estamos incluindo a data atual de salvamento, um traço e uma sequência númerica aleatório*/
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const eventosUpload = multer({storage: storageEventos});
// Configuração do multer acima

router.get("/", eAdmin, (req, res) => { // rota para quando for localhost8081/admin
    // res.send("Página inicial da Administração") - FOI FEITO APENAS PARA TESTE
    res.render("admin/index") // 2 - renderização do index/template principal do meu arquivo de rotas - Quando utilizo o res.render(), por default, o express procurará uma pasta views e dentro dela a pasta que desejo pegar o template. Por isso, não preciso especificar views/admin/template_name
})

router.get("/alunos", eAdmin, (req, res) => { // 1 - rota para pegar o template para cadastrarmos os alunos, com id, nome, suas notas e média. Entenda que o nome /alunos é o nome que coloco na minha url
    //res.send("Página para inserimento dos alunos")
    // Não se esqueça que além de fazer a codificação de passar os alunos para o contexto da página, necessitamos preparar o HTML, onde vamos utilizar o each
    Aluno.find().lean().sort({date: 'desc'}).then((alunos) => { // como pode ver, eu poderia deixar sem esse (). Acho que o colocamos mais para questão de organização
        res.render("admin/alunos", {alunos: alunos}) // 3 - variável alunos criada agora que está recebendo os alunos vindos do database (alunos acima em then)
    }).catch((err) => {
        console.log(err)
        req.flash('error_msg', 'Houve um erro na listagem dos alunos!')
        res.redirect("/admin")
    })
})

router.get("/alunos/add", eAdmin, (req, res) => { // Lembre-se que as get são apenas para renderização da página. Vamos criar uma post para salvar no banco de dados
    res.render("admin/addalunos")
})

router.post("/alunos/addpost", eAdmin, (req, res) => {
    let erros = [] 

    if(!req.body.nome){ // req.body.nome is undefined or null or an empty string
        erros.push({texto: "Nome inválido"})
    }
    if(!req.body.email){
        erros.push({texto: "E-mail inválido"})
    }

    if(!req.body.javascript || Number(req.body.javascript) < 0 || Number(req.body.javascript) > 10){
        erros.push({texto: "Nota de JavaScript inválida"})
    }

    if(!req.body.html || Number(req.body.html) < 0 || Number(req.body.html) > 10){
        erros.push({texto: "Nota de HTML inválida"})
    }

    if(!req.body.css || Number(req.body.css) < 0 || Number(req.body.css) > 10){
        erros.push({texto: "Nota de CSS inválida"})
    }

    if(!req.body.node_js || Number(req.body.node_js) < 0 || Number(req.body.node_js) > 10){
        erros.push({texto: "Nota de Node.js inválida"})
    }

    if(!req.body.react || Number(req.body.react) < 0 || Number(req.body.react) > 10){
        erros.push({texto: "Nota de React inválida"})
    }

    if(!req.body.slug){
        erros.push({texto: "Slug inválido"})
    }

    if(erros.length > 0){
        res.render("admin/addalunos", {erros: erros}) // se houve erros na lista erros, vamos passar para o contexto do template add alunos e exibi-los na página. Esse admin é a pasta dentro de view
    }else{
        const novoAluno = { // vai guardar os dados digitados no template para que salvemos no banco de dados. Necessitamos fazer esse armazenamento em formato de objeto e o declaramos com const para que ele seja imutável
            nome: req.body.nome,
            email: req.body.email,
            javascript: req.body.javascript,
            html: req.body.html,
            css: req.body.css,
            node_js: req.body.node_js,
            react: req.body.react,
            slug: req.body.slug.toLowerCase()
        }
        /*
        O código abaixo está equivocado, pois é necessário verificar antes se temos um usuário cadastrado com o e-mail duplicado. Com esse código pode ser que fosse, em um dado momento, salvo o usuário antes de verificar. O código seguinte é o mais ideal
        new Aluno(novoAluno).save().then(() => { // then e catch são formas de sinalizar que a programação que ocorre aqui é de forma assíncrona
            req.flash('success_msg', 'Aluno novo registrado com sucesso!')
            res.redirect("/admin/alunos") // isso aqui é rota admin/alunos e não o template (quando for template, é sem a barra na frente)
        }).catch((err) => {
            console.log('Erro ao salvar aluno como Administrador:' + err)
            Aluno.find().then((aluno) => {
                if (aluno.email == req.body.email){
                    req.flash('error_msg', 'Já existe um aluno cadastrado com o e-mail fornecido! Tente novamente.') 
                    res.redirect("/admin/alunos/add")
                }else{
                    req.flash('error_msg', 'Houve um erro interno ao registrar o aluno! Tente novamente.') 
                    res.redirect("/admin/alunos")
                }
            })    
        })*/
        Aluno.findOne({email: req.body.email}).then((aluno) => { // eu poderia colocar req.body.email, mas isso não é interessante para organização do código
            if(aluno){ // se for true, ter um aluno com o e-mail fornecido, gerará um erro específico para essa situação
                req.flash('error_msg', 'Já existe um aluno cadastrado com o e-mail fornecido! Tente novamente.') 
                res.redirect("/admin/alunos/add")
            } else {
                new Aluno(novoAluno).save().then(() => { // declarando o objeto em Aluno, collection formado pelo model Aluno
                    req.flash('success_msg', 'Aluno novo registrado com sucesso!')
                    res.redirect("/admin/alunos")
                }).catch((err) => {
                    console.log(err)
                    req.flash('error_msg', 'Houve um erro interno ao registrar o aluno! Tente novamente.') 
                    res.redirect("/admin/alunos")
                })
            }
        })
    }
})

// É possível manter a validação de e-mail, pois em editar não estamos fazendo uma verificação para saber se o e-mail é igual a um existente ou não. Só fazemos ao adicionar um novo aluno
// Crio um get primeiro, pois vou acessar uma página de edição. Após isso, crio o post para enviar os dados editados do template para o banco
router.get("/alunos/editar/:id", eAdmin, (req, res) => { // tem /alunos, pois é uma rota. O template onde clicamos para fazer é essa edição tem o id sendo passado pelo botão para acessar essa rota. Esse id será declarado na url para ser passado para a rota post abaixo.
    console.log('Estou aqui')
    Aluno.findOne({_id: req.params.id}).lean().then((aluno) => {  // lembrando que esse aluno em then poderia ter sido chamado de qualquer coisa. É como item de itens
        res.render("admin/editalunos", {aluno: aluno}) // sem barra, pois estou acessando uma pasta
    }).catch((err) => {
        console.log(err)
        req.flash('error_msg', 'Este aluno não existe!')
        res.redirect("/admin/alunos")
    })
})

router.post("/alunos/editpost", eAdmin, (req, res) => {
    let erros = []

    if(!req.body.nome){ // req.body.nome is undefined or null or an empty string
        erros.push({texto: "Nome inválido"})
    }
    if(!req.body.email){
        erros.push({texto: "E-mail inválido"})
    }

    if(!req.body.javascript || Number(req.body.javascript) < 0 || Number(req.body.javascript) > 10){
        erros.push({texto: "Nota de JavaScript inválida"})
    }

    if(!req.body.html || Number(req.body.html) < 0 || Number(req.body.html) > 10){
        erros.push({texto: "Nota de HTML inválida"})
    }

    if(!req.body.css || Number(req.body.css) < 0 || Number(req.body.css) > 10){
        erros.push({texto: "Nota de CSS inválida"})
    }

    if(!req.body.node_js || Number(req.body.node_js) < 0 || Number(req.body.node_js) > 10){
        erros.push({texto: "Nota de Node.js inválida"})
    }

    if(!req.body.react || Number(req.body.react) < 0 || Number(req.body.react) > 10){
        erros.push({texto: "Nota de React inválida"})
    }

    if(!req.body.slug){
        erros.push({texto: "Slug inválido"})
    }

    if(erros.length > 0){
        res.render("admin/editalunos", {erros: erros, aluno: {_id: req.body.id}}) // se houve erros na lista erros, vamos passar para o contexto do template add alunos e exibi-los na página. Esse admin é a pasta dentro de view. 
        // Estamos repassando o id que vei da página editalunos, novamente, caso tenhamos erros de validação, tendo em vista que ele é perdido quando vem para está rota post
    }else{ // se deu tudo certo na validação, vamos passar o id para encontrar o aluno:
        
        // Decidir por não inserir a validação de e-mail aqui, pois caso fosse colocar o e-mail antigo do aluno, a API detectaria que temos usuário com o e-mail e não conseguiriamos fazer a edição com o mesmo e-mail de antes.

        Aluno.findOne({_id: req.body.id}).then((aluno) => { // aluno em then poderia ter qualquer outro nome
            // Os valores aqui não são separados por vírgula, pois não estou definindo atributos em uma variável diferente do que é feito na const novoAluno. Aqui estou pegando atributos de uma variável e os definindo individualmente.
            aluno.nome = req.body.nome
            aluno.email = req.body.email
            aluno.javascript = req.body.javascript
            aluno.html = req.body.html
            aluno.css = req.body.css
            aluno.node_js = req.body.node_js
            aluno.react = req.body.react
            aluno.slug = req.body.slug.toLowerCase()
        
        aluno.save().then(() => {
            // Utilizando concatenação req.flash('success_msg', 'Aluno ' + aluno.nome + ' editado com sucesso'). Embaixo, usamos interpolação, que deve ser acompanhada pela crase
            req.flash('success_msg', `Aluno ${aluno.nome} editado com sucesso`)
            res.redirect("/admin/alunos")
        }).catch((err) => {
            console.log(err)
            req.flash('error_msg', 'Houve um erro interno ao salvar o aluno editado no banco de dados!')
            res.redirect("/admin/alunos")
        })

        }).catch((err) => {
            console.log(err)
            req.flash('error_msg', 'Houve um erro ao encontrar o aluno no banco de dados!')
            res.redirect("/admin/alunos")
        })
    }
})

// Vou apenas passar o id para o banco e executar o delete. Por esse motivo, não passei esse id na rota, como fizemos com o get de edição de aluno
router.post("/alunos/deletar", eAdmin, (req, res) => {
    Aluno.deleteOne({_id: req.body.id}).then(() => {
        req.flash('success_msg', 'Aluno deletado com sucesso!')
        res.redirect("/admin/alunos")
    }).catch((err) => {
        console.log(err)
        req.flash('error_msg', 'Houve um erro ao deletar o aluno!')
        res.redirect("/admin/alunos")
    })
})

router.get("/eventos", eAdmin, (req, res) => { // 1 - rota para pegar o template para cadastrar eventos que serão exibidos na página principal do site da faculdade
    // res.send("Página para a criação de eventos que serão exibidos na página principal")
    Evento.find().lean().sort({date: 'desc'}).then((eventos) => {
        res.render("admin/eventos", {eventos: eventos}) // poderia passar eventos diretamente. Contudo é mais interessanto colocá-los dentro de uma nova var eventos antes de passá-las no template
    }).catch((err) =>{
        console.log(err)
        req.flash('error_msg', 'Houve um erro ao listas os eventos')
        res.redirect('/admin')
    })
    
})

router.get("/eventos/add", eAdmin, (req, res) => {
    res.render("admin/addeventos")
})

router.post("/eventos/addpost", eAdmin, eventosUpload.single("imagem"), (req, res) => { // estou sinalizando que o campo file terá a imagem a ser salva no diretório. Para isso, coloquei o nome desse campo (imagem) do HTML addeventos
    let erros = []

    if(!req.body.titulo){ // req.body.titulo is undefined or null or an empty string
        erros.push({texto: "Título inválido"})
    }
    if(!req.body.assunto){
        erros.push({texto: "Assunto inválido"})
    }
    if(!req.body.conteudo){
        erros.push({texto: "Conteúdo inválido"})
    }

    if(!req.body.slug){
        erros.push({texto: "Slug inválido"})
    }

    image_path_default = "/img/eventos/default.png" // lógica para salvarmos uma imagem default caso nenhum nos tenha sido fornecida pelo user
    if(req.file){
        const caminhoCorrigido = req.file.path.replace(/\\/g, '/'); // Nessa situação fizemos a inversão do caminho do endereço que iremos salvar no banco, pois ele estava sendo salvo de uma forma que para o windows conseguir realizar o acesso, era impossível (invertemos as barras que estão em um formato mais para Linix)
        const caminhoSemPublic = caminhoCorrigido.replace('public/', '/'); // Aqui fizemos a substituição de public/ por uma /, pois um public implícito já é passado pela aplicação para o sistema acessar a pasta public, conforme definido em app.js, no qual passamos um caminho absoluto
        image_path_default = caminhoSemPublic
    }

    if(erros.length > 0){
        res.render("admin/addeventos", {erros: erros}) // se houve erros na lista erros, vamos passar para o contexto do template add alunos e exibi-los na página. Esse admin é a pasta dentro de view
    }else{
// NÃO ESTAVA FUNCIONANDO, POIS ESTAVA SALVANDO NO BANCO COM O PUBLIC. AO REMOVER, CONSEGUIMOS TER ACESSO A IMAGEM. PUBLIC JÁ É ACESSÍVEL NO PROGRAMA TODO POR CONTA DE ESTAR EM APP.JS E SER DECLARO COMO GLOBAL

            const novoEvento = {
            titulo: req.body.titulo,
            assunto: req.body.assunto,
            conteudo: req.body.conteudo,
            slug: req.body.slug,
            imagem: image_path_default // utilizamos filename para salvar apenas o nome da imagem. Temos acesso ao filename, 
            // função criada no multer, pois estamos passando eventosUpload para a rota.
             //imagem: caminhoCorrigido // .path para salvar o caminho do file que será feito o upload.
        }

        new Evento(novoEvento).save().then(() =>{
            req.flash('success_msg', 'Evento criado com sucesso!')
            res.redirect('/admin/eventos')
        }).catch((err) => {
            req.flash('error_msg', 'Houve um erro durante o salvamento do evento!')
            res.redirect('/admin')
        })
    }
})

router.get("/eventos/editar/:id", eAdmin, (req, res) => { // tem /alunos, pois é uma rota
    console.log('Estou aqui')
    Evento.findOne({_id: req.params.id}).lean().then((evento) => {  // lembrando que esse aluno em then poderia ter sido chamado de qualquer coisa. É como item de itens
        res.render("admin/editeventos", {evento: evento}) // sem barra, pois estou acessando uma pasta
    }).catch((err) => {
        console.log(err)
        req.flash('error_msg', 'Este evento não existe!')
        res.redirect("/admin/eventos")
    })
})

router.post("/eventos/editpost", eAdmin, eventosUpload.single("imagem"), (req, res) => {
    let erros = []

    if(!req.body.titulo){ // req.body.titulo is undefined or null or an empty string
        erros.push({texto: "Título inválido"})
    }
    if(!req.body.assunto){
        erros.push({texto: "Assunto inválido"})
    }
    if(!req.body.conteudo){
        erros.push({texto: "Conteúdo inválido"})
    }

    if(!req.body.slug){
        erros.push({texto: "Slug inválido"})
    }

    // lógica para imagem feita igual a que foi feita na rota usuario.js
    let nova_imagem = ""
    if(req.file){
        const caminhoCorrigido = req.file.path.replace(/\\/g, '/'); // Nessa situação fizemos a inversão do caminho do endereço que iremos salvar no banco, pois ele estava sendo salvo de uma forma que para o windows conseguir realizar o acesso, era impossível (invertemos as barras que estão em um formato mais para Linix)
        const caminhoSemPublic = caminhoCorrigido.replace('public/', '/'); // Aqui fizemos a substituição de public/ por uma /, pois um public implícito já é passado pela aplicação para o sistema acessar a pasta public, conforme definido em app.js, no qual passamos um caminho absoluto
        nova_imagem = caminhoSemPublic

    }

    if(erros.length > 0){
        res.render("admin/editeventos", {erros: erros, evento: {_id: req.body.id}}) // esse evento é aquele que veio da página editeventos
    
    }else{

        Evento.findOne({_id: req.body.id}).then((evento) => { // vamos pesquisar esse evento no banco de dados 
            console.log(evento.titulo)
            evento.titulo = req.body.titulo // é sinal de igual, pois agora estamos atribuindo o valor a uma var e não mais fazendo um dict
            evento.assunto = req.body.assunto
            evento.conteudo = req.body.conteudo
            evento.slug = req.body.slug

            if(nova_imagem){
                evento.imagem = nova_imagem
            }else{
                evento.imagem = evento.imagem
            } 
        
        evento.save().then(() =>{ // o evento do then
            req.flash('success_msg', `Evento intitulado ${evento.titulo} editado com sucesso!`)
            res.redirect("/admin/eventos")
        }).catch((err) =>{
            console.log(err)
            req.flash('error_msg', 'Houve um erro interno no salvamento da edição do evento no banco de dados!')
            res.redirect("/admin/eventos")
        }) 

        }).catch((err) => {
            console.log(err)
            req.flash('error_msg', 'Houve um erro ao encontrar o evento no banco de dados!')
            res.redirect("/admin/eventos")
        })
    }
})

router.post("/eventos/deletar", eAdmin, (req, res) => {
    Evento.deleteOne({_id: req.body.id}).then(() => {
        req.flash('success_msg', 'Evento deletado com sucesso!')
        res.redirect("/admin/eventos")
    }).catch((err) => {
        console.log(err)
        req.flash('error_msg', 'Houve um erro ao deletar o evento!')
        res.redirect("/admin/eventos")
    })
})

module.exports = router // 1 - sem esse comando, não há como mandar a informação para app.js ou qualquer outra parte da aplicação que necessitamos desse módulo admin.js