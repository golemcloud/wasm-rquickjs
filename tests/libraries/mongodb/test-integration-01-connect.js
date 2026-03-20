import { MongoClient } from "mongodb";

export async function run() {
  const url = "mongodb://127.0.0.1:27019";
  const client = new MongoClient(url, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  });

  try {
    await client.connect();
    const result = await client.db("admin").command({ ping: 1 });
    if (result.ok !== 1) {
      throw new Error(`ping returned ok=${result.ok}, expected 1`);
    }
    return "PASS: connected and pinged MongoDB successfully";
  } finally {
    await client.close();
  }
}
