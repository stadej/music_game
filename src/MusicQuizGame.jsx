import React, { useState, useEffect, useRef } from 'react';
import { quizData } from './quizData';

const MusicQuizGame = () => {
  const [score, setScore] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [playerReady, setPlayerReady] = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState([]);
  const [questionType, setQuestionType] = useState('artist'); // 'artist' or 'song'
  const playerRef = useRef(null);
  const gameOverPlayerRef = useRef(null);
  const timerRef = useRef(null);

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopAudio = () => {
    if (playerRef.current && playerRef.current.pauseVideo) {
      playerRef.current.pauseVideo();
    }
    stopTimer();
  };

  const handleTimeOut = () => {
    stopAudio();
    setGameOver(true);
  };

  const getRandomNumber = () => {
    let randomNumber = Math.floor(Math.random() * (quizData.length - 1));


    while(questionsAnswered.includes(randomNumber) || randomNumber === currentQuestion){
      randomNumber = Math.floor(Math.random() * (quizData.length - 1));
    }

    return randomNumber;
  }

  const handleAnswer = (answer) => {
    if (selectedAnswer !== null) return;

    stopAudio();
    setSelectedAnswer(answer);

    const correct = questionType === 'artist' 
      ? answer === currentQuiz.artist 
      : answer === currentQuiz.song;

    if (correct) {
      const newScore = score + 1;
      setScore(newScore);

      setQuestionsAnswered([...questionsAnswered, currentQuestion])

      setTimeout(() => {
        setSelectedAnswer(null);
        setCurrentQuestion(getRandomNumber());
      }, 1500);
    } else {
      setTimeout(() => {
        setSelectedAnswer(null);
        setGameOver(true);
      }, 1500);
    }
  };

  const resetGame = () => {

    if (gameOverPlayerRef.current) {
      try {
        if (gameOverPlayerRef.current.pauseVideo) {
          gameOverPlayerRef.current.pauseVideo();
        }
        if (gameOverPlayerRef.current.destroy) {
          gameOverPlayerRef.current.destroy();
        }
      } catch (e) {
        // Ignore errors during cleanup
      }
      gameOverPlayerRef.current = null;
    }

    // Set gameOver to false after a small delay to allow cleanup
    setTimeout(() => {
      setGameOver(false);
      setScore(0);
      setQuestionsAnswered([]);
      setCurrentQuestion(getRandomNumber());
      setSelectedAnswer(null);
      setTimeLeft(30);
      setPlayerReady(false);
      setShuffledOptions([]);
      setQuestionType('song');
    }, 100);
  };

  // Load YouTube IFrame API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // Initialize YouTube player
  useEffect(() => {
    if (gameOver) {return};

    const initPlayer = () => {
      if (window.YT && window.YT.Player) {
        // Destroy existing player if it exists
        if (playerRef.current && playerRef.current.destroy) {
          playerRef.current.destroy();
        }

        // Create new player
        playerRef.current = new window.YT.Player('youtube-player', {
          height: '0',
          width: '0',
          videoId: quizData[currentQuestion].youtubeId,
          playerVars: {
            autoplay: 0,
            controls: 0,
          },
          events: {
            onReady: (event) => {
              setPlayerReady(true);
            },
          },
        });
      }
    };

    // Reset player ready state
    setPlayerReady(false);

    const isArtistQuestion = Math.random() < 0.5;
    setQuestionType(isArtistQuestion ? 'artist' : 'song');
    
    // Get the appropriate options based on question type
    const currentQuiz = quizData[currentQuestion];
    const options = isArtistQuestion 
      ? [...currentQuiz.artistOptions] 
      : [...currentQuiz.songOptions];

    const shuffled = options.sort(() => Math.random() - 0.5);
    setShuffledOptions(shuffled);

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (playerRef.current && playerRef.current.destroy) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // Ignore errors during cleanup
        }
        playerRef.current = null;
      }
    };
  }, [currentQuestion]);

  // Play audio when ready
  useEffect(() => {

    if (playerReady && selectedAnswer === null) {

      if(!gameOver){
        const currentQuiz = quizData[currentQuestion];
        playerRef.current.loadVideoById({
          videoId: currentQuiz.youtubeId,
          startSeconds: currentQuiz.startTime,
          endSeconds: currentQuiz.startTime + 30,
        });
        playerRef.current.playVideo();
        startTimer();
      }else{
        gameOverPlayerRef.current.loadVideoById({
          videoId: '6n3pFFPSlW4',
          startSeconds: 10,
          endSeconds: 15,
        });
        gameOverPlayerRef.current.playVideo();
      }
    } 

    return () => {
      stopTimer();
    };
  }, [playerReady]);

  useEffect(() => {
    if (gameOver) {
      const initGameOverPlayer = () => {
        if (window.YT && window.YT.Player) {
          // Destroy existing game over player if it exists
          if (gameOverPlayerRef.current && gameOverPlayerRef.current.destroy) {
            try {
              gameOverPlayerRef.current.destroy();
            } catch (e) {
              // Ignore errors during cleanup
            }
          }

          // Create new game over player
          gameOverPlayerRef.current = new window.YT.Player('game-over-youtube-player', {
            height: '0',
            width: '0',
            videoId: '6n3pFFPSlW4',
            playerVars: {
              autoplay: 0,
              controls: 0,
            },
            events: {
            onReady: (event) => {
              setPlayerReady(true);
            },
          },
          });
        }
      };

      setPlayerReady(false);

      if (window.YT && window.YT.Player) {
        initGameOverPlayer();
      }
    }

    return () => {
      if (gameOverPlayerRef.current && gameOverPlayerRef.current.destroy) {
        try {
          gameOverPlayerRef.current.destroy();
        } catch (e) {
          // Ignore errors during cleanup
        }
        gameOverPlayerRef.current = null;
      }
    };
  }, [gameOver]);

  if (gameOver) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-400 via-blue-800 to-amber-400 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-md w-full text-center border border-white/20 shadow-2xl">
          {score >= 7 ? (
            <>
              <h1 className="text-4xl font-bold text-white mb-4">YOU WIN!</h1>
              <img
                className="w-48 h-48 mx-auto mb-4"
                src="/images/Gnome-meme-5.png"
              />
              <div className="bg-yellow-400/20 border-2 border-yellow-400 rounded-xl p-6 mb-6">
                <p className="text-xl text-white font-semibold">
                  Gnomes hid your gifts in the wood chest
                </p>
              </div>
              <p className="text-white text-lg mb-6">
                Final Score: {score}
              </p>
            </>
          ) : (
            <>
              <h1 className="text-4xl font-bold text-white mb-4">Game Over</h1>
              <div id="game-over-youtube-player" style={{ display: 'none' }}></div>
              <img
                className="w-48 h-48 mx-auto mb-4"
                src="/images/Gnome-meme-5.png"
              />
              <p className="text-white text-xl mb-6">
                Final Score: {score}
              </p>
              <p className="text-white/80 mb-6">
                {score > 0 ? "You're gonna have to GNOME more songs next time!" : "Better luck next time, me old chum!"}
              </p>
            </>
          )}
          <button
            onClick={resetGame}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-full font-semibold flex items-center gap-2 mx-auto transition-all transform hover:scale-105"
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }

  const currentQuiz = quizData[currentQuestion];
  const correctAnswer = questionType === 'artist' ? currentQuiz.artist : currentQuiz.song;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-400 via-blue-800 to-amber-400 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-2xl w-full border border-white/20 shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">Gnome's Gnolden Gmedley</h1>
          </div>
          <div className="text-right">
            <div className="text-white/70 text-sm">Score</div>
            <div className="text-3xl font-bold text-white">{score}</div>
          </div>
        </div>

        <div className="mb-8">
          <div className="bg-white/5 rounded-xl p-6 mb-4 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white text-lg font-semibold">
                Listen to the song...
              </span>
              <div className="bg-blue-500 rounded-full px-4 py-2 font-bold text-white">
                {timeLeft}s
              </div>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000"
                style={{ width: `${(timeLeft / 30) * 100}%` }}
              />
            </div>
          </div>

          <div id="youtube-player" style={{ display: 'none' }}></div>

          <p className="text-white/90 text-xl mb-4 text-center font-semibold">
            {questionType === 'artist' ? 'Who is the artist?' : 'What is the song title?'}
          </p>

          <div className="grid grid-cols-1 gap-3">
            {shuffledOptions.map((option, index) => {
              let buttonClass = "bg-white/10 hover:bg-white/20 border-white/20";
              
              if (selectedAnswer !== null) {
                if (option === correctAnswer) {
                  buttonClass = "bg-green-500/30 border-green-400";
                } else if (option === selectedAnswer) {
                  buttonClass = "bg-red-500/30 border-red-400";
                }
              }

              return (
                <button
                  key={index}
                  onClick={() => handleAnswer(option)}
                  disabled={selectedAnswer !== null}
                  className={`${buttonClass} border-2 text-white px-6 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 disabled:cursor-not-allowed disabled:transform-none`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        <div className="text-center text-white/60 text-sm">
          Guess 7 songs in a row and we'll tell you where your gifts are hidden!
        </div>
      </div>
    </div>
  );
};

export default MusicQuizGame;