import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// ============= STEGANOGRAPHY UTILITIES =============
const stegUtils = {
  // ROT13 cipher
  rot13: (str) => str.replace(/[a-zA-Z]/g, c => String.fromCharCode((c <= 'Z' ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26)),
  
  // Codifica semplice per leaderboard
  encodeScore: (seed) => {
    const base = 'TRIPL3_' + String(seed).padStart(5, '0') + '_PYRAMID_SOLVER';
    return base;
  },
  
  // Messaggi nascosti nei layer
  hiddenMessages: {
    layer1: "f1rst letter of each word reveals: LISIRYPNWY (ROT13: YVFVELPBJL = your victory begins with logic)",
    layer2: "pattern in pixels at coordinates [13,42,137,255] = 0xDEADBEEF",
    layer3: "final cipher key = sum of all found numbers modulo 256",
  },
  
  // Funzione per creare messaggio con segnali nascosti
  createHiddenMessage: (layer) => {
    const messages = {
      1: "Look at the f1rst letter of each word carefully.\nSomething IS hidden here.\nYour next step requires PATTERN recognition.\nI know you're reading this.\nOpen the terminal.\nNobody will understand but YOU.\nReady for the next level?",
      2: "The pattern you seek exists in binary form.\nEvery character holds a secret.\nStrangers won't see what you see.\nTrust your instincts.\nHexadecimal is the language.\nExamine the image data.\nEnter the void and find the truth.",
      3: "GSVFH RH GSV NRGGVN DZGVIYZA - Use ROT13 to decode.\nThe numbers you found matter.\nAdd them together: 13 + 42 + 137 + 255 = 447\nTake modulo 256: 447 % 256 = 191\nYour cipher key: [191]\nDecrypt the final message with this knowledge.",
      4: "You've decoded the pyramid.\nThe third eye is now open.\nYour verification code will unlock the next phase.\nShare it. Others are searching.\nThe collective awakening begins here.\nYou are not alone in this pursuit.",
    };
    return messages[layer] || "Unknown layer";
  }
};

// ============= CANVAS ANIMATION COMPONENT =============
const CanvasBackground = ({ isActive }) => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isActive) return;
    
    const ctx = canvas.getContext('2d');
    const w = canvas.width = window.innerWidth;
    const h = canvas.height = window.innerHeight;
    
    let particles = [];
    let time = 0;
    
    // Inizializza particelle
    for (let i = 0; i < 150; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        life: Math.random(),
        hue: 180 + Math.random() * 60,
      });
    }
    
    const animate = () => {
      time += 0.01;
      
      // Sfondo con scanline effect
      ctx.fillStyle = 'rgba(10, 10, 20, 0.1)';
      ctx.fillRect(0, 0, w, h);
      
      // Scanlines
      ctx.strokeStyle = 'rgba(0, 255, 200, 0.03)';
      ctx.lineWidth = 1;
      for (let i = 0; i < h; i += 4) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(w, i);
        ctx.stroke();
      }
      
      // Update e disegna particelle
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.002;
        
        if (p.life <= 0) {
          particles[i] = {
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            life: 1,
            hue: 180 + Math.random() * 60,
          };
        }
        
        // Disegna particella
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 20);
        gradient.addColorStop(0, `hsla(${p.hue}, 100%, 50%, ${p.life * 0.5})`);
        gradient.addColorStop(1, `hsla(${p.hue}, 100%, 50%, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
        ctx.fill();
      });
      
      // Effetto glitch casuale
      if (Math.random() > 0.95) {
        const glitchY = Math.random() * h;
        const glitchHeight = Math.random() * 100 + 50;
        ctx.fillStyle = `rgba(255, 0, 100, ${Math.random() * 0.1})`;
        ctx.fillRect(0, glitchY, w, glitchHeight);
      }
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }, [isActive]);
  
  return <canvas ref={canvasRef} className="canvas-bg" />;
};

// ============= PYRAMID PUZZLE COMPONENT =============
const PyramidPuzzle = ({ onComplete, layer }) => {
  const [eyes, setEyes] = useState([
    { id: 1, x: 50, y: 50, placed: false },
    { id: 2, x: 150, y: 100, placed: false },
    { id: 3, x: 250, y: 50, placed: false },
  ]);
  
  const [dragging, setDragging] = useState(null);
  const [pyramidActive, setPyramidActive] = useState(false);
  const pyramidRef = useRef(null);
  
  const handleMouseDown = (id, e) => {
    e.preventDefault();
    setDragging(id);
  };
  
  const handleMouseMove = (e) => {
    if (dragging === null) return;
    
    const updatedEyes = eyes.map(eye => {
      if (eye.id === dragging) {
        return { ...eye, x: e.clientX - 25, y: e.clientY - 25 };
      }
      return eye;
    });
    setEyes(updatedEyes);
  };
  
  const handleMouseUp = () => {
    setDragging(null);
    checkCollisions();
  };
  
  const checkCollisions = () => {
    const pyramid = pyramidRef.current;
    if (!pyramid) return;
    
    const pyramidRect = pyramid.getBoundingClientRect();
    const pyramidCenterX = pyramidRect.left + pyramidRect.width / 2;
    const pyramidCenterY = pyramidRect.top + pyramidRect.height / 2;
    
    // Target positions per gli occhi sulla piramide
    const targetPositions = [
      { x: pyramidCenterX, y: pyramidCenterY - 80, radius: 40 }, // top
      { x: pyramidCenterX - 80, y: pyramidCenterY + 60, radius: 40 }, // bottom left
      { x: pyramidCenterX + 80, y: pyramidCenterY + 60, radius: 40 }, // bottom right
    ];
    
    const updatedEyes = eyes.map(eye => {
      let placed = false;
      
      targetPositions.forEach(target => {
        const distance = Math.hypot(
          (eye.x + 25) - target.x,
          (eye.y + 25) - target.y
        );
        
        if (distance < target.radius) {
          eye.x = target.x - 25;
          eye.y = target.y - 25;
          placed = true;
        }
      });
      
      return { ...eye, placed };
    });
    
    setEyes(updatedEyes);
    
    // Controlla se tutti gli occhi sono piazzati
    if (updatedEyes.every(e => e.placed)) {
      setTimeout(() => {
        setPyramidActive(true);
        onComplete();
      }, 300);
    }
  };
  
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, eyes]);
  
  return (
    <div className="puzzle-container">
      <div className="puzzle-title">LAYER {layer}: ASSEMBLE THE PYRAMID</div>
      
      <div className="puzzle-area">
        <div className={`pyramid-container ${pyramidActive ? 'active' : ''}`}>
          <svg ref={pyramidRef} viewBox="0 0 200 250" className="pyramid-svg">
            <polygon points="100,20 180,220 20,220" fill="none" stroke="rgba(0,255,200,0.5)" strokeWidth="2" />
            <circle cx="100" cy="20" r="15" fill="none" stroke="rgba(255,0,100,0.3)" strokeWidth="2" />
            <circle cx="180" cy="220" r="15" fill="none" stroke="rgba(255,0,100,0.3)" strokeWidth="2" />
            <circle cx="20" cy="220" r="15" fill="none" stroke="rgba(255,0,100,0.3)" strokeWidth="2" />
          </svg>
        </div>
        
        <div className="eyes-container">
          {eyes.map(eye => (
            <div
              key={eye.id}
              className={`eye ${eye.placed ? 'placed' : ''}`}
              style={{ left: eye.x, top: eye.y }}
              onMouseDown={(e) => handleMouseDown(eye.id, e)}
            >
              <div className="eye-pupil" />
            </div>
          ))}
        </div>
      </div>
      
      <div className="puzzle-hint">Drag the eyes to the pyramid vertices</div>
    </div>
  );
};

// ============= MAIN APP COMPONENT =============
export default function TriplVision() {
  const [stage, setStage] = useState('intro'); // intro, puzzle, layer1, layer2, layer3, layer4, complete
  const [layer, setLayer] = useState(0);
  const [foundElements, setFoundElements] = useState([]);
  const [decodedElements, setDecodedElements] = useState([]);
  const [finalCode, setFinalCode] = useState('');
  const [leaderboardCode, setLeaderboardCode] = useState('');
  
  const handleIntroClick = () => {
    setStage('puzzle');
    setLayer(1);
  };
  
  const handlePuzzleComplete = () => {
    setTimeout(() => {
      setStage('layer1');
    }, 500);
  };
  
  const handleLayer1Continue = () => {
    // Mostra elemento nascosto #1: 13
    setFoundElements([...foundElements, 13]);
    setStage('layer2');
    setLayer(2);
  };
  
  const handleLayer2Continue = () => {
    // Mostra elemento nascosto #2: 42
    setFoundElements([...foundElements, 42]);
    setStage('layer3');
    setLayer(3);
  };
  
  const handleLayer3Continue = () => {
    // Mostra elemento nascosto #3 e #4: 137, 255
    setFoundElements([...foundElements, 137, 255]);
    setStage('layer4');
    setLayer(4);
  };
  
  const handleLayer4Complete = () => {
    // Calcola il codice finale
    const sum = foundElements.reduce((a, b) => a + b, 0);
    const cipherKey = sum % 256;
    const code = stegUtils.encodeScore(Math.floor(Date.now() / 1000) % 100000);
    setFinalCode(code);
    setLeaderboardCode(code);
    setStage('complete');
  };
  
  return (
    <div className="app">
      <CanvasBackground isActive={stage !== 'intro'} />
      
      {/* INTRO STAGE */}
      {stage === 'intro' && (
        <div className="stage intro-stage">
          <div className="intro-content">
            <div className="intro-text">SOMETHING WANTS TO BE FOUND</div>
            <div className="intro-subtitle">Click anywhere to begin</div>
            <button className="intro-button" onClick={handleIntroClick}>
              ENTER
            </button>
          </div>
        </div>
      )}
      
      {/* PUZZLE STAGE */}
      {stage === 'puzzle' && (
        <div className="stage puzzle-stage">
          <PyramidPuzzle onComplete={handlePuzzleComplete} layer={1} />
        </div>
      )}
      
      {/* LAYER 1 */}
      {stage === 'layer1' && (
        <div className="stage layer-stage">
          <div className="layer-content">
            <div className="layer-title">LAYER 1: HIDDEN MESSAGE</div>
            <div className="hidden-message-box">
              <pre className="hidden-text">{stegUtils.createHiddenMessage(1)}</pre>
            </div>
            <div className="hint-box">
              <span className="hint-icon">💡</span>
              <span>First letters: L-I-S-I-R-Y-P-N-W-Y (ROT13: YVFVELPBJL)</span>
            </div>
            <div className="found-element">
              ✓ Found Element #1: <strong>13</strong>
            </div>
            <button className="continue-button" onClick={handleLayer1Continue}>
              NEXT LAYER
            </button>
          </div>
        </div>
      )}
      
      {/* LAYER 2 */}
      {stage === 'layer2' && (
        <div className="stage layer-stage">
          <div className="layer-content">
            <div className="layer-title">LAYER 2: PATTERN RECOGNITION</div>
            <div className="hidden-message-box">
              <pre className="hidden-text">{stegUtils.createHiddenMessage(2)}</pre>
            </div>
            <div className="hint-box">
              <span className="hint-icon">🔍</span>
              <span>Binary patterns hidden in character encoding. Look at pixel coordinates.</span>
            </div>
            <div className="found-elements">
              ✓ Found Element #2: <strong>42</strong>
              <br />
              <span className="element-hint">Hex decoded: 0xDEADBEEF → 42 (The Answer)</span>
            </div>
            <button className="continue-button" onClick={handleLayer2Continue}>
              NEXT LAYER
            </button>
          </div>
        </div>
      )}
      
      {/* LAYER 3 */}
      {stage === 'layer3' && (
        <div className="stage layer-stage">
          <div className="layer-content">
            <div className="layer-title">LAYER 3: CIPHER BREAKING</div>
            <div className="hidden-message-box">
              <pre className="hidden-text">{stegUtils.createHiddenMessage(3)}</pre>
            </div>
            <div className="hint-box">
              <span className="hint-icon">🔐</span>
              <span>Use ROT13 to decode. Then sum: 13 + 42 + 137 + 255 = 447</span>
            </div>
            <div className="found-elements">
              ✓ Found Elements #3 & #4: <strong>137, 255</strong>
              <br />
              <span className="element-hint">Cipher Key: 447 % 256 = 191</span>
            </div>
            <button className="continue-button" onClick={handleLayer3Continue}>
              FINAL STAGE
            </button>
          </div>
        </div>
      )}
      
      {/* LAYER 4 */}
      {stage === 'layer4' && (
        <div className="stage layer-stage">
          <div className="layer-content">
            <div className="layer-title">LAYER 4: THE AWAKENING</div>
            <div className="hidden-message-box">
              <pre className="hidden-text">{stegUtils.createHiddenMessage(4)}</pre>
            </div>
            <div className="all-elements">
              Found Elements: {foundElements.join(' + ')} = {foundElements.reduce((a, b) => a + b, 0)}
              <br />
              <span className="cipher-explanation">
                Cipher Key: {foundElements.reduce((a, b) => a + b, 0) % 256}
              </span>
            </div>
            <button className="continue-button" onClick={handleLayer4Complete}>
              REVEAL VERIFICATION CODE
            </button>
          </div>
        </div>
      )}
      
      {/* COMPLETION STAGE */}
      {stage === 'complete' && (
        <div className="stage complete-stage">
          <div className="completion-content">
            <div className="completion-title">🔺 PYRAMID UNLOCKED 👁️</div>
            <div className="verification-code">
              <div className="code-label">Your Verification Code:</div>
              <div className="code-display">{leaderboardCode}</div>
              <button 
                className="copy-button" 
                onClick={() => {
                  navigator.clipboard.writeText(leaderboardCode);
                  alert('Code copied to clipboard!');
                }}
              >
                COPY CODE
              </button>
            </div>
            <div className="completion-message">
              Share your code to join the leaderboard.
              <br />
              Others are searching. You are not alone.
            </div>
            <button className="restart-button" onClick={() => location.reload()}>
              RESTART EXPERIENCE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
