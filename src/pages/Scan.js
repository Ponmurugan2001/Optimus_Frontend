import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import { Col, Row } from "antd";
import Doctor from "../components/Doctor";
import { useDispatch } from "react-redux";
import { showLoading, hideLoading } from "../redux/alertsSlice";
import "./scan.css"

function Home() {
  const [doctors, setDoctors] = useState([]);
  const [webcamAccessed, setWebcamAccessed] = useState(false);
  const [recording, setRecording] = useState(false);
  const [videoStream, setVideoStream] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [folderPath, setFolderPath] = useState('');
  const [detectionResult, setDetectionResult] = useState(null); // New state for detection result
  const dispatch = useDispatch();

  const getData = async () => {
    try {
      dispatch(showLoading());
      const response = await axios.get("/api/user/get-all-approved-doctors", {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
      });
      dispatch(hideLoading());
      if (response.data.success) {
        setDoctors(response.data.data);
      }
    } catch (error) {
      dispatch(hideLoading());
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const handleScanButtonClick = () => {
    if (!webcamAccessed && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          setWebcamAccessed(true);
          setVideoStream(stream);
        })
        .catch((error) => {
          console.error('Error accessing webcam:', error);
        });
    }
  };

  const handleStartRecording = () => {
    if (videoStream) {
      setRecording(true);
      const mediaRecorder = new MediaRecorder(videoStream);
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks((prev) => [...prev, event.data]);
        }
      };
      mediaRecorder.start();
      setTimeout(() => {
        mediaRecorder.stop();
        setRecording(false);
        saveRecording();
      }, 5000); // Stop recording after 5 seconds
    }
  };

  const saveRecording = () => {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style = 'display: none';
    a.href = url;
    a.download = 'recorded-video.webm';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleChooseFolderClick = () => {
    
    const input = document.createElement('input');
    
    input.type = 'file';
    input.directory = true;
    input.multiple = false;
    input.webkitdirectory = true;
    setFolderPath("new")
    input.addEventListener('change', (event) => {
      const files = event.target.files;
   
    });
    input.click();
  };

  const handleDetectPupil = async () => {
    try {
      dispatch(showLoading());
      const response = await axios.post("http://localhost:5000/detect-pupil", {
        folder_path: "C:\\Users\\ponmu\\OneDrive\\Desktop\\eye" // Use the selected folderPath
      });
      dispatch(hideLoading());
      setDetectionResult(response.data); // Set the detection result
    } catch (error) {
      dispatch(hideLoading());
      console.error('Error detecting pupil:', error);
    }
  };

  return (
    <Layout>
      {!folderPath && (
        <button className="big-button" onClick={handleChooseFolderClick}>Choose image from folder</button>
      )}
      {folderPath && (
        <button className="big-button" onClick={handleDetectPupil}>Detect Pupil</button>
      )}
      {!webcamAccessed && (
        <button className="big-button" onClick={handleScanButtonClick}>Scan</button>
      )}
      {webcamAccessed && !recording && (
        <div className="video-container">
          <video
            className="video"
            autoPlay
            ref={(videoElement) => { if (videoElement) videoElement.srcObject = videoStream; }}
          />
          <button className="record-button" onClick={handleStartRecording}>Start Recording</button>
        </div>
      )}
      {recording && <p>Recording...</p>}
      {detectionResult && (
        <div>
          <p>Minimum Diameter: {detectionResult.min_diameter}</p>
          <p>Maximum Diameter: {detectionResult.max_diameter}</p>
          <p>Ratio: {detectionResult.ratio}</p>
        </div>
      )}
    </Layout>
  );
}

export default Home;