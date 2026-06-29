const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const seedId = process.env.MOCK_SEED_ID || "soft-opening-rankings-2026-06-29";
const mockCount = Number(process.env.MOCK_PROFILE_COUNT || 20);

const vegetables = [
  "Carrot",
  "Radish",
  "Turnip",
  "Cabbage",
  "Broccoli",
  "Spinach",
  "Pumpkin",
  "Pepper",
  "Celery",
  "Onion",
  "Garlic",
  "Potato",
  "Tomato",
  "Lettuce",
  "Cucumber",
  "Zucchini",
  "Beet",
  "Basil",
  "Kale",
  "Pea",
  "Corn",
  "Ginger",
  "Leek",
  "Okra",
];

const aircraft = [
  "Falcon",
  "Citation",
  "Skyhawk",
  "Spitfire",
  "Mustang",
  "Tomcat",
  "Hornet",
  "Phantom",
  "Raptor",
  "Eagle",
  "Typhoon",
  "Mirage",
  "Dakota",
  "Comet",
  "Concorde",
  "Hercules",
  "Orion",
  "Viper",
  "Tornado",
  "Gripen",
  "Harrier",
  "Blackbird",
  "Lightning",
  "Starfighter",
];

const topics = [
  ["box-folding", "Box Folding", "spatial-orientation"],
  ["box-unfolding", "Box Unfolding", "spatial-orientation"],
  ["missing-cube", "Missing Cube", "spatial-orientation"],
  ["jigsaw", "Jigsaw", "spatial-orientation"],
  ["find-similar-shape", "Find Similar Shape", "visual-scanning"],
  ["number-series", "Number Series", "logical-reasoning"],
  ["calculate", "Calculate", "numerical-agility"],
  ["approximation", "Approximation", "numerical-agility"],
  ["missing-operator", "Missing Operator", "numerical-agility"],
  ["dern-jood", "Dern-Jood PRO MAX", "multitasking"],
  ["joy-stick-game", "Joy-Stick Game", "multitasking"],
  ["aircraft-rotation", "Aircraft Rotation", "spatial-orientation"],
  ["string-comparison", "String Comparison", "visual-scanning"],
  ["string-sprint", "String Sprint", "visual-scanning"],
  ["scanning-shape", "Scanning Shape", "visual-scanning"],
  ["short-term-memory", "Short-Term Memory Table", "short-term-memory"],
  ["passage-recall", "Passage Recall", "short-term-memory"],
];

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...valueParts] = trimmed.split("=");
    if (process.env[key]) continue;
    process.env[key] = valueParts.join("=").replace(/^["']|["']$/g, "");
  }
}

function rankScore(percentage) {
  if (percentage >= 90) return "Captain";
  if (percentage >= 75) return "First Officer";
  if (percentage >= 60) return "Cadet";
  if (percentage >= 40) return "Trainee";
  return "Ground School";
}

function shuffle(values) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function buildCallSigns(count) {
  const pairs = [];
  for (const vegetable of vegetables) {
    for (const airplane of aircraft) {
      pairs.push(`${vegetable} ${airplane}`);
    }
  }
  return shuffle(pairs).slice(0, count);
}

async function main() {
  loadEnvLocal();

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required.");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
    ssl: { rejectUnauthorized: false },
  });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
    await client.query(
      "ALTER TABLE account_users ADD COLUMN IF NOT EXISTS is_mock BOOLEAN NOT NULL DEFAULT FALSE;",
    );
    await client.query(
      "ALTER TABLE account_profiles ADD COLUMN IF NOT EXISTS is_mock BOOLEAN NOT NULL DEFAULT FALSE;",
    );

    await client.query(
      `
        DELETE FROM account_users
        WHERE is_mock = TRUE
          AND google_sub LIKE $1;
      `,
      [`mock:${seedId}:%`],
    );

    const callSigns = buildCallSigns(mockCount);
    const inserted = [];

    for (let index = 0; index < mockCount; index += 1) {
      const callSign = callSigns[index];
      const mockNumber = String(index + 1).padStart(2, "0");
      const googleSub = `mock:${seedId}:${mockNumber}`;
      const email = `mock+${seedId.replace(/[^a-z0-9-]/gi, "-")}-${mockNumber}@sky-skills.local`;

      const userResult = await client.query(
        `
          INSERT INTO account_users (
            google_sub,
            email,
            name,
            image_url,
            email_verified,
            is_mock
          )
          VALUES ($1, $2, $3, NULL, TRUE, TRUE)
          RETURNING id;
        `,
        [googleSub, email, callSign],
      );
      const userId = userResult.rows[0].id;

      const profileResult = await client.query(
        `
          INSERT INTO account_profiles (
            user_id,
            call_sign,
            image_url,
            is_default,
            is_mock
          )
          VALUES ($1, $2, NULL, TRUE, TRUE)
          RETURNING id;
        `,
        [userId, callSign],
      );
      const profileId = profileResult.rows[0].id;

      for (let topicIndex = 0; topicIndex < topics.length; topicIndex += 1) {
        const [topicSlug, topicTitle, skillDomain] = topics[topicIndex];
        const percentage = 50 + Math.floor(Math.random() * 37);
        const completedOffsetMinutes = index * topics.length + topicIndex;
        const metadata = {
          is_mock: true,
          mock_seed_id: seedId,
          mock_profile_number: index + 1,
        };

        await client.query(
          `
            INSERT INTO account_score_history (
              user_id,
              profile_id,
              topic_slug,
              topic_title,
              skill_domain,
              score,
              max_score,
              percentage,
              rank_label,
              mode,
              difficulty,
              question_count,
              time_taken_seconds,
              metadata,
              completed_at
            )
            VALUES (
              $1,
              $2,
              $3,
              $4,
              $5,
              $6,
              100,
              $6,
              $7,
              'real',
              'mock',
              20,
              $8,
              $9::jsonb,
              NOW() - ($10::int * INTERVAL '1 minute')
            );
          `,
          [
            userId,
            profileId,
            topicSlug,
            topicTitle,
            skillDomain,
            percentage,
            rankScore(percentage),
            180 + Math.floor(Math.random() * 361),
            JSON.stringify(metadata),
            completedOffsetMinutes,
          ],
        );
      }

      inserted.push(callSign);
    }

    await client.query("COMMIT");
    console.log(`Inserted ${inserted.length} mock profiles with seed "${seedId}".`);
    console.log(inserted.map((callSign) => `- ${callSign}`).join("\n"));
    console.log("");
    console.log("Remove later with:");
    console.log(
      `DELETE FROM account_users WHERE is_mock = TRUE AND google_sub LIKE 'mock:${seedId}:%';`,
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
