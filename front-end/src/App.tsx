// ...existing code...
import { useState, useRef } from 'react'
import './App.css'

function App() {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [fileAName, setFileAName] = useState<string>('');
  const [fileBName, setFileBName] = useState<string>('');
  const [textValue, setTextValue] = useState<string>('');

  // new UI state
  const [llmOutput, setLlmOutput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputARef = useRef<HTMLInputElement | null>(null)
  const fileInputBRef = useRef<HTMLInputElement | null>(null)

  const handleClick = async () => {
    if (!fileA || !fileB) {
      alert("Please select both files");
      return;
    }

    setLoading(true);
    setError(null);
    setLlmOutput('');

    const formData = new FormData();
    formData.append("job_file", fileA);
    formData.append("resume_file", fileB);
    formData.append("prompt", textValue);

    try {
      const res = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        // Prefer server-provided message, fallback to generic
        setError(data.error || data.message || 'Upload failed');
      } else {
        // backend returns llm_output per main.py
        setLlmOutput(data.llm_output || data.message || JSON.stringify(data));
      }
      console.log("Response:", data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1>Resume Agent</h1>
      <div className="card">

        <div style={{ marginTop: 20 }}>
          <div style={{ marginBottom: 12 }}>
            <input
              ref={fileInputARef}
              type="file"
              accept=".pdf,application/pdf"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) {
                  // runtime validation: ensure MIME type or extension is PDF
                  if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) {
                    alert('Please select a PDF file');
                    e.currentTarget.value = '';
                    setFileA(null);
                    setFileAName('');
                    return;
                  }
                }
                setFileA(f || null)
                setFileAName(f ? f.name : '')
              }}
            />
            <button onClick={() => fileInputARef.current?.click()}>
              Choose Job
            </button>
            <span className='span-container' >{fileAName || 'No file chosen'}</span>
          </div>

          <div style={{ marginBottom: 12 }}>
            <input
              ref={fileInputBRef}
              type="file"
              accept=".pdf,application/pdf"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) {
                  if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) {
                    alert('Please select a PDF file');
                    e.currentTarget.value = '';
                    setFileB(null);
                    setFileBName('');
                    return;
                  }
                }
                setFileB(f || null)
                setFileBName(f ? f.name : '')
              }}
            />
            <button onClick={() => fileInputBRef.current?.click()}>
              Choose Resume
            </button>
            <span className='span-container'>{fileBName || 'No file chosen'}</span>
          </div>

          <div>
            <label htmlFor="notes">Prompt</label>
            <textarea
              id="notes"
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              rows={5}
              style={{ width: '100%', maxWidth: 600 }}
            />
          </div>
        </div>

        <button onClick={handleClick} style={{ marginTop: 20 }} disabled={loading}>
          {loading ? 'Sending...' : 'Send Prompt'}
        </button>

        {/* Display error or LLM output */}
        <div style={{ marginTop: 16 }}>
          {error && (
            <div style={{ color: 'red', marginBottom: 8 }}>
              Error: {error}
            </div>
          )}

          <label htmlFor="llm-output">LLM Response</label>
          <textarea
            id="llm-output"
            value={llmOutput}
            readOnly
            rows={10}
            style={{ width: '100%', maxWidth: 800, whiteSpace: 'pre-wrap' }}
            placeholder={loading ? 'Waiting for response...' : 'LLM output will appear here'}
          />
        </div>
      </div>
    </>
  )
}

export default App
// ...existing code...