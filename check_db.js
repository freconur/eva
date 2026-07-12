const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs, limit, query } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyDli98HId_qZcJq0yez2nr4ueS12aeFQw0",
  authDomain: "evaluaciones-ugel.firebaseapp.com",
  projectId: "evaluaciones-ugel",
  storageBucket: "evaluaciones-ugel.firebasestorage.app",
  messagingSenderId: "694050305562",
  appId: "1:694050305562:web:d5b98183620099729103a3",
  measurementId: "G-Y3MVL3NVRC"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  try {
    console.log("Checking collections under evaluaciones...");
    const evalsSnap = await getDocs(limit(collection(db, "evaluaciones"), 5));
    if (evalsSnap.empty) {
      console.log("No evaluations found.");
      return;
    }
    for (const evalDoc of evalsSnap.docs) {
      const evalId = evalDoc.id;
      console.log(`Evaluation ID: ${evalId}`);
      // Let's try to query students in 2025/8
      const studentsColl = collection(db, `evaluaciones/${evalId}/estudiantes-evaluados/2025/8`);
      const studentsSnap = await getDocs(limit(studentsColl, 5));
      console.log(`  Found ${studentsSnap.size} students under 2025/8`);
      studentsSnap.forEach(doc => {
        console.log(`    Student DNI: ${doc.id}`);
        console.log("    Data:", JSON.stringify(doc.data(), null, 2));
      });
      
      // Let's also check other months
      for (let m = 0; m <= 11; m++) {
        const c = collection(db, `evaluaciones/${evalId}/estudiantes-evaluados/2025/${m}`);
        const s = await getDocs(limit(c, 1));
        if (s.size > 0) {
          console.log(`    Month ${m} has data. Example student data:`, JSON.stringify(s.docs[0].data(), null, 2));
        }
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

check();
