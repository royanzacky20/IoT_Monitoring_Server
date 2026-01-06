import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCHXrDSqK2_PPOGjvghjmHLWWS2dJWOND4",
  authDomain: "iot-server-monitor.firebaseapp.com",
  databaseURL: "https://iot-server-monitor-default-rtdb.firebaseio.com",
  projectId: "iot-server-monitor",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
