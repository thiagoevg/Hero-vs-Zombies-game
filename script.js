//Seleciona o canvas no HTML
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

/////////CARREGA IMAGENS DOS COMPONENTES///////////

//Background image
const background = new Image();
background.src = "images/background.png";

//gameOver image
const gameoverPicture = new Image();
gameoverPicture.src = "images/game-over.png";

//Hero dieing images
const heroDieingImages = [];
for (let i = 0; i <= 9; i++) {
  const newImage = new Image();
  newImage.src = `images/hero/die/JK_P__Die_00${i}.png`;
  heroDieingImages.push(newImage);
}

//Hero shooting images
const heroShootingImages = [];
for (let i = 0; i <= 9; i++) {
  const newImage = new Image();
  newImage.src = `images/hero/shoot/JK_P_Gun__Attack_00${i}.png`;
  heroShootingImages.push(newImage);
}

//Zombie walking images
const zombieWalkingImages = [];
for (let i = 0; i <= 9; i++) {
  const newImage = new Image();
  newImage.src = `images/zombie/walk/go_${i + 1}.png`;
  zombieWalkingImages.push(newImage);
}

//Zombie dieing images
const zombieDieingImages = [];
for (let i = 0; i <= 7; i++) {
  const newImage = new Image();
  newImage.src = `images/zombie/die/die_${i + 1}.png`;
  zombieDieingImages.push(newImage);
}

//Bullet image
const bullet = new Image();
bullet.src = "images/bullet.png";

/////////CARREGA SONS DO JOGO/////////

const zombieSound = new Audio();
zombieSound.src = "sounds/zombie.wav";
zombieSound.volume = 0.1;

const screamSound = new Audio();
screamSound.src = "sounds/scream.wav";
screamSound.volume = 0.1;

const clickSound = new Audio();
clickSound.src = "sounds/mouseclick.wav";
clickSound.volume = 0.1;

///////CLASS///////COMPONENT//////////////

class Component {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.status;

    //Atributos internos para incremento de posição e seleção de imagem
    this.pictureFrame = 0;
    this.dx = 0;
    this.dy = 0;
  }

  //Delimita limites geométricos dos componentes

  left() {
    return this.x;
  }
  right() {
    return this.x + this.width;
  }
  top() {
    return this.y;
  }
  bottom() {
    return this.y + this.height;
  }

  //Redefine a posição dos componentes a cada frame
  setPosition = () => {
    this.x += this.dx;
    this.y += this.dy;
  };

  //Verifica se componente foi atingido por um projétil
  killed(component) {
    return !(
      this.bottom() < component.top() ||
      this.top() > component.bottom() ||
      this.right() < component.left() ||
      this.left() > component.right()
    );
  }
}

///////CLASS///////HERO//////////////

class Hero extends Component {
  constructor(x, y, width, height, shootingArr, dieingArr) {
    super(x, y, width, height);
    this.dieingImagesArr = dieingArr;
    this.shootingImagesArr = shootingArr;
    this.pictureFrame = 0;
    this.status = "alive";
  }

  //Desenha componente no canvas
  draw = () => {
    if (this.status == "alive") {
      ctx.drawImage(
        this.shootingImagesArr[this.pictureFrame],
        this.x,
        this.y,
        this.width,
        this.height
      );
    }

    if (this.status === "dead") {
      ctx.drawImage(
        this.dieingImagesArr[this.pictureFrame],
        this.x,
        this.y,
        this.width,
        this.height
      );
    }
  };

  //Corrige dimensionamento da imagem do herói
  right() {
    return this.x + this.width - 10;
  }
  top() {
    return this.y + 10;
  }
}

//////CLASS//////ZOMBIES////////////

class Zombie extends Component {
  constructor(x, y, width, height, walkingArr, dieingArr, attackingArr) {
    super(x, y, width, height);
    this.walkingImagesArr = walkingArr;
    this.dieingImagesArr = dieingArr;
    this.attackingImagesArr = attackingArr;
    this.dx = -3;
    this.status = "alive";
    this.frames = 0;
    this.pictureFrame = 0;
  }

