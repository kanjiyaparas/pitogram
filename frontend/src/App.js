import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import mermaid from 'mermaid';
import { jsPDF } from "jspdf";
import 'svg2pdf.js';
import html2canvas from 'html2canvas';

function App() {
  const [inputText, setInputText] = useState('');
  const [diagramCode, setDiagramCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const diagramRef = useRef(null);

  // Mermaid initialization
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'neutral',
      securityLevel: 'loose',
      flowchart: { curve: 'basis' }
    });
  }, []);

  // Diagram rendering
  useEffect(() => {
    const renderDiagram = async () => {
      if (diagramCode && diagramRef.current) {
        try {
          diagramRef.current.innerHTML = '';
          const { svg } = await mermaid.render('mermaid-diagram', diagramCode);
          
          // Fix SVG issues
          const cleanSVG = svg
            .replace(/xlink:href/g, 'href')
            .replace(/<br>/g, '<br/>');
          
          diagramRef.current.innerHTML = cleanSVG;
          setError('');
        } catch (err) {
          setError('Diagram error: ' + err.message);
        }
      }
    };
    renderDiagram();
  }, [diagramCode]);

  const generateDiagram = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await axios.post(
        'https://pitogram.onrender.com/generate-diagram',
        inputText,
        {
          headers: { 'Content-Type': 'text/plain' },
          timeout: 15000
        }
      );

      if (!response.data) throw new Error('Invalid response from server');
      setDiagramCode(response.data);
    } catch (error) {
      setError(error.response?.data?.error || error.message);
    } finally {
      setIsLoading(false);
    }
  };


  const downloadPDF = async () => {
    try {
      if (!diagramRef.current) {
        throw new Error('Please generate diagram first');
      }
  
      // डायग्राम डिव को कैप्चर करें
      const canvas = await html2canvas(diagramRef.current, {
        scale: 2, // हाई रेजोल्यूशन के लिए
        useCORS: true, // CORS इश्यू के लिए
        logging: true // एरर्ड डिबग करने के लिए
      });
  
      // PDF साइज सेट करें
      const imgWidth = canvas.width * 0.75;
      const imgHeight = canvas.height * 0.75;
      
      const pdf = new jsPDF({
        orientation: imgWidth > imgHeight ? 'l' : 'p',
        unit: 'pt',
        format: [imgWidth, imgHeight]
      });
  
      pdf.addImage(
        canvas.toDataURL('image/jpeg', 1.0),
        'JPEG',
        0,
        0,
        imgWidth,
        imgHeight
      );
  
      pdf.save('process-diagram.pdf');
    } catch (error) {
      setError(error.message);
    }
  };

// Add validation function
const checkDiagramValidity = async (code) => {
  try {
    await mermaid.parse(code);
    return true;
  } catch (err) {
    console.error('Mermaid Syntax Error:', err);
    return false;
  }
};

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Process Flowchart Generator</h1>
      
      <div style={styles.inputSection}>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enter process steps (e.g., '1. Step One\n  - Substep')"
          style={styles.textArea}
          rows={10}
        />
      </div>

      <button
        onClick={generateDiagram}
        style={styles.button}
        disabled={isLoading}
      >
        {isLoading ? 'Generating...' : 'Generate Diagram'}
      </button>

      {error && <div style={styles.errorBox}>{error}</div>}

      {diagramCode && (
        <div style={styles.diagramSection}>
          <h3 style={styles.subHeading}>Process Flow</h3>
          <div ref={diagramRef} style={styles.diagram}></div>
          <button
            onClick={downloadPDF}
            style={{ ...styles.button, backgroundColor: '#27ae60' }}
          >
            Export as PDF
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '800px',
    margin: '0 auto',
    fontFamily: 'Arial, sans-serif'
  },
  title: {
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: '2rem'
  },
  inputSection: {
    marginBottom: '1.5rem'
  },
  textArea: {
    width: '100%',
    padding: '1rem',
    border: '2px solid #3498db',
    borderRadius: '8px',
    minHeight: '200px',
    fontFamily: 'monospace',
    fontSize: '1rem'
  },
  button: {
    padding: '0.8rem 1.5rem',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1rem',
    marginBottom: '1rem',
    width: '100%',
    transition: 'background-color 0.3s',
    '&:hover': {
      backgroundColor: '#2980b9'
    }
  },
  errorBox: {
    color: '#e74c3c',
    backgroundColor: '#f8d7da',
    padding: '1rem',
    borderRadius: '5px',
    margin: '1rem 0'
  },
  diagramSection: {
    marginTop: '2rem'
  },
  subHeading: {
    color: '#2c3e50',
    marginBottom: '1rem'
  },
  diagram: {
    border: '2px solid #3498db',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1.5rem',
    backgroundColor: 'white',
    overflowX: 'auto',
    minHeight: '400px'
  }
};

export default App;
