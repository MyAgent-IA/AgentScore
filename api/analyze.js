export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL manquante' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        system: `Tu es AgentScore, un outil d'analyse IA pour boutiques e-commerce.
Analyse l'URL fournie et génère un score réaliste basé sur ce que tu sais des e-commerçants typiques et sur l'URL elle-même.
Réponds UNIQUEMENT en JSON valide, sans markdown, sans texte autour, exactement ce format :
{
  "score_global": <nombre 0-100>,
  "couleur_globale": "<red|amber|green>",
  "dimensions": [
    {"nom": "SAV & réactivité", "emoji": "⚡", "score": <0-100>, "couleur": "<red|amber|green>"},
    {"nom": "Gestion retours", "emoji": "📦", "score": <0-100>, "couleur": "<red|amber|green>"},
    {"nom": "Avis clients", "emoji": "⭐", "score": <0-100>, "couleur": "<red|amber|green>"},
    {"nom": "Automatisation", "emoji": "🤖", "score": <0-100>, "couleur": "<red|amber|green>"}
  ],
  "points_cles": [
    "<observation concrète 1>",
    "<observation concrète 2>",
    "<observation concrète 3>"
  ],
  "sav_critique": <true|false>
}
Sois réaliste et varié. Adapte le score au secteur de la boutique. Ne mets pas tous les scores identiques.`,
        messages: [{ role: 'user', content: `Analyse cette boutique e-commerce : ${url}` }]
      })
    });

    const data = await response.json();
    const text = data.content[0].text.trim();
    const result = JSON.parse(text);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: 'Erreur analyse', detail: err.message });
  }
}