  //Desenha componente no canvas
  draw = () => {
    this.frames++;
    if (this.status === "alive") {
      ctx.drawImage(
        this.walkingImagesArr[parseInt((this.frames / 10) % 8)],
        this.x,
        this.y,
        this.width,
        this.height
      );
    }
    if (this.status === "dead") {
      ctx.drawImage(
        this.dieingImagesArr[this.pictureFrame],
        this.x,
        this.y,
        this.width,
        this.height
      );
    }
    if (this.status === "attack") {
      ctx.drawImage(
        this.attackingImagesArr[this.pictureFrame],
        this.x,
        this.y,
        this.width,
        this.height
      );
    }
  };
}

//////////////BULLET/////////////

class Bullet extends Component {
  constructor(x, y, width, height, img) {
    super(x, y, width, height);
    this.img = img;
    this.dx = 10;
  }

  //Desenha componente no canvas
  draw = () => {
    ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
  };
}

/////////CLASS///////GAME////////////////

class Game {
  constructor(player) {
    this.player = player;
    this.components = [];
    this.bullets = [];
    this.zombies = [];
    this.animationId;
    this.frames = 0;
    this.shootFrames = 0;
    this.gameoverPicture = gameoverPicture;
    this.score = 0;
  }

  //Limpa canvas a cada frame
  clear = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  //Atualiza posicionamento dos componentes do jogo
  updateComponents = () => {
    this.bullets.forEach((bullet) => {
      bullet.setPosition();
      bullet.draw();
    });
    this.zombies.forEach((zombie) => {
      zombie.setPosition();
      zombie.draw();
    });

    this.player.setPosition();
    this.player.draw();
  };

  //Realizado disparo de novo projétil
  shoot = () => {
    let frames = this.player.shootingImagesArr.length;
    if (this.shootFrames > 30) {
      this.shootAnimation(frames);
      this.shootFrames = 0;
    }
  };

  //Realiza a animação do disparo e chama a função generateBullet
  shootAnimation = (frames) => {
    setTimeout(() => {
      if (frames > 0) {
        frames -= 1;
        this.player.pictureFrame = frames;
        if (frames === 0) {
          this.generateBullet();

          return;
        }
        this.shootAnimation(frames);
      }
    }, 40);
  };

  //Cria projétio e adiciona na lista de componentes bullets
  generateBullet = () => {
    //Obs: o som do disparo precisou se instanciado aqui para evitar problemas de assincronicidade
    const bangSound = new Audio();
    bangSound.src = "sounds/bang.wav";
    bangSound.volume = 0.1;
    bangSound.play();
    this.bullets.push(new Bullet(80, this.player.y + 70, 20, 30, bullet));
  };

  //Gera zumbis em posições aleatórias
  generateZombies() {
    this.frames++;
    if (this.frames % 50 === 0) {
      const originX = canvas.width;

      const minY = 220;
      const maxY = 520;
      const randomY = Math.floor(Math.random() * (maxY - minY + 1)) + minY;
      const newZombie = new Zombie(
        originX,
        randomY,
        70,
        100,
        zombieWalkingImages,
        zombieDieingImages
      );
      this.components.push(newZombie);
      this.zombies.push(newZombie);
    }
  }

  //Modifica status do zumbi de "alive" para "dead", encerra o deslocamento e reproduz som
  zombieDied = (zombie, zombieIdx) => {
    let frames = 0;
    zombie.status = "dead";
    zombie.dx = 0;
    zombieSound.play();
    this.zombieDieingAnimation(frames, zombie, zombieIdx);
  };

  //Realiza animação do zumbi morrendo
  zombieDieingAnimation = (frames, zombie, zombieIdx) => {
    setTimeout(() => {
      frames += 1;
      zombie.pictureFrame = frames;
      if (frames === zombie.dieingImagesArr.length - 1) {
        this.zombies.splice(zombieIdx, 1);
        return;
      }
      this.zombieDieingAnimation(frames, zombie, zombieIdx);
    }, 70);
  };

  //Verifica se zumbi foi atingido por um projétil
  checkKill = () => {
    this.bullets.forEach((bullet, bulletIdx) =>
      this.zombies.forEach((zombie, zombieIdx) => {
        if (bullet.killed(zombie)) {
          this.score++;
          this.zombieDied(zombie, zombieIdx);
          this.bullets.splice(bulletIdx, 1);
        }
      })
    );
  };

