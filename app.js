// Carregando os módulos - Todo projeto node.js começa através do meu app.js, onde faço configurações globais, declaros todas as bibliotecas que estou utilizando e faço a criação dos principais intermediários da aplicação, os chamados middlewares.
    const express = require("express") // 1 requisição do framework express e o colocando em uma variável para ficar melhor o acesso dele
    const handlebars = require("express-handlebars") // 1 - templates
    const handlebarsHelpers = require('handlebars-helpers') // os helpers do handlebars te ajudam a realizar operações dentro do html, como lógica if e else por exemplo
    const bodyParser = require("body-parser") // 1 - bodyparser ajuda na conexão com o banco de dados. Body Parser - auxilia em trazer os dados do formulário para salvar no banco de dados.
    const app = express() // 1 para criar rotas
    const admin = require("./routes/admin") // 2 rotas admin sendo declaras
    const path = require("path") // 3 para sinalizar caminhos, como o dos arquivos publicos que fizemos abaixo.
    const mongoose = require('mongoose') // 1
    const session = require("express-session") // criar sessões para os usuários. Sessão são informações rápidas da aplicação para o usuário e vice-versa - info. do user para aplicação
    const flash = require("connect-flash") // para exibição de mensagens nos templates de sucesso ou erro
    require("./models/Aluno") // sinalizando o model Aluno aqui no arquivo principal
    const Aluno = mongoose.model("alunos")
    require("./models/Evento")
    const Evento = mongoose.model("eventos")
    const multer = require("multer") // é um middleware que nos ajudará a fazer o upload de arquivos. Ele pega o arquivo que enviamos e faz a extração.
    const usuarios = require("./routes/usuario") // aqui estou acessando o router usuario.js
    const Usuario = mongoose.model("usuarios")
    const passport = require("passport") // Importamos o passport
    require("./config/auth")(passport) // importamos o auth aqui. O passport está sendo passado de argumento para ele

