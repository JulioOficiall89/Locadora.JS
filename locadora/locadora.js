const fs = require('fs');
const readline = require('readline');

let filmesDisponiveis = {};
let historicoLocacoes = [];
let usuarios = {};
let usuarioAtual = null;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function menu() {
    if (!usuarioAtual) {
        console.log("\nMenu:");
        console.log("1 - Registrar");
        console.log("2 - Fazer login");
        console.log("3 - Sair");
        rl.question("Escolha uma opção: ", (opcao) => {
            switch (opcao) {
                case '1': registrar(); break;
                case '2': fazerLogin(); break;
                case '3': console.log("Saindo..."); rl.close(); break;
                default: console.log("Opção inválida. Tente novamente."); menu();
            }
        });
    } else {
        console.log("\nMenu:");
        console.log("1 - Fazer locação");
        console.log("2 - Exibir histórico de locações");
        console.log("3 - Adicionar filme");
        console.log("4 - Total de locações do dia");
        console.log("5 - Sair");
        console.log("6 - Voltar ao menu anterior");

        rl.question("Escolha uma opção: ", (opcao) => {
            switch (opcao) {
                case '1': fazerLocacao(); break;
                case '2': exibirHistorico(); break;
                case '3': adicionarFilme(); break;
                case '4': totalLocacoesDia(); break;
                case '5': console.log("Saindo..."); rl.close(); break;
                case '6': menu(); break;
                default: console.log("Opção inválida. Tente novamente."); menu();
            }
        });
    }
}

function carregarUsuarios() {
    fs.readFile('usuarios.txt', 'utf8', (err, data) => {
        if (err) {
            console.error("Erro ao ler o arquivo de usuários:", err);
            return;
        }

        const linhas = data.trim().split('\n\n'); // Cada usuário separado por uma linha em branco
        linhas.forEach(linha => {
            const [nome, email, cpf, cep] = linha.split(';\n').map(item => item.trim());
            if (cpf) {
                usuarios[cpf] = { nome, email, cpf, cep };
            }
        });

        console.log("Usuários carregados com sucesso.");
        menu();
    });
}

function registrar() {
    console.log("\n--- Registro ---");
    rl.question("Digite seu nome: ", (nome) => {
        rl.question("Digite seu e-mail (gmail/hotmail): ", (email) => {
            if (!/\S+@\S+\.\S+/.test(email)) {
                console.log("E-mail inválido. Tente novamente.");
                return registrar();
            }
            rl.question("Digite seu CPF (somente números): ", (cpf) => {
                rl.question("Digite seu CEP (somente números): ", (cep) => {
                    const usuario = {
                        nome: nome,
                        email: email,
                        cpf: cpf.replace(/\D/g, ''),
                        cep: cep.replace(/\D/g, ''),
                    };
                    const usuarioKey = usuario.cpf;
                    if (usuarios[usuarioKey]) {
                        console.log("Usuário já existe. Tente outro CPF.");
                        return menu();
                    } else {
                        usuarios[usuarioKey] = usuario;
                        salvarUsuario(usuario);
                        console.log("Registro realizado com sucesso!");
                        menu();
                    }
                });
            });
        });
    });
}

function salvarUsuario(usuario) {
    const dados = `${usuario.nome};\n${usuario.email};\n${usuario.cpf};\n${usuario.cep}\n\n`;
    console.log(`Salvando usuário: ${usuario.cpf}`); // Log para depuração
    fs.appendFile('usuarios.txt', dados, (err) => {
        if (err) console.error("Erro ao salvar usuário:", err);
    });
}

function fazerLogin() {
    console.log("\n--- Login ---");
    rl.question("Digite seu CPF (ou 'voltar' para retornar ao menu): ", (cpf) => {
        const cpfLimpo = cpf.replace(/\D/g, ''); // Limpar caracteres não numéricos
        console.log(`Tentando logar com CPF: ${cpfLimpo}`); // Log para depuração
        if (cpf.toLowerCase() === 'voltar') {
            return menu();
        }
        if (!usuarios[cpfLimpo]) {
            console.log("Usuário não encontrado. Tente novamente.");
            return fazerLogin();
        } else {
            rl.question("Digite seu CPF novamente para confirmar: ", (cpfConfirm) => {
                const cpfConfirmLimpo = cpfConfirm.replace(/\D/g, '');
                if (usuarios[cpfLimpo].cpf === cpfConfirmLimpo) {
                    usuarioAtual = cpfLimpo;
                    console.log(`Bem-vindo, ${usuarios[usuarioAtual].nome}!`);
                    menu();
                } else {
                    console.log("CPF incorreto. Tente novamente.");
                    return fazerLogin();
                }
            });
        }
    });
}

function fazerLocacao() {
    console.log("Filmes disponíveis:");
    for (const [codigo, filme] of Object.entries(filmesDisponiveis)) {
        console.log(`${codigo} - ${filme.nome}`);
    }

    rl.question("Digite o código do filme que deseja locar: ", (codigo) => {
        if (filmesDisponiveis[codigo]) {
            const filme = filmesDisponiveis[codigo];
            const locacao = { filme: filme.nome, usuario: usuarioAtual, data: new Date() };
            historicoLocacoes.push(locacao);
            console.log(`Locação realizada com sucesso: ${filme.nome}`);
            salvarLocacao(locacao); // Salvar a locação no arquivo
        } else {
            console.log("Código inválido. Tente novamente.");
        }
        menu();
    });
}

function salvarLocacao(locacao) {
    const dados = `${locacao.filme};\n${locacao.usuario};\n${locacao.data}\n`; // Registro com CPF
    fs.appendFile('historico_locacoes.txt', dados, (err) => {
        if (err) console.error("Erro ao salvar locação:", err);
    });
}

function exibirHistorico() {
    if (historicoLocacoes.length === 0) {
        console.log("Nenhuma locação realizada ainda.");
    } else {
        historicoLocacoes.forEach((locacao, index) => {
            console.log(`${index + 1}. ${locacao.filme} - ${locacao.data} (CPF: ${locacao.usuario})`);
        });
    }
    menu();
}

function adicionarFilme() {
    rl.question("Nome do filme: ", (nome) => {
        const codigo = String(Object.keys(filmesDisponiveis).length + 1);
        filmesDisponiveis[codigo] = { nome: nome };
        console.log(`Filme ${nome} adicionado com sucesso.`);
        menu();
    });
}

function totalLocacoesDia() {
    const dia = new Date().toISOString().split('T')[0];
    const total = historicoLocacoes.filter(locacao => locacao.data.toISOString().startsWith(dia)).length;
    console.log(`Total de locações hoje: ${total}`);
    menu();
}

function carregarFilmes() {
    fs.readFile('filmes.txt', 'utf8', (err, data) => {
        if (err) {
            console.error("Erro ao ler o arquivo de filmes:", err);
            return;
        }
        
        const linhas = data.trim().split('\n');
        linhas.forEach(linha => {
            const [codigo, nome] = linha.split(';');
            filmesDisponiveis[codigo] = { nome: nome.trim() };
        });
        
        console.log("Filmes carregados com sucesso.");
        carregarUsuarios(); // Carregar usuários ao iniciar
    });
}

carregarFilmes();
