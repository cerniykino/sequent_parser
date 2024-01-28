import React, { useState } from 'react';
import { parseAndVisit, printAst } from './chevr';
import SequentDisplay from './SequentDisplay';
import SequentTree from "./SequentTree";
import './App.css'

function App() {
  const [inputSequent, setInputSequent] = useState('');
  const [sequents, setSequents] = useState([]);

  const handleCreateSequent = () => {
    try {
      const parsedResult = parseAndVisit(inputSequent);
      setSequents([...sequents, parsedResult]);
    } catch (error) {
      console.error(`Error: ${error.message}`);
    }
  };

  const addNewSequent = (newSequent) => {
    // Update the state to include the new sequent
    setSequents(sequents => [...sequents, newSequent]);
  };

  return (
    <div className="App">
      <textarea
        className="textarea"
        value={inputSequent}
        onChange={(e) => setInputSequent(e.target.value)}
      />
      <button className="button" onClick={handleCreateSequent}>
        Create Sequent
      </button>
      {sequents.map((sequent, index) => (
        <SequentDisplay key={index} initialSequent={sequent} onNewSequent={addNewSequent} />
        ))}
    </div>
    );
}

export default App;