// Configurações
    // Sessão
        app.use(session({ // 4 lembre-se que app.use é usado para criar middlewares
            secret: "courseproject", // tipo uma chave para gerar uma sessão para você
            resave: true, /*Quando definido como true, isso significa que a sessão será regravada no armazenamento, mesmo que a solicitação não tenha sido modificada. Isso é útil em alguns casos de armazenamento de sessão para garantir que as alterações feitas na sessão sejam salvas, mesmo para solicitações que não causam modificações na sessão. No entanto, isso pode ter um impacto no desempenho. */
            saveUninitialized: true /* Quando definido como true, isso indica que as sessões que não foram inicializadas ainda serão salvas no armazenamento. Por exemplo, se você tem uma sessão que foi criada, mas não modificada, ela não será salva no armazenamento a menos que saveUninitialized seja true. Isso pode ser útil para criar sessões vazias e, em seguida, preenchê-las posteriormente. */
        }))
        app.use(passport.initialize()) //  Este middleware inicializa o Passport. É necessário para autenticar as solicitações dos usuários.
        app.use(passport.session()) // Este middleware é usado para persistir a sessão de login. Ele serializa e deserializa o usuário a partir da sessão.
        app.use(flash()) //Flash - é um mecanismo para armazenar mensagens temporárias. Ele é usado para enviar mensagens entre solicitações. Ele deve ser colocado após a configuração da sessão para funcionar corretamente.
        
        /* 
        NÃO FUNCIONOU
        
        Middleware para passar os dados de req.user para os demais ponto da aplicação. Fizemos isso pensando, especialmente, no _nav.handlebars para usar o eAdmin e fazer a lógica de exibição de botões apenas para usersadmin
        app.use((req, res, next) => {
            res.locals.user = req.user; // Isso tornará req.user disponível em todos os templates
            next();
        });*/
    
        // Middleware para mensagens

        /*req e res Esses objetos são passados automaticamente pelo Express para cada middleware e rota definidos na aplicação. 
        Eles são a base do modelo de programação baseado em middleware do Express e são usados para manipular as requisições e respostas 
        HTTP durante o ciclo de vida de uma solicitação.*/

        app.use((req, res, next) => { // middleware personalizado que criamos para mensagens
            // res.locals é um objeto usado para passar variáveis para os modelos views, sendo success_msg, error_msg and error usadas para armazenar mensagens para exibição
            res.locals.success_msg = req.flash('success_msg')
            res.locals.error_msg = req.flash('error_msg') // Pode ser usado para mensagens de erro específicas, como entrada inválida de formulário, campos ausentes, etc.
            res.locals.error = req.flash('error') // Geralmente usado para erros gerais, como falha na autenticação, problemas no servidor, etc. Após sua criação, precisamos declará-la no nosso main.handlebars. Conseguimos isso, pois ela foi criada aqui app.js, ambiente global
            // res.locals.success = req.flash('success') // da mesma forma que a error, essa success vai ter a mensagem de sucesso definida no auth.js quando ocorrer o processo de autenticação
            // console.log('Mensagem de sucesso em app.js:', res.locals.success); // Para saber se a mensagem de sucesso está sendo passada na variável acima - NÃO FUNCIONA - EXPLICAÇÃO NO AUTH.JS
            res.locals.user = req.user || null; /* Vai armazenar os dados do usuário logado. O req.user é algo criado pelo passport automaticamente
            para fazer esse armazenamento. O null será passado para a variável caso não há nenhum usuário logado.*/
            next() // função que garante que após o funcionamento do middleware personalizado no caso, o próximo middleware seja chamado seja ele qual for.
        })
    // Middleware Multer
    /*
    Essa seria uma abordagem individual para definir o nome de cada diretório, no qual o multer precisará salvar uma imagem e nome que essas imagens teriam ao serem salvas nas pastas.
    Contudo essa abordagem é pouco dinâmica e exastante para caso tenhamos muitas imagens para salvar em diretórios diferentes.*/

        /* Fizemos a criação diretamente no router usuario.js, pois não conseguimos exportá-lo para lá.
        const storageAlunos = multer.diskStorage({ // a função diskStorage serve para manipularmos os arquivos após o upload. No caso, vamos usar para modificar o nome e extensão com a qual o arquivo é salvo
            destination: function(req, file, cb){ // aqui temos atríbutos da função diskStorage presente em multer 
                cb(null, 'public/img/alunos');// cb é de calback - ONDE SERÁ SALVO
            },
            filename: function(req, file, cb){ // QUAL NOME TERÁ O ARQUIVO AO SER SALVO
                cb(null, file.originalname);
            }
        });*/
        /* Fizemos a criação do middle direto em admin, pois não funcionou a importação

        const storageEventos = multer.diskStorage({ // a função diskStorage serve para manipularmos os arquivos após o upload. No caso, vamos usar para modificar o nome e extensão com a qual o arquivo é salvo
            destination: function(req, file, cb){ // aqui temos atríbutos da função diskStorage presente em multer 
                cb(null, 'public/img/eventos');// cb é de calback
            },
            filename: function(req, file, cb){
                cb(null, file.originalname);
            }
        });*/
        // const alunosUpload = multer({storage: storageAlunos}); // sem a barra no início, pois, caso contrário, seria add os upload dentro de node_modules
        // const eventosUpload = multer({storage: storageEventos});
        
        // Na abordagem abaixo temos algo mais dinâmico e mais funcional para a situações de muitas imagens e muitos diretórios
        /*
        const multerStorage = (directory) => multer.diskStorage({
            destination: function (req, file, cb) {
                cb(null, `public/img/${directory}`);
            },
            fillname: function (req, file, cb){
                /*Date.now(): Isso retorna o número de milissegundos desde 1º de janeiro de 1970 00:00:00 UTC. Esse valor é uma forma de representar a data e a hora atuais de maneira exclusiva. 
                Math.random(): Isso gera um número decimal aleatório entre 0 (inclusive) e 1 (exclusive).
                1E9: Isso é uma notação para 1 seguido de 9 zeros, ou seja, 1 bilhão.
                Math.round(): Isso arredonda o número resultante da multiplicação de Math.random() e 1E9 para o inteiro mais próximo.
                path.extname(file.originalname): Isso retorna a extensão do nome do arquivo original. A extensão é a parte do nome do arquivo após o último ponto, se houver.
                Todos esses componentes são então concatenados usando a sintaxe de template string do JavaScript, que é representada por ${}. O resultado é um sufixo único que é uma combinação do tempo atual, um número aleatório e a extensão do nome do arquivo original. Isso ajuda a garantir que o nome do arquivo seja exclusivo no momento do armazenamento.
                const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
                cb(null, file.fieldname + '-' + uniqueSuffix)
            }
        })
        /* Quando chamarmos uma dessas constantes, estamos passando 'alunos' ou 'eventos' para multerStorage, constante, na qual defininos a função directory
        que identificará o diretório na qual salvaremos a imagem e em fillname, teremos um nome sendo gerado com a data atual, um random e o nome original do file -
        garante que se a mesma imagem passar por upload, ela e a primeira serão diferente como esse sufixo único.
        
        const alunosUpload = multer({storage: multerStorage('alunos')}); // sem a barra no início, pois, caso contrário, seria add os upload dentro de node_modules
        const eventosUpload = multer({storage: multerStorage('eventos')});*/

        // Body Parser - vai salvar os dados do html no banco de dados 1
        app.use(bodyParser.urlencoded({extended: true}))
        app.use(bodyParser.json())
    // Handlebars - responsável por lidar com os templates 1
        app.engine('handlebars', handlebars.engine({defaultLayout: 'main', helpers: handlebarsHelpers()})) // Este main que é o defaultLayout é aquele que tem os partials do navbar e messages. Isso permite que a aplicação habilite o navbar e as mensagens nos demais templates, sendo uma característica herdada por todos eles.
        app.set('view engine', 'handlebars')
    // Mongoose 4 - estabelecendo a conexão com o mongo
        mongoose.Promise = global.Promise; // nos ajuda a minimizar erros
        mongoose.connect("mongodb://127.0.0.1:27017/courseapp").then(() => { // add nosso uri de conexão ao connect. [::1]:27017 - seria o que colocar no lugar da conf. do IPV4. Contudo não deu certo, pois é necessário conf. o MongoDB para aceitar o tipo de endereço IPV6.
            console.log("Conectado ao mongo") // mensagem que definimos para aparecer no cmd, em prol de saber que a conexão com o mongo foi feita com sucesso ou não
        }).catch((err) => {
            console.log("Erro ao se conectar: "+err)
        }) 
    // Path
        app.use(express.static(path.join(__dirname, 'public'))) // 3 - estamos falando para o express que todos os nossos arquivos estáticos estão sendo guardados na pasta public. __dirname pega caminhos absolutos para o diretório em questão
        // app.use(express.static('public')); //- outra forma de sinalizar que o projeto deve acessar a pasta public para acessar os arquivos estáticos
