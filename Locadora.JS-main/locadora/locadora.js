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

// Função para mostrar o menu principal
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
        console.log("5 - Ver catálogo de filmes");
        console.log("6 - Adicionar estrelas ao filme");
        console.log("7 - Voltar ao menu anterior");
        console.log("8 - Sair");

        rl.question("Escolha uma opção: ", (opcao) => {
            switch (opcao) {
                case '1': fazerLocacao(); break;
                case '2': exibirHistorico(); break;
                case '3': adicionarFilme(); break;
                case '4': totalLocacoesDia(); break;
                case '5': verCatalogo(); break;
                case '6': adicionarEstrelas(); break;
                case '7': menu(); break; // Voltar ao menu principal
                case '8': console.log("Saindo..."); rl.close(); break;
                default: console.log("Opção inválida. Tente novamente."); menu();
            }
        });
    }
}

// Função para adicionar estrelas a um filme
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
                console.log(`Estrelas do filme "${filme.nome}" atualizadas para: ${'⭐'.repeat(filme.estrelas)}`);
                salvarFilme(codigo, filme);
                menu();
            });
        } else {
            console.log("Código de filme inválido. Tente novamente.");
            adicionarEstrelas();
        }
    });
}

// Função para ver o catálogo de filmes
function verCatalogo() {
    console.log("\n--- Catálogo de Filmes ---");
    for (const [codigo, filme] of Object.entries(filmesDisponiveis)) {
        console.log(`${filme.nome} ${'⭐'.repeat(filme.estrelas)} (Código: ${codigo})`);
    }
    rl.question("Digite o código do filme para mais detalhes (ou 'voltar' para retornar): ", (codigo) => {
        if (codigo.toLowerCase() === 'voltar') {
            return menu();
        }
        if (filmesDisponiveis[codigo]) {
            mostrarDetalhesFilme(codigo);
        } else {
            console.log("Código inválido. Tente novamente.");
            verCatalogo();
        }
    });
}

// Função para mostrar os detalhes do filme
function mostrarDetalhesFilme(codigo) {
    const filme = filmesDisponiveis[codigo];
    console.log(`\nTítulo: ${filme.nome}`);
    console.log(`Estrelas: ${'⭐'.repeat(filme.estrelas)}`);
    console.log("1 - Ver Prólogo");
    console.log("2 - Ver Comentários");
    console.log("3 - Voltar ao Catálogo");

    rl.question("Escolha uma opção: ", (opcao) => {
        switch (opcao) {
            case '1':
                lerPrologo(codigo);
                break;
            case '2':
                lerComentarios(codigo);
                break;
            case '3':
                verCatalogo(); // Volta ao catálogo
                break;
            case '7':
                menu(); // Voltar ao menu principal
                break;
            default:
                console.log("Opção inválida. Tente novamente.");
                mostrarDetalhesFilme(codigo);
        }
    });
}

// Função para ler o prólogo do filme
function lerPrologo(codigo) {
    fs.readFile(`prologo_${codigo}.txt`, 'utf8', (err, prologo) => {
        if (err) {
            console.error("Erro ao ler o prólogo:", err);
            return;
        }
        console.log(`Prólogo: ${prologo}`);
        mostrarDetalhesFilme(codigo);
    });
}

// Função para ler os comentários do filme
function lerComentarios(codigo) {
    fs.readFile(`comentarios_${codigo}.txt`, 'utf8', (err, comentarios) => {
        if (err) {
            console.error("Erro ao ler os comentários:", err);
            return;
        }
        console.log(`Comentários: ${comentarios}`);
        mostrarDetalhesFilme(codigo);
    });
}

// Função para adicionar um novo filme
function adicionarFilme() {
    if (usuarioAtual.cpf !== '12312312312') {
        console.log("Você não tem permissão para adicionar filmes.");
        return menu();
    }

    console.log("\n--- Adicionar Filme ---");
    rl.question("Digite o código do filme: ", (codigo) => {
        rl.question("Digite o nome do filme: ", (nome) => {
            rl.question("Digite o tipo do filme: ", (tipo) => {
                rl.question("Digite a quantidade de estrelas (1 a 5): ", (estrelas) => {
                    rl.question("Digite o prólogo do filme: ", (prologo) => {
                        rl.question("Digite os comentários do filme: ", (comentarios) => {
                            if (filmesDisponiveis[codigo]) {
                                console.log("Um filme com esse código já existe. Tente outro código.");
                                return adicionarFilme();
                            }
                            filmesDisponiveis[codigo] = {
                                nome: nome,
                                tipo: tipo,
                                estrelas: estrelas
                            };
                            salvarFilme(codigo, filmesDisponiveis[codigo]);
                            salvarPrologo(codigo, prologo);
                            salvarComentarios(codigo, comentarios);
                            console.log("Filme adicionado com sucesso!");
                            menu();
                        });
                    });
                });
            });
        });
    });
}

