// módulo no qual configuramos nosso sistema de autenticação
const localStrategy = require("passport-local").Strategy // Aqui estou importando a estratégia local do passport que fizemos o download
const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
require("../models/Usuario") // preciso sair desse módulo, dessa pasta, acessar models e, por fim, Usuario.js
const Usuario = mongoose.model("usuarios")

module.exports = function(passport){ // Estamos sinalizando que essa função helper pode ser usado em qualquer parte do programa
    passport.use(new localStrategy({usernameField:'email', passwordField:'senha'}, (email, senha, done) =>{ // a função de call back criada contém o email, a senha e o done para serem usados abaixo na pesquisa do user por email e na averiguação da sua senha e done é uma função do passport para termos o resultado das nossa consultas de email e senha. Inclusive, esse email e senha foram os parâmetros que definimos no model Usuario
        Usuario.findOne({email: email}).then((usuario) => {
            if(!usuario){
                return done(null, false, {message: 'Está conta não existe!'})
            } /* Primeiro parâmetro são os dados da conta (null no caso, pois é em caso ele não retornar um usuário(!usuario))
            Segundo é se autenticação vai ocorrer com sucesso (true) ou sem sucesso (false) e terceiro a messagem*/

            // se a conta existir
            bcrypt.compare(senha, usuario.senha, (erro, batem) => { // batem foi o nome da variável que criei com o resultado da senha, que pode ser true ou false
                if(batem){ // se for true, ele 
                    //console.log('Mensagem de sucesso definida em auth.js:', {message: 'Logado com sucesso. Bem-vindo!'}); // para saber se a mensagem é passada e exibida no console
                    return done(null, usuario) // Não funcionou passar a mensagem de sucesso dentro do done {message: 'Logado com sucesso. Bem-vindo!'}, pois essa forma de passport talvez requeira que isso seja feito de outra forma ou o formato da mensagem não é aceito por ele.

                    /*No contexto do Passport.js, `done(null, usuario)` é uma função que indica que a operação de autenticação foi concluída com sucesso. O primeiro parâmetro `null` é o erro (que está sendo passado como nulo, indicando que não houve erro na autenticação) e o segundo parâmetro `usuario` é o objeto que representa o usuário autenticado.

Ao chamar `done(null, usuario)`, você está sinalizando para o Passport que a autenticação foi bem-sucedida e está passando o objeto `usuario` como o usuário autenticado. Esse objeto normalmente contém informações como ID, nome, e-mail, entre outros dados relevantes do usuário.

O `null` é usado aqui para indicar que não ocorreu nenhum erro durante o processo de autenticação. Em caso de erro, você pode passar o erro como primeiro parâmetro, por exemplo, `done(erro)` para indicar que ocorreu um erro na autenticação.*/
                }else{
                    return done(null, false, {message:'Senha incorreta!'})
                }
            })
        })
    }))

    passport.serializeUser((usuario, done) => {
        done(null, usuario.id)
        // servirá para salvar os dados do usuário em uma seção. Assim que o usuário logar,
        // os dados dele são salvos em uma seção (facilita o acesso mais rápido. É como se os dados de autenticação e o que o usuário
        // fazia em seu site ficassem em standby para serem usuados sem que todo o caminho até o servidor ou vice versa seja feito.
        // Permite, em suma, uma interação mais rápida do usuário com seu site/aplicação)
    })

        /* A função de baixo complementa a de cima. - Tivemos que modificá-la devido a novas regras de uso Model.findById que não mais aceita 
     funções de callback */
    passport.deserializeUser((id, done) => {
        Usuario.findById(id).then((usuario) => {
            done(null, usuario)
        }).catch((err) => {
            done(null, false, {message:"Erro de autenticação."})
        })
    })

}


/*
Explicação do chatgpt sobre esse módulo:
Claro! Vamos começar com a dúvida. Parece haver um pequeno erro na configuração do Passport no código. A linha `passport.user` deve ser `passport.use` para definir a estratégia de autenticação local.

Agora, sobre a explicação do que está acontecendo no código:

1. **Requerimentos Iniciais:**
   - `passport-local`: Módulo Passport responsável por autenticação local.
   - `mongoose`: Para interagir com o banco de dados MongoDB.
   - `bcryptjs`: Biblioteca para criptografia de senhas.

2. **Requisição do Modelo `Usuario`:**
   - `require("../models/Usuario")`: Importa o modelo `Usuario` que representa a coleção de usuários no banco de dados.

3. **Exportação do Módulo:**
   - `module.exports = function(passport)`: Exporta uma função que recebe o `passport` como argumento para configurar as estratégias de autenticação.

4. **Definição da Estratégia Local:**
   - `passport.use(new localStrategy({ ... }, (email, senha, done) => { ... }))`: Configura a estratégia local de autenticação.
   - Dentro dela:
     - Verifica se o usuário com o email fornecido existe no banco de dados.
     - Compara a senha fornecida com a senha criptografada no banco de dados usando `bcrypt.compare()`.
     - Retorna o resultado da autenticação usando `done`.

5. **Serialização e Deserialização do Usuário:**
   - `passport.serializeUser((usuario, done) => { ... })`: Define como o usuário será serializado para a sessão.
   - `passport.deserializeUser((id, done) => { ... })`: Define como o usuário será desserializado a partir da sessão.

6. **Funcionamento de `serializeUser` e `deserializeUser`:**
   - `serializeUser`: Salva apenas o ID do usuário na sessão.
   - `deserializeUser`: Encontra o usuário com base no ID da sessão e o passa para as rotas subsequentes.

Essencialmente, este módulo está configurando a estratégia de autenticação local, usando o `bcryptjs` para comparar senhas criptografadas, e definindo como os usuários são serializados e desserializados para e da sessão. Isso é fundamental para autenticação e autorização em aplicativos web.
*/