// Rotas
    app.get("/", (req, res) => { // 2 página inicial do projeto. Vamos passar dados dos eventos que criamos para elas.
        // res.send('Página inicial onde os alunos serão exibidos')
        // console.log(req.user) - apenas para ver os atributos do objeto user
        Evento.find().lean().sort({data: "desc"}).then((eventos) => {
            res.render("index", {eventos: eventos}) // Quando necessitamos fazer alguma modificação no objeto que importamos do banco de dados, é uma boa prática passa-lo em novo objeto. Caso contrário como é o nosso, podemos passar diretamente o primeiro objeto evento para o contexto da página. Lembre-se que, objeto em programação é um dictionary ou map, uma estrutura de dado composta por chave-valor.
        }).catch((err) => {
            console.log(err)
            req.flash('error_msg', 'Erros ao exibir os eventos')
            res.redirect("/404")
        })
    })
    // Essa rota abaixo em app.js é para termos uma página para a exibição da postagem quando clicarmos no botão "Leia mais" na rota principal. Ela foi criada aqui, em prol de termos ela desvinculada das rotas admin, que só é acessada por quem é admin. Não foi criada em usuarios.js para termos ela em um ambiente global, que serve para todas aplicação, como é o caso de app.js
    app.get("/evento/:slug", (req, res) => { // um evento especifico que será encontrado pela slug que possui
        Evento.findOne({slug: req.params.slug}).lean().then((evento) => { // a slug está vindo da url. Por esse motivo, o req.params.slug
            if(evento){
                res.render("evento/index", {evento: evento})
            }else{
                req.flash('error_msg', 'Este evento não existe!')
                res.redirect("/")
            }
        }).catch((err) => {
            console.log(err)
            req.flash('error_msg', 'Houve um erro ao carregar o evento!')
            res.redirect("/")
        })
    }) // fomos em vies e criamos uma pasta eventos e dentro dela criamos um index.handlebars. Chamamos dessa forma para referenciar que faz parte de index.
    /*
    Usada apenas para testar a função de upload que está funcionando corretamente
    app.post("/upload", eventosUpload.single("file"), (req, res) =>{
        res.send('Arquivo recebido')
    })*/

    app.use("/admin", admin) // 2 vai receber nossas rotas admin salvas na variável admin (segundo admin que é o admin no topo) 

    app.use("/usuarios", usuarios) // essa será a forma globa de citar as rotas criada em router usuario.js na pasta router em partes do programa, como templates por exemplo.

// Outros
    const PORT = 8081 //  1 - serve para sinalizar a porta do mongoose 
    app.listen(PORT, () => {
        console.log("Servidor rodando!") // mensagem para exibir no console
    })
    
    /*
    NENHUMA DAS DUAS ABORDAGENS FUNCIONOU. ENTÃO, VOU CRIAR O MIDDLEWARE NA PRÓPRIA ROTA ADMIN. RESULTADO: 

    module.exports = eventosUpload; em admin para salvar as imagens dos eventos. Aqui estou exportando apenas o middleware que criamos
    com outro middleware (multer no caso). Nessa caso, teriamos que importá-lo em admin como:
    const eventosUpload = require('../app');
    e usá-lo:
    router.post("/eventos/addpost", eventosUpload.single('imagem'), (req, res) => {
    // Seu código aqui
    });
    
    Abaixo, estamos exportando um objeto. Qual a diferença de exportar o multer e exportar um objeto que contenha o middleware??
    Com o de cima só conseguimos exportar apenas uma função ou middleware no caso. Já com o de baixo, conseguimos exportar mais de uma 
    função e teriamos que importar em admin como const { app, eventosUpload } = require('../app'); 
    module.exports = {
        eventosUpload
    };*/