  //Encerra a animação e desenha a tela de game-over
  gameOver = () => {
    cancelAnimationFrame(this.animationId);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(this.gameoverPicture, 0, 0, canvas.width, canvas.height);
    ctx.font = "15px Verdana";
    ctx.fillStyle = "black";
    ctx.fillText(`Final Score: ${this.score}`, 85, 170);
    // ctx.drawImage(zombieDieingImages[3], 160, 0, 80, 80);
  };

  //Verifica se o player foi morto e chama método gameOver
  checkGameOver = () => {
    this.zombies.forEach((zombie, zombieIdx) => {
      if (zombie.killed(this.player)) {
        this.zombieDied(zombie, zombieIdx);
        this.heroDied(this.player);
      }
    });
  };

  //Muda status do herói de "alive" para "dead" e inicia a animação
  heroDied = (hero) => {
    let frames = 0;
    hero.status = "dead";
    hero.dx = 0;
    screamSound.play();
    this.heroDieingAnimation(frames, hero);
  };

  //Animação do herói morrendo
  heroDieingAnimation = (frames, hero) => {
    setTimeout(() => {
      frames += 1;
      hero.pictureFrame = frames;
      if (frames === hero.dieingImagesArr.length - 1) {
        this.gameOver();
        return;
      }
      this.heroDieingAnimation(frames, hero);
    }, 100);
  };

  //Desenha o score atualizado na tela
  updateScore() {
    ctx.font = "30px Verdana";
    ctx.fillStyle = "white";
    ctx.fillText(`Kills:`, 90, 70);
    ctx.drawImage(zombieDieingImages[3], 160, 0, 80, 80);
    ctx.fillText(`x${this.score}`, 230, 70);
  }

  //////////////////

  //Inicia efetivamente o jogo
  start = () => {
    this.updateGameArea();
  };

  //Encadeia os métodos necessários para o funcionamento do jogo a cada frame
  updateGameArea = () => {
    //Limpa canvas
    this.clear();

    //Desenha background
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    //Gera zumbis
    this.generateZombies();

    //Atualiza score
    this.updateScore();

    //Atualiza componentes
    this.updateComponents();

    //Checa colisões
    this.checkKill();

    //Realiza a animação (callback)
    this.animationId = requestAnimationFrame(this.updateGameArea);

    //Checa Game Over
    this.checkGameOver();

    //Incrementa shootFrames
    this.shootFrames++;
  };
}

///////CARREGA IMAGENS E INICIA O JOGO////////

//Faz as preparações necessárias e começa o jogo
startGame = () => {
  // Remove canvas da tela introdutória
  const gameBoard = document.querySelector("#game-board");
  document.querySelector("body").removeChild(gameBoard);

  // Adiciona eventListener à tela introdutória para o início do jogo
  const gameIntro = document.querySelector("#game-intro");
  gameIntro.addEventListener("click", () => {
    //Remove tela introdutória
    document.querySelector("body").removeChild(gameIntro);
    //Reintroduz o canvas
    document.querySelector("body").appendChild(gameBoard);
    const bangSoundIntro = new Audio();
    bangSoundIntro.src = "sounds/bang.wav";
    bangSoundIntro.volume = 0.1;
    bangSoundIntro.play();
    //Inicia o jogo efetivamente
    game.start();
  });

  //Cria herói
  const hero = new Hero(0, 240, 80, 120, heroShootingImages, heroDieingImages);

  //Cria novo jogo
  const game = new Game(hero);
  //Adiciona herói na lista de componentes
  game.components.push(hero);

  //Adiciona eventListener para o posicionamento do player
  document.addEventListener("mousemove", (e) => {
    if (e.clientY >= 290 && e.clientY <= 570) {
      hero.y = e.clientY - 90;
    }
  });

  //Adiciona eventListener 'click' para disparar projétil
  gameBoard.addEventListener("click", () => {
    setTimeout(game.shoot, 70);
  });
};

//Espera o tempo de processamento dos componentes para iniciar o jogo
window.onload = () => {
  startGame();
};

//Adiciona eventListener na tela inicial
let gameIntro = document.querySelector("#game-intro div");
gameIntro.addEventListener("mouseover", () => {
  clickSound.play();
});
