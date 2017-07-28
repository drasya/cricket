import React from 'react';

import PlayersDetails from 'views/PlayersDetails';
import Scoreboard from 'views/Scoreboard';
import Alert from 'common/components/Alert';
import defs from 'utils/defs';

import DartboardSVG from 'images/dartboard.inline.svg';
import styles from './app.css';

export default class App extends React.Component {
  constructor() {
    super();
    this.isGameStatus      = this.isGameStatus.bind(this);
    this.newGame           = this.newGame.bind(this);
    this.startGame         = this.startGame.bind(this);
    this.addPlayer         = this.addPlayer.bind(this);
    this.removePlayer      = this.removePlayer.bind(this);
    this.updatePlayer      = this.updatePlayer.bind(this);
    this.findPlayerIndex   = this.findPlayerIndex.bind(this);
    this.updateHit         = this.updateHit.bind(this);
    this.targetIDs = ['20', '19', '18', '17', '16', '15', 'B'];
    this.playerIDs = 0;
    this.maxPlayers = 4;
    this.state = {
      gameState: 'new',
      winner: null,
      leader: null,
      players: [],
      alert: '',
    };
  }

  findPlayerIndex(playerId, players) {
    const index = players.findIndex(p => p.id === playerId);
    if (index === -1) {
      throw new Error(`didn\'t find playerId (${playerId})`);
    }
    return index;
  }

  addPlayer(name) {
    this.setState(prevState => {
      const newState = {alert: ''};

      // Validate name
      if (name === '' || name === 0 || !name) {
        newState.alert = `invalid player name (${name})`;
        return newState;
      }
      // Validate players count
      if (prevState.players.length === this.maxPlayers) {
        newState.alert = `cannot add player, reached max-players (${this.maxPlayers})`;
        return newState;
      }
      // Check if name already exists
      if (prevState.players.length > 0) {
        const found = prevState.players.find(p => (p.name.toLowerCase() === name.toLowerCase()));
        if (found !== undefined) {
          newState.alert = `player name already exists (${name})`;
          return newState;
        }
      }
      // Pass validations adding player
      newState.players = prevState.players.slice();
      newState.players.push({
        id: this.playerIDs++,
        name: name,
        score: 0,
        targets: this.targetIDs.map(t => ({ id: t, hitCount: 0 })),
      });
      return newState;
    });
  }

  updatePlayer(playerId, newName) {
    this.setState(prevState => {
      // TODO: validate player name
      const newState = {
        alert: '',
        players: prevState.players.slice(),
      };
      const idx = this.findPlayerIndex(playerId, newState.players);
      newState.players[idx].name = newName;
      return newState;
    });
  }

  removePlayer(playerId) {
    this.setState(prevState => {
      const newState = {
        alert: '',
        players: prevState.players.slice(),
      };
      const idx = this.findPlayerIndex(playerId, newState.players);
      newState.players.splice(idx, 1);
      return newState;
    });
  }

  updateHit(playerID, targetId, amount = 1) {
    // Update players target hit count and score
    this.setState(prevState => {
      // Get prev state and cache indexes
      const players   = prevState.players.slice();
      const playerIdx = this.findPlayerIndex(playerID, players);
      const targetIdx = players[playerIdx].targets.findIndex(t => t.id === targetId);
      const hitCount  = players[playerIdx].targets[targetIdx].hitCount;

      // Validate hit count
      // on add, exit if target is closed
      if (amount > 0 && hitCount >= 3) {
        console.log('Target is closed');
        return;
      }
      // on remove, exit if target is empty
      if (amount < 0 && hitCount === 0) {
        console.log('Target is empty');
        return;
      }
      // Pass vlidations, update target and score
      players[playerIdx].targets[targetIdx].hitCount += amount;
      players[playerIdx].score += amount;

      // Prepare new state object
      const newState = {players};

      // Update leading player
      const leadingPlayer = players.reduce((prev, curr, idx, arr) => (curr.score > prev.score) ? curr : prev);
      newState.leader = leadingPlayer;

      // Do we have a winner?
      if (players[playerIdx].score === 21) {
        newState.gameState = 'over';
        newState.winner = playerID;
      }
      return newState;
    });
  }

  startGame() {
    if (this.state.players.length === 0) {
      this.setState({alert: 'cannot start game, need at least 1 player'});
    } else {
      this.setState({alert: '', gameState: 'on'});
    }
  }

  newGame() {
    this.setState({gameState: 'new'});
  }

  isGameStatus(status) {
    return (this.state.gameState === status);
  }

  componentDidMount() {
    defs.DEMO_PLAYERS.forEach(name => this.addPlayer(name));
  }

  render() {
    return (
      <div className={styles.app}>
        <header className={styles.header}>
          <h1 className={styles.title}>Cricket Darts</h1>
          {
            (!this.isGameStatus('new')) && (
              <button className={styles.ctaBtn} type="button" onClick={this.newGame}>New Game</button>
            )
          }
        </header>
        <main className={styles.main}>
          <Alert message={this.state.alert} />
          {
            (this.isGameStatus('new')) ? (
              <PlayersDetails
                players={this.state.players}
                updatePlayer={this.updatePlayer}
                removePlayer={this.removePlayer}
                addPlayer={this.addPlayer}
                startGame={this.startGame}
              />
            ) : (
              <Scoreboard
                targetIDs={this.targetIDs}
                players={this.state.players}
                updateHit={this.updateHit}
              />
            )
          }
        </main>
        <DartboardSVG className={styles.dartboardSVG}/>
      </div>
    );
  }
}
