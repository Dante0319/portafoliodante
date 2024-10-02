document.addEventListener('DOMContentLoaded', function() {
    particlesJS('particles-js', {
        particles: {
            number: { value: 120, density: { enable: true, value_area: 800 } },
            color: { value: ['#4a4a4a', '#666666', '#2c3e50', '#34495e'] },
            shape: {
                type: ['circle', 'polygon', 'star'],
                stroke: { width: 0, color: '#ffffff' },
                polygon: { nb_sides: 6 }
            },
            opacity: {
                value: 0.7,
                random: true,
                anim: { enable: true, speed: 0.5, opacity_min: 0.1 }
            },
            size: {
                value: 6,
                random: true,
                anim: { enable: true, speed: 4, size_min: 2 }
            },
            line_linked: {
                enable: true,
                distance: 150,
                color: '#666666',
                opacity: 0.6,
                width: 2
            },
            move: {
                enable: true,
                speed: 2,
                direction: 'none',
                random: false,
                straight: false,
                out_mode: 'out',
                bounce: false
            }
        },
        interactivity: {
            detect_on: 'window',
            events: {
                onhover: { enable: true, mode: 'repulse' },
                onclick: { enable: true, mode: 'push' },
                resize: true
            },
            modes: {
                grab: { distance: 200, line_linked: { opacity: 1 } },
                bubble: { distance: 200, size: 20, duration: 1, opacity: 0.9, speed: 3 },
                repulse: { distance: 100, duration: 0.4 },
                push: { particles_nb: 6 },
                remove: { particles_nb: 2 }
            }
        },
        retina_detect: true
    });

    const startButton = document.getElementById('start-tetris');
    const tetrisGame = document.getElementById('tetris-game');
    const canvas = document.getElementById('tetris');
    const context = canvas.getContext('2d');
    const scoreElement = document.querySelector('#tetris-score span');
    const musicToggle = document.getElementById('music-toggle');
    const music = document.getElementById('tetris-music');

    let score = 0;
    const grid = 20;
    const tetrominoSequence = [];

    // Colores neón para cada tetromino
    const colors = {
        'I': '#36cb89',  // Palo
        'O': '#e8f0ff',  // Cuadrado
        'T': '#800080',  // Púrpura neón
        'S': '#8f8fff',  // Verde neón
        'Z': '#af9eab',  // Rojo neón
        'J': '#ec89ac',  // Azul neón
        'L': '#f2994a'   // Naranja neón
    };

    let count = 0;
    let tetromino = null;
    let rAF = null;
    let gameOver = false;
    let isMusicPlaying = false;

    const playfield = Array(20).fill().map(() => Array(10).fill(0));

    function generateSequence() {
        const sequence = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
        while (sequence.length) {
            const rand = Math.floor(Math.random() * sequence.length);
            const name = sequence.splice(rand, 1)[0];
            tetrominoSequence.push(name);
        }
    }

    function getNextTetromino() {
        if (tetrominoSequence.length === 0) {
            generateSequence();
        }
        const name = tetrominoSequence.pop();
        const matrix = tetrominos[name];
        const col = playfield[0].length / 2 - Math.ceil(matrix[0].length / 2);
        const row = name === 'I' ? -1 : -2;
        return { name: name, matrix: matrix, row: row, col: col };
    }

    function rotate(matrix) {
        const N = matrix.length - 1;
        const result = matrix.map((row, i) => row.map((val, j) => matrix[N - j][i]));
        return result;
    }

    function isValidMove(matrix, cellRow, cellCol) {
        for (let row = 0; row < matrix.length; row++) {
            for (let col = 0; col < matrix[row].length; col++) {
                if (matrix[row][col] && (
                    cellCol + col < 0 ||
                    cellCol + col >= playfield[0].length ||
                    cellRow + row >= playfield.length ||
                    playfield[cellRow + row][cellCol + col])
                ) {
                    return false;
                }
            }
        }
        return true;
    }

    function placeTetromino() {
        for (let row = 0; row < tetromino.matrix.length; row++) {
            for (let col = 0; col < tetromino.matrix[row].length; col++) {
                if (tetromino.matrix[row][col]) {
                    if (tetromino.row + row < 0) {
                        return showGameOver();
                    }
                    playfield[tetromino.row + row][tetromino.col + col] = tetromino.name;
                }
            }
        }

        let linesCleared = 0;
        for (let row = playfield.length - 1; row >= 0; ) {
            if (playfield[row].every(cell => !!cell)) {
                linesCleared++;
                for (let r = row; r >= 1; r--) {
                    for (let c = 0; c < playfield[r].length; c++) {
                        playfield[r][c] = playfield[r-1][c];
                    }
                }
                playfield[0] = Array(playfield[0].length).fill(0);
            }
            else {
                row--;
            }
        }

        if (linesCleared > 0) {
            score += [0, 40, 100, 300, 1200][linesCleared];
            scoreElement.textContent = score;
            
            // Aplicar efecto de temblor
            canvas.classList.add('shake');
            setTimeout(() => {
                canvas.classList.remove('shake');
            }, 500); // Remover la clase después de 500ms (duración de la animación)
        }

        tetromino = getNextTetromino();
    }

    function showGameOver() {
        cancelAnimationFrame(rAF);
        gameOver = true;
    
        // Limpiar el canvas
        context.clearRect(0, 0, canvas.width, canvas.height);
    
        // Cubrir todo el canvas con un fondo negro sólido
        context.fillStyle = 'black'; 
        context.fillRect(0, 0, canvas.width, canvas.height);
    
        // Ajustar el estilo del texto de Game Over
        context.fillStyle = 'red';
        context.font = '36px monospace';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        const message = 'GAME OVER'; 
        context.fillText(message, canvas.width / 2, canvas.height / 2 - 30);
        
        // Efecto de neón
        context.strokeStyle = 'rgba(255, 0, 0, 0.8)';
        context.lineWidth = 1;
        context.strokeText(message, canvas.width / 2, canvas.height / 2 - 30);
    
        // Crear y mostrar el botón Retry
        const style = document.createElement('style');
        style.innerHTML = `
            .retry-button {
                transition: transform 0.2s ease;
            }
            .retry-button:hover {
                transform: scale(1.1);
            }
        `;
        document.head.appendChild(style);

        // Crear el botón
        const retryButton = document.createElement('button');
        retryButton.textContent = 'RETRY';
        retryButton.classList.add('retry-button');
        retryButton.style.position = 'absolute';
        retryButton.style.left = '50%';
        retryButton.style.top = 'calc(50% + 50px)';
        retryButton.style.transform = 'translate(-50%, -50%)';
        retryButton.style.padding = '10px 20px';
        retryButton.style.fontSize = '18px';
        retryButton.style.cursor = 'pointer';
        retryButton.style.zIndex = '1000';

        const tetrisGameContainer = document.getElementById('tetris-game');
        tetrisGameContainer.style.position = 'relative';
        tetrisGameContainer.appendChild(retryButton);

        retryButton.addEventListener('click', restartGame);
    }
    
    function restartGame() {
        // Reiniciar variables del juego
        gameOver = false;
        score = 0;
        count = 0;
        playfield.forEach(row => row.fill(0));
        
        // Eliminar el botón Retry
        const retryButton = document.querySelector('.retry-button');
        if (retryButton) {
            retryButton.remove();
        }
    
        // Reiniciar el juego
        tetromino = getNextTetromino();
        scoreElement.textContent = score;
        rAF = requestAnimationFrame(loop);
    }

    const tetrominos = {
        'I': [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
        'J': [[1,0,0],[1,1,1],[0,0,0]],
        'L': [[0,0,1],[1,1,1],[0,0,0]],
        'O': [[1,1],[1,1]],
        'S': [[0,1,1],[1,1,0],[0,0,0]],
        'Z': [[1,1,0],[0,1,1],[0,0,0]],
        'T': [[0,1,0],[1,1,1],[0,0,0]]
    };

    function loop() {
        rAF = requestAnimationFrame(loop);
        context.clearRect(0, 0, canvas.width, canvas.height);

        for (let row = 0; row < 20; row++) {
            for (let col = 0; col < 10; col++) {
                if (playfield[row][col]) {
                    const name = playfield[row][col];
                    context.fillStyle = colors[name];
                    context.fillRect(col * grid, row * grid, grid - 1, grid - 1);
                    context.shadowColor = colors[name];
                    context.shadowBlur = 20;
                }
            }
        }

        if (tetromino) {
            if (++count > 35) {
                tetromino.row++;
                count = 0;
                if (!isValidMove(tetromino.matrix, tetromino.row, tetromino.col)) {
                    tetromino.row--;
                    placeTetromino();
                }
            }

            context.fillStyle = colors[tetromino.name];
            context.shadowColor = colors[tetromino.name];
            context.shadowBlur = 20;

            for (let row = 0; row < tetromino.matrix.length; row++) {
                for (let col = 0; col < tetromino.matrix[row].length; col++) {
                    if (tetromino.matrix[row][col]) {
                        context.fillRect((tetromino.col + col) * grid, (tetromino.row + row) * grid, grid - 1, grid - 1);
                    }
                }
            }
        }
    }

    document.addEventListener('keydown', function(e) {
        if (gameOver) return;

        if ([37, 38, 39, 40].includes(e.which)) {
            e.preventDefault();
        }

        if (e.which === 37 || e.which === 39) {
            const col = e.which === 37 ? tetromino.col - 1 : tetromino.col + 1;
            if (isValidMove(tetromino.matrix, tetromino.row, col)) {
                tetromino.col = col;
            }
        }

        if (e.which === 38) {
            const matrix = rotate(tetromino.matrix);
            if (isValidMove(matrix, tetromino.row, tetromino.col)) {
                tetromino.matrix = matrix;
            }
        }

        if (e.which === 40) {
            const row = tetromino.row + 1;
            if (!isValidMove(tetromino.matrix, row, tetromino.col)) {
                tetromino.row = row - 1;
                placeTetromino();
                return;
            }
            tetromino.row = row;
        }
    });

    function scrollToTetris() {
        const tetrisContainer = document.querySelector('.tetris-container');
        tetrisContainer.scrollIntoView({ behavior: 'smooth' });
    }

    startButton.addEventListener('click', function() {
        tetrisGame.style.display = 'block';
        startButton.style.display = 'none';
        tetromino = getNextTetromino();
        score = 0;
        scoreElement.textContent = score;
        rAF = requestAnimationFrame(loop);
        scrollToTetris();
        
        // Iniciar la música
        music.play();
        isMusicPlaying = true;
        musicToggle.innerHTML = '<i class="fas fa-volume-up"></i>';
    });

    musicToggle.addEventListener('click', function() {
        if (isMusicPlaying) {
            music.pause();
            musicToggle.innerHTML = '<i class="fas fa-volume-mute"></i>';
        } else {
            music.play();
            musicToggle.innerHTML = '<i class="fas fa-volume-up"></i>';
        }
        isMusicPlaying = !isMusicPlaying;
    });
});