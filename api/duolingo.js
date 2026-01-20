import { Client } from '@neondatabase/serverless';

export const config = {
  runtime: 'edge',
};

export default async function (req, event) {
  const url = new URL(req.url);

  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (!process.env.NETLIFY_DATABASE_URL) {
    console.error("NETLIFY_DATABASE_URL not set");
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
    });
  }

  const client = new Client(process.env.NETLIFY_DATABASE_URL);

  try {
    await client.connect();

    if (req.method === 'GET') {
      // Create table if not exists (lazy initialization for simplicity in this demo)
      // Note: In production, use migrations.
      await client.query(`
        CREATE TABLE IF NOT EXISTS duolingo_stats (
            id SERIAL PRIMARY KEY,
            date DATE NOT NULL DEFAULT CURRENT_DATE,
            streak_count INTEGER NOT NULL,
            accuracy_percentage INTEGER NOT NULL,
            words_learned TEXT,
            leaderboard_position INTEGER,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      const { rows } = await client.query('SELECT * FROM duolingo_stats ORDER BY date DESC, created_at DESC');
      event.waitUntil(client.end());

      return new Response(JSON.stringify(rows), {
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
      });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { date, streak_count, accuracy_percentage, words_learned, leaderboard_position } = body;

      if (streak_count === undefined || accuracy_percentage === undefined) {
         return new Response(JSON.stringify({ error: "Missing required fields" }), {
             status: 400,
             headers: { 'Access-Control-Allow-Origin': '*' }
         });
      }

      const dateVal = date || new Date().toISOString().split('T')[0];

      const query = `
        INSERT INTO duolingo_stats (date, streak_count, accuracy_percentage, words_learned, leaderboard_position)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      const values = [dateVal, streak_count, accuracy_percentage, words_learned, leaderboard_position];

      const { rows } = await client.query(query, values);

      event.waitUntil(client.end());

      return new Response(JSON.stringify(rows[0]), {
        status: 201,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
      });
    }

    return new Response("Method not allowed", { status: 405 });

  } catch (error) {
    console.error("Database error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    });
  }
}
