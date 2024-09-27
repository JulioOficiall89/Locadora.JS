const fs = require('fs'); 
const readline = require('readline');

let filmesDisponiveis = {};
let sugeridos = [];
let usuarios = {};
let usuarioAtual = null;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function exibirEstrelas(estrelas) {
    const estrelasInteiras = Math.floor(estrelas);
    const meiaEstrela = estrelas % 1 !== 0;
    let resultado = '🌟'.repeat(estrelasInteiras);

    if (meiaEstrela) {
        resultado += '⭐';
    }

    return resultado;
}

function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function validarCPF(cpf) {
    return cpf.length === 11 && /^\d+$/.test(cpf);
}

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
    } else if (usuarioAtual.cpf === '12312312312') { // Dono
        console.log("\nMenu do Dono:");
        console.log("1 - Fazer locação");
        console.log("2 - Exibir histórico de locações");
        console.log("3 - Adicionar filme");
        console.log("4 - Total de locações do dia");
        console.log("5 - Ver catálogo de filmes");
        console.log("6 - Adicionar estrelas ao filme");
        console.log("7 - Gerenciar filmes sugeridos");
        console.log("8 - Logout");
        rl.question("Escolha uma opção: ", (opcao) => {
            switch (opcao) {
                case '1': fazerLocacao(); break;
                case '2': exibirHistorico(); break;
                case '3': adicionarFilme(); break;
                case '4': totalLocacoesDia(); break;
                case '5': verCatalogo(); break;
                case '6': adicionarEstrelas(); break;
                case '7': gerenciarSugeridos(); break;
                case '8': logout(); break;
                default: console.log("Opção inválida. Tente novamente."); menu();
            }
        });
    } else { // Cliente
        console.log("\nMenu do Cliente:");
        console.log("1 - Fazer locação");
        console.log("2 - Exibir histórico de locações");
        console.log("3 - Ver catálogo de filmes");
        console.log("4 - Sugerir filme");
        console.log("5 - Logout");
        rl.question("Escolha uma opção: ", (opcao) => {
            switch (opcao) {
                case '1': fazerLocacao(); break;
                case '2': exibirHistorico(); break;
                case '3': verCatalogo(); break;
                case '4': sugerirFilme(); break;
                case '5': logout(); break;
                default: console.log("Opção inválida. Tente novamente."); menu();
            }
        });
    }
}

function logout() {
    usuarioAtual = null;
    console.log("Você saiu da sua conta.");
    menu();
}

function gerenciarSugeridos() {
    console.log("\n--- Gerenciar Filmes Sugeridos ---");
    carregarSugeridos(() => {
        if (sugeridos.length === 0) {
            console.log("Nenhum filme sugerido ainda.");
        } else {
            sugeridos.forEach((filme, index) => {
                console.log(`${index + 1} - ${filme}`);
            });
        }

        console.log("1 - Adicionar filme sugerido ao catálogo");
        console.log("2 - Remover um filme sugerido");
        console.log("3 - Voltar ao menu do dono");
        rl.question("Escolha uma opção: ", (opcao) => {
            switch (opcao) {
                case '1': adicionarFilmeCatalogo(); break;
                case '2': removerFilmeSugerido(); break;
                case '3': menu(); break;
                default: console.log("Opção inválida. Tente novamente."); gerenciarSugeridos();
            }
        });
    });
}

function sugerirFilme() {
    rl.question("Digite o nome do filme sugerido: ", (nome) => {
        sugeridos.push(nome);
        salvarSugeridos();
        console.log(`Filme "${nome}" sugerido com sucesso!`);
        menu();
    });
}

function adicionarFilmeCatalogo() {
    rl.question("Digite o número do filme sugerido para adicionar ao catálogo: ", (numero) => {
        const index = parseInt(numero) - 1;
        if (index >= 0 && index < sugeridos.length) {
            const filme = sugeridos[index];
            rl.question("Digite o código do filme: ", (codigo) => {
                rl.question("Digite o tipo do filme: ", (tipo) => {
                    rl.question("Digite a quantidade de estrelas (1 a 5): ", (estrelas) => {
                        const estrelasNumerico = parseFloat(estrelas);
                        if (estrelasNumerico < 1 || estrelasNumerico > 5) {
                            console.log("Por favor, insira um valor entre 1 e 5.");
                            return adicionarFilmeCatalogo();
                        }
                        filmesDisponiveis[codigo] = {
                            nome: filme,
                            tipo: tipo,
                            estrelas: estrelas
                        };
                        salvarFilme(codigo, filmesDisponiveis[codigo]);
                        console.log(`Filme "${filme}" adicionado ao catálogo!`);
                        sugeridos.splice(index, 1); // Remove da lista de sugeridos
                        salvarSugeridos(); // Atualiza o arquivo de sugestões
                        menu();
                    });
                });
            });
        } else {
            console.log("Número inválido. Tente novamente.");
            adicionarFilmeCatalogo();
        }
    });
}

function removerFilmeSugerido() {
    rl.question("Digite o número do filme a ser removido: ", (numero) => {
        const index = parseInt(numero) - 1;
        if (index >= 0 && index < sugeridos.length) {
            const filmeRemovido = sugeridos.splice(index, 1)[0]; // Remove e captura o filme removido
            console.log(`Filme "${filmeRemovido}" removido com sucesso!`);
            salvarSugeridos(); // Atualiza o arquivo de sugestões
        } else {
            console.log("Número inválido. Tente novamente.");
        }
        gerenciarSugeridos();
    });
}

