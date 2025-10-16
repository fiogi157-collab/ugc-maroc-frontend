// js/test-api.js

async function testAPI() {
  try {
    const res = await fetch("https://ugc-maroc-backend.vercel.app/ping");
    const data = await res.json();
    console.log("✅ Réponse du backend :", data);

    // Afficher clairement la réponse
    document.getElementById("api-status").innerText = data.message || JSON.stringify(data);
  } catch (error) {
    console.error("❌ Erreur API :", error);
    document.getElementById("api-status").innerText = "❌ Erreur de connexion à l'API";
  }
}

window.onload = testAPI;
