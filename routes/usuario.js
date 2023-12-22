const express = require('express')
const router = express.Router() // para ter um maior direcionamento das rotas
const mongoose = require('mongoose') // para ter acesso aqui aos dados no mongoose
require("../models/Usuario") // para ter acesso aqui ao models
const Usuario = mongoose.model("usuarios") // para ter, diretamente, a um acesso a essa coleção no banco de dados
require("../models/Aluno")
const Aluno = mongoose.model("alunos")
const bcrypt = require("bcryptjs") // Para trabalhar com hash - modificar o formato da senha
const passport = require("passport")
const multer = require("multer") 
const eAdmin = require('../helpers/eAdmin')


/*
O passport é um middleware muito popular em aplicativos Node.js, usado para autenticação. Ele oferece uma maneira flexível e extensível de autenticar usuários em aplicativos web. Sua versatilidade permite que diferentes estratégias de autenticação sejam implementadas, como autenticação local (usando nome de usuário e senha), OAuth, JWT (JSON Web Tokens), entre outros.

Com o passport, você pode definir várias estratégias de autenticação e aplicar lógica personalizada para verificar credenciais de usuários, gerenciar sessões e controlar o acesso a rotas protegidas.

Ele é frequentemente combinado com estratégias como passport-local para autenticação baseada em senha, passport-jwt para autenticação usando tokens JWT e passport-oauth para integração com provedores de terceiros (como Google, Facebook, etc.).

No seu código, ao usar o passport, você pode configurá-lo para lidar com a autenticação de usuários, definindo estratégias de autenticação e gerenciando os processos de login e logout no seu aplicativo. */