// Função para carregar os usuários do arquivo
function carregarUsuarios(callback) {
    fs.readFile('usuarios.txt', 'utf8', (err, data) => {
        if (err) {
            console.error("Erro ao ler o arquivo de usuários:", err);
            return;
        }

        const linhas = data.trim().split('\n\n');
        linhas.forEach(linha => {
            const [nome, email, cpf, cep] = linha.split(';\n').map(item => item.trim());
            if (cpf) {
                usuarios[cpf.replace(/\D/g, '')] = { nome, email, cpf, cep };
            }
        });

        console.log("Usuários carregados com sucesso.");
        callback();
    });
}

// Função para carregar os filmes do arquivo
function carregarFilmes(callback) {
    fs.readFile('filmes.txt', 'utf8', (err, data) => {
        if (err) {
            console.error("Erro ao ler o arquivo de filmes:", err);
            return;
        }

        const linhas = data.trim().split('\n');
        linhas.forEach(linha => {
            const [codigo, nome, tipo, estrelas] = linha.split(';');
            filmesDisponiveis[codigo] = {
                nome: nome,
                tipo: tipo,
                estrelas: estrelas
            };
        });

        console.log("Filmes carregados com sucesso.");
        callback();
    });
}

// Função para fazer login
function fazerLogin() {
    console.log("\n--- Fazer Login ---");
    rl.question("Digite seu CPF (somente números): ", (cpf) => {
        const usuarioKey = cpf.replace(/\D/g, '');
        if (usuarios[usuarioKey]) {
            usuarioAtual = usuarios[usuarioKey];
            console.log(`Bem-vindo, ${usuarioAtual.nome}!`);
            menu();
        } else {
            console.log("Usuário não encontrado. Tente novamente.");
            menu();
        }
    });
}

// Função para fazer locação
function fazerLocacao() {
    // Implementação da função para locação
    console.log("\n--- Fazer Locação ---");
    // ... Adicione a lógica necessária aqui ...
    menu(); // Volta ao menu principal
}

// Função para exibir o histórico de locações
function exibirHistorico() {
    console.log("\n--- Histórico de Locações ---");
    // ... Adicione a lógica necessária aqui ...
    menu(); // Volta ao menu principal
}

// Função para total de locações do dia
function totalLocacoesDia() {
    console.log("\n--- Total de Locações do Dia ---");
    // ... Adicione a lógica necessária aqui ...
    menu(); // Volta ao menu principal
}

// Função para registrar um novo usuário
function registrar() {
    console.log("\n--- Registrar ---");
    rl.question("Digite seu nome: ", (nome) => {
        rl.question("Digite seu email: ", (email) => {
            rl.question("Digite seu CPF (somente números): ", (cpf) => {
                rl.question("Digite seu CEP: ", (cep) => {
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

// Função para salvar o usuário em arquivo
function salvarUsuario(usuarioKey, usuario) {
    const data = `${usuario.nome};${usuario.email};${usuario.cpf};${usuario.cep}\n\n`;
    fs.appendFile('usuarios.txt', data, (err) => {
        if (err) {
            console.error("Erro ao salvar o usuário:", err);
        }
    });
}

// Função para salvar o filme em arquivo
function salvarFilme(codigo, filme) {
    const data = `${codigo};${filme.nome};${filme.tipo};${filme.estrelas}\n`;
    fs.appendFile('filmes.txt', data, (err) => {
        if (err) {
            console.error("Erro ao salvar o filme:", err);
        }
    });
}

// Função para salvar o prólogo do filme em arquivo
function salvarPrologo(codigo, prologo) {
    fs.writeFile(`prologo_${codigo}.txt`, prologo, (err) => {
        if (err) {
            console.error("Erro ao salvar o prólogo:", err);
        }
    });
}

// Função para salvar os comentários do filme em arquivo
function salvarComentarios(codigo, comentarios) {
    fs.writeFile(`comentarios_${codigo}.txt`, comentarios, (err) => {
        if (err) {
            console.error("Erro ao salvar os comentários:", err);
        }
    });
}

// Função para carregar os dados iniciais
function carregarDados() {
    carregarUsuarios(() => {
        carregarFilmes(menu);
    });
}

// Inicia o carregamento dos dados
carregarDados();
