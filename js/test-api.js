// js/test-api.js

async function testAPI() {
  try {
    const res = await fetch("/api/ping");
    const data = await res.json();
    console.log("✅ Réponse du backend :", data);

    // Afficher clairement la réponse
    const statusElement = document.getElementById("api-status");
    if (statusElement) {
      statusElement.innerText = data.message || JSON.stringify(data);
    }
  } catch (error) {
    console.error("❌ Erreur API :", error);
    const statusElement = document.getElementById("api-status");
    if (statusElement) {
      statusElement.innerText = "❌ Erreur de connexion à l'API";
    }
  }
}

window.onload = testAPI;
