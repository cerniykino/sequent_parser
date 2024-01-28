import React, { useState, useRef  } from 'react';
import Modal from 'react-modal';
import {
    printAst,
    applyRightConjunctionRule,
    applyLeftConjunctionRule,
    applyRightDisjunctionRule,
    applyLeftDisjunctionRule,
    applyRightNegationRule,
    applyLeftNegationRule,
    applyRightImplicationRule,
    applyLeftImplicationRule, applyIdentityRule, applyCutRule
} from './chevr';
import Draggable from 'react-draggable'; // Both at the same time
import './SequentDisplay.css';
function SequentDisplay({ initialSequent, onNewSequent }) {
  const [selectedRule, setSelectedRule] = useState('');
  const [output, setOutput] = useState(printAst(initialSequent)); // Convert the initial sequent to string
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [sequents, setSequents] = useState([initialSequent]);
  const initialNode = { sequent: initialSequent, children: [] };
  const [sequentTree, setSequentTree] = useState(initialNode);

  const handleRuleChange = (e) => {
    setSelectedRule(e.target.value);
  };

  const handleApplyRule = () => {
    let newSequents;
    if (selectedRule === 'rightConjunction') {
      newSequents = applyRightConjunctionRule(initialSequent);
      console.log('dsadsa')
    } else if (selectedRule === 'leftConjunction') {
      newSequents = applyLeftConjunctionRule(initialSequent);
      console.log('dsadsa')
    } else if (selectedRule === 'rightDisjunction') {
      newSequents = applyRightDisjunctionRule(initialSequent);
    } else if (selectedRule === 'leftDisjunction') {
      newSequents = applyLeftDisjunctionRule(initialSequent);
    } else if (selectedRule === 'rightNegation') {
      newSequents = applyRightNegationRule(initialSequent);
    } else if (selectedRule === 'leftNegation') {
      newSequents = applyLeftNegationRule(initialSequent);
    } else if (selectedRule === 'rightImplication') {
      newSequents = applyRightImplicationRule(initialSequent);
    } else if (selectedRule === 'leftImplication') {
      newSequents = applyLeftImplicationRule(initialSequent);
    } else if (selectedRule === 'cut') {
      const sequent1 = 'A ⊢ B';
      const sequent2 = 'B ⊢ C';
      const cutSequent = applyCutRule(sequent1, sequent2);
      if (cutSequent) newSequents = [cutSequent];
    } else if (selectedRule === 'identity'){
      const identitySequent = applyIdentityRule(initialSequent);
      if (identitySequent) newSequents = [identitySequent];
    }
    else {
      console.error('Invalid rule selected');
      return;
      
    }
    newSequents.forEach((sequent) => {
      if (onNewSequent) {
        onNewSequent(sequent);
        
      }
    });
    let newNodes = newSequents.map(sequent => ({ sequent, children: [] }));
    setSequentTree(prevTree => ({ ...prevTree, children: newNodes }));
    setSequents(prevSequents => [...prevSequents, ...newSequents]);
    closeModal();
  }
  const showVariable = () => {
    console.log(sequents)
  }

  const openModal = () => setModalIsOpen(true);
  const closeModal = () => setModalIsOpen(false);
  
  const renderSequentNode = (node) => {
    return (
      <div>
        <Draggable>
          <div className="sequentNode">{printAst(node.sequent)}</div>
        </Draggable>
        {node.children.map(childNode => renderSequentNode(childNode))}
      </div>
      );
  };
  
  return (
    <Draggable>
      <div className="sequentDisplay">
        <button onClick={showVariable}/>
        <div className="sequentOutput">
          {renderSequentNode(sequentTree)}
        </div>
        <button onClick={openModal} className="sequentButton">Select Rule</button>
        <Modal  className="customModal" isOpen={modalIsOpen} onRequestClose={closeModal} contentLabel="Select Rule">
          <button onClick={() => {setSelectedRule('rightConjunction'); handleApplyRule()}} >Right Conjunction</button>
          <button onClick={() => {setSelectedRule('leftConjunction'); handleApplyRule()}}>Left Conjunction</button>
          <button onClick={() => {setSelectedRule('rightDisjunction'); handleApplyRule()}}>Right Disjunction</button>
          <button onClick={() => {setSelectedRule('leftDisjunction'); handleApplyRule()}}>Left Disjunction</button>
          <button onClick={() => {setSelectedRule('rightNegation'); handleApplyRule()}}>Right Negation</button>
          <button onClick={() => {setSelectedRule('leftNegation'); handleApplyRule()}}>Left Negation</button>
          <button onClick={() => {setSelectedRule('rightImplication'); handleApplyRule()}}>Right Implication</button>
          <button onClick={() => {setSelectedRule('leftImplication'); handleApplyRule()}}>Left Implication</button>
          <button onClick={() => {setSelectedRule('cut'); handleApplyRule()}}>Cut Rule</button>
          <button onClick={() => {setSelectedRule('identity'); handleApplyRule()}}>Identity Rule</button>
          <button onClick={closeModal} style={{ marginTop: '10px' }}>Close</button>
        </Modal>
      </div>
    </Draggable>
    );
  
}

export default SequentDisplay;