function carregarSugeridos(callback) {
    fs.readFile('sugeridos.txt', 'utf8', (err, data) => {
        if (err) {
            console.error("Erro ao ler o arquivo de sugestões:", err);
            return callback();
        }
        sugeridos = data.trim().split('\n').filter(Boolean);
        callback();
    });
}

function salvarSugeridos() {
    const data = sugeridos.join('\n') + '\n';
    fs.writeFile('sugeridos.txt', data, (err) => {
        if (err) {
            console.error("Erro ao salvar sugestões:", err);
        }
    });
}

// Funções de registrar, fazerLogin, adicionarEstrelas, etc. seguem...

function adicionarEstrelas() {
    if (usuarioAtual.cpf !== '12312312312') {
        console.log("Você não tem permissão para adicionar estrelas aos filmes.");
        return menu();
    }

    console.log("\n--- Adicionar Estrelas a um Filme ---");
    rl.question("Digite o código do filme: ", (codigo) => {
        if (filmesDisponiveis[codigo]) {
            rl.question("Digite a quantidade de estrelas a adicionar (1 a 5): ", (estrelas) => {
                const filme = filmesDisponiveis[codigo];
                const novaQuantidadeEstrelas = Math.min(Math.max(parseInt(filme.estrelas) + parseInt(estrelas), 1), 5);
                filme.estrelas = novaQuantidadeEstrelas;
                console.log(`Estrelas do filme "${filme.nome}" atualizadas para: ${exibirEstrelas(filme.estrelas)}`);
                salvarFilme(codigo, filme);
                menu();
            });
        } else {
            console.log("Código de filme inválido. Tente novamente.");
            adicionarEstrelas();
        }
    });
}

// Função para fazer login
function fazerLogin() {
    console.log("\n--- Login ---");
    rl.question("Digite seu CPF (ou 'voltar' para retornar ao menu): ", (cpf) => {
        if (cpf.toLowerCase() === 'voltar') {
            return menu();
        }
        
        if (validarCPF(cpf)) {
            if (usuarios[cpf]) {
                usuarioAtual = usuarios[cpf];
                console.log(`Bem-vindo, ${usuarioAtual.nome}!`);
                menu();
            } else {
                console.log("CPF não encontrado. Tente novamente.");
                fazerLogin();
            }
        } else {
            console.log("CPF inválido. Deve ter 11 dígitos.");
            fazerLogin();
        }
    });
}

// Função para registrar usuários
function registrar() {
    console.log("\n--- Registrar ---");
    rl.question("Digite seu nome (ou 'voltar' para retornar): ", (nome) => {
        if (nome.toLowerCase() === 'voltar') return menu();
        rl.question("Digite seu email (ou 'voltar' para retornar): ", (email) => {
            if (email.toLowerCase() === 'voltar') return registrar();
            if (!validarEmail(email)) {
                console.log("Email inválido. Tente novamente.");
                return registrar();
            }
            rl.question("Digite seu CPF (somente números) (ou 'voltar' para retornar): ", (cpf) => {
                if (cpf.toLowerCase() === 'voltar') return registrar();
                if (!validarCPF(cpf)) {
                    console.log("CPF inválido. Deve ter 11 dígitos.");
                    return registrar();
                }
                rl.question("Digite seu CEP (ou 'voltar' para retornar): ", (cep) => {
                    if (cep.toLowerCase() === 'voltar') return registrar();
                    const usuarioKey = cpf.replace(/\D/g, '');
                    if (usuarios[usuarioKey]) {
                        console.log("Esse CPF já está registrado. Tente novamente.");
                        return registrar();
                    }
                    usuarios[usuarioKey] = { nome, email, cpf, cep };
                    salvarUsuario(usuarioKey, usuarios[usuarioKey]);
                    console.log("Usuário registrado com sucesso!");
                    menu();
                });
            });
        });
    });
}

// Funções para carregar e salvar usuários e filmes
function carregarUsuarios(callback) {
    fs.readFile('usuarios.txt', 'utf8', (err, data) => {
        if (err) {
            console.error("Erro ao ler o arquivo de usuários:", err);
            return callback();
        }
        const linhas = data.trim().split('\n');
        linhas.forEach(linha => {
            const [nome, email, cpf, cep] = linha.split(';');
            usuarios[cpf] = { nome, email, cpf, cep };
        });
        callback();
    });
}

function salvarUsuario(cpf, usuario) {
    const data = `${usuario.nome};${usuario.email};${usuario.cpf};${usuario.cep}\n`;
    fs.appendFile('usuarios.txt', data, (err) => {
        if (err) {
            console.error("Erro ao salvar usuário:", err);
        }
    });
}

function carregarFilmes(callback) {
    fs.readFile('filmes.txt', 'utf8', (err, data) => {
        if (err) {
            console.error("Erro ao ler o arquivo de filmes:", err);
            return callback();
        }
        const linhas = data.trim().split('\n');
        linhas.forEach(linha => {
            const [codigo, nome, tipo, estrelas] = linha.split(';');
            filmesDisponiveis[codigo] = { nome, tipo, estrelas };
        });
        callback();
    });
}

function salvarFilme(codigo, filme) {
    const data = `${codigo};${filme.nome};${filme.tipo};${filme.estrelas}\n`;
    fs.appendFile('filmes.txt', data, (err) => {
        if (err) {
            console.error("Erro ao salvar filme:", err);
        }
    });
}

// Carregamento inicial
carregarUsuarios(() => {
    carregarFilmes(() => {
        carregarSugeridos(menu);
    });
});
