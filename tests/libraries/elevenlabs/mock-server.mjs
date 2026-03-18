import http from 'node:http';

const PORT = 18080;
const EXPECTED_API_KEY = 'mock-api-key';

const json = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
};

const readJsonBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString('utf-8');
  return text ? JSON.parse(text) : {};
};

const ensureApiKey = (req, res) => {
  const apiKey = req.headers['xi-api-key'];
  if (apiKey !== EXPECTED_API_KEY) {
    json(res, 401, { detail: 'Unauthorized: missing or invalid xi-api-key header' });
    return false;
  }
  return true;
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  const key = `${req.method} ${path}`;

  if (key === 'GET /health') {
    return json(res, 200, { status: 'ok' });
  }

  if (!ensureApiKey(req, res)) {
    return;
  }

  if (key === 'GET /v1/voices') {
    return json(res, 200, {
      voices: [
        { voice_id: 'voice_1', name: 'Mock Voice One', category: 'generated' },
        { voice_id: 'voice_2', name: 'Mock Voice Two', category: 'premade' },
      ],
    });
  }

  if (key === 'GET /v1/models') {
    return json(res, 200, [
      { model_id: 'eleven_multilingual_v2', name: 'Multilingual v2', can_do_text_to_speech: true },
      { model_id: 'eleven_flash_v2_5', name: 'Flash v2.5', can_do_text_to_speech: true },
    ]);
  }

  if (key === 'GET /v1/user') {
    return json(res, 200, {
      user_id: 'user_mock_123',
      subscription: { tier: 'creator' },
      is_new_user: false,
      can_use_delayed_payment_methods: false,
      is_onboarding_completed: true,
      is_onboarding_checklist_completed: true,
    });
  }

  if (key === 'GET /v1/user/subscription') {
    return json(res, 200, {
      tier: 'creator',
      character_count: 12,
      character_limit: 10000,
      can_extend_character_limit: false,
      allowed_to_extend_character_limit: false,
      voice_slots_used: 1,
      professional_voice_slots_used: 0,
      voice_limit: 30,
      voice_add_edit_counter: 0,
      professional_voice_limit: 0,
      can_extend_voice_limit: false,
      can_use_instant_voice_cloning: true,
      can_use_professional_voice_cloning: false,
      status: 'active',
      has_open_invoices: false,
    });
  }

  if (key === 'POST /v1/text-to-speech/voice_1/with-timestamps') {
    const body = await readJsonBody(req);
    if (body.text !== 'Hello mock world' || body.model_id !== 'eleven_multilingual_v2') {
      return json(res, 400, { detail: 'Unexpected request body for convertWithTimestamps' });
    }

    return json(res, 200, {
      audio_base64: 'U09NRV9NT0NLX0FVRElP',
      alignment: {
        characters: ['H', 'i'],
        character_start_times_seconds: [0, 0.2],
        character_end_times_seconds: [0.2, 0.4],
      },
      normalized_alignment: {
        characters: ['H', 'i'],
        character_start_times_seconds: [0, 0.2],
        character_end_times_seconds: [0.2, 0.4],
      },
    });
  }

  if (key === 'GET /v1/voices/missing-voice') {
    return json(res, 404, { detail: 'Voice not found' });
  }

  json(res, 404, { detail: `No mock route for ${key}` });
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
