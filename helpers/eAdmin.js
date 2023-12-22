// Esse módulo será usado para criar ma função que vai detectar se o user é ou não admin. Ele vai funcionar como decorator do python, que é uma função que fazer algo, como o @login_user(), decorator para saber se o user é ou não admin do sistema criado com Django.
module.exports = {
    eAdmin: function(req, res, next){
        if(req.isAuthenticated() && req.user.eAdmin == 1){ // se o usuário estiver autenticado e for admin. isAuthenticated é uma função do passport. Ao definir o eAdmin como 1, ele será considerado como 1 para ser admin a partir dessa condição que criamos aqui.
            return next();
        }

        req.flash('error_msg', 'Você necessita ser um Usuário Admin para ter acesso a essa página!')
        res.redirect('/')
    }
} 