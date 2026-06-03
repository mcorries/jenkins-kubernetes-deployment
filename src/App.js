import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="App">
      {/* Changed background color to a striking Crimson Red */}
      <header className="App-header" style={{ backgroundColor: '#991b1b' }}>
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#ffffff', fontWeight: 'bold' }} // Whited out the link for better contrast against red
        >
          Learn React (Pipeline Rollout Test Successful!)
        </a>
      </header>
    </div>
  );
}

export default App;