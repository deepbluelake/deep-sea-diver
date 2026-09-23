import Game from './Game.js';

const canvas = document.createElement('canvas');
document.body.appendChild(canvas);

const game = new Game(canvas);
game.start();