// Configuração do multer para salvar as imagens dos usuários:
const storageUsuarios = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, 'public/img/usuarios');
    },
    filename: function(req, file, cb){
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const usuariosUpload = multer({storage: storageUsuarios});

router.get("/index", (req, res) => { // Eu havia colocado usuarios, mas mudei para index, pois index já representa a rota principal.
    Usuario.find({eAdmin: 0}).lean().sort({data: "desc"}).then((usuarios) => { // {} - fazer dentro das chaves, nos permite passar para o filtro um dado em formato de objeto, que é o necessário para fazer tal operação e não como um operador direto como tentamos fazer eAdmin == 0
        res.render("usuarios/index", {usuarios: usuarios})
    }).catch((err) => {
        console.log(err)
        req.flash('error_msg', 'Houve um erro ao carregar os usuário!')
        res.redirect("/")
    })
})


router.get("/registro", (req, res) => {
    res.render("usuarios/registro")
})
// a rota get e set têm o mesmo nome, pois os dados do form de registro será trato por essa mesma rota. Elas estarão separadas aqui, mas procure entender como elas fazendo parte de uma coisa só. Lembre-se que quando for enviar e tratar os dados na mesma rota, não precisamos definir o action no html. O programa é inteligente para saber que ele vai acionar a de cima quando for get e a de baixo quando houver um envio de dados.

router.post("/registro", usuariosUpload.single("imagem"), (req, res) => {
    var erros = []

    if(!req.body.nome){
        erros.push({texto: "Nome inválido"})
    }

    if(!req.body.email){
        erros.push({texto: "E-mail inválido"})
    }

    if(!req.body.descricao){
        erros.push({texto: "Descrição inválida"})
    }

    if(!req.body.senha){
        erros.push({texto: "Senha inválida"})
    }

    if(req.body.senha.length < 4){
        erros.push({texto: "Senha muito curta!"})
    }

    if(req.body.senha != req.body.senha2){ // O senha2 serve apenas para uma verificação
        erros.push({texto: "As senhas são diferentes. Tente novamente!"})
    }

    imagepath = "/img/usuarios/default.jpg"

    if(req.file){
        const caminhoCorrigido = req.file.path.replace(/\\/g, '/');
        const caminhoSemPublic = caminhoCorrigido.replace('public/', '/');
        imagepath = caminhoSemPublic;
    }

    if(erros.length > 0){
        res.render("usuarios/registro", {erros:erros})
    }else{

        Usuario.findOne({email: req.body.email}).then((usuario) => {
            if(usuario){
                req.flash('error_msg', 'Já existe uma conta com o e-mail informado!')
                res.redirect("usuarios/registro")
            }else{
                const novoUsuario = new Usuario({
                    nome: req.body.nome,
                    email: req.body.email,
                    descricao: req.body.descricao,
                    senha: req.body.senha,
                    imagem: imagepath
                })
                /*No contexto da criptografia de senhas, o "salt" (sal) é uma sequência de bytes aleatórios gerada de forma aleatória. O objetivo do salt é adicionar entropia e tornar mais difícil a decodificação de senhas usando ataques de força bruta ou tabelas de hash pré-computadas.

                O `bcrypt` utiliza o salt para criar um hash seguro de uma senha. O "hash" é uma sequência de caracteres criptografados e é o resultado da operação de hash. No caso do `bcrypt`, ele usa um algoritmo de hash forte e iterativo para gerar esse hash.

                No `bcrypt.hash`, os argumentos são:

                    1. `novoUsuario.senha`: É a senha que você deseja criptografar.
                    2. `salt`: É o sal gerado anteriormente, que é usado para criar o hash.
                    3. Callback de erro e hash: O callback é uma função que será executada após o término do processo de hash. Ela recebe dois parâmetros, o primeiro para erros, caso ocorram, e o segundo para o hash gerado.

                    O nome `hash` é comumente usado para se referir ao resultado criptografado da senha, mas poderia ter outro nome, se preferir. No entanto, manter o nome `hash` é uma prática comum e facilita a compreensão do código por outros desenvolvedores. */
                bcrypt.genSalt(10, (erro, salt) => { // 10 é um argumento da função genSalt de bcrypt que é uma forma de controlar o tempo que um hash leva para ser computado. Representa o tamanho dele. Além disso, estamos passando para essa função uma função de callback que contém o erro e o salt, nome que demos para o argumento que vai conter a senha/hash caso não tenha erros 
                    bcrypt.hash(novoUsuario.senha, salt, (erro, hash) => {
                        if(erro){
                            console.log(erro)
                            req.flash('error_msg', 'Houve um erro durante o salvamento do usuário!')
                            res.redirect("/")
                        }

                        // Só vamos salvar o usuário no banco se o hashamento da senha dele tiver funcionado.
                        novoUsuario.senha = hash

                        novoUsuario.save().then(() => {
                            req.login(novoUsuario, function(err) { // o Express.js possui um método chamado de login para fazer autenticação de usuários. Além desse, ele possui um de logout tb, onde os passport pode se integrar ao dois.
                                if(err){ // se houve erro:
                                    console.error(err)
                                    req.flash('error_msg', 'Erro ao fazer login após o registro!')
                                    res.redirect('/')
                                } // Caso contrário, o usuário é criado e autenticado
                                req.flash('success_msg', `Usuário criado com sucesso! Bem vindo(a), ${novoUsuario.nome}!`)
                                res.redirect("/")
                            })
                        }).catch((err) => {
                            console.log(err)
                            req.flash('error_msg', 'Houve um erro ao registrar o usuário!')
                        })
                    })
                })
            }
        }).catch((err) => {
            console.log(err)
            req.flash('error_msg', 'Houve um erro interno!')
            res.redirect("/")
        })
    }
})

router.get("/boletim", (req, res) =>{ // O botão, de fato, some do navbar quando o user está deslogado. Contudo a rota continua ativa. Então, por medidas de segurança, utilizamos o eAdmin para proteger a rota.
    const id_user_auth = req.user._id // salvando o id do user logado. COnsigo acesso, pois user é uma variável global. Utilizando o Passport.js, especificamente, pois configuramos corretamente a serialização do usuário, podemos acessar os dados do usuário autenticado através desse objeto req.user, cotém os dados do usuário no caso. 
    Usuario.findOne({_id: id_user_auth}).then((usuario) => {
        if (usuario){ // Temos que ter um aluno já cadastrado para termos a geração de um boletim. 
            Aluno.findOne({email: usuario.email}).lean().then((aluno) => {
                if(aluno){
                    res.render("usuarios/boletim", {aluno: aluno})
                } else {
                    req.flash('error_msg', 'Aluno não encontrado ou não cadastrado!')
                    res.redirect('/')
                }
            })
        } else {
            req.flash('error_msg', 'Usuário não encontrado!')
            res.redirect('/')
        }
    })
})

router.get("/edituser", (req, res) => {
    const id_user_auth = req.user._id
    Usuario.findOne({_id: id_user_auth}).lean().then((usuario) => {
        res.render("usuarios/editaruser", {usuario: usuario})
    }).catch((err) => {
        console.log(err)
        req.flash('error_msg', 'Usuário não localizado!')
        res.redirect("/")
    })
})

// CHECAR A QUESTÃO DA IMAGEM, FAZER UMA LÓGICA PARA MANTER A IMAGEM QUE ESTAVA SALVA E NÃO SUBSTITUIR PELA DEFAULT E VER COMO CRIAR UMA NOVA SESSÃO PARA ESSE USER CONTINUAR LOGADO
router.post("/edituser", usuariosUpload.single("imagem"), (req, res) =>{
    const id_user_auth = req.user._id

    var erros = []

    if(!req.body.nome){
        erros.push({texto: "Nome inválido"})
    }

    if(!req.body.email){
        erros.push({texto: "E-mail inválido"})
    }

    if(!req.body.descricao){
        erros.push({texto: "Descrição inválida"})
    }

    if(!req.body.senha){
        erros.push({texto: "Senha inválida"})
    }

    if(req.body.senha.length < 4){
        erros.push({texto: "Senha muito curta!"})
    }

    if(req.body.senha != req.body.senha2){ // O senha2 serve apenas para uma verificação
        erros.push({texto: "As senhas são diferentes. Tente novamente!"})
    }

    let nova_imagem = "" // diferente do const, let permite que a variável seja reatribuida.
    if(req.file){ // Não é possível definir um input do tipo file no HTML. Então, caso o usuário decida mudar sua foto, ou seja, req.file não vazio, será executada a lógica abaixo
        const caminhoCorrigido = req.file.path.replace(/\\/g, '/');
        const caminhoSemPublic = caminhoCorrigido.replace('public/', '/');
        nova_imagem = caminhoSemPublic;
    }

    if(erros.length > 0){
        res.render("usuarios/registro", {erros:erros})
    }else{

        Usuario.findOne({_id: id_user_auth}).then((usuario) => {
            usuario.nome = req.body.nome
            usuario.email = req.body.email
            usuario.descricao = req.body.descricao
            usuario.senha = req.body.senha

            if(nova_imagem){ // Se foi salvo em nova imagem uma nova foto, essa substituirá a antiga. Caso contrário, antiga se mantém.
                usuario.imagem = nova_imagem
            }else{
                usuario.imagem = usuario.imagem
            }
                                

            bcrypt.genSalt(10, (erro, salt) => {
                bcrypt.hash(usuario.senha, salt, (erro, hash) => {
                    if(erro){
                        console.log(erro)
                        req.flash('error_msg', 'Houve um erro durante o hashamento e salvamento do usuário!')
                        res.redirect("/")
                    }

                    usuario.senha = hash

                    usuario.save().then(() => {
                        req.login(usuario, function(err) { // Estamos utilizando o login novamente. Quando o usuário atualizar os dados, ele será logado novamente e isso atualizará a sessão.
                            if(err){ // se houve erro:
                                console.error(err)
                                req.flash('error_msg', 'Erro ao manter a sessão do usuário!')
                                res.redirect('/')
                            } // Caso contrário, o usuário é criado e autenticado
                            req.flash('success_msg', `Atualização feita com sucesso, ${usuario.nome}!`)
                            res.redirect("/")
                        })
                    }).catch((err) => {
                        console.log(err)
                        req.flash('error_msg', 'Houve um erro ao registrar as alterações feitas!')
                    })
                })
            })

        }).catch((err) => {
            console.log(err)
            req.flash('error_msg', 'Houve um erro ao encontrar o usuário no banco de dados!')
            res.redirect("/")
        })
    }
})


router.get("/login", (req, res) => {
    res.render("usuarios/login")
})

/*
O express.js já fornece ferramentas de login e logout. O passport é uma biblioteca específica para lidar com autenticação. Podemos utilizar a abordagem
que foi feito no curso de node. Contudo, poderiamos ter utilizado apenas as funções do express.js para fazer isso e tornar o programa mais simples, do que
ter centralizado a questão de login no auth.js, como em:

router.post('/login', (req, res, next) => {
    // Realizar a autenticação aqui, verificar as credenciais do usuário

    // Se as credenciais estiverem corretas, autenticar o usuário
    req.login(user, (err) => {
        if (err) {
            // Lidar com erros de login, se houver
            return next(err);
        }
        // Redirecionar ou retornar alguma resposta após o login
        res.redirect('/');
    });
});

// Rota de logout
router.get('/logout', (req, res) => {
    // Fazer logout do usuário
    req.logout();
    // Redirecionar ou retornar alguma resposta após o logout
    res.redirect('/');
});

*/

// Poderiamos fazer o inserimento das mensagens de login sucedido na rota abaixo ou no arquivo auth.js. Entretanto, normalmente, é feito no arquivo de rotas. Então, vamos seguir fazer aqui.
router.post("/login", (req, res, next) => { // As mensagens abaixo serão definidas no meu auth.js, módulo para realizar as autenticações, dentro de config
    passport.authenticate("local", { // sempre chamamos a função authenticate sempre que desejamos fazer uma atenticação. Abaixo vamos passar três campos
        successRedirect: "/", // em caso de sucesso, quero que o usuário seja redirecionado para a rota principal
        //successFlash: 'Logado com sucesso. Bem-vindo!', // NÃO FUNCIONA
        failureRedirect: "/usuarios/login", // em caso de insucesso na autenticação
        failureFlash: true // aqui estamos habilitando as mensagens flash de autenticação. Foi o flash definido no middleware lá em app.js
        // failureFlash: "Endereço de e-mail ou senha incorretos!", - esse não é necessário, pois já estamos definindo mensagens de falha dentro do auth.js. Então, declarando o de cima como true, estamos os habilitando.
    })(req, res, next) 

    // req.flash('success_msg', 'Logado com sucesso. Bem-vindo!'); - Não funcionou
    // console.log(req.flash('success_msg'))
})

router.get("/logout", (req, res) => {
    req.logOut((err) =>{
        if(err){
            req.flash('error_msg', 'Erro ao deslogar')
            return next(err)
        }
    req.flash('success_msg', 'Deslogado com sucesso!')
    res.redirect("/")
    })
})

// Rota criada apenas para ter acesso aos atributos do objeto criado pelo passport req.user para sabermos como devemos mencionar acima (rota login) para obter o nome dele
router.get('/useratribut', (req, res) => {
    console.log(req.user)
    res.send('Verifique o console para ter as informaçoes do objeto user!!!')
})

module.exports